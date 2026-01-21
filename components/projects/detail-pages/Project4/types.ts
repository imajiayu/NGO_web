import type { ProjectStats } from '@/types'

export interface FamilyMember {
  name: string
  nameOriginal: string
  description?: string
}

export interface Child {
  name: string
  nameOriginal: string
}

// Aid List types (similar to Project 3 supplies)
export interface AidItem {
  item: string
  itemOriginal: string
  category: 'toys' | 'books' | 'educational' | 'furniture' | 'food'
  quantity: number
  unitPrice?: { uah: number; usd: number }
  status: 'pending' | 'purchased' | 'delivered'
  forChild?: string // Optional: which child this is for
}

export interface AidListData {
  title: string
  description: string
  statusLabels: {
    pending: string
    purchased: string
    delivered: string
  }
  items: AidItem[]
  total?: {
    items: number
    totalCost: { uah: number; usd: number }
  }
  exchangeRateNote?: string
  note?: string
  receipts?: {
    description: string
    images: string[]
  }
}

export interface GalleryImage {
  url: string
  caption?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface TalentItem {
  activity: string
  image: string
}

export interface Highlight {
  number: string
  label: string
  detail: string
}

export interface Project4Content {
  title: string
  subtitle: string
  location: string
  images: string[]
  introduction: string[]
  highlights?: Highlight[]
  family: {
    mother: FamilyMember
    father: FamilyMember
    grandmother: FamilyMember
    childrenCount: {
      total: number
      biological: number
      adopted: number
      boys: number
      girls: number
    }
  }
  children: {
    boys: Child[]
    girls: Child[]
  }
  livingConditions: {
    title: string
    description: string
    points: string[]
    images?: string[]
  }
  childrenTalents: {
    title: string
    description: string
    talents: TalentItem[]
    artworkImage?: string
  }
  adoptionStory: {
    title: string
    content: string
  }
  fruitWishes: {
    title: string
    description: string
    fruits: string[]
  }
  whyGifts: {
    title: string
    causeLabel: string
    effectLabel: string
    reasons: string[]
    conclusion: string
  }
  familyGallery: {
    title?: string
    images: GalleryImage[]
  }
  callToAction: {
    title: string
    content: string
    closing: string
  }
}

export interface Project4DetailContentProps {
  project: ProjectStats
  locale: string
}

export interface SectionProps {
  content: Project4Content
  locale?: string
}
