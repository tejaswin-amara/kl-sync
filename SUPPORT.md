# Support for KL Sync

## Looking for Help?

If you need assistance with KL Sync, you're in the right place. We have different channels depending on the type of help you need.

## Tier 1: GitHub Issues

Use [GitHub Issues](https://github.com/tejaswin-amara/kl-sync/issues) for:
- **Bug Reports**: If something is broken, completely unresponsive, or throwing errors. Please use the Bug Report template.
- **Feature Requests**: Proposing new dashboard modules or enhancements. Please use the Feature Request template.

*Response Time Expectation*: Issues are typically triaged within **48 hours**.

## Tier 2: GitHub Discussions

Use [GitHub Discussions](https://github.com/tejaswin-amara/kl-sync/discussions) for:
- **Questions**: "How do I setup X?", "Why is Y behaving like this?"
- **Architecture Debates**: Proposing significant internal changes or discussing the Ponytail Philosophy.
- **Show & Tell**: Sharing how you use KL Sync or custom UI themes you've built.

## Tier 3: Email

Use email (**tejaswinamara@gmail.com**) strictly for:
- **Security Reports**: Private disclosure of security vulnerabilities (see [SECURITY.md](SECURITY.md)).
- **Licensing inquiries**: Questions about the proprietary license and commercial usage.

*Response Time Expectation*: Security reports are acknowledged within **24 hours**.

## Frequently Asked Questions (FAQ)

### My attendance data looks wrong
The university ERP may have changed its HTML structure, causing scraper drift. Please [open an issue](https://github.com/tejaswin-amara/kl-sync/issues) with the specific module that is failing so we can patch the cheerio extractors.

### How do I get a `SESSION_SECRET`?
You need a 32-byte hex string for AES-256-GCM encryption. Generate one using OpenSSL in your terminal:
```bash
openssl rand -hex 32
```
Add this to your `.env.local` file.

### Can I host this publicly?
**No**. KL Sync operates under a strict proprietary, source-available license. You may not host public instances or commercialize the software. See the [LICENSE](LICENSE) file for full details.

### Can I use the scrapers in my own project?
You must contact the author (tejaswinamara@gmail.com) for explicit permission before extracting and using the internal modules or scraping logic in other projects.
