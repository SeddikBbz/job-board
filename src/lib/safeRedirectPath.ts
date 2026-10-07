// Only allow same-site paths ("/dashboard"), never "//evil.com" or "https://…" (open redirect).
export const safeRedirectPath = (value: unknown, fallback = '/dashboard') =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : fallback
