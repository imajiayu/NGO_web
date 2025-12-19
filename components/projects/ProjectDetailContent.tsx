'use client'

import { useTranslations } from 'next-intl'

interface ProjectDetailContentProps {
  projectId: number
  projectName: string
  locale: string
}

export default function ProjectDetailContent({
  projectId,
  projectName,
  locale
}: ProjectDetailContentProps) {
  const t = useTranslations('donate')

  // TODO: In the future, dynamically import MDX content files
  // For now, show a placeholder with instructions for manual content editing

  return (
    <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Content Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{projectName}</h1>
        <p className="text-blue-100">
          {locale === 'en' ? 'Project Details' : locale === 'zh' ? '项目详情' : 'Деталі проекту'}
        </p>
      </div>

      {/* Content Body - Empty, waiting for MDX content */}
      <div className="p-8">
        {/* Placeholder notice for admin */}
        <div className="p-6 bg-yellow-50 border-2 border-yellow-200 border-dashed rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-bold text-yellow-900 mb-1">
                {locale === 'en' ? 'For Administrators' : locale === 'zh' ? '管理员须知' : 'Для адміністраторів'}
              </h4>
              <p className="text-sm text-yellow-800">
                {locale === 'en'
                  ? 'This is placeholder content for Project #' + projectId + '. To add custom content, create a file at: '
                  : locale === 'zh'
                  ? '这是项目 #' + projectId + ' 的占位内容。要添加自定义内容，请在以下位置创建文件：'
                  : 'Це вміст-заповнювач для проекту #' + projectId + '. Щоб додати власний контент, створіть файл за адресою: '}
                <code className="bg-yellow-100 px-2 py-0.5 rounded text-xs ml-1">
                  components/projects/content/project-{projectId}-{locale}.mdx
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
