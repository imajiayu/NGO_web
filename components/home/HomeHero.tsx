import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { cn } from '@/lib/utils'

import ApproachCarousel from './ApproachCarousel'
import ScrollToComplianceButton from './ScrollToComplianceButton'
import ScrollToProjectsButton from './ScrollToProjectsButton'

/**
 * 首页融合首屏（响应式，移动端与桌面端统一）
 * 将「使命 / 影响 / 方式」三层信息压缩进约 1.5 屏的深色沉浸叙事：
 * - Band A: 深色 Hero（照片墙 + 标题/副标题/双 CTA + 影响数据条）
 *   桌面：左照片墙 + 右下文案；移动：文案在上、照片墙、CTA、数据条单列堆叠
 * - Band B: 浅色方式带（透明 / 高效 / 直接）
 */
export default async function HomeHero() {
  const t = await getTranslations('home.hero')
  const locale = await getLocale()

  // 桌面端（lg+）大标题始终单行：用 clamp 按视口宽度缩放字号保证不换行，直到掉到 lg 以下走移动端样式（正常换行）。
  // 各语言长度不同（中文最短、英文最长），单独设 clamp(min, vw, max)。
  const titleSizeByLocale: Record<string, string> = {
    en: 'lg:whitespace-nowrap lg:[font-size:clamp(2rem,3.3vw,3.375rem)]',
    zh: 'lg:whitespace-nowrap lg:[font-size:clamp(2.5rem,6.5vw,4.5rem)]',
    ua: 'lg:whitespace-nowrap lg:[font-size:clamp(2rem,4.8vw,4.5rem)]',
  }
  const titleSizeClass = titleSizeByLocale[locale] ?? titleSizeByLocale.en

  // 照片墙：8 张图不裁剪、按原比例分 3 行，每行图数/比例不同 → 右侧犬牙交错
  const W = '/images/home'
  const photoRows = [
    [
      { src: `${W}/people.webp`, w: 800, h: 533, alt: t('impact.people.label') },
      { src: `${W}/civilians.webp`, w: 1600, h: 1067, alt: t('mission.civilians') },
    ],
    [
      { src: `${W}/donations.webp`, w: 800, h: 800, alt: t('impact.donations.label') },
      { src: `${W}/recovery.webp`, w: 1290, h: 1954, alt: t('impact.people.label') },
      { src: `${W}/distribution.webp`, w: 1600, h: 1200, alt: t('impact.subtitle') },
    ],
    [
      { src: `${W}/bg-texture.webp`, w: 1071, h: 875, alt: '' },
      { src: `${W}/women.webp`, w: 1400, h: 1386, alt: t('mission.women') },
      { src: `${W}/shelters.webp`, w: 800, h: 1200, alt: t('impact.shelters.label') },
    ],
  ] as const

  // 移动端马赛克条：去掉纯纹理图（alt 为空），仅保留真实影像照片（7 张）
  const mobilePhotos = photoRows.flat().filter((p) => p.alt !== '')

  // 底部影响数据条
  const stats = [
    { value: t('impact.donations.value'), label: t('impact.donations.label') },
    { value: t('impact.people.value'), label: t('impact.people.label') },
    { value: t('impact.shelters.value'), label: t('impact.shelters.label') },
  ] as const

  // 方式带三要点
  const approachFeatures = [
    {
      key: 'transparent',
      image: '/images/home/transparent.webp',
      objectPosition: '',
      accentText: 'text-ukraine-blue-300',
      accentBar: 'from-ukraine-blue-400 to-ukraine-blue-300',
    },
    {
      key: 'efficient',
      image: '/images/home/efficient.webp',
      // 第二张图取景上移（显示更上方）→ 画面内容相对下移
      objectPosition: 'lg:object-[center_30%]',
      accentText: 'text-ukraine-gold-300',
      accentBar: 'from-ukraine-gold-400 to-ukraine-gold-300',
    },
    {
      key: 'direct',
      image: '/images/home/direct.webp',
      // 桌面：放大并以左下角为原点 → 露出图片左下区域
      objectPosition: 'lg:scale-[1.15] lg:origin-bottom-left',
      accentText: 'text-life-300',
      accentBar: 'from-life-400 to-life-300',
    },
  ] as const

  return (
    <div>
      {/* ───────────── Band A · 深色沉浸 Hero ───────────── */}
      <section className="relative overflow-hidden lg:flex lg:items-center lg:min-h-[88vh]">
        {/* 背景大图 + 暗化叠加（移动整体偏暗保证可读，桌面顶部透出招牌） */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* 取景：object-cover 始终填满容器（任何比例都不留空，彻底消除缩放灰带），
              用 object-position 把画面锚定到右上角招牌；裁切落在左下（被照片墙遮住） */}
          <Image
            src="/images/home/bg-hero.webp"
            alt=""
            fill
            className="object-cover object-[77%_50%] translate-y-[5%] lg:translate-y-0 lg:object-[58%_45%] lg:translate-x-[10%]"
            priority
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/45 lg:via-black/45 lg:to-black/15" />
        </div>

        {/* 金色光斑装饰 */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-20 top-1/4 h-96 w-96 animate-pulse rounded-full bg-ukraine-gold-500/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 animate-pulse rounded-full bg-ukraine-blue-400/15 blur-3xl delay-1000" />
        </div>

        {/* 移动端专属顶部照片马赛克条：满铺裁切、全不透明、底部渐隐融入深色 hero。
            桌面端不渲染（走下方左半整幅参差拼贴），二者完全隔离、互不影响。
            7 张真实照片排进 4×2 栅格：首图横跨 2 格作焦点，其余各占 1 格。 */}
        <div className="relative z-[5] grid h-[34vh] grid-cols-4 grid-rows-2 gap-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_80%,transparent)] lg:hidden">
          {mobilePhotos.map(({ src, alt, w, h }, i) => (
            <Image
              key={src}
              src={src}
              alt={alt}
              width={w}
              height={h}
              sizes="50vw"
              className={`h-full w-full object-cover ${i === 0 ? 'col-span-2' : ''}`}
            />
          ))}
        </div>

        {/* 照片墙：8 张图不裁剪、3 行参差拼贴（右侧犬牙交错）；桌面贴左半、高度 0.9× 背景（顶对齐）；
            每行最右侧图片右边缘渐隐，使犬牙轮廓自然消融；移动端不渲染（改用上方马赛克条） */}
        <div className="relative z-[5] hidden flex-col gap-2 p-4 opacity-50 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-1/2 lg:gap-0 lg:p-0 lg:opacity-100">
          {photoRows.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-start gap-2 lg:min-h-0 lg:flex-1 lg:flex-nowrap lg:items-stretch lg:gap-0"
            >
              {row.map(({ src, alt, w, h }, j) => (
                <Image
                  key={src}
                  src={src}
                  alt={alt}
                  width={w}
                  height={h}
                  className={cn(
                    'h-[10vh] w-auto lg:h-full',
                    j === row.length - 1 &&
                      'lg:[mask-image:linear-gradient(to_right,black_80%,transparent)] lg:[-webkit-mask-image:linear-gradient(to_right,black_80%,transparent)]'
                  )}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[96rem] px-4 py-12 sm:px-6 lg:translate-y-[3vh] lg:px-8 lg:py-16">
          <div className="lg:flex lg:justify-end">
            {/* 文案 + CTA：移动全宽，桌面右半沉底 */}
            <div className="flex flex-col justify-end text-white lg:min-h-[56vh] lg:w-1/2">
              <h1
                className={`whitespace-pre-line font-display text-4xl font-bold leading-[1.1] drop-shadow-md sm:text-5xl ${titleSizeClass}`}
              >
                {t('mission.title')}
              </h1>

              <div className="relative mt-5 max-w-xl lg:mt-6">
                {/* 副标题可读性蒙版：柔和暗色光晕（羽化、无硬框），避免浅色文字与亮部背景融为一体 */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-4 -inset-y-3 -z-[1] rounded-2xl bg-gradient-to-t from-black/75 via-black/60 to-black/40 blur-lg"
                />
                <p className="whitespace-pre-line text-base font-normal leading-relaxed text-gray-50 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:text-lg lg:text-xl">
                  {t('mission.subtitleLine1')}
                </p>
                <p className="mt-2 text-base font-normal leading-relaxed text-gray-50 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:text-lg lg:text-xl">
                  {t('mission.subtitleBefore')}
                  <span className="relative inline-block font-semibold text-white">
                    {t('mission.subtitleHighlight')}
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-ukraine-gold-400 via-ukraine-gold-300 to-ukraine-gold-400" />
                  </span>
                  {t('mission.subtitleAfter')}
                </p>
              </div>

              <div className="mt-5 flex flex-col items-start gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:mt-9">
                <ScrollToProjectsButton label={t('mission.ctaProjects')} />
                <ScrollToComplianceButton label={t('compliance.button')} />
              </div>
            </div>
          </div>

          {/* 底部影响数据条：留在文案列外保持原垂直位置，用同样的 justify-end + w-[58%] 实现左对齐、右缘到容器右边 */}
          <div className="mt-6 lg:mt-12 lg:flex lg:justify-end">
            <div className="flex w-fit divide-x divide-white/15 rounded-2xl bg-white/10 px-2 py-5 ring-1 ring-white/15 backdrop-blur-md sm:grid sm:w-auto sm:grid-cols-3 sm:px-6 sm:py-6 lg:w-1/2 lg:px-3 lg:py-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center px-2 text-center sm:px-4 lg:px-3">
                  <span className="font-data text-xl font-bold tracking-tight text-ukraine-gold-300 sm:text-3xl lg:text-3xl">
                    {value}
                  </span>
                  <span className="mt-1 text-xs font-medium text-gray-200 sm:text-sm lg:text-sm">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Band B · 方式带 ───────────── */}
      <ApproachCarousel
        sectionTitle={t('approach.title')}
        titleSizeClass={titleSizeClass}
        cards={approachFeatures.map(({ key, image, objectPosition, accentText, accentBar }) => ({
          image,
          objectPosition: objectPosition ?? '',
          accentText,
          accentBar,
          title: t(`approach.${key}.title`),
          summary: t(`approach.${key}.summary`),
        }))}
      />
    </div>
  )
}
