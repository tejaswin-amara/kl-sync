/**
 * tests/verify-links.test.ts
 * Unit & Integration Test Suite for Markdown Link, Anchor, and License Verification Suite.
 * Part of Awesome Dev Pipeline (R2).
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  GitHubSlugifier,
  parseMarkdownContent,
  auditDocumentLicense,
  categorizeLinkUrl,
  levenshteinDistance,
  findClosestSlug,
  validateDocumentCollection,
  runVerification,
  DocumentScan,
} from '../scripts/verify-links';

describe('GitHubSlugifier', () => {
  it('correctly slugifies standard headings', () => {
    const slugifier = new GitHubSlugifier();
    assert.equal(slugifier.slugify('Part 1: Universal Developer Tooling'), 'part-1-universal-developer-tooling');
    assert.equal(slugifier.slugify('Fast & Modern Terminal CLI'), 'fast--modern-terminal-cli');
  });

  it('strips emojis and special symbols according to GFM rules', () => {
    const slugifier = new GitHubSlugifier();
    assert.equal(slugifier.slugify('🚀 1.1 Terminal & Shell'), '11-terminal--shell');
    assert.equal(slugifier.slugify('⭐ Top Rated Tools (2026)'), 'top-rated-tools-2026');
    assert.equal(slugifier.slugify('API Design & Documentation (OpenAPI / GraphQL)'), 'api-design--documentation-openapi--graphql');
  });

  it('strips inline markdown code spans and links', () => {
    const slugifier = new GitHubSlugifier();
    assert.equal(slugifier.slugify('Using `next.config.ts` in Next.js'), 'using-nextconfigts-in-nextjs');
    assert.equal(slugifier.slugify('[Turbopack](https://turbo.build) vs Vite'), 'turbopack-vs-vite');
    assert.equal(slugifier.slugify('![Logo](logo.png) Project Overview'), 'project-overview');
  });

  it('strips formatting tokens and inline HTML', () => {
    const slugifier = new GitHubSlugifier();
    assert.equal(slugifier.slugify('**Bold** and *Italic* and ~Strikethrough~'), 'bold-and-italic-and-strikethrough');
    assert.equal(slugifier.slugify('<span>Overview</span> and <code>Details</code>'), 'overview-and-details');
  });

  it('handles duplicate headings with incremental suffix numbering (-1, -2)', () => {
    const slugifier = new GitHubSlugifier();
    assert.equal(slugifier.slugify('Caveats & Trade-offs'), 'caveats--trade-offs');
    assert.equal(slugifier.slugify('Caveats & Trade-offs'), 'caveats--trade-offs-1');
    assert.equal(slugifier.slugify('Caveats & Trade-offs'), 'caveats--trade-offs-2');
  });

  it('resets duplicate counters on reset()', () => {
    const slugifier = new GitHubSlugifier();
    assert.equal(slugifier.slugify('Summary'), 'summary');
    assert.equal(slugifier.slugify('Summary'), 'summary-1');
    slugifier.reset();
    assert.equal(slugifier.slugify('Summary'), 'summary');
  });
});

describe('Markdown Parser & Link Extractor', () => {
  it('extracts inline links and images', () => {
    const markdown = `
# Sample Doc
Here is a [Next.js Link](https://nextjs.org) and an ![Image](https://example.com/logo.png).
[Internal Link](#sample-doc)
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    assert.equal(doc.headings.length, 1);
    assert.equal(doc.headings[0].slug, 'sample-doc');
    assert.equal(doc.links.length, 3);
    assert.equal(doc.links[0].url, 'https://nextjs.org');
    assert.equal(doc.links[0].type, 'external-http');
    assert.equal(doc.links[1].url, 'https://example.com/logo.png');
    assert.equal(doc.links[2].url, '#sample-doc');
    assert.equal(doc.links[2].type, 'in-page-anchor');
  });

  it('extracts HTML links and explicit anchor IDs', () => {
    const markdown = `
<a id="custom-anchor"></a>
<a href="https://example.com">HTML link</a>
<img src="https://example.com/banner.png" />
<span id="target-span">Section</span>
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    assert.ok(doc.explicitAnchors.has('custom-anchor'));
    assert.ok(doc.explicitAnchors.has('target-span'));
    assert.ok(doc.links.some((l) => l.url === 'https://example.com'));
    assert.ok(doc.links.some((l) => l.url === 'https://example.com/banner.png'));
  });

  it('extracts autolinks and mailto links', () => {
    const markdown = `
Check <https://turbopack.dev> or contact <mailto:dev@example.com>.
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    assert.equal(doc.links.length, 2);
    assert.equal(doc.links[0].type, 'external-http');
    assert.equal(doc.links[1].type, 'mailto');
  });

  it('resolves reference-style links', () => {
    const markdown = `
See the [Documentation][doc-link] for more info.

[doc-link]: https://example.com/docs
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    assert.ok(doc.links.some((l) => l.url === 'https://example.com/docs'));
  });

  it('ignores links and headings inside fenced code blocks', () => {
    const markdown = `
# Real Heading
[Real Link](https://real.com)

\`\`\`markdown
# Fake Heading In Code
[Fake Link](https://fake.com)
\`\`\`

~~~typescript
const x = "https://example.com";
~~~
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    assert.equal(doc.headings.length, 1);
    assert.equal(doc.headings[0].text, 'Real Heading');
    assert.equal(doc.links.length, 1);
    assert.equal(doc.links[0].url, 'https://real.com');
  });
});

describe('Link Type Categorization', () => {
  it('categorizes various link formats accurately', () => {
    assert.equal(categorizeLinkUrl('#overview'), 'in-page-anchor');
    assert.equal(categorizeLinkUrl('https://github.com/owner/repo'), 'external-http');
    assert.equal(categorizeLinkUrl('http://localhost:3000'), 'external-http');
    assert.equal(categorizeLinkUrl('mailto:test@example.com'), 'mailto');
    assert.equal(categorizeLinkUrl('./CLAUDE.md'), 'relative-file');
    assert.equal(categorizeLinkUrl('./README.md#part-1-universal'), 'relative-anchor');
    assert.equal(categorizeLinkUrl('full-stack-dev-github-repos.md#minio'), 'relative-anchor');
  });
});

describe('License Caveat Auditor', () => {
  it('detects missing AGPLv3 license declaration for MinIO', () => {
    const badMarkdown = `## Object Storage\nWe use MinIO for local S3 emulation.`;
    const errors = auditDocumentLicense('test.md', badMarkdown);
    assert.ok(errors.some((e) => e.type === 'MISSING_LICENSE_TAG' && e.message.includes('MinIO')));
  });

  it('detects missing caveat warning keywords for MinIO even when license tag is present', () => {
    const markdown = `## Object Storage\n**MinIO** (AGPL-3.0) — High performance object storage.`;
    const errors = auditDocumentLicense('test.md', markdown);
    assert.ok(errors.some((e) => e.type === 'MISSING_LICENSE_CAVEAT' && e.message.includes('MinIO')));
  });

  it('passes when MinIO has explicit AGPL tag and copyleft caveat', () => {
    const goodMarkdown = `## Object Storage\n**MinIO** (AGPL-3.0) — ⚠️ Caveat: Network copyleft requires open-sourcing backend stack if modified.`;
    const errors = auditDocumentLicense('test.md', goodMarkdown);
    assert.equal(errors.length, 0);
  });

  it('detects missing BSL license declaration and caveat for Terraform', () => {
    const badMarkdown = `## Infrastructure\nTerraform is used for cloud provisioning.`;
    const errors = auditDocumentLicense('test.md', badMarkdown);
    assert.ok(errors.some((e) => e.message.includes('Terraform')));
  });

  it('passes when Terraform has BSL 1.1 tag and OpenTofu / non-compete caveat', () => {
    const goodMarkdown = `## IaC\n**Terraform** (BSL 1.1) — ⚠️ Caveat: BSL non-compete clause restricts commercial hosting; use OpenTofu for open source.`;
    const errors = auditDocumentLicense('test.md', goodMarkdown);
    assert.equal(errors.length, 0);
  });

  it('audits n8n, Redis/Valkey, and Sentry correctly', () => {
    const goodDoc = `
### Workflow Automation
**n8n** (Sustainable Use / Fair-Code) — ⚠️ Caveat: Prohibits offering as a commercial managed service; internal business automation permitted.

### Caching
**Redis** (RSALv2 / SSPL dual license post-7.2.4) — ⚠️ Caveat: Non-OSI source-available; use Valkey for true open-source caching.

### Error Tracking
**Sentry** (FSL-1.1-Apache / BSL) — ⚠️ Caveat: Commercial competition restriction converts to Apache 2.0 after 2 years.
`;
    const errors = auditDocumentLicense('test.md', goodDoc);
    assert.equal(errors.length, 0);
  });
});

describe('Star Metric & Badge Schema Validator', () => {
  it('validates compliant star metric text', () => {
    const doc = parseMarkdownContent(`
| Tool | Stars |
| --- | --- |
| Ghostty | ⭐ ~48k |
| Biome | Stars: ~12.5k |
| Next.js | ⭐ 120k+ |
| Astro | ⭐ >50k |
`);
    assert.equal(doc.starMetrics.length, 4);
    assert.ok(doc.starMetrics.every((m) => m.isValid));
  });

  it('rejects corrupted star metric formats', () => {
    const doc = parseMarkdownContent(`
| Bad Tool | Stars |
| --- | --- |
| Buggy1 | ⭐ undefined |
| Buggy2 | Stars: [object Object] |
| Buggy3 | ⭐ NaN |
`);
    assert.equal(doc.starMetrics.length, 3);
    assert.ok(doc.starMetrics.every((m) => !m.isValid));
  });
});

describe('Levenshtein Distance & Closest Slug Finder', () => {
  it('calculates string edit distances correctly', () => {
    assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
    assert.equal(levenshteinDistance('fast', 'fast'), 0);
  });

  it('suggests closest existing slug for typos', () => {
    const availableSlugs = new Set(['part-1-universal-developer-tooling', 'part-2-full-stack-web-pipeline', 'overview']);
    const suggestion = findClosestSlug('part-1-universal-dev-tooling', availableSlugs);
    assert.equal(suggestion, 'part-1-universal-developer-tooling');
  });
});

describe('Document Collection Validation Engine', () => {
  it('detects broken in-page anchors', async () => {
    const markdown = `
# Title
[Broken Anchor](#non-existent-heading)
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    const docs = new Map<string, DocumentScan>([['test.md', doc]]);
    const result = await validateDocumentCollection(docs, { offline: true });

    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].type, 'BROKEN_IN_PAGE_ANCHOR');
  });

  it('validates matching in-page anchors cleanly', async () => {
    const markdown = `
# Title
## Section One
[Go to Section One](#section-one)
`;
    const doc = parseMarkdownContent(markdown, 'test.md');
    const docs = new Map<string, DocumentScan>([['test.md', doc]]);
    const result = await validateDocumentCollection(docs, { offline: true });

    assert.equal(result.errors.length, 0);
  });

  it('validates relative file links on disk', async () => {
    const markdown = `
# Overview
Check [Package File](./package.json)
`;
    const doc = parseMarkdownContent(markdown, 'test.md', process.cwd());
    const docs = new Map<string, DocumentScan>([['test.md', doc]]);
    const result = await validateDocumentCollection(docs, { offline: true });

    assert.equal(result.errors.length, 0);
  });

  it('detects missing relative files on disk', async () => {
    const markdown = `
# Overview
Check [Missing Doc](./does-not-exist-12345.md)
`;
    const doc = parseMarkdownContent(markdown, 'test.md', process.cwd());
    const docs = new Map<string, DocumentScan>([['test.md', doc]]);
    const result = await validateDocumentCollection(docs, { offline: true });

    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].type, 'MISSING_LOCAL_FILE');
  });
});

describe('Full Verification Runner (Offline Mode)', () => {
  it('runs offline verification across workspace markdown files', async () => {
    const result = await runVerification({ offline: true });
    assert.ok(result.totalFiles > 0, 'Should discover and scan markdown files');
    assert.ok(typeof result.durationMs === 'number');
    assert.ok(Array.isArray(result.errors));
    assert.ok(Array.isArray(result.warnings));
  });
});
