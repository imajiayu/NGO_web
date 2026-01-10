/**
 * Email System Configuration
 */

import { NGOBranding } from './types'

// NGO Branding Configuration
export const NGO_BRANDING: NGOBranding = {
  name: {
    en: 'Way to Future UA',
    zh: '乌克兰未来之路',
    ua: 'Way to Future UA'
  },
  logoUrl: '', // No logo in emails
  websiteUrl: 'https://waytofutureua.org.ua',
  contactEmail: 'contact@waytofutureua.org.ua',
  socialLinks: {
    // TODO: Add actual social media links if available
    // facebook: 'https://facebook.com/waytofutureua',
    // twitter: 'https://twitter.com/waytofutureua',
    // instagram: 'https://instagram.com/waytofutureua',
  }
}

// Email color scheme - Website UI style (dark gradient theme)
export const EMAIL_COLORS = {
  // Primary gradient colors
  gradientStart: '#312e81',    // indigo-900
  gradientMid: '#581c87',      // purple-900
  gradientEnd: '#831843',      // pink-900

  // Accent colors
  primary: '#60a5fa',          // blue-400
  primaryDark: '#3b82f6',      // blue-500
  success: '#34d399',          // emerald-400
  successDark: '#059669',      // emerald-600
  warning: '#fbbf24',          // amber-400
  warningDark: '#f59e0b',      // amber-500
  info: '#60a5fa',             // blue-400
  error: '#f87171',            // red-400
  errorDark: '#ef4444',        // red-500

  // Text colors (for dark background)
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.9)',
  textLight: 'rgba(255,255,255,0.75)',
  textSubtle: 'rgba(255,255,255,0.5)',

  // Background colors
  background: '#0f0f23',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.1)',
  glassBg: 'rgba(255,255,255,0.1)',
  glassBorder: 'rgba(255,255,255,0.2)',

  // Legacy (for backwards compatibility)
  backgroundLight: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)'
} as const
