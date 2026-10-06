export const siteUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// Minimal, inline-styled wrapper: email clients ignore most CSS.
export const emailLayout = ({ title, body }: { title: string; body: string }) => `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
      <tr><td>
        <p style="margin:0 0 24px;font-weight:bold;color:#2f4fd6">JobBoard</p>
        <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
        ${body}
        <p style="margin:32px 0 0;font-size:12px;color:#71717a">You received this email because of activity on your JobBoard account.</p>
      </td></tr>
    </table>
  </body>
</html>`

export const emailButton = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#2f4fd6;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escapeHtml(label)}</a></p>`
