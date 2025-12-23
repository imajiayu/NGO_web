'use client'

import { useState, useEffect } from 'react'
import type { Database } from '@/types/database'
import {
  updateDonationStatus,
  uploadDonationResultFile,
  getDonationResultFiles,
  deleteDonationResultFile
} from '@/app/actions/admin'

type Donation = Database['public']['Tables']['donations']['Row']

interface Props {
  donation: Donation
  onClose: () => void
  onSaved: (donation: Donation) => void
}

interface DonationFile {
  name: string
  path: string
  publicUrl: string
  size: number
  contentType: string
  createdAt: string
  updatedAt: string
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  refunding: ['refunded'],
  paid: ['confirmed'],
  confirmed: ['delivering'],
  delivering: ['completed'],
}

export default function DonationEditModal({ donation, onClose, onSaved }: Props) {
  const [newStatus, setNewStatus] = useState<string>(donation.donation_status || '')
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 文件管理状态
  const [files, setFiles] = useState<DonationFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)

  const currentStatus = donation.donation_status || ''
  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || []
  const canUpdate = allowedStatuses.length > 0

  // 检查是否需要上传文件（delivering → completed）
  const needsFileUpload = currentStatus === 'delivering' && newStatus === 'completed'

  // 检查是否可以管理文件（只有 completed 状态才能独立管理文件）
  const canManageFiles = currentStatus === 'completed'

  // 加载现有文件
  useEffect(() => {
    if (canManageFiles) {
      loadFiles()
    } else {
      setLoadingFiles(false)
    }
  }, [donation.id])

  const loadFiles = async () => {
    try {
      setLoadingFiles(true)
      const result = await getDonationResultFiles(donation.id)
      setFiles(result)
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
    const maxSize = 50 * 1024 * 1024 // 50MB

    // 验证所有文件
    const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      setError(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}. Only images (JPEG, PNG, GIF) and videos (MP4, MOV) are allowed.`)
      return
    }

    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      setError(`File too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 50MB per file.`)
      return
    }

    setFilesToUpload(selectedFiles)
    setError('')
  }

  const uploadFile = async (file: File): Promise<void> => {
    // 使用 Server Action 上传文件（使用服务端管理员认证）
    const formData = new FormData()
    formData.append('file', file)
    formData.append('donationId', donation.id.toString())

    // 模拟进度（Server Action 无法跟踪真实进度）
    setUploadProgress(10)
    await new Promise(resolve => setTimeout(resolve, 100))
    setUploadProgress(30)

    await uploadDonationResultFile(formData)

    setUploadProgress(100)

    // 重新加载文件列表
    await loadFiles()
  }

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('确定要删除这个文件吗？')) {
      return
    }

    try {
      setDeletingFile(filePath)
      await deleteDonationResultFile(donation.id, filePath)
      await loadFiles()
    } catch (err: any) {
      alert(`删除失败: ${err.message}`)
    } finally {
      setDeletingFile(null)
    }
  }

  const handleUploadOnly = async () => {
    if (filesToUpload.length === 0) {
      setError('请选择要上传的文件')
      return
    }

    setError('')
    setUploading(true)
    setUploadProgress(0)

    try {
      // 上传所有文件
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        const progress = Math.round(((i + 1) / filesToUpload.length) * 100)
        setUploadProgress(progress)
        await uploadFile(file)
      }

      setFilesToUpload([])
      // 清空文件输入
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) {
      setError(`上传失败: ${err.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const isImage = (contentType: string) => {
    return contentType.startsWith('image/')
  }

  const isVideo = (contentType: string) => {
    return contentType.startsWith('video/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 如果需要上传文件
      if (needsFileUpload) {
        if (filesToUpload.length === 0) {
          setError('Please upload at least one result image/video')
          setLoading(false)
          return
        }

        setUploading(true)
        setUploadProgress(0)
        try {
          // 上传所有文件
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i]
            const progress = Math.round(((i + 1) / filesToUpload.length) * 100)
            setUploadProgress(progress)
            await uploadFile(file)
          }
        } catch (err: any) {
          throw new Error(`File upload failed: ${err.message}`)
        } finally {
          setUploading(false)
          setUploadProgress(0)
        }
      }

      // 更新状态
      const updated = await updateDonationStatus(donation.id, newStatus)
      onSaved(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to update donation')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Edit Donation #{donation.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
              {error}
            </div>
          )}

          {/* All Donation Info (Read-only) */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">ID:</span>
                  <span className="ml-2 text-gray-900">{donation.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Public ID:</span>
                  <span className="ml-2 text-gray-900">{donation.donation_public_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Project ID:</span>
                  <span className="ml-2 text-gray-900">{donation.project_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className="ml-2 font-bold text-gray-900">{currentStatus}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Donor Information</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="ml-2 text-gray-900">{donation.donor_name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="ml-2 text-gray-900">{donation.donor_email}</span>
                </div>
                {donation.contact_telegram && (
                  <div>
                    <span className="font-medium text-gray-600">Telegram:</span>
                    <span className="ml-2 text-gray-900">{donation.contact_telegram}</span>
                  </div>
                )}
                {donation.contact_whatsapp && (
                  <div>
                    <span className="font-medium text-gray-600">WhatsApp:</span>
                    <span className="ml-2 text-gray-900">{donation.contact_whatsapp}</span>
                  </div>
                )}
                {donation.donor_message && (
                  <div>
                    <span className="font-medium text-gray-600">Message:</span>
                    <div className="mt-1 p-2 bg-white rounded border border-gray-200 text-gray-900">
                      {donation.donor_message}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Amount:</span>
                  <span className="ml-2 text-gray-900">
                    {donation.amount} {donation.currency || 'UAH'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Payment Method:</span>
                  <span className="ml-2 text-gray-900">{donation.payment_method || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Order Reference:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">
                    {donation.order_reference}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Timestamps</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Donated At:</span>
                  <div className="text-gray-900 text-xs">{formatDateTime(donation.donated_at)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created At:</span>
                  <div className="text-gray-900 text-xs">{formatDateTime(donation.created_at)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Locale:</span>
                  <span className="ml-2 text-gray-900">{donation.locale || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Form */}
          {canUpdate && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Update Status</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status To:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">-- Select Status --</option>
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Allowed transitions: {currentStatus} → {allowedStatuses.join(' / ')}
                </p>
              </div>

              {/* File upload (only for delivering → completed) */}
              {needsFileUpload && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Result Images/Videos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={uploading}
                    multiple
                  />
                  {filesToUpload.length > 0 && !uploading && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium text-green-600">
                        {filesToUpload.length} file(s) selected:
                      </p>
                      {filesToUpload.map((file, index) => (
                        <p key={index} className="text-xs text-gray-600 ml-2">
                          • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      ))}
                    </div>
                  )}
                  {uploading && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Accepted formats: JPEG, PNG, GIF, MP4, MOV (max 50MB)
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading || !newStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading
                    ? 'Uploading...'
                    : loading
                      ? 'Saving...'
                      : 'Update Status'}
                </button>
              </div>
            </form>
          )}

          {/* File Management Section (for delivering/completed status) */}
          {canManageFiles && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold">Result Files Management</h3>

              {/* Existing Files */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
                {loadingFiles ? (
                  <div className="text-sm text-gray-500">Loading files...</div>
                ) : files.length === 0 ? (
                  <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">
                    No files uploaded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.path}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>

                            {/* Preview */}
                            {isImage(file.contentType) && (
                              <div className="mb-2">
                                <img
                                  src={file.publicUrl}
                                  alt={file.name}
                                  className="max-w-xs max-h-48 rounded border border-gray-300"
                                />
                              </div>
                            )}
                            {isVideo(file.contentType) && (
                              <div className="mb-2">
                                <video
                                  src={file.publicUrl}
                                  controls
                                  className="max-w-xs max-h-48 rounded border border-gray-300"
                                />
                              </div>
                            )}

                            <div className="flex gap-2 mt-2">
                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View Full Size
                              </a>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteFile(file.path)}
                            disabled={deletingFile === file.path}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingFile === file.path ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload New Files */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload New Files</h4>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={uploading}
                    multiple
                  />
                  {filesToUpload.length > 0 && !uploading && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-600">
                        {filesToUpload.length} file(s) selected:
                      </p>
                      {filesToUpload.map((file, index) => (
                        <p key={index} className="text-xs text-gray-600 ml-2">
                          • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      ))}
                    </div>
                  )}
                  {uploading && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleUploadOnly}
                    disabled={uploading || filesToUpload.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : `Upload ${filesToUpload.length > 0 ? `${filesToUpload.length} File(s)` : 'Files'}`}
                  </button>
                  <p className="text-xs text-gray-500">
                    Accepted formats: JPEG, PNG, GIF, MP4, MOV (max 50MB per file)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close button if no update form */}
          {!canUpdate && !canManageFiles && (
            <div className="space-y-4 border-t pt-4">
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded">
                This donation cannot be updated. Current status: <strong>{currentStatus}</strong>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Close button for completed status with files */}
          {!canUpdate && canManageFiles && (
            <div className="flex justify-end pt-4 border-t mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
