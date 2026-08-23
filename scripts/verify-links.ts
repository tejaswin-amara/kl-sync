#!/usr/bin/env node
/**
 * scripts/verify-links.ts
 * Standalone Markdown Link, Anchor, License Caveat, and Star Metric Verification Suite.
 * Part of Awesome Dev Pipeline (R2).
 *
 * Zero-dependency implementation utilizing Node.js built-ins:
 * - node:fs / node:fs/promises
 * - node:path
 * - node:url
 * - node:process
 * - globalThis.fetch
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import { URL } from 'node:url';

// ============================================================================
// 1. Types & Interfaces
// ============================================================================

export type LinkType =
  | 'in-page-anchor'
  | 'relative-file'
  | 'relative-anchor'
  | 'external-http'
  | 'mailto'
  | 'unknown';

export interface DocumentLink {
  file: string;
  line: number;
  rawText: string;
  url: string;
  type: LinkType;
}

export interface HeadingItem {
  line: number;
  level: number;
  text: string;
  slug: string;
}

export interface StarMetricItem {
  line: number;
  raw: string;
  value: string;
  isValid: boolean;
}

export interface DocumentScan {
  filePath: string;
  absolutePath: string;
  rawContent: string;
  headings: HeadingItem[];
  slugs: Set<string>;
  explicitAnchors: Set<string>;
  links: DocumentLink[];
  starMetrics: StarMetricItem[];
}

export interface ValidationError {
  file: string;
  line: number;
  type:
    | 'BROKEN_IN_PAGE_ANCHOR'
    | 'MISSING_LOCAL_FILE'
    | 'BROKEN_CROSS_FILE_ANCHOR'
    | 'INVALID_URL_SYNTAX'
    | 'INVALID_URL_PROTOCOL'
    | 'INVALID_STAR_METRIC'
    | 'INVALID_BADGE_SCHEMA'
    | 'MISSING_LICENSE_TAG'
    | 'MISSING_LICENSE_CAVEAT'
    | 'HTTP_NOT_FOUND'
    | 'HTTP_SERVER_ERROR'
    | 'HTTP_NETWORK_ERROR'
    | 'GENERIC_ERROR';
  message: string;
  suggestion?: string;
  isWarning?: boolean;
}

export interface VerificationOptions {
  offline?: boolean;
  strict?: boolean;
  files?: string[];
  rootDir?: string;
  concurrency?: number;
  timeoutMs?: number;
  maxRetries?: number;
  jsonOutput?: boolean;
  reportPath?: string;
}

export interface VerificationResult {
  totalFiles: number;
  totalLinks: number;
  inPageAnchors: number;
  relativeLinks: number;
  externalUrls: number;
  starMetricsCount: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  durationMs: number;
  summary: {
    passed: boolean;
    filesScanned: string[];
  };
}

// ============================================================================
// 2. GFM Heading Slugifier
// ============================================================================

export class GitHubSlugifier {
  private occurrences = new Map<string, number>();

  /**
   * Generates a GitHub-compatible anchor slug from a Markdown heading string.
   * Handles markdown stripping, punctuation removal, case conversion, and duplicate numbering.
   */
  public slugify(headingText: string): string {
    // 1. Strip images completely: ![alt](url) -> "" (images in GFM headings have no text content)
    let text = headingText.replace(/!\[[^\]]*\]\([^\)]+\)/g, '');

    // 2. Strip inline Markdown links: [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // 3. Strip inline code backticks `code` -> code
    text = text.replace(/`([^`]+)`/g, '$1');

    // 4. Strip formatting tokens: bold/italic/strikethrough (*, _, ~)
    text = text.replace(/[*_~]/g, '');

    // 5. Strip inline HTML tags <span>, <a>, <code>, etc.
    text = text.replace(/<[^>]*>/g, '');

    // 6. Strip punctuation matching GitHub GFM rules.
    // Retains alphanumeric characters, spaces, hyphens, and underscores.
    // Strips unicode punctuation, emojis, and symbols.
    text = text.replace(/[^\w\s-]/gu, '');

    // 7. Convert to lowercase and trim
    text = text.toLowerCase().trim();

    // 8. Replace whitespace with hyphens (GFM maps each whitespace char to a hyphen)
    text = text.replace(/\s/g, '-');

    // 9. Handle duplicate headings in the same document
    const count = this.occurrences.get(text) || 0;
    this.occurrences.set(text, count + 1);

    if (count > 0) {
      return `${text}-${count}`;
    }
    return text;
  }

  /**
   * Resets internal occurrence counters (used when starting a new document).
   */
  public reset(): void {
    this.occurrences.clear();
  }
}


// ============================================================================
// 3. Document Parser & Scanner
// ============================================================================

/**
 * Parses a markdown string and extracts headings, anchors, links, and metrics.
 */
export function parseMarkdownContent(
  rawContent: string,
  filePath: string = 'inline.md',
  rootDir: string = process.cwd()
): DocumentScan {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  const lines = rawContent.split(/\r?\n/);

  const slugifier = new GitHubSlugifier();
  const headings: HeadingItem[] = [];
  const slugs = new Set<string>();
  const explicitAnchors = new Set<string>();
  const links: DocumentLink[] = [];
  const starMetrics: StarMetricItem[] = [];

  // Track reference link definitions [ref]: url
  const refDefinitions = new Map<string, string>();

  let inFencedCodeBlock = false;

  // First pass: collect reference definitions and headings/anchors/links outside code blocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Toggle fenced code block
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      continue;
    }
    if (inFencedCodeBlock) {
      continue;
    }

    // Check for reference link definition: [ref_id]: http://...
    const refDefMatch = line.match(/^\s*\[([^\]]+)\]:\s*(\S+)(?:\s+["'(].*["')])?\s*$/);
    if (refDefMatch) {
      const refId = refDefMatch[1].toLowerCase().trim();
      const refUrl = refDefMatch[2].trim();
      refDefinitions.set(refId, refUrl);
      continue;
    }

    // 1. Markdown Headings (# Heading)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      headings.push({
        line: i + 1,
        level,
        text: headingText,
        slug: slugifier.slugify(headingText),
      });
      slugs.add(headings[headings.length - 1].slug);
    }

    // 2. Explicit HTML Anchors (<a id="...">, <span id="...">, <div id="...">, <a name="...">)
    const anchorMatches = line.matchAll(
      /<(?:a|span|div|section|h[1-6]|p)\s+(?:[^>]*?\s+)?(?:id|name)=["']([^"']+)["'][^>]*>/gi
    );
    for (const match of anchorMatches) {
      explicitAnchors.add(match[1].trim());
    }

    // 3. Inline Markdown Links [text](url)
    const inlineLinkMatches = line.matchAll(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
    for (const match of inlineLinkMatches) {
      const rawText = match[1];
      const url = match[2].trim();
      const type = categorizeLinkUrl(url);

      links.push({
        file: filePath,
        line: i + 1,
        rawText,
        url,
        type,
      });
    }

    // 4. Markdown Images ![alt](url) (if not already captured as inline link)
    const imgMatches = line.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
    for (const match of imgMatches) {
      const url = match[2].trim();
      // Only add if not duplicate line/url
      if (!links.some((l) => l.line === i + 1 && l.url === url)) {
        links.push({
          file: filePath,
          line: i + 1,
          rawText: match[1],
          url,
          type: categorizeLinkUrl(url),
        });
      }
    }

    // 5. HTML Hyperlinks <a href="...">...</a>
    const htmlLinkMatches = line.matchAll(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi);
    for (const match of htmlLinkMatches) {
      const url = match[1].trim();
      const rawText = match[2].replace(/<[^>]*>/g, '').trim();
      links.push({
        file: filePath,
        line: i + 1,
        rawText,
        url,
        type: categorizeLinkUrl(url),
      });
    }

    // 6. HTML Images <img src="...">
    const htmlImgMatches = line.matchAll(/<img\s+(?:[^>]*?\s+)?src=["']([^"']+)["'][^>]*>/gi);
    for (const match of htmlImgMatches) {
      const url = match[1].trim();
      links.push({
        file: filePath,
        line: i + 1,
        rawText: '',
        url,
        type: categorizeLinkUrl(url),
      });
    }

    // 7. Autolinks <https://...> or <mailto:...>
    const autolinkMatches = line.matchAll(/<(https?:\/\/[^\s>]+|mailto:[^\s>]+)>/gi);
    for (const match of autolinkMatches) {
      const url = match[1].trim();
      links.push({
        file: filePath,
        line: i + 1,
        rawText: url,
        url,
        type: categorizeLinkUrl(url),
      });
    }

    // 8. Star metric detection
    const starMatches = line.matchAll(/(?:⭐\s*~?|Stars:\s*~?)(?:[^\s,|<)]+)/gi);
    for (const match of starMatches) {
      const raw = match[0];
      const validFormat = /(?:⭐\s*~?|Stars:\s*~?)\s*(?:>\s*)?(?:\d+(?:\.\d+)?[kKmM]?\+?)/.test(raw);
      const isCorrupted = /(?:undefined|null|\[object Object\]|NaN|-\d+)/i.test(raw);
      starMetrics.push({
        line: i + 1,
        raw,
        value: raw.replace(/^(?:⭐\s*~?|Stars:\s*~?)/i, '').trim(),
        isValid: validFormat && !isCorrupted,
      });
    }
  }

  // Second pass: resolve reference-style links [text][ref] or [ref][]
  inFencedCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      continue;
    }
    if (inFencedCodeBlock) continue;

    const refUsageMatches = line.matchAll(/\[([^\]]+)\](?:\[([^\]]*)\])?/g);
    for (const match of refUsageMatches) {
      // If it's already an inline link [text](url), skip
      const after = line.slice((match.index ?? 0) + match[0].length);
      if (after.startsWith('(')) continue;

      const rawText = match[1];
      const refId = (match[2] && match[2].length > 0 ? match[2] : match[1]).toLowerCase().trim();

      if (refDefinitions.has(refId)) {
        const resolvedUrl = refDefinitions.get(refId)!;
        links.push({
          file: filePath,
          line: i + 1,
          rawText,
          url: resolvedUrl,
          type: categorizeLinkUrl(resolvedUrl),
        });
      }
    }
  }

  return {
    filePath,
    absolutePath,
    rawContent,
    headings,
    slugs,
    explicitAnchors,
    links,
    starMetrics,
  };
}

/**
 * Reads a markdown file from disk and parses it.
 */
export function scanMarkdownFile(filePath: string, rootDir: string = process.cwd()): DocumentScan {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  const rawContent = fs.readFileSync(absolutePath, 'utf-8');
  return parseMarkdownContent(rawContent, filePath, rootDir);
}

/**
 * Categorizes a target URL into its respective link type.
 */
export function categorizeLinkUrl(url: string): LinkType {
  const trimmed = url.trim();
  if (trimmed.startsWith('#')) {
    return 'in-page-anchor';
  }
  if (trimmed.startsWith('mailto:')) {
    return 'mailto';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'external-http';
  }
  if (trimmed.includes('#') && !trimmed.startsWith('//')) {
    return 'relative-anchor';
  }
  if (!trimmed.startsWith('//') && !trimmed.includes(':')) {
    return 'relative-file';
  }
  return 'unknown';
}

// ============================================================================
// 4. License Caveat & Restriction Auditor
// ============================================================================

export interface LicenseRule {
  toolName: string;
  toolRegex: RegExp;
  requiredLicense: RegExp;
  mandatoryCaveatKeywords: string[];
  description: string;
}

export const RESTRICTED_LICENSE_RULES: LicenseRule[] = [
  {
    toolName: 'MinIO',
    toolRegex: /\bMinIO\b/i,
    requiredLicense: /AGPL(?:-3\.0|v3)?/i,
    mandatoryCaveatKeywords: [
      'copyleft',
      'source disclosure',
      'derivative work',
      'proprietary saas',
      'network copyleft',
      'open-sourcing backend',
      'open-source backend',
      'backend stack',
    ],
    description: 'AGPLv3 copyleft requires open-sourcing backend stack if modified or networked in SaaS.',
  },
  {
    toolName: 'Terraform',
    toolRegex: /\bTerraform\b/i,
    requiredLicense: /BSL(?:-?1\.1)?|BUSL/i,
    mandatoryCaveatKeywords: [
      'business source license',
      'competitive hosting',
      'opentofu',
      'non-compete',
      'commercial hosting',
      'source-available',
    ],
    description: 'BSL 1.1 non-compete clause restricts commercial competitive hosting (use OpenTofu for open-source).',
  },
  {
    toolName: 'n8n',
    toolRegex: /\bn8n\b/i,
    requiredLicense: /Sustainable Use|Fair-?Code/i,
    mandatoryCaveatKeywords: [
      'sustainable use',
      'fair-code',
      'internal use',
      'cannot charge',
      'commercial managed service',
      'non-commercial',
      'internal business automation',
    ],
    description: 'Sustainable Use / Fair-Code prohibits offering n8n as a commercial managed service.',
  },
  {
    toolName: 'Redis',
    toolRegex: /\bRedis\b/i,
    requiredLicense: /RSALv2|SSPL|Source-Available|BSD-3|Valkey/i,
    mandatoryCaveatKeywords: [
      'rsalv2',
      'sspl',
      'valkey',
      'non-osi',
      'cloud hosting restriction',
      'source-available',
      'dual license',
      'commercial cloud hosting',
    ],
    description: 'RSALv2 / SSPL dual license post-7.2.4 restricts cloud hosting (use Valkey for true open-source caching).',
  },
  {
    toolName: 'Sentry',
    toolRegex: /\bSentry\b/i,
    requiredLicense: /BSL|FSL(?:-1\.1-Apache)?/i,
    mandatoryCaveatKeywords: [
      'fsl',
      'functional source license',
      'commercial competition',
      'self-hosted enterprise',
      'converts to apache',
    ],
    description: 'FSL / BSL source-available license restricts commercial competition for 2 years.',
  },
];


/**
 * Audits a single document's text for license tags and caveat warnings when flagged tools are present.
 */
export function auditDocumentLicense(filePath: string, content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lowerContent = content.toLowerCase();

  for (const rule of RESTRICTED_LICENSE_RULES) {
    if (rule.toolRegex.test(content)) {
      // 1. Verify License Identifier Presence
      if (!rule.requiredLicense.test(content)) {
        errors.push({
          file: filePath,
          line: 1,
          type: 'MISSING_LICENSE_TAG',
          message: `Tool '${rule.toolName}' is referenced in ${filePath} but missing required license declaration matching '${rule.requiredLicense.source}'.`,
        });
      }

      // 2. Verify Mandatory Warning / Caveat Keywords
      const hasCaveat = rule.mandatoryCaveatKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()));
      if (!hasCaveat) {
        errors.push({
          file: filePath,
          line: 1,
          type: 'MISSING_LICENSE_CAVEAT',
          message: `Tool '${rule.toolName}' in ${filePath} lacks required caveat warning explaining licensing constraints (expected at least one of: ${rule.mandatoryCaveatKeywords.join(', ')}).`,
        });
      }
    }
  }

  return errors;
}

/**
 * Audits all documentation assets in the document index map.
 */
export function auditLicenseCaveats(docs: Map<string, DocumentScan>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const [filePath, doc] of docs.entries()) {
    // Audit core documentation files
    if (/(?:README|full-stack-dev-github-repos|CLAUDE|CONTRIBUTING)\.md$/i.test(filePath)) {
      errors.push(...auditDocumentLicense(filePath, doc.rawContent));
    }
  }
  return errors;
}

// ============================================================================
// 5. Levenshtein Distance & Closest Slug Finder
// ============================================================================

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[m][n];
}

export function findClosestSlug(target: string, availableSlugs: Set<string>): string | undefined {
  if (availableSlugs.size === 0) return undefined;
  let bestSlug: string | undefined;
  let minDistance = Infinity;

  for (const slug of availableSlugs) {
    const dist = levenshteinDistance(target.toLowerCase(), slug.toLowerCase());
    if (dist < minDistance && dist <= Math.max(4, Math.floor(target.length * 0.4))) {
      minDistance = dist;
      bestSlug = slug;
    }
  }

  return bestSlug;
}

// ============================================================================
// 6. External Network URL Reachability Engine
// ============================================================================

export interface NetworkValidatorConfig {
  concurrency?: number;
  timeoutMs?: number;
  maxRetries?: number;
  userAgent?: string;
}

export class ExternalUrlValidator {
  private cache = new Map<string, { statusCode: number; ok: boolean; error?: string }>();
  private config: Required<NetworkValidatorConfig>;

  constructor(config?: NetworkValidatorConfig) {
    this.config = {
      concurrency: config?.concurrency ?? 8,
      timeoutMs: config?.timeoutMs ?? 8000,
      maxRetries: config?.maxRetries ?? 2,
      userAgent: config?.userAgent ?? 'Mozilla/5.0 (compatible; AwesomeDevPipelineVerifier/1.0)',
    };
  }

  /**
   * Checks reachability of an external URL using HEAD with fallback to GET (with Range header).
   */
  public async checkUrl(url: string): Promise<{ statusCode: number; ok: boolean; error?: string }> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    let attempt = 0;
    while (attempt <= this.config.maxRetries) {
      try {
        const headRes = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': this.config.userAgent },
          signal: AbortSignal.timeout(this.config.timeoutMs),
          redirect: 'follow',
        });

        // 405 Method Not Allowed or 403 Forbidden on HEAD -> Fallback to lightweight GET
        if (headRes.status === 405 || headRes.status === 403) {
          const getRes = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': this.config.userAgent,
              Range: 'bytes=0-1024',
            },
            signal: AbortSignal.timeout(this.config.timeoutMs),
            redirect: 'follow',
          });

          const result = { statusCode: getRes.status, ok: getRes.ok || getRes.status === 304 };
          this.cache.set(url, result);
          return result;
        }

        // Rate limiting (429) -> exponential retry
        if (headRes.status === 429) {
          attempt++;
          const retryAfter = parseInt(headRes.headers.get('retry-after') || '2', 10);
          await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
          continue;
        }

        const result = { statusCode: headRes.status, ok: headRes.ok || headRes.status === 304 };
        this.cache.set(url, result);
        return result;
      } catch (err: unknown) {
        attempt++;
        if (attempt > this.config.maxRetries) {
          const errorMessage = err instanceof Error ? err.message : 'Network timeout or connection refused';
          const result = {
            statusCode: 0,
            ok: false,
            error: errorMessage,
          };
          this.cache.set(url, result);
          return result;
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    return { statusCode: 0, ok: false, error: 'Max retries exceeded' };
  }

  /**
   * Concurrently checks a batch of URLs with rate and pool concurrency limiting.
   */
  public async checkBatch(
    urls: string[],
    onProgress?: (url: string, res: { statusCode: number; ok: boolean; error?: string }) => void
  ): Promise<Map<string, { statusCode: number; ok: boolean; error?: string }>> {
    const results = new Map<string, { statusCode: number; ok: boolean; error?: string }>();
    const uniqueUrls = Array.from(new Set(urls));
    const poolSize = this.config.concurrency;

    let index = 0;
    const worker = async () => {
      while (index < uniqueUrls.length) {
        const i = index++;
        const targetUrl = uniqueUrls[i];
        const res = await this.checkUrl(targetUrl);
        results.set(targetUrl, res);
        if (onProgress) {
          onProgress(targetUrl, res);
        }
      }
    };

    const workers = Array.from({ length: Math.min(poolSize, uniqueUrls.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }
}

// ============================================================================
// 7. Comprehensive Document Validation Engine
// ============================================================================

/**
 * Validates links, anchors, badges, metrics, and licenses across scanned documents.
 */
export async function validateDocumentCollection(
  docs: Map<string, DocumentScan>,
  options: VerificationOptions = {}
): Promise<VerificationResult> {
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  let totalLinks = 0;
  let inPageAnchors = 0;
  let relativeLinks = 0;
  let externalUrls = 0;
  let starMetricsCount = 0;

  const externalUrlList: Array<{ url: string; file: string; line: number }> = [];

  // 1. Local Link & Anchor Validation
  for (const [filePath, doc] of docs.entries()) {
    // Star metrics validation
    for (const metric of doc.starMetrics) {
      starMetricsCount++;
      if (!metric.isValid) {
        errors.push({
          file: filePath,
          line: metric.line,
          type: 'INVALID_STAR_METRIC',
          message: `Malformed or invalid star metric detected: "${metric.raw}". Expected format: ⭐ ~XXk or Stars: ~XXk.`,
        });
      }
    }

    for (const link of doc.links) {
      totalLinks++;

      if (link.type === 'in-page-anchor') {
        inPageAnchors++;
        const targetSlug = link.url.slice(1);
        if (!doc.slugs.has(targetSlug) && !doc.explicitAnchors.has(targetSlug)) {
          const allSlugs = new Set([...doc.slugs, ...doc.explicitAnchors]);
          const suggestion = findClosestSlug(targetSlug, allSlugs);
          errors.push({
            file: filePath,
            line: link.line,
            type: 'BROKEN_IN_PAGE_ANCHOR',
            message: `Anchor '#${targetSlug}' does not exist in ${filePath}.`,
            suggestion: suggestion ? `#${suggestion}` : undefined,
          });
        }
      } else if (link.type === 'relative-file' || link.type === 'relative-anchor') {
        relativeLinks++;
        const [targetFilePart, targetAnchor] = link.url.split('#');
        const resolvedPath = path.normalize(path.resolve(path.dirname(doc.absolutePath), targetFilePart));

        if (!fs.existsSync(resolvedPath)) {
          errors.push({
            file: filePath,
            line: link.line,
            type: 'MISSING_LOCAL_FILE',
            message: `Target relative file '${targetFilePart}' does not exist on disk (resolved to: ${resolvedPath}).`,
          });
          continue;
        }

        // Cross-file anchor resolution
        if (targetAnchor) {
          let targetDoc = Array.from(docs.values()).find((d) => path.normalize(d.absolutePath) === resolvedPath);
          if (!targetDoc && targetFilePart.endsWith('.md')) {
            try {
              targetDoc = scanMarkdownFile(resolvedPath, options.rootDir);
              docs.set(targetFilePart, targetDoc);
            } catch {
              // Could not scan target file
            }
          }

          if (targetDoc) {
            const allTargetSlugs = new Set([...targetDoc.slugs, ...targetDoc.explicitAnchors]);
            if (!allTargetSlugs.has(targetAnchor)) {
              const suggestion = findClosestSlug(targetAnchor, allTargetSlugs);
              errors.push({
                file: filePath,
                line: link.line,
                type: 'BROKEN_CROSS_FILE_ANCHOR',
                message: `Anchor '#${targetAnchor}' does not exist in target file '${targetFilePart}'.`,
                suggestion: suggestion ? `${targetFilePart}#${suggestion}` : undefined,
              });
            }
          }
        }
      } else if (link.type === 'external-http') {
        externalUrls++;
        // URI syntax validation
        try {
          const parsed = new URL(link.url);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            errors.push({
              file: filePath,
              line: link.line,
              type: 'INVALID_URL_PROTOCOL',
              message: `Invalid protocol in external URL '${link.url}'. Expected http: or https:.`,
            });
          }

          // Validate GitHub repository URL structure if pointing to github.com
          if (parsed.hostname === 'github.com') {
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length < 2 && !parsed.pathname.startsWith('/topics') && !parsed.pathname.startsWith('/explore')) {
              // Note: could be an organization/user profile or repo
            }
          }

          // Validate Shields.io dynamic star badges
          if (parsed.hostname === 'img.shields.io' && parsed.pathname.startsWith('/github/stars/')) {
            const repoPath = parsed.pathname.replace(/^\/github\/stars\//, '');
            const repoParts = repoPath.split('/');
            if (repoParts.length < 2 || !repoParts[0] || !repoParts[1]) {
              errors.push({
                file: filePath,
                line: link.line,
                type: 'INVALID_BADGE_SCHEMA',
                message: `Malformed Shields.io GitHub stars badge schema: '${link.url}'. Expected /github/stars/:owner/:repo.`,
              });
            }
          }

          externalUrlList.push({ url: link.url, file: filePath, line: link.line });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Invalid URI';
          errors.push({
            file: filePath,
            line: link.line,
            type: 'INVALID_URL_SYNTAX',
            message: `Malformed external URL syntax '${link.url}': ${errorMessage}`,
          });
        }
      }
    }
  }

  // 2. License Caveat Compliance Audit
  const licenseErrors = auditLicenseCaveats(docs);
  errors.push(...licenseErrors);

  // 3. Online Network Verification (if not offline)
  if (!options.offline && externalUrlList.length > 0) {
    const networkValidator = new ExternalUrlValidator({
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
      maxRetries: options.maxRetries,
    });

    const uniqueUrls = Array.from(new Set(externalUrlList.map((e) => e.url)));
    const reachabilityResults = await networkValidator.checkBatch(uniqueUrls);

    for (const item of externalUrlList) {
      const res = reachabilityResults.get(item.url);
      if (res && !res.ok) {
        const errorType =
          res.statusCode === 404
            ? 'HTTP_NOT_FOUND'
            : res.statusCode >= 500
            ? 'HTTP_SERVER_ERROR'
            : 'HTTP_NETWORK_ERROR';

        errors.push({
          file: item.file,
          line: item.line,
          type: errorType,
          message: `External URL check failed (${res.statusCode > 0 ? `HTTP ${res.statusCode}` : res.error || 'Network error'}): ${item.url}`,
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    totalFiles: docs.size,
    totalLinks,
    inPageAnchors,
    relativeLinks,
    externalUrls,
    starMetricsCount,
    errors,
    warnings,
    durationMs,
    summary: {
      passed: errors.length === 0 && (!options.strict || warnings.length === 0),
      filesScanned: Array.from(docs.keys()),
    },
  };
}

// ============================================================================
// 8. Main Entrypoint & CLI Runner
// ============================================================================

/**
 * Executes full repository link and license verification with options.
 */
export async function runVerification(options: VerificationOptions = {}): Promise<VerificationResult> {
  const rootDir = options.rootDir || process.cwd();

  // Determine target files to check
  let targetFiles = options.files;
  if (!targetFiles || targetFiles.length === 0) {
    const candidateFiles = [
      'README.md',
      'CLAUDE.md',
      'full-stack-dev-github-repos.md',
      'CONTRIBUTING.md',
      'ARCHITECTURE.md',
      'DESIGN.md',
      'SECURITY.md',
      'CODE_OF_CONDUCT.md',
      'SUPPORT.md',
      'ROADMAP.md',
      'CHANGELOG.md',
    ];

    targetFiles = candidateFiles.filter((f) => fs.existsSync(path.resolve(rootDir, f)));
  }

  const docs = new Map<string, DocumentScan>();
  for (const relFile of targetFiles) {
    const fullPath = path.resolve(rootDir, relFile);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      docs.set(relFile, scanMarkdownFile(relFile, rootDir));
    }
  }

  const result = await validateDocumentCollection(docs, {
    offline: options.offline ?? true,
    strict: options.strict ?? false,
    rootDir,
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
    maxRetries: options.maxRetries,
  });

  // If report output is requested
  if (options.reportPath) {
    const reportFullPath = path.resolve(rootDir, options.reportPath);
    fs.mkdirSync(path.dirname(reportFullPath), { recursive: true });
    fs.writeFileSync(reportFullPath, JSON.stringify(result, null, 2), 'utf-8');
  }

  return result;
}

/**
 * CLI Argument Parser
 */
export function parseCliArgs(argv: string[]): VerificationOptions {
  const options: VerificationOptions = {
    offline: true,
    strict: false,
    jsonOutput: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--offline' || arg === '--dry-run') {
      options.offline = true;
    } else if (arg === '--online' || arg === '--network') {
      options.offline = false;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--json') {
      options.jsonOutput = true;
    } else if (arg === '--report' && argv[i + 1]) {
      options.reportPath = argv[++i];
    } else if (arg.startsWith('--report=')) {
      options.reportPath = arg.slice('--report='.length);
    } else if (arg === '--concurrency' && argv[i + 1]) {
      options.concurrency = parseInt(argv[++i], 10);
    } else if (arg === '--timeout' && argv[i + 1]) {
      options.timeoutMs = parseInt(argv[++i], 10);
    } else if (arg === '--files' && argv[i + 1]) {
      options.files = argv[++i].split(',').map((s) => s.trim());
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Awesome Dev Pipeline — Markdown Link & License Integrity Suite

Usage:
  npx tsx scripts/verify-links.ts [options]

Options:
  --offline, --dry-run      Run validation without external network requests (Default: true)
  --online, --network       Perform live HTTP/HTTPS reachability checks
  --strict                  Treat warnings as fatal errors (exit code 1)
  --files <file1,file2>     Specify comma-separated list of target markdown files
  --concurrency <n>         Max concurrent network requests (Default: 8)
  --timeout <ms>            Request timeout in milliseconds (Default: 8000)
  --report <path>           Write JSON verification report to file
  --json                    Output structured JSON to stdout
  --help, -h                Display this help message
`);
}

/**
 * Formats and prints ANSI terminal diagnostic report
 */
export function formatCliReport(result: VerificationResult, options: VerificationOptions): void {
  console.log('\n🔍 Awesome Dev Pipeline — Verification & Integrity Suite');
  console.log('═'.repeat(68));

  console.log(`\n📁 Scanned ${result.totalFiles} documentation files:`);
  for (const file of result.summary.filesScanned) {
    console.log(`   ✓ ${file}`);
  }

  console.log('\n⚓ Local Links & In-Page Anchors:');
  console.log(`   ✓ ${result.inPageAnchors} in-page anchor links verified (GFM slug resolution)`);
  console.log(`   ✓ ${result.relativeLinks} relative file links verified`);

  console.log('\n⚖️  License Caveat Compliance Audit:');
  console.log('   ✓ MinIO (AGPLv3) — Warning callout audit active');
  console.log('   ✓ Terraform (BSL 1.1) — Warning callout audit active');
  console.log('   ✓ n8n (Sustainable Use) — Warning callout audit active');
  console.log('   ✓ Redis (RSALv2/SSPL/Valkey) — Warning callout audit active');
  console.log('   ✓ Sentry (FSL/BSL) — Warning callout audit active');

  console.log('\n⭐ Star Metric & Formatting Validation:');
  console.log(`   ✓ ${result.starMetricsCount} star metric declarations verified`);

  console.log(`\n🌐 External URL Health Check (Mode: ${options.offline ? 'OFFLINE' : 'ONLINE'}):`);
  console.log(`   ✓ ${result.externalUrls} external URLs audited for syntax & schema`);
  if (options.offline) {
    console.log('   ℹ Network reachability skipped in offline mode (use --online to test live endpoints).');
  }

  console.log('\n' + '─'.repeat(68));

  if (result.errors.length > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${result.errors.length} error(s) found:\n`);
    for (const err of result.errors) {
      console.error(`  ✖ [${err.type}] ${err.file}:${err.line}`);
      console.error(`    ${err.message}`);
      if (err.suggestion) {
        console.error(`    💡 Suggestion: Did you mean '${err.suggestion}'?`);
      }
    }
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  ${result.warnings.length} warning(s):\n`);
    for (const warn of result.warnings) {
      console.warn(`  ⚠️  [${warn.type}] ${warn.file}:${warn.line} - ${warn.message}`);
    }
  }

  if (result.summary.passed) {
    console.log(
      `✅ VERIFICATION PASSED: 0 errors, ${result.warnings.length} warnings across ${result.totalLinks} links in ${result.totalFiles} files (${result.durationMs}ms).\n`
    );
  } else {
    console.error(
      `\n❌ Verification completed with failures in ${result.durationMs}ms.\n`
    );
  }
}

// ============================================================================
// 9. CLI Execution Entrypoint
// ============================================================================

async function main(): Promise<void> {
  const cliArgs = process.argv.slice(2);
  const options = parseCliArgs(cliArgs);

  const result = await runVerification(options);

  if (options.jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    formatCliReport(result, options);
  }

  if (!result.summary.passed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

import { fileURLToPath } from 'node:url';

// Auto-run if executed directly as main script
let isDirectRun = false;
try {
  const currentFile = fileURLToPath(import.meta.url);
  isDirectRun = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(currentFile);
} catch {
  isDirectRun =
    Boolean(process.argv[1]) &&
    (process.argv[1].endsWith('verify-links.ts') || process.argv[1].endsWith('verify-links.js')) &&
    !process.argv[1].includes('test');
}

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal Verification Error:', err);
    process.exit(1);
  });
}

