import type { ProjectStats } from '@/types'

/** 图片按原始比例展示（不裁剪），width/height 供 next/image 预留空间避免 CLS */
export interface Project7Image {
  src: string
  alt: string
  width: number
  height: number
}

/** 时间线节点。marker 是时间标记（"2022" / "25 May 2026"）。 */
export interface TimelineEvent {
  /** 锚点后缀，最终 DOM id 为 `p7-story-${id}` */
  id: string
  marker: string
  heading: string
  paragraphs: string[]
  /** 可选的要点清单（伤情、日常动作），带标题时才渲染标题 */
  listTitle?: string
  /** clinical=伤情，排成克制的双栏列表；progress=康复进展，排成 chip 行 */
  listTone?: 'clinical' | 'progress'
  list?: string[]
  images?: Project7Image[]
}

export interface Therapy {
  name: string
  /** 疗程次数与费用取自费用估算书（该表内部自洽：各项金额之和 = 总额） */
  sessions: number
  cost: number
}

export interface RehabPeriod {
  label: string
  value: string
  duration: string
}

export interface RehabGoals {
  title: string
  shortTermLabel: string
  shortTerm: string
  longTermLabel: string
  longTerm: string
}

/** 费用表直接由 therapies 渲染，保证明细与卡片同源、不会各说各话 */
export interface RehabCosts {
  title: string
  description: string
  itemHeader: string
  sessionsHeader: string
  costHeader: string
  sessionsUnit: string
  totalLabel: string
  total: number
  currency: string
  note: string
}

export interface RehabContent {
  title: string
  description: string
  period: RehabPeriod
  goals: RehabGoals
  /** 康复现场照片，与具体疗法不再一一对应，整体作为一组网格展示 */
  gallery: Project7Image[]
  therapies: Therapy[]
  costs: RehabCosts
}

/** 康复机构背书。projectId 指向站内合作项目详情页（Way to Health = project 0）。 */
export interface AttributionContent {
  quote: string
  name: string
  role: string
  organization: string
  linkLabel: string
  projectId: number
}

export interface IntroContent {
  quote: string
  paragraphs: string[]
}

export interface Project7Content {
  title: string
  subtitle: string
  location: string
  intro: IntroContent
  storyTitle: string
  timeline: TimelineEvent[]
  rehab: RehabContent
  attribution: AttributionContent
}

export interface Project7DetailContentProps {
  project: ProjectStats
  locale: string
}

export interface SectionProps {
  content: Project7Content
  project: ProjectStats
  locale: string
}
