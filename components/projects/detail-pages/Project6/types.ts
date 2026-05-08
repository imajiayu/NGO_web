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

export interface BundleMoney {
  uah: number
  usd: number
}

export interface BundleSupplyItem {
  name: string
  qty: number
  qtyUnit: string
  unitPrice: BundleMoney
}

export interface BundleItem {
  type: BundleItemType
  label: string
  items: BundleSupplyItem[]
  subtotal: BundleMoney
}

export interface BundleTotals {
  perPackage: BundleMoney
  packageCount: number
  grandTotal: BundleMoney
}

export interface BundleLabels {
  sectionTitle: string
  sectionSubtitle: string
  subtotal: string
  perPackage: string
  perPackageHint: string
  grandTotal: string
  exchangeRateNote: string
  qtyHeader: string
  unitPriceHeader: string
  itemHeader: string
  receiptsTitle: string
  receiptsPlaceholder: string
}

export interface BundleContent {
  intro: string
  items: BundleItem[]
  totals: BundleTotals
  labels: BundleLabels
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
