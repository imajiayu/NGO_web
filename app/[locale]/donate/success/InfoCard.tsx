import { ReactNode } from 'react'

type InfoCardProps = {
  variant: 'blue' | 'purple' | 'yellow'
  title: string
  description: string | ReactNode
  icon?: ReactNode
}

const VARIANT_STYLES = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    borderStyle: 'border',
    title: 'text-blue-900',
    description: 'text-blue-800',
    icon: 'text-blue-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    borderStyle: 'border',
    title: 'text-purple-900',
    description: 'text-purple-800',
    icon: 'text-purple-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    borderStyle: 'border-l-4',
    title: 'text-yellow-900',
    description: 'text-yellow-800',
    icon: 'text-yellow-600',
  },
} as const

export default function InfoCard({
  variant,
  title,
  description,
  icon
}: InfoCardProps) {
  const styles = VARIANT_STYLES[variant]
  const borderClass = styles.borderStyle

  return (
    <div className={`${styles.bg} ${borderClass} ${styles.border} rounded-lg p-${icon ? '6' : '5'}`}>
      {icon ? (
        <div className="flex items-start gap-3">
          <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
            {icon}
          </div>
          <div>
            <h4 className={`font-semibold ${styles.title} mb-1`}>{title}</h4>
            <div className={`text-sm ${styles.description}`}>{description}</div>
          </div>
        </div>
      ) : (
        <>
          <h4 className={`font-semibold ${styles.title} mb-2`}>{title}</h4>
          <div className={`text-sm ${styles.description}`}>{description}</div>
        </>
      )}
    </div>
  )
}
