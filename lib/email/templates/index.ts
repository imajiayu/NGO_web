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
  contentFile: string // 内容文件路径（相对于 content/ 目录，不含扩展名）
}

export interface TemplateContent {
  en: string
  zh: string
  ua: string
}

/**
 * 获取所有可用的邮件模板
 * @returns 模板列表（name + fileName）
 */
export function getAvailableTemplates(): { name: string; fileName: string }[] {
  const templatesDir = path.join(process.cwd(), 'lib/email/templates/broadcast')

  try {
    const files = fs.readdirSync(templatesDir)
    const templates = files
      .filter((file) => file.endsWith('.ts') && !file.startsWith('index'))
      .map((file) => {
        const fileName = file.replace('.ts', '')
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
 * @param fileName - 模板文件名（不含扩展名）
 * @returns 模板定义或 null
 */
export function getEmailTemplate(fileName: string): EmailTemplate | null {
  try {
    // 动态导入模板文件
    const template = require(`./broadcast/${fileName}`).default as EmailTemplate
    return template
  } catch (err) {
    console.error(`Failed to load template: ${fileName}`, err)
    return null
  }
}

/**
 * 加载模板的 HTML 内容（三种语言）
 * @param contentFile - 内容文件名（不含扩展名和语言后缀）
 * @returns 三种语言的内容
 */
export function loadTemplateContent(contentFile: string): TemplateContent | null {
  const contentDir = path.join(process.cwd(), 'lib/email/templates/content')

  try {
    const en = fs.readFileSync(path.join(contentDir, `${contentFile}.en.html`), 'utf-8')
    const zh = fs.readFileSync(path.join(contentDir, `${contentFile}.zh.html`), 'utf-8')
    const ua = fs.readFileSync(path.join(contentDir, `${contentFile}.ua.html`), 'utf-8')

    return { en, zh, ua }
  } catch (err) {
    console.error(`Failed to load template content: ${contentFile}`, err)
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
 * @param fileName - 模板文件名
 * @returns 模板定义和内容，或 null
 */
export function getCompleteEmailTemplate(fileName: string): {
  template: EmailTemplate
  content: TemplateContent
} | null {
  const template = getEmailTemplate(fileName)
  if (!template) return null

  const content = loadTemplateContent(template.contentFile)
  if (!content) return null

  return { template, content }
}
