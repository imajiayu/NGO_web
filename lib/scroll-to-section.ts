// 滚动落点的导航栏高度补偿（手动微调）。
// 桌面端 64 = Navigation 的 h-16，落点正好在两区块分界处（导航栏底边贴 section 顶边）。
// 移动端浏览器滚动时地址栏收起会多滚一段，用更大的偏移做静态补偿；按设备手动调这个值：
//   调大 → 滚动更少 → 标题下移、上方留白变多；调小 → 反之。
const NAV_OFFSET_DESKTOP = 64
const NAV_OFFSET_MOBILE = 112

/**
 * 平滑滚动到指定 id 的元素，顶部预留导航栏高度补偿，使目标区块顶边对齐到导航栏底边。
 * 供首页「跳到项目 / 跳到合规」等锚点按钮复用。
 */
export function scrollToElementById(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return
  const navHeight = window.matchMedia('(max-width: 767px)').matches
    ? NAV_OFFSET_MOBILE
    : NAV_OFFSET_DESKTOP
  const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - navHeight
  window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
}
