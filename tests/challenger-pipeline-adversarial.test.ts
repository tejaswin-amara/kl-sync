import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseMarkdownContent, GitHubSlugifier, RESTRICTED_LICENSE_RULES, auditDocumentLicense } from '../scripts/verify-links';

const rootDir = process.cwd();
const readmePath = path.join(rootDir, 'README.md');
const claudePath = path.join(rootDir, 'CLAUDE.md');
const deepDocPath = path.join(rootDir, 'full-stack-dev-github-repos.md');
const contributingPath = path.join(rootDir, 'CONTRIBUTING.md');
const licensePath = path.join(rootDir, 'LICENSE');

const readmeContent = fs.readFileSync(readmePath, 'utf-8');
const claudeContent = fs.readFileSync(claudePath, 'utf-8');
const deepDocContent = fs.readFileSync(deepDocPath, 'utf-8');
const contributingContent = fs.readFileSync(contributingPath, 'utf-8');

test('Adversarial Challenge 1: CLAUDE.md Tabular Quick-References Completeness & Usability', () => {
  const scan = parseMarkdownContent(claudeContent, 'CLAUDE.md', rootDir);

  const expectedHeadings = [
    '1. Executive Agent Directive & Operational Rules',
    '2. Operational Tabular Quick-Reference Defaults',
    '2.1 Universal Developer Environment Defaults',
    '2.2 Full-Stack Web Pipeline Defaults',
    '2.3 Situational & Specialized Tooling Defaults',
    '2.4 AI Agent Tooling & Architectures Defaults',
    '3. Concrete Default Stacks & Architectural Rationale',
    '4. Explicit Deviation Rules & Quantitative Scale Triggers',
    '5. Comprehensive License Alert & Legal Constraint Matrix',
    '6. Verification & Quality Gates',
  ];

  for (const exp of expectedHeadings) {
    const found = scan.headings.some((h) => h.text.includes(exp) || exp.includes(h.text));
    assert.ok(found, `Expected heading in CLAUDE.md: ${exp}`);
  }

  const lines = claudeContent.split('\n');
  const tableRows = lines.filter((l) => l.startsWith('|') && !l.startsWith('|---|'));
  assert.ok(tableRows.length >= 35, `Expected at least 35 tabular rows in CLAUDE.md, found ${tableRows.length}`);

  const keyDefaults = [
    { category: 'Terminal', expected: 'Ghostty' },
    { category: 'Multiplexer', expected: 'Zellij' },
    { category: 'VCS', expected: 'LazyGit' },
    { category: 'Package Mgr', expected: 'pnpm' },
    { category: 'Python Package Mgr', expected: 'uv' },
    { category: 'JS/TS Linter', expected: 'Biome' },
    { category: 'Python Linter', expected: 'Ruff' },
    { category: 'Frontend', expected: 'Next.js' },
    { category: 'Backend Framework', expected: 'Hono' },
    { category: 'Relational Database', expected: 'PostgreSQL' },
    { category: 'Analytical OLAP', expected: 'ClickHouse' },
    { category: 'ORM', expected: 'Drizzle ORM' },
    { category: 'Cache', expected: 'Valkey' },
    { category: 'Auth', expected: 'Better-Auth' },
    { category: 'Real-Time', expected: 'PartyKit' },
    { category: 'Search', expected: 'Meilisearch' },
    { category: 'Vector', expected: 'pgvector' },
    { category: 'Background Job', expected: 'BullMQ' },
    { category: 'AI Coding Agent', expected: 'Claude Code' },
    { category: 'Tool Protocol', expected: 'Model Context Protocol' },
    { category: 'Agent Orchestrator', expected: 'LangGraph' },
  ];

  for (const kd of keyDefaults) {
    const match = tableRows.some((row) => row.toLowerCase().includes(kd.expected.toLowerCase()));
    assert.ok(match, `Expected quick-reference table row for ${kd.category} specifying default ${kd.expected}`);
  }
});

test('Adversarial Challenge 2: Concrete Default Stacks & Architecture Completeness', () => {
  const expectedStacks = [
    'Stack A: Modern Production Web & SaaS (The Golden Baseline)',
    'Stack B: High-Throughput / Distributed Microservices',
    'Stack C: Real-Time, Collaborative & Local-First',
    'Stack D: Edge-First & Serverless Architecture',
    'Stack E: Production AI Agent & Copilot Architecture',
  ];

  for (const stackName of expectedStacks) {
    assert.ok(claudeContent.includes(stackName), `Expected ${stackName} in CLAUDE.md`);
  }

  // Stack A
  assert.ok(claudeContent.includes('Next.js 15/16') || claudeContent.includes('Next.js (App Router)'));
  assert.ok(claudeContent.includes('Drizzle ORM'));
  assert.ok(claudeContent.includes('Better-Auth'));
  assert.ok(claudeContent.includes('PostgreSQL 16'));
  assert.ok(claudeContent.includes('Valkey'));
  assert.ok(claudeContent.includes('BullMQ'));
  assert.ok(claudeContent.includes('Cloudflare R2'));

  // Stack B
  assert.ok(claudeContent.includes('Connect-RPC'));
  assert.ok(claudeContent.includes('Go 1.23+') || claudeContent.includes('Rust'));
  assert.ok(claudeContent.includes('ClickHouse'));
  assert.ok(claudeContent.includes('sqlc') || claudeContent.includes('sqlx'));

  // Stack C
  assert.ok(claudeContent.includes('PartyKit'));
  assert.ok(claudeContent.includes('Yjs') || claudeContent.includes('Automerge'));
  assert.ok(claudeContent.includes('ElectricSQL'));

  // Stack D
  assert.ok(claudeContent.includes('Cloudflare Workers'));
  assert.ok(claudeContent.includes('Hono'));
  assert.ok(claudeContent.includes('Turso'));

  // Stack E
  assert.ok(claudeContent.includes('LangGraph'));
  assert.ok(claudeContent.includes('Model Context Protocol (MCP)') || claudeContent.includes('FastMCP'));
  assert.ok(claudeContent.includes('Langfuse'));
  assert.ok(claudeContent.includes('Agent-as-Judge'));
});

test('Adversarial Challenge 3: 14 Scale Triggers & Zero Contradictions with Defaults', () => {
  for (let i = 1; i <= 14; i++) {
    const triggerMarker = `| **${i}** |`;
    assert.ok(claudeContent.includes(triggerMarker), `Expected deviation rule #${i} in CLAUDE.md`);
  }

  assert.ok(claudeContent.includes('>5,000,000 rows/sec'), 'Trigger 1 (ClickHouse) must define >5M rows/sec OLAP threshold');
  assert.ok(claudeContent.includes('>50,000 write ops/sec'), 'Trigger 2 (MongoDB/DynamoDB) must define >50k writes threshold');
  assert.ok(claudeContent.includes('5,000 requests/sec'), 'Trigger 6 (Connect-RPC) must define 5k req/sec threshold');
  assert.ok(claudeContent.includes('>1,000,000 ops/sec'), 'Trigger 9 (Dragonfly) must define >1M ops/sec threshold');
  assert.ok(claudeContent.includes('10,000,000 vectors'), 'Trigger 12 (Qdrant) must define 10M vectors threshold');
  assert.ok(claudeContent.includes('>10,000 validations/sec'), 'Trigger 13 (Typia/ArkType) must define >10k validations/sec threshold');
  assert.ok(claudeContent.includes('<15MB'), 'Trigger 14 (Tauri) must define <15MB bundle size threshold');

  // Coherence: Default ORM Drizzle vs Prisma deviation rule
  assert.ok(claudeContent.includes('Only when maintaining legacy codebases already deeply committed to the Prisma schema DSL'));
});

test('Adversarial Challenge 4: Rigorous License Risk Warning Audit Across All Documents', () => {
  const docs = [
    { name: 'README.md', content: readmeContent },
    { name: 'CLAUDE.md', content: claudeContent },
    { name: 'full-stack-dev-github-repos.md', content: deepDocContent },
    { name: 'CONTRIBUTING.md', content: contributingContent },
  ];

  for (const doc of docs) {
    const errors = auditDocumentLicense(doc.name, doc.content);
    assert.strictEqual(errors.length, 0, `Document ${doc.name} failed license caveat audit: ${JSON.stringify(errors)}`);
  }

  for (const doc of docs) {
    assert.ok(/AGPL(?:-3\.0|v3)?/i.test(doc.content), `${doc.name} missing AGPL license notice`);
    assert.ok(/copyleft|network|open-sourc/i.test(doc.content), `${doc.name} missing AGPL copyleft caveat`);

    assert.ok(/BSL(?:-?1\.1)?/i.test(doc.content), `${doc.name} missing BSL license notice`);
    assert.ok(/OpenTofu|non-compete|commercial hosting/i.test(doc.content), `${doc.name} missing Terraform OpenTofu/BSL caveat`);

    assert.ok(/RSALv2|SSPL|Valkey/i.test(doc.content), `${doc.name} missing Redis license or Valkey fork notice`);

    assert.ok(/Sustainable Use|Fair-?Code/i.test(doc.content), `${doc.name} missing n8n Sustainable Use notice`);

    assert.ok(/FSL|BSL/i.test(doc.content), `${doc.name} missing Sentry FSL notice`);
  }
});

test('Adversarial Challenge 5: Cross-Document Semantic & Heading Consistency', () => {
  const readmeScan = parseMarkdownContent(readmeContent, 'README.md', rootDir);
  const claudeScan = parseMarkdownContent(claudeContent, 'CLAUDE.md', rootDir);
  const deepScan = parseMarkdownContent(deepDocContent, 'full-stack-dev-github-repos.md', rootDir);

  const parts = [
    'Part 1: Universal Developer',
    'Part 2: Full-Stack Web Pipeline',
    'Part 3: Beyond a Web App',
    'AI Agent Tooling',
  ];

  for (const part of parts) {
    const inReadme = readmeScan.headings.some((h) => h.text.includes(part));
    const inDeep = deepScan.headings.some((h) => h.text.includes(part));
    assert.ok(inReadme, `README missing part: ${part}`);
    assert.ok(inDeep, `full-stack-dev-github-repos.md missing part: ${part}`);
  }

  // Verify deep architectural tool coverage in full-stack-dev-github-repos.md
  const deepTools = [
    'Ghostty', 'Alacritty', 'WezTerm', 'Zellij', 'Tmux',
    'Nushell', 'Zsh', 'Starship',
    'LazyGit', 'Jujutsu', 'Difftastic', 'Delta',
    'VS Code', 'Neovim', 'Zed', 'Cursor',
    'pnpm', 'uv', 'Mise',
    'Biome', 'Ruff',
    'Chezmoi', 'Direnv',
    'Next.js', 'Astro', 'SvelteKit', 'Vite',
    'Hono', 'FastAPI', 'Fastify',
    'PostgreSQL', 'SQLite', 'Turso', 'ClickHouse',
    'Drizzle ORM', 'Prisma', 'Kysely',
    'Valkey', 'Dragonfly',
    'Better-Auth', 'Auth.js',
    'tRPC', 'TanStack Query', 'Zod', 'Valibot',
    'Tailwind CSS', 'shadcn/ui', 'Radix UI',
    'PartyKit', 'LiveKit', 'Meilisearch', 'Qdrant', 'MinIO', 'Cloudflare R2',
    'PostHog', 'Umami', 'Unleash', 'Resend', 'React Email',
    'Clap', 'Cobra', 'Ratatui', 'Bubbletea',
    'BullMQ', 'Temporal', 'n8n',
    'Cloudflare Workers', 'Expo', 'Tauri',
    'Polars', 'dbt', 'OpenTofu', 'Caddy', 'Coolify',
    'Sentry', 'OpenTelemetry',
    'Claude Code', 'Cursor',
    'LangGraph', 'LlamaIndex',
    'Model Context Protocol', 'FastMCP', 'Ollama', 'vLLM', 'Langfuse', 'Promptfoo',
  ];

  for (const tool of deepTools) {
    const foundInDeep = deepDocContent.toLowerCase().includes(tool.toLowerCase().split(' ')[0]);
    assert.ok(foundInDeep, `Tool ${tool} not found in full-stack-dev-github-repos.md`);
  }
});

test('Adversarial Challenge 6: Relative File Link & In-Page Anchor Integrity', () => {
  const docs = [
    { file: 'README.md', content: readmeContent },
    { file: 'CLAUDE.md', content: claudeContent },
    { file: 'full-stack-dev-github-repos.md', content: deepDocContent },
    { file: 'CONTRIBUTING.md', content: contributingContent },
  ];

  for (const doc of docs) {
    const scan = parseMarkdownContent(doc.content, doc.file, rootDir);

    for (const link of scan.links) {
      if (link.type === 'in-page-anchor') {
        const anchor = link.url.slice(1);
        const resolved = scan.slugs.has(anchor) || scan.explicitAnchors.has(anchor);
        assert.ok(resolved, `Broken in-page anchor '${link.url}' at ${doc.file}:${link.line}`);
      } else if (link.type === 'relative-file') {
        const targetPath = path.resolve(rootDir, link.url);
        assert.ok(fs.existsSync(targetPath), `Broken relative file link '${link.url}' at ${doc.file}:${link.line}`);
      }
    }
  }
});
