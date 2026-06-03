/**
 * 平滑滚动到指定 id 的元素，顶部预留固定导航栏高度。
 * 供首页「跳到项目 / 跳到合规」等锚点按钮复用。
 */
export function scrollToElementById(elementId: string, navHeight = 80) {
  const element = document.getElementById(elementId)
  if (!element) return
  const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - navHeight
  window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
}
