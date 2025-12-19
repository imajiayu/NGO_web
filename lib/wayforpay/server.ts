import crypto from 'crypto'

if (!process.env.WAYFORPAY_MERCHANT_ACCOUNT) {
  throw new Error('WAYFORPAY_MERCHANT_ACCOUNT is not set')
}

if (!process.env.WAYFORPAY_SECRET_KEY) {
  throw new Error('WAYFORPAY_SECRET_KEY is not set')
}

export const WAYFORPAY_MERCHANT_ACCOUNT = process.env.WAYFORPAY_MERCHANT_ACCOUNT
export const WAYFORPAY_SECRET_KEY = process.env.WAYFORPAY_SECRET_KEY
export const WAYFORPAY_MERCHANT_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Generate WayForPay signature
 * @param values Array of values to sign (order matters!)
 * @returns MD5 hash signature
 */
export function generateSignature(values: (string | number)[]): string {
  const signString = values.join(';')
  return crypto.createHash('md5').update(signString).digest('hex')
}

/**
 * WayForPay Payment Parameters
 */
export interface WayForPayPaymentParams {
  merchantAccount: string
  merchantAuthType: 'SimpleSignature'
  merchantDomainName: string
  merchantSignature: string
  orderReference: string
  orderDate: number
  amount: number
  currency: 'UAH' | 'USD' | 'EUR'
  productName: string[]
  productPrice: number[]
  productCount: number[]
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  language: 'UA' | 'EN' | 'RU'
  returnUrl: string
  serviceUrl: string
}

/**
 * Create WayForPay payment parameters
 */
export function createWayForPayPayment({
  orderReference,
  amount,
  currency = 'UAH',
  productName,
  productPrice,
  productCount,
  clientFirstName,
  clientLastName,
  clientEmail,
  clientPhone,
  language = 'UA',
  returnUrl,
  serviceUrl,
}: {
  orderReference: string
  amount: number
  currency?: 'UAH' | 'USD' | 'EUR'
  productName: string[]
  productPrice: number[]
  productCount: number[]
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  language?: 'UA' | 'EN' | 'RU'
  returnUrl: string
  serviceUrl: string
}): WayForPayPaymentParams {
  const orderDate = Math.floor(Date.now() / 1000)

  // Generate signature
  // Order: merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
  const signatureValues = [
    WAYFORPAY_MERCHANT_ACCOUNT,
    WAYFORPAY_MERCHANT_DOMAIN,
    orderReference,
    orderDate,
    amount,
    currency,
    ...productName,
    ...productCount,
    ...productPrice,
  ]

  const merchantSignature = generateSignature(signatureValues)

  return {
    merchantAccount: WAYFORPAY_MERCHANT_ACCOUNT,
    merchantAuthType: 'SimpleSignature',
    merchantDomainName: WAYFORPAY_MERCHANT_DOMAIN,
    merchantSignature,
    orderReference,
    orderDate,
    amount,
    currency,
    productName,
    productPrice,
    productCount,
    clientFirstName,
    clientLastName,
    clientEmail,
    clientPhone,
    language,
    returnUrl,
    serviceUrl,
  }
}

/**
 * Verify WayForPay callback signature
 */
export function verifyWayForPaySignature(
  data: Record<string, any>,
  receivedSignature: string
): boolean {
  // Signature fields order for payment notification:
  // merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
  const signatureValues = [
    data.merchantAccount,
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode || '',
    data.cardPan || '',
    data.transactionStatus,
    data.reasonCode || '',
  ]

  const calculatedSignature = generateSignature(signatureValues)
  return calculatedSignature === receivedSignature
}

/**
 * WayForPay transaction statuses
 */
export const WAYFORPAY_STATUS = {
  APPROVED: 'Approved', // Payment successful
  DECLINED: 'Declined', // Payment declined
  PENDING: 'Pending', // Payment pending
  REFUND_IN_PROCESSING: 'RefundInProcessing', // Refund being processed
  REFUNDED: 'Refunded', // Refund completed
} as const

export type WayForPayStatus = typeof WAYFORPAY_STATUS[keyof typeof WAYFORPAY_STATUS]
