'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, ImageIcon, Loader2, Download, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react'
import { getAllDonationResultFiles } from '@/app/actions/donation-result'
import JSZip from 'jszip'

interface DonationResultViewerProps {
  donationPublicId: string
  onClose: () => void
}

interface DonationFile {
  name: string
  originalUrl: string
  thumbnailUrl: string | null
  isImage: boolean
  isVideo: boolean
  size: number
  contentType: string
}

export default function DonationResultViewer({
  donationPublicId,
  onClose
}: DonationResultViewerProps) {
  const t = useTranslations('donationResult')
  const [files, setFiles] = useState<DonationFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    async function fetchFiles() {
      try {
        setLoading(true)
        setError(null)
        const result = await getAllDonationResultFiles(donationPublicId)

        if (result.error) {
          setError(t(`errors.${result.error}`))
        } else if (result.files && result.files.length > 0) {
          setFiles(result.files)
        } else {
          setError(t('errors.noImage'))
        }
      } catch (err) {
        setError(t('errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [donationPublicId, t])

  const handleDownloadAll = async () => {
    if (files.length === 0) return

    try {
      setDownloading(true)
      const zip = new JSZip()

      // Download all files and add to zip
      for (const file of files) {
        try {
          const response = await fetch(file.originalUrl)
          const blob = await response.blob()
          zip.file(file.name, blob)
        } catch (err) {
          console.error(`Failed to download ${file.name}:`, err)
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `donation-${donationPublicId}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Failed to create zip:', err)
      alert(t('errors.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setImageLoaded(false) // 重置加载状态
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
    setImageLoaded(false)
  }

  const goToPrevious = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1)
      setImageLoaded(false) // 切换图片时重置
    }
  }

  const goToNext = () => {
    if (lightboxIndex !== null && lightboxIndex < files.length - 1) {
      setLightboxIndex(lightboxIndex + 1)
      setImageLoaded(false) // 切换图片时重置
    }
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  return (
    <>
      {/* Main Modal */}
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

            {!loading && !error && files.length > 0 && (
              <div className="space-y-4">
                {/* Thumbnail Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(index)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all group"
                    >
                      {file.isImage && (
                        <>
                          {/* 优先使用缩略图 */}
                          {file.thumbnailUrl ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={`Result ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            // 如果没有缩略图，显示占位符 + 图标
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </>
                      )}
                      {file.isVideo && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                        <p className="text-white text-xs truncate">{file.name}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('downloading')}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t('downloadAll')} ({files.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && files[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60]"
          onClick={closeLightbox}
        >
          {/* Previous Button */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Next Button */}
          {lightboxIndex < files.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              aria-label="Next"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Top Bar: File Counter */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
            <div className="px-3 py-1 bg-black/50 rounded-full">
              <p className="text-white text-sm font-medium">
                {lightboxIndex + 1} / {files.length}
              </p>
            </div>
          </div>

          {/* Bottom Bar: Close Button & File Name */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeLightbox()
              }}
              className="mb-3 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full transition-all flex items-center gap-2 group"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Close</span>
            </button>
            <p className="text-white text-sm text-center truncate max-w-md pointer-events-none">
              {files[lightboxIndex].name}
            </p>
          </div>

          {/* Content */}
          <div
            className="absolute inset-0 flex items-center justify-center px-4 z-0"
            style={{
              paddingTop: '80px',   // 顶部栏高度
              paddingBottom: '120px' // 底部栏高度
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {files[lightboxIndex].isImage && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* 先显示缩略图（如果有） */}
                {!imageLoaded && files[lightboxIndex].thumbnailUrl && (
                  <img
                    src={files[lightboxIndex].thumbnailUrl}
                    alt={files[lightboxIndex].name}
                    className="max-w-full max-h-full object-contain rounded-lg blur-sm"
                  />
                )}

                {/* 原图（后台加载） */}
                <img
                  src={files[lightboxIndex].originalUrl}
                  alt={files[lightboxIndex].name}
                  className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : files[lightboxIndex].thumbnailUrl ? 'opacity-0 absolute' : 'opacity-100'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />

                {/* 加载指示器 */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            )}
            {files[lightboxIndex].isVideo && (
              <video
                src={files[lightboxIndex].originalUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
