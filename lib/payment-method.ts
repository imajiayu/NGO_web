// ============================================
// 支付方式工具库
// 单一数据源：donations.payment_method 的全部取值与判断函数
// ============================================
//
// 与 `lib/donation-status.ts`（只管 donation_status）分开：payment_method 是
// 另一列，语义上与状态无关。数据库侧 `payment_method` 是无 CHECK 约束的
// varchar(50)，取值约定只由这里和 RLS 策略共同维护。

/** 线上支付网关写入的标签。由三个 webhook 分支精确字符串比较消费。 */
export type OnlinePaymentMethod = 'WayForPay' | 'NOWPayments' | 'QmmPay'

/**
 * admin 手动录入的线下捐赠（银行转账、现金、当面交付）。
 *
 * 线下捐赠没有支付网关订单，无法在线退款——`requestRefund` 据此提前返回，
 * 追踪页据此隐藏退款按钮。数据库侧由 "Admins can insert offline donations"
 * 策略强制同一取值。
 */
export const OFFLINE_PAYMENT_METHOD = 'Offline'

export type PaymentMethodLabel = OnlinePaymentMethod | typeof OFFLINE_PAYMENT_METHOD

/** 该笔捐赠是否为线下录入（无支付网关订单，不可在线退款） */
export function isOfflineDonation(paymentMethod: string | null | undefined): boolean {
  return paymentMethod === OFFLINE_PAYMENT_METHOD
}
