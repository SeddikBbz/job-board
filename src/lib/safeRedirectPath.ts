// Only allow same-site paths ("/dashboard"), never "//evil.com" or "https://…" (open redirect).
// Browsers silently drop tabs and newlines in URLs ("/\t/evil.com" becomes "//evil.com"), and some
// treat "\" like "/", so any control character or backslash is rejected too.
const UNSAFE_CHARS = /[\u0000-\u001f\u007f\\]/

export const safeRedirectPath = (value: unknown, fallback = '/dashboard') =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !UNSAFE_CHARS.test(value)
    ? value
    : fallback
