import { getTranslations } from 'next-intl/server'

export default async function ComplianceSection() {
  const t = await getTranslations('home.hero.compliance')

  const documents = [
    { key: 'registration', file: '非营利组织登记册摘录.pdf' },
    { key: 'charter', file: '章程.pdf' },
    { key: 'edrpou', file: 'ЄДРПОУ 登记信息证明（带公章）.pdf' },
    { key: 'application', file: '申请获取〈非营利组织登记册摘录〉的申请文件.pdf' },
    { key: 'procurement', file: '采购管理政策.pdf' },
    { key: 'conflict', file: '利益冲突政策.pdf' },
    { key: 'accounting', file: '会计政策.pdf' },
    { key: 'info', file: '登记信息摘录.pdf' }
  ]

  return (
    <section id="compliance-section" className="relative bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-12 md:py-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Documents Grid - Single Row */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div className="flex gap-4 min-w-min px-2">
            {documents.map(({ key, file }) => (
              <a
                key={key}
                href={`/documents/${encodeURIComponent(file)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 w-48 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* PDF Icon */}
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Document Name */}
                <p className="text-sm font-medium text-gray-900 text-center leading-tight group-hover:text-blue-600 transition-colors line-clamp-3">
                  {t(`documents.${key}` as any)}
                </p>

                {/* Download Indicator */}
                <div className="mt-3 flex justify-center">
                  <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                    PDF
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Scroll Hint (Mobile) */}
        <div className="md:hidden text-center mt-4">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            {t('scrollHint')}
          </p>
        </div>
      </div>
    </section>
  )
}
