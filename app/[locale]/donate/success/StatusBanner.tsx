type StatusBannerProps = {
  type: 'failed' | 'processing' | 'success'
  title: string
  description: string
  amount: number
  amountLabel: string
}

const STATUS_STYLES = {
  failed: {
    container: 'bg-red-50 border-l-4 border-red-500',
    icon: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-800',
    amount: 'text-red-700',
  },
  processing: {
    container: 'bg-yellow-50 border-l-4 border-yellow-400',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-800',
    amount: 'text-yellow-700',
  },
  success: {
    container: 'bg-green-50 border-l-4 border-green-500',
    icon: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-800',
    amount: 'text-green-700',
  },
} as const

const STATUS_ICONS = {
  failed: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  processing: (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  success: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
} as const

export default function StatusBanner({ type, title, description, amount, amountLabel }: StatusBannerProps) {
  const styles = STATUS_STYLES[type]
  const icon = STATUS_ICONS[type]

  return (
    <div className={`${styles.container} p-6 rounded-lg`}>
      <div className="flex items-start gap-3">
        <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${styles.title} text-lg mb-1`}>{title}</h3>
          <p className={`text-sm ${styles.description} mb-3`}>{description}</p>
          <div className={`text-sm ${styles.amount}`}>
            <span className="font-medium">{amountLabel}</span>{' '}
            {type === 'success' ? (
              <span className="text-xl font-bold text-green-900">${amount.toFixed(2)}</span>
            ) : (
              <span>${amount.toFixed(2)}</span>
            )}{' '}
            USD
          </div>
        </div>
      </div>
    </div>
  )
}
