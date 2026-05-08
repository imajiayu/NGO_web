import type { ProjectStats } from '@/types'

export interface IntroImage {
  src: string
  alt: string
}

export interface IntroductionImages {
  opening: IntroImage
  arrival: IntroImage[]
  bedroomHero: IntroImage
  bedroomDetails: IntroImage[]
  daily: IntroImage[]
  closing: IntroImage[]
}

export type IntroStatType = 'shelter' | 'location' | 'mothers' | 'children'

export interface IntroStat {
  type: IntroStatType
  label: string
  primary: string
  secondary?: string
}

export type BundleItemType = 'food' | 'hygiene' | 'clothing' | 'detergent'

export interface BundleItem {
  type: BundleItemType
  label: string
}

export interface BundleContent {
  intro: string
  items: BundleItem[]
}

export interface IntroductionContent {
  stats: IntroStat[]
  paragraphs: string[]
  bundle: BundleContent
  closingCaption: string
  images: IntroductionImages
}

export interface Project6Content {
  title: string
  subtitle: string
  location: string
  introduction: IntroductionContent
}

export interface Project6DetailContentProps {
  project: ProjectStats
  locale: string
}

export interface SectionProps {
  content: Project6Content
  project: ProjectStats
  locale: string
}
