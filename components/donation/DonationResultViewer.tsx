'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, ImageIcon, Loader2, Download } from 'lucide-react'
import { getDonationResultUrl } from '@/app/actions/donation-result'

interface DonationResultViewerProps {
  donationPublicId: string
  onClose: () => void
}

export default function DonationResultViewer({
  donationPublicId,
  onClose
}: DonationResultViewerProps) {
  const t = useTranslations('donationResult')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImage() {
      try {
        setLoading(true)
        setError(null)
        const result = await getDonationResultUrl(donationPublicId)

        if (result.error) {
          setError(t(`errors.${result.error}`))
        } else if (result.url) {
          setImageUrl(result.url)
        } else {
          setError(t('errors.noImage'))
        }
      } catch (err) {
        setError(t('errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [donationPublicId, t])

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `donation-result-${donationPublicId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('donationId')}: <code className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{donationPublicId}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <p className="text-sm text-gray-600">{t('contactSupport')}</p>
            </div>
          )}

          {!loading && !error && imageUrl && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt={t('imageAlt', { donationId: donationPublicId })}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  {t('download')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
