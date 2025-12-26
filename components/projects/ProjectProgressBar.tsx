'use client'

interface ProjectProgressBarProps {
  current: number
  target: number
  unitName?: string
  className?: string
  showAsAmount?: boolean // For aggregated projects, show as dollar amounts
}

export default function ProjectProgressBar({
  current,
  target,
  unitName = '',
  className = '',
  showAsAmount = false,
}: ProjectProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const isComplete = current >= target

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          {showAsAmount ? (
            <>
              ${current.toLocaleString()} / ${target.toLocaleString()}
            </>
          ) : (
            <>
              {current} / {target} {unitName}
            </>
          )}
        </span>
        <span className={isComplete ? 'text-green-600 font-medium' : ''}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isComplete ? 'bg-green-500' : 'bg-blue-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
