type PageHeaderProps = {
  title: string
  subtitle: string
  titleColor?: string
}

export default function PageHeader({
  title,
  subtitle,
  titleColor = 'text-gray-900'
}: PageHeaderProps) {
  return (
    <div className="text-center mb-12">
      <h1 className={`text-4xl lg:text-5xl font-bold ${titleColor} mb-4 font-display`}>
        {title}
      </h1>
      <p className="text-xl text-gray-600 font-light">
        {subtitle}
      </p>
    </div>
  )
}
