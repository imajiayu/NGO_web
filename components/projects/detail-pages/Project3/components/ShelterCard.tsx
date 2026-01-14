'use client'

import { MapPinIcon, HeartIcon } from '@/components/icons'
import type { Shelter } from '../types'

interface ShelterCardProps {
  shelter: Shelter
  index: number
}

export default function ShelterCard({ shelter, index }: ShelterCardProps) {
  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-christmas-pine/10 hover:shadow-md hover:border-christmas-gold/30 transition-all duration-300">
      <div className="h-1 bg-gradient-to-r from-christmas-berry via-christmas-gold to-christmas-pine" />
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-christmas-berry to-rose-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <HeartIcon className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-christmas-gold flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{index + 1}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-gray-900 leading-tight truncate">
              {shelter.name}
            </h3>
            <p className="text-[10px] text-gray-400 italic truncate">{shelter.nameOriginal}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500 truncate flex-1 min-w-0">
            <MapPinIcon className="w-3 h-3 text-christmas-pine flex-shrink-0" />
            <span className="truncate">{shelter.address}</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-christmas-gold/20 font-bold text-christmas-gold-dark ml-2 flex-shrink-0">
            {shelter.childrenCount}
          </div>
        </div>
      </div>
    </div>
  )
}
