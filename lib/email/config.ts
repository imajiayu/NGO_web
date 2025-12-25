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

// Email color scheme
export const EMAIL_COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#0ea5e9',
  text: '#333333',
  textLight: '#6b7280',
  background: '#ffffff',
  backgroundLight: '#f9fafb',
  border: '#e0e0e0'
} as const
