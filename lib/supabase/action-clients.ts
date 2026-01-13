/**
 * Action Clients - Unified Supabase client factory for Server Actions
 *
 * Provides semantic client getters that encapsulate permission checks
 * and client initialization patterns.
 */

import { createAuthClient, requireAdmin } from './admin-auth'
import { createAnonClient, createServiceClient } from './server'

/**
 * Get admin client with automatic permission check
 * Use for admin-only operations
 */
export async function getAdminClient() {
  await requireAdmin()
  return createAuthClient()
}

/**
 * Get public (anonymous) client
 * Use for public operations that respect RLS
 */
export function getPublicClient() {
  return createAnonClient()
}

/**
 * Get internal (service) client
 * Use for webhooks and trusted server-side operations
 * CAUTION: Bypasses RLS
 */
export function getInternalClient() {
  return createServiceClient()
}

/**
 * Get user client with authentication context
 * Use for operations that need user session
 */
export async function getUserClient() {
  return createAuthClient()
}
