import crypto from 'crypto'
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetPaymentStatusResponse,
  NowPaymentsWebhookBody,
  NowPaymentsError,
} from './types'

// Validate environment variables
if (!process.env.NOWPAYMENTS_API_KEY) {
  console.warn('NOWPAYMENTS_API_KEY is not set - NOWPayments integration will not work')
}

if (!process.env.NOWPAYMENTS_IPN_SECRET) {
  console.warn('NOWPAYMENTS_IPN_SECRET is not set - Webhook verification will fail')
}

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ''
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || ''
const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1'

/**
 * Sort object keys alphabetically (required for signature verification)
 */
function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sorted[key] = sortObjectKeys(value)
    } else {
      sorted[key] = value
    }
  }
  return sorted
}

/**
 * Verify NOWPayments IPN (webhook) signature
 * @see https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup
 *
 * The signature verification process:
 * 1. Sort the webhook body keys alphabetically
 * 2. Generate HMAC-SHA512 hash using IPN secret
 * 3. Compare with received signature
 */
export function verifyNowPaymentsSignature(
  body: Record<string, any>,
  receivedSignature: string
): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) {
    console.error('[NOWPAYMENTS] IPN secret not configured')
    return false
  }

  try {
    // Sort body keys alphabetically
    const sortedBody = sortObjectKeys(body)
    const bodyString = JSON.stringify(sortedBody)

    // Generate HMAC-SHA512 signature
    const hmac = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
    hmac.update(bodyString)
    const calculatedSignature = hmac.digest('hex')

    // Compare signatures (case-insensitive)
    return calculatedSignature.toLowerCase() === receivedSignature.toLowerCase()
  } catch (error) {
    console.error('[NOWPAYMENTS] Signature verification error:', error)
    return false
  }
}

/**
 * Create a NOWPayments payment
 * @see https://documenter.getpostman.com/view/7907941/2s93JusNJt#create-payment
 */
export async function createNowPaymentsPayment(
  params: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  console.log('[NOWPAYMENTS] Creating payment:', {
    order_id: params.order_id,
    price_amount: params.price_amount,
    price_currency: params.price_currency,
    pay_currency: params.pay_currency || '(user choice)',
  })

  const response = await fetch(`${NOWPAYMENTS_API_BASE}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json() as NowPaymentsError
    console.error('[NOWPAYMENTS] Create payment error:', {
      status: response.status,
      code: errorData.code,
      message: errorData.message,
    })
    throw new Error(`NOWPayments API error: ${errorData.message || response.statusText}`)
  }

  const data = await response.json() as CreatePaymentResponse

  console.log('[NOWPAYMENTS] Payment created:', {
    payment_id: data.payment_id,
    pay_address: data.pay_address,
    pay_amount: data.pay_amount,
    pay_currency: data.pay_currency,
    status: data.payment_status,
  })

  return data
}

/**
 * Get payment status by payment_id
 * @see https://documenter.getpostman.com/view/7907941/2s93JusNJt#get-payment-status
 */
export async function getNowPaymentsStatus(
  paymentId: string | number
): Promise<GetPaymentStatusResponse> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  const response = await fetch(`${NOWPAYMENTS_API_BASE}/payment/${paymentId}`, {
    method: 'GET',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  })

  if (!response.ok) {
    const errorData = await response.json() as NowPaymentsError
    throw new Error(`NOWPayments API error: ${errorData.message || response.statusText}`)
  }

  return await response.json() as GetPaymentStatusResponse
}

/**
 * Get minimum payment amount for a currency pair
 * @see https://documenter.getpostman.com/view/7907941/2s93JusNJt#get-minimum-payment-amount
 */
export async function getMinimumPaymentAmount(
  currencyFrom: string,
  currencyTo: string
): Promise<number> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  const response = await fetch(
    `${NOWPAYMENTS_API_BASE}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get minimum amount: ${response.statusText}`)
  }

  const data = await response.json()
  return data.min_amount
}

/**
 * Get minimum payment amount in USD for a specific pay currency
 * This queries the real minimum based on the crypto -> outcome wallet conversion
 * then converts it to USD for display
 *
 * @param payCurrency - The cryptocurrency the user will pay with (e.g., 'btc', 'eth')
 * @param outcomeWallet - The merchant's outcome wallet currency (default: 'usdttrc20')
 */
export async function getMinimumPaymentAmountInUsd(
  payCurrency: string,
  outcomeWallet: string = 'usdttrc20'
): Promise<number> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  try {
    // Step 1: Get minimum in crypto (payCurrency -> outcomeWallet)
    const minResponse = await fetch(
      `${NOWPAYMENTS_API_BASE}/min-amount?currency_from=${payCurrency}&currency_to=${outcomeWallet}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      }
    )

    const minData = await minResponse.json()

    // Check if the conversion is not supported
    if (minData.status === false || !minData.min_amount) {
      // Fall back to USD -> payCurrency minimum
      return await getFallbackMinimum(payCurrency)
    }

    const minCrypto = minData.min_amount

    // Step 2: Convert crypto minimum to USD using estimate
    const estResponse = await fetch(
      `${NOWPAYMENTS_API_BASE}/estimate?amount=${minCrypto}&currency_from=${payCurrency}&currency_to=usd`,
      {
        method: 'GET',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      }
    )

    const estData = await estResponse.json()

    // Check if estimate failed
    if (estData.status === false || !estData.estimated_amount) {
      return await getFallbackMinimum(payCurrency)
    }

    // estimated_amount is returned as a string
    const usdAmount = parseFloat(estData.estimated_amount)

    // Add 10% buffer for exchange rate fluctuations
    return Math.ceil(usdAmount * 1.1 * 100) / 100
  } catch {
    // On any error, use fallback
    return await getFallbackMinimum(payCurrency)
  }
}

/**
 * Fallback method: Get minimum using USD -> payCurrency query
 */
async function getFallbackMinimum(payCurrency: string): Promise<number> {
  const response = await fetch(
    `${NOWPAYMENTS_API_BASE}/min-amount?currency_from=usd&currency_to=${payCurrency}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get minimum amount: ${response.statusText}`)
  }

  const data = await response.json()
  return data.min_amount || 20 // Default to $20 if no data
}

/**
 * Get estimated price for currency conversion
 * @see https://documenter.getpostman.com/view/7907941/2s93JusNJt#get-estimated-price
 */
export async function getEstimatedPrice(
  amount: number,
  currencyFrom: string,
  currencyTo: string
): Promise<number> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  const response = await fetch(
    `${NOWPAYMENTS_API_BASE}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get estimate: ${response.statusText}`)
  }

  const data = await response.json()
  return data.estimated_amount
}

/**
 * Get available currencies (simple list)
 * @see https://documenter.getpostman.com/view/7907941/2s93JusNJt#get-available-currencies
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  const response = await fetch(`${NOWPAYMENTS_API_BASE}/currencies`, {
    method: 'GET',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get currencies: ${response.statusText}`)
  }

  const data = await response.json()
  return data.currencies
}

/**
 * Full currency info returned from /full-currencies endpoint
 */
export interface FullCurrencyInfo {
  id: number
  code: string
  name: string
  logo_url: string
  network: string
  is_popular: boolean
  is_stable: boolean
  available_for_payment: boolean
  ticker: string
}

/**
 * Get full currency information with logos and metadata
 * Only returns currencies available for payment
 */
export async function fetchAvailableCurrencies(): Promise<FullCurrencyInfo[]> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  const response = await fetch(`${NOWPAYMENTS_API_BASE}/full-currencies`, {
    method: 'GET',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get currencies: ${response.statusText}`)
  }

  const data = await response.json()

  // Filter to only show currencies available for payment
  return data.currencies.filter((c: FullCurrencyInfo) => c.available_for_payment)
}

/**
 * Check API status
 * @see https://documenter.getpostman.com/view/7907941/2s93JusNJt#api-status
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_BASE}/status`, {
      method: 'GET',
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.message === 'OK'
  } catch {
    return false
  }
}

// Re-export types for convenience
export * from './types'
