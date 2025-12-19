'use client'

interface ProjectSuppliesInfoProps {
  projectId: number
  locale: string
}

export default function ProjectSuppliesInfo({
  projectId,
  locale
}: ProjectSuppliesInfoProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
        <h2 className="text-2xl font-bold">
          {locale === 'en' ? 'Supplies & Expenses' : locale === 'zh' ? '物资清单与支出' : 'Матеріали та витрати'}
        </h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Supplies List Section */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {locale === 'en' ? 'Supply List' : locale === 'zh' ? '物资清单' : 'Список матеріалів'}
          </h3>

          {/* Placeholder for supplies list */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 italic">
              {locale === 'en'
                ? 'Supply list will be added via MDX content'
                : locale === 'zh'
                ? '物资清单将通过 MDX 内容添加'
                : 'Список матеріалів буде додано через MDX контент'}
            </p>
          </div>
        </section>

        {/* Unit Price Section */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {locale === 'en' ? 'Unit Price Breakdown' : locale === 'zh' ? '单价明细' : 'Детальна ціна за одиницю'}
          </h3>

          {/* Placeholder for unit price breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 italic">
              {locale === 'en'
                ? 'Price breakdown will be added via MDX content'
                : locale === 'zh'
                ? '单价明细将通过 MDX 内容添加'
                : 'Розбивка цін буде додана через MDX контент'}
            </p>
          </div>
        </section>

        {/* Expense Receipts Section */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {locale === 'en' ? 'Expense Receipts' : locale === 'zh' ? '支出凭证' : 'Квитанції про витрати'}
          </h3>

          {/* Placeholder for expense receipts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 italic">
              {locale === 'en'
                ? 'Expense receipts will be added via MDX content'
                : locale === 'zh'
                ? '支出凭证将通过 MDX 内容添加'
                : 'Квитанції про витрати будуть додані через MDX контент'}
            </p>
          </div>
        </section>

        {/* Admin notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">
              {locale === 'en' ? 'Note:' : locale === 'zh' ? '注意：' : 'Примітка:'}
            </span>{' '}
            {locale === 'en'
              ? 'Add custom supply lists, prices, and receipts by creating: '
              : locale === 'zh'
              ? '通过创建以下文件来添加自定义物资清单、价格和凭证：'
              : 'Додайте власні списки матеріалів, цін та квитанцій, створивши: '}
            <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
              components/projects/content/project-{projectId}-{locale}.mdx
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
