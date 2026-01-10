import fs from 'fs'
import path from 'path'

export interface EmailTemplate {
  name: string // 模板名称（用于显示）
  fileName: string // 文件名（不含扩展名）
  subject: {
    en: string
    zh: string
    ua: string
  }
  projectId?: string // 关联的项目 ID（用于生成 project_url）
}

export interface TemplateContent {
  en: string
  zh: string
  ua: string
}

/**
 * 获取所有可用的邮件模板
 * 扫描 broadcast/ 目录下的子文件夹
 * @returns 模板列表（name + fileName）
 */
export function getAvailableTemplates(): { name: string; fileName: string }[] {
  const templatesDir = path.join(process.cwd(), 'lib/email/templates/broadcast')

  try {
    const entries = fs.readdirSync(templatesDir, { withFileTypes: true })
    const templates = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const fileName = entry.name
        // 将文件名转换为显示名称（如 new-project -> New Project）
        const name = fileName
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        return { name, fileName }
      })

    return templates
  } catch (err) {
    console.error('Failed to read templates directory:', err)
    return []
  }
}

/**
 * 加载指定的邮件模板定义
 * @param fileName - 模板文件夹名称
 * @returns 模板定义或 null
 */
export function getEmailTemplate(fileName: string): EmailTemplate | null {
  try {
    // 从子文件夹加载模板定义
    const template = require(`./broadcast/${fileName}`).default as EmailTemplate
    return template
  } catch (err) {
    console.error(`Failed to load template: ${fileName}`, err)
    return null
  }
}

/**
 * 加载模板的 HTML 内容（三种语言）
 * 从 content/{templateName}/ 目录加载 {locale}.html 文件
 * @param templateName - 模板名称
 * @returns 三种语言的内容
 */
export function loadTemplateContent(templateName: string): TemplateContent | null {
  const contentDir = path.join(process.cwd(), 'lib/email/templates/content', templateName)

  try {
    const en = fs.readFileSync(path.join(contentDir, 'en.html'), 'utf-8')
    const zh = fs.readFileSync(path.join(contentDir, 'zh.html'), 'utf-8')
    const ua = fs.readFileSync(path.join(contentDir, 'ua.html'), 'utf-8')

    return { en, zh, ua }
  } catch (err) {
    console.error(`Failed to load template content: ${templateName}`, err)
    return null
  }
}

/**
 * 替换模板变量
 * @param content - HTML 内容
 * @param variables - 变量映射（如 { unsubscribe_url: "..." }）
 * @returns 替换后的内容
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content

  // 替换所有 {{variable_name}} 格式的变量
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, value)
  })

  return result
}

/**
 * 获取完整的邮件模板（定义 + 内容）
 * @param fileName - 模板文件夹名称
 * @returns 模板定义和内容，或 null
 */
export function getCompleteEmailTemplate(fileName: string): {
  template: EmailTemplate
  content: TemplateContent
} | null {
  const template = getEmailTemplate(fileName)
  if (!template) return null

  // 直接使用 fileName 作为文件夹名加载内容
  const content = loadTemplateContent(fileName)
  if (!content) return null

  return { template, content }
}
