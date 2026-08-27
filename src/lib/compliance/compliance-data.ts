export interface ComplianceBadge {
  id: string;
  category: 'privacy' | 'accessibility';
  code: string;
  name: string;
  region: string;
  flagIcon: string;
  status: 'compliant' | 'active';
  summary: string;
  principles: string[];
}

export const COMPLIANCE_BADGES: ComplianceBadge[] = [
  // ── Privacy & Data ──
  {
    id: 'gdpr',
    category: 'privacy',
    code: 'GDPR',
    name: 'General Data Protection Regulation',
    region: 'European Union',
    flagIcon: '🇪🇺',
    status: 'compliant',
    summary:
      'Strict data minimization, purpose limitation, user consent management, and full support for Right to Access (Art. 15/20) and Right to Erasure (Art. 17).',
    principles: [
      'No plain-text storage of credentials',
      'Zero unauthorized tracking/cookies',
      'Complete data export & one-click erasure',
    ],
  },
  {
    id: 'ccpa-cpra',
    category: 'privacy',
    code: 'CCPA / CPRA',
    name: 'California Consumer Privacy Act / Rights Act',
    region: 'California, USA',
    flagIcon: '🇺🇸',
    status: 'compliant',
    summary:
      'Zero sale or sharing of student personal information, transparent data processing notices, and user rights honoring.',
    principles: [
      'Do Not Sell/Share Personal Info honored by default',
      'No algorithmic behavioral profiling',
      'Full disclosure of proxy data paths',
    ],
  },
  {
    id: 'hipaa',
    category: 'privacy',
    code: 'HIPAA',
    name: 'Health Insurance Portability and Accountability Act',
    region: 'United States',
    flagIcon: '🇺🇸',
    status: 'compliant',
    summary:
      'Enterprise AES-256-GCM encryption for session tokens at rest and in transit, strict access control safeguards, zero PHI logging.',
    principles: [
      'AES-256-GCM authenticated encryption',
      'Zero health/medical certificate data leakage',
      'Inactivity session timeout protections',
    ],
  },
  {
    id: 'pipeda-cppa',
    category: 'privacy',
    code: 'PIPEDA / CPPA',
    name: 'Personal Information Protection and Electronic Documents Act',
    region: 'Canada',
    flagIcon: '🇨🇦',
    status: 'compliant',
    summary:
      'Meaningful consent model, strict limitation of data collection to educational proxying, robust cryptographic safeguards.',
    principles: [
      'Direct student-to-ERP proxying only',
      'No persistent backend database of student data',
      'Transparent accountability',
    ],
  },
  {
    id: 'lgpd',
    category: 'privacy',
    code: 'LGPD',
    name: 'Lei Geral de Proteção de Dados',
    region: 'Brazil',
    flagIcon: '🇧🇷',
    status: 'compliant',
    summary:
      'Full compliance with Brazilian data protection law regarding data subject rights, transparent legal basis, and revocation of consent.',
    principles: [
      'Immediate consent revocation',
      'Zero unnecessary personal data retention',
      'Transparent data lifecycle',
    ],
  },
  {
    id: 'dpdpa',
    category: 'privacy',
    code: 'DPDPA',
    name: 'Digital Personal Data Protection Act 2023',
    region: 'India',
    flagIcon: '🇮🇳',
    status: 'compliant',
    summary:
      'Full compliance with Indian data privacy law for student data processing, multilingual consent notices, and purpose limitation.',
    principles: [
      'Indian local compliance (English, Telugu, Hindi notices)',
      'Purpose-limited proxying for academic ERP',
      'Grievance and erasure rights',
    ],
  },
  {
    id: 'pipl',
    category: 'privacy',
    code: 'PIPL',
    name: 'Personal Information Protection Law',
    region: 'China',
    flagIcon: '🇨🇳',
    status: 'compliant',
    summary:
      'Informed consent for student proxying, data classification safeguards, and cross-border data transfer disclosures.',
    principles: [
      'Explicit informed consent',
      'Local storage data minimization',
      'Encrypted proxy transmission',
    ],
  },
  {
    id: '152-fz',
    category: 'privacy',
    code: '152-FZ',
    name: 'Federal Law on Personal Data No. 152-FZ',
    region: 'Russian Federation',
    flagIcon: '🇷🇺',
    status: 'compliant',
    summary:
      'Confidentiality of personal data, cryptographic protection, user consent, and local device processing isolation.',
    principles: [
      'Client-side cryptographic session isolation',
      'No third-party data distribution',
      'Right to data deletion',
    ],
  },

  // ── Accessibility & Localization ──
  {
    id: 'wcag-aaa',
    category: 'accessibility',
    code: 'WCAG 2.2 AAA',
    name: 'Web Content Accessibility Guidelines Level AAA',
    region: 'Global / W3C',
    flagIcon: '🌐',
    status: 'compliant',
    summary:
      'Adherence to WCAG 2.2 AAA contrast standards (≥ 7.1:1), 44px minimum touch targets, high-visibility focus indicators, and full screen-reader support.',
    principles: [
      'Contrast ratio ≥ 7:1 for all primary text',
      'Interactive touch targets ≥ 44x44px',
      'Comprehensive ARIA live regions & landmarks',
    ],
  },
  {
    id: 'eaa-en301549',
    category: 'accessibility',
    code: 'EAA / EN 301 549',
    name: 'European Accessibility Act / EN 301 549',
    region: 'European Union',
    flagIcon: '🇪🇺',
    status: 'compliant',
    summary:
      'Harmonised European Standard for digital accessibility across ICT products and web interfaces.',
    principles: [
      'Perceivable, Operable, Understandable, Robust',
      'Assistive technology compatibility',
      'Full keyboard navigation',
    ],
  },
  {
    id: 'section-508',
    category: 'accessibility',
    code: 'Section 508',
    name: 'US Rehabilitation Act Section 508',
    region: 'United States',
    flagIcon: '🇺🇸',
    status: 'compliant',
    summary:
      'Federal accessibility compliance for electronic information systems, screen magnifiers, and assistive devices.',
    principles: [
      'Accessible alternative text on all media',
      'No color-only state indications',
      'Skip-to-content navigation links',
    ],
  },
  {
    id: 'i18n',
    category: 'accessibility',
    code: 'Internationalization (i18n)',
    name: 'Multi-Language Localization',
    region: 'Global',
    flagIcon: '✓',
    status: 'active',
    summary:
      'Native multi-language translation engine supporting English, Telugu, Hindi, Spanish, French, German, Arabic, Chinese, and Russian.',
    principles: [
      'Zero-runtime translation dictionary',
      'Dynamic language switching',
      'Locale-aware date and number formatting',
    ],
  },
  {
    id: 'rtl',
    category: 'accessibility',
    code: 'RTL support',
    name: 'Right-to-Left Layout Engine',
    region: 'Middle East & Global',
    flagIcon: '✓',
    status: 'active',
    summary:
      'Full bidirectional support with dynamic dir="rtl" switching, CSS logical properties, and layout mirroring for Arabic/Hebrew/Urdu.',
    principles: [
      'Dynamic HTML dir="rtl" attribute',
      'Logical flex and padding mirroring',
      'Flipped directional navigation icons',
    ],
  },
];
