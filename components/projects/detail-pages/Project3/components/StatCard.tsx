'use client'

import { AnimatedNumber } from '@/components/projects/shared'

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  subLabel?: string
  prefix?: string
  colorScheme?: 'gold' | 'pine' | 'berry'
}

export default function StatCard({
  icon: Icon,
  value,
  label,
  subLabel,
  prefix = '',
  colorScheme = 'gold',
}: StatCardProps) {
  const colors = {
    gold: {
      bg: 'from-christmas-gold/20 via-amber-50 to-orange-50',
      border: 'border-christmas-gold/30',
      icon: 'from-christmas-gold to-amber-600',
      text: 'text-christmas-gold-dark',
    },
    pine: {
      bg: 'from-christmas-pine/20 via-emerald-50 to-teal-50',
      border: 'border-christmas-pine/30',
      icon: 'from-christmas-pine to-emerald-700',
      text: 'text-christmas-pine',
    },
    berry: {
      bg: 'from-christmas-berry/20 via-rose-50 to-red-50',
      border: 'border-christmas-berry/30',
      icon: 'from-christmas-berry to-rose-700',
      text: 'text-christmas-berry',
    },
  }
  const c = colors[colorScheme]

  return (
    <div
      className={`relative p-2.5 md:p-4 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} overflow-hidden group hover:shadow-md transition-all duration-300`}
    >
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-xl" />
      {/* Mobile: vertical stack, Desktop: horizontal */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3">
        <div
          className={`w-7 h-7 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${c.icon} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0`}
        >
          <Icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-data text-lg md:text-2xl font-bold ${c.text} leading-tight`}>
            <AnimatedNumber value={value} prefix={prefix} />
          </div>
          <div className="text-[10px] md:text-xs text-gray-600 leading-tight">{label}</div>
          {subLabel && <div className="text-[10px] text-gray-500">{subLabel}</div>}
        </div>
      </div>
    </div>
  )
}
