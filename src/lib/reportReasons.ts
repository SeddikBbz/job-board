// Shared by the reports collection (server) and the report dialog (browser)
export const REPORT_REASONS = [
  { value: 'scam', label: 'Scam or asks for money' },
  { value: 'misleading', label: 'Misleading or fake' },
  { value: 'discriminatory', label: 'Discriminatory' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'other', label: 'Something else' },
] as const
