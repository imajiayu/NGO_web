/**
 * Broadcast Email Modal Component
 * Modal for sending newsletter broadcasts to subscribers with preview support
 */

'use client'

import { useState, useEffect } from 'react'
import {
  sendEmailBroadcast,
  getAvailableBroadcastTemplates,
  previewEmailTemplate
} from '@/app/actions/email-broadcast'
import type { DonationLocale } from '@/types'

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
  subscriberCount: number
}

type PreviewLocale = DonationLocale

const LOCALE_LABELS: Record<PreviewLocale, string> = {
  en: 'English',
  zh: '中文',
  ua: 'Українська'
}

export default function BroadcastModal({
  isOpen,
  onClose,
  subscriberCount
}: BroadcastModalProps) {
  // State
  const [templates, setTemplates] = useState<Array<{ name: string; fileName: string }>>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('new-project')
  const [previewLocale, setPreviewLocale] = useState<PreviewLocale>('en')
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewSubject, setPreviewSubject] = useState<string | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    sent: number
    failed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load available templates on mount
  useEffect(() => {
    if (isOpen && templates.length === 0) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const response = await getAvailableBroadcastTemplates()
      if (response.data) {
        setTemplates(response.data)
        if (response.data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(response.data[0].fileName)
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handlePreview = async () => {
    setIsLoadingPreview(true)
    setError(null)

    try {
      const response = await previewEmailTemplate(selectedTemplate, previewLocale, {
        donate_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${previewLocale}/donate`,
        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/unsubscribe?token=PREVIEW_TOKEN`
      })

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setPreviewHtml(response.data.html)
        setPreviewSubject(response.data.subject)
        setShowPreview(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleSend = async () => {
    setIsSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await sendEmailBroadcast({
        templateName: selectedTemplate,
        testMode,
        variables: {
          donate_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en/donate`
        }
      })

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setResult({
          success: response.data.success,
          sent: response.data.sent,
          failed: response.data.failed
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      setResult(null)
      setError(null)
      setTestMode(false)
      setShowPreview(false)
      setPreviewHtml(null)
      setPreviewSubject(null)
      onClose()
    }
  }

  const handleBackFromPreview = () => {
    setShowPreview(false)
    setPreviewHtml(null)
    setPreviewSubject(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          className={`relative bg-white rounded-lg shadow-xl ${showPreview ? 'max-w-4xl' : 'max-w-md'} w-full p-6 space-y-4 transition-all duration-300`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {showPreview ? 'Email Preview' : 'Send Newsletter Broadcast'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSending}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          {showPreview ? (
            // Preview View
            <div className="space-y-4">
              {/* Subject Line */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-500">Subject: </span>
                <span className="font-medium text-gray-900">{previewSubject}</span>
              </div>

              {/* Email Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    Preview ({LOCALE_LABELS[previewLocale]})
                  </span>
                </div>
                <iframe
                  srcDoc={previewHtml || ''}
                  className="w-full h-[500px] bg-white"
                  title="Email Preview"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleBackFromPreview}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || subscriberCount === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </div>
          ) : result ? (
            // Success/Result View
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}
              >
                <div className="flex items-start gap-3">
                  <svg
                    className={`w-6 h-6 flex-shrink-0 ${result.success ? 'text-green-600' : 'text-yellow-600'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <h3
                      className={`font-medium ${result.success ? 'text-green-900' : 'text-yellow-900'}`}
                    >
                      {result.success
                        ? 'Broadcast Sent Successfully!'
                        : 'Broadcast Completed with Errors'}
                    </h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>✓ Successfully sent: {result.sent}</p>
                      {result.failed > 0 && <p>✗ Failed: {result.failed}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            // Send Form
            <>
              <div className="space-y-3">
                {/* Template Selector */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Template
                  </label>
                  {isLoadingTemplates ? (
                    <div className="text-sm text-blue-700">Loading templates...</div>
                  ) : templates.length === 0 ? (
                    <div className="text-sm text-blue-700">No templates available</div>
                  ) : (
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {templates.map((template) => (
                        <option key={template.fileName} value={template.fileName}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Preview Language Selector */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Language
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(LOCALE_LABELS) as PreviewLocale[]).map((locale) => (
                      <button
                        key={locale}
                        onClick={() => setPreviewLocale(locale)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                          previewLocale === locale
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {LOCALE_LABELS[locale]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handlePreview}
                    disabled={isLoadingPreview || !selectedTemplate}
                    className="mt-3 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isLoadingPreview ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'Preview Email'
                    )}
                  </button>
                </div>

                {/* Recipient Count */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Recipients</span>
                    <span className="text-lg font-bold text-gray-900">
                      {testMode ? 1 : subscriberCount}
                    </span>
                  </div>
                </div>

                {/* Test Mode Toggle */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                      disabled={isSending}
                      className="mt-1 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-yellow-900">Test Mode</span>
                      <span className="block text-xs text-yellow-700 mt-1">
                        Send to only the first subscriber for testing
                      </span>
                    </div>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || subscriberCount === 0 || !selectedTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Broadcast'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
