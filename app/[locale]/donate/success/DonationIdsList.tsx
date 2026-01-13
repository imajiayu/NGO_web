'use client'

import CopyButton from '@/components/CopyButton'
import { getProjectName, getLocation, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'
import type { I18nText } from '@/types'

type Donation = {
  id: number
  donation_public_id: string
  amount: number
  projects: {
    project_name: string
    project_name_i18n: I18nText | null
    location: string
    location_i18n: I18nText | null
    unit_name: string
    unit_name_i18n: I18nText | null
    aggregate_donations: boolean | null
  }
}

type DonationIdsListProps = {
  donations: Donation[]
  locale: string
  t: (key: string) => string
}

export default function DonationIdsList({ donations, locale, t }: DonationIdsListProps) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold tracking-wider uppercase rounded-full mb-2">
              {t('important')}
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 font-display">{t('saveIdsTitle')}</h3>
            <p className="text-sm text-gray-700">{t('saveIdsDescription')}</p>
          </div>
        </div>
        {donations.length > 1 && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <CopyButton
              text={donations.map(d => d.donation_public_id).join(' ')}
              label={t('copy.copyAll')}
              copiedLabel={t('copy.copied')}
              variant="secondary"
              className="!bg-blue-600 hover:!bg-blue-700 !text-white !border-blue-600 w-full sm:w-auto"
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        {donations.map((donation, index) => {
          const donationProjectName = getProjectName(
            donation.projects.project_name_i18n,
            donation.projects.project_name,
            locale as SupportedLocale
          )
          const donationLocation = getLocation(
            donation.projects.location_i18n,
            donation.projects.location,
            locale as SupportedLocale
          )
          const unitName = getUnitName(
            donation.projects.unit_name_i18n,
            donation.projects.unit_name,
            locale as SupportedLocale
          )
          const isAggregateProject = donation.projects.aggregate_donations === true

          return (
            <div key={donation.id} className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <code className="text-sm font-data text-gray-900 break-all">{donation.donation_public_id}</code>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {!isAggregateProject && (
                    <span className="text-sm text-gray-600">
                      1 {unitName}
                    </span>
                  )}
                  <span className="text-base font-bold text-green-600">
                    ${Number(donation.amount).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-start sm:items-center justify-between gap-3 pl-7 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-0">
                  <p className="text-base text-gray-800 font-semibold break-words">{donationProjectName}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{donationLocation}</p>
                </div>
                <div className="flex-shrink-0">
                  <CopyButton
                    text={donation.donation_public_id}
                    label={t('copy.copyId')}
                    copiedLabel={t('copy.copied')}
                    variant="secondary"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
