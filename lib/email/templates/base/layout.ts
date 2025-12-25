/**
 * Base Email Layout
 */

import { baseStyles } from './styles'
import { createHeader, createFooter } from './components'
import { Locale } from '../../types'

interface EmailLayoutParams {
  title: string
  content: string
  locale: Locale
}

/**
 * Create complete email HTML with base layout
 */
export function createEmailLayout({ title, content, locale }: EmailLayoutParams): string {
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${baseStyles}
  </style>
</head>
<body>
  <div class="email-container">
    ${createHeader(title, locale)}
    <div class="content">
      ${content}
    </div>
    ${createFooter(locale)}
  </div>
</body>
</html>
  `.trim()
}

/**
 * Create plain text version of email
 */
export function createTextLayout(content: string): string {
  // Remove HTML tags and format for plain text
  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
