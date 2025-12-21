'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'

export default function ApproachSection() {
  const t = useTranslations('home.hero.approach')
  const tCompliance = useTranslations('home.hero.compliance')

  const handleScrollToCompliance = () => {
    const complianceSection = document.getElementById('compliance-section')
    if (complianceSection) {
      const navHeight = 80
      const elementPosition = complianceSection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const features = [
    {
      key: 'transparent',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      image: '/images/approach/transparent.webp'
    },
    {
      key: 'efficient',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      image: '/images/approach/efficient.webp'
    },
    {
      key: 'direct',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-red-500',
      image: '/images/approach/direct.webp'
    }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/images/hero/2.webp"
          alt="Approach"
          fill
          className="object-cover mix-blend-overlay"
          quality={60}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-blue-100 text-blue-700 rounded-full mb-6">
            {t('label')}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 break-words">
            {t('title')}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-5xl mx-auto">
            <p className="text-xl sm:text-2xl text-gray-600 text-center sm:text-left break-words">
              {t('subtitle')}
            </p>
            <button
              onClick={handleScrollToCompliance}
              className="inline-flex items-center px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="whitespace-nowrap">{tCompliance('button')}</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map(({ key, icon, gradient, image }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              {/* Background Image */}
              <Image
                src={image}
                alt={t(`${key}.title` as any)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* Gradient Overlay - Stronger overlay for better contrast */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-25 transition-all duration-500`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/30 group-hover:from-black/70 group-hover:via-black/50 group-hover:to-black/40 transition-all duration-500" />

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8">
                {/* Icon and Title - ensure consistent display */}
                <div className="mb-6">
                  <div className={`inline-flex p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg`}>
                    {icon}
                  </div>
                </div>

                {/* Title with backdrop - no wrapping */}
                <h3 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide mb-6 inline-block px-3 py-2 bg-black/20 backdrop-blur-sm rounded-lg shadow-lg whitespace-nowrap">
                  {t(`${key}.title` as any)}
                </h3>

                {/* List Items with subtle backdrop */}
                <ul className="space-y-3">
                  {(t.raw(`${key}.items` as any) as string[]).map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 drop-shadow-lg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-white text-sm sm:text-base leading-relaxed font-medium px-2 py-1 bg-black/15 backdrop-blur-sm rounded shadow-md">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
