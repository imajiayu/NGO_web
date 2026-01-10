/**
 * Base Email Layout - Website UI Style (Dark Gradient Theme)
 *
 * Uses inline styles for maximum email client compatibility
 */

import { createHeader, createFooter } from './components'
import { Locale } from '../../types'

interface EmailLayoutParams {
  title: string
  content: string
  locale: Locale
  badge?: string  // Optional badge text above title
  subtitle?: string  // Optional subtitle below title
}

/**
 * Create complete email HTML with base layout
 * Uses table-based layout with inline styles for email client compatibility
 */
export function createEmailLayout({ title, content, locale, badge, subtitle }: EmailLayoutParams): string {
  const fontFamily = locale === 'zh'
    ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${fontFamily}; background-color: #0f0f23;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #312e81 0%, #581c87 50%, #831843 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.03); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">

          ${createHeader(title, locale, badge, subtitle)}

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px;">
              ${content}
            </td>
          </tr>

          ${createFooter(locale)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
