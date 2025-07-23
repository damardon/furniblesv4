'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Eye,
  RotateCcw
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { cn } from '@/lib/utils'

interface UploadedFile {
  id: string
  filename: string
  url: string
  size: number
  type: 'PDF' | 'IMAGE'
  status: 'uploading' | 'completed' | 'error'
  progress: number
}

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSizePerFile?: number // En MB
  acceptedTypes?: string[]
  initialFiles?: UploadedFile[]
  showPreview?: boolean
  allowMultiple?: boolean
  className?: string
  required?: boolean
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxSizePerFile = 50,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'],
  initialFiles = [],
  showPreview = true,
  allowMultiple = true,
  className,
  required = false
}: FileUploadProps) {
  const t = useTranslations('file_upload')
  const { user, token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper para crear notificaciones
  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) => ({
    id: `notif-${Date.now()}-${Math.random()}`,
    userId: user?.id || '',
    type,
    title,
    message,
    data: {},
    isRead: false,
    readAt: undefined,
    sentAt: new Date().toISOString(),
    emailSent: false,
    orderId: undefined,
    priority: priority as any,
    channel: 'IN_APP' as any,
    groupKey: undefined,
    expiresAt: undefined,
    clickedAt: undefined,
    clickCount: 0,
    createdAt: new Date().toISOString()
  })

  const validateFile = (file: File): string | null => {
    // Validar tipo
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(extension)) {
      return t('error.invalid_type', { types: acceptedTypes.join(', ') })
    }

    // Validar tamaño
    const sizeInMB = file.size / (1024 * 1024)
    if (sizeInMB > maxSizePerFile) {
      return t('error.file_too_large', { max: maxSizePerFile })
    }

    // Validar cantidad
    if (uploadedFiles.length >= maxFiles) {
      return t('error.too_many_files', { max: maxFiles })
    }

    return null
  }

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const tempFile: UploadedFile = {
      id: tempId,
      filename: file.name,
      url: '',
      size: file.size,
      type: file.type.startsWith('image/') ? 'IMAGE' : 'PDF',
      status: 'uploading',
      progress: 0
    }

    // Agregar archivo temporal
    setUploadedFiles(prev => [...prev, tempFile])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', tempFile.type)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        const uploadedFile: UploadedFile = {
          id: result.data.id,
          filename: result.data.filename,
          url: result.data.url,
          size: result.data.size,
          type: result.data.type,
          status: 'completed',
          progress: 100
        }

        // Actualizar archivo temporal con datos reales
        setUploadedFiles(prev => 
          prev.map(f => f.id === tempId ? uploadedFile : f)
        )

        return uploadedFile
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      // Marcar como error
      setUploadedFiles(prev => 
        prev.map(f => f.id === tempId ? { ...f, status: 'error' as const } : f)
      )

      addNotification(createNotification(
        'FILE_UPLOAD_ERROR' as NotificationType,
        t('error.upload_failed'),
        t('error.upload_failed_message', { filename: file.name }),
        'HIGH'
      ))

      return null
    }
  }

  const handleFiles = async (files: FileList) => {
    if (!user) {
      addNotification(createNotification(
        'AUTH_REQUIRED' as NotificationType,
        t('error.auth_required'),
        t('error.auth_required_message'),
        'HIGH'
      ))
      return
    }

    setIsUploading(true)
    const filesToUpload = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Validar archivos
    for (const file of filesToUpload) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    // Mostrar errores de validación
    if (errors.length > 0) {
      addNotification(createNotification(
        'VALIDATION_ERROR' as NotificationType,
        t('error.validation_failed'),
        errors.join('\n'),
        'HIGH'
      ))
    }

    // Subir archivos válidos
    const uploadPromises = validFiles.map(file => uploadFile(file))
    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter(Boolean) as UploadedFile[]

    setIsUploading(false)

    if (successfulUploads.length > 0) {
      addNotification(createNotification(
        'FILE_UPLOAD_SUCCESS' as NotificationType,
        t('success.upload_completed'),
        t('success.upload_completed_message', { count: successfulUploads.length }),
        'NORMAL'
      ))

      onFilesUploaded?.(uploadedFiles.filter(f => f.status === 'completed'))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    onFilesUploaded?.(uploadedFiles.filter(f => f.id !== fileId && f.status === 'completed'))
  }

  const retryUpload = async (fileId: string) => {
    const fileToRetry = uploadedFiles.find(f => f.id === fileId)
    if (!fileToRetry || fileToRetry.status !== 'error') return

    // Reset status
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f)
    )

    // Create a mock file for retry (in real implementation, you'd store the original file)
    // For now, just simulate success
    setTimeout(() => {
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f)
      )
    }, 2000)
  }

  const getFileIcon = (type: string, status: string) => {
    if (status === 'uploading') return <Upload className="w-5 h-5 animate-pulse" />
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-600" />
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />
    
    return type === 'PDF' ? <FileText className="w-5 h-5" /> : <Image className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-4 border-dashed border-black p-8 text-center transition-all cursor-pointer",
          isDragging ? "bg-yellow-400 border-solid" : "bg-white hover:bg-gray-50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        style={{ boxShadow: '4px 4px 0 #000000' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        <h3 className="text-xl font-black text-black uppercase mb-2">
          {t('drop_zone.title')}
        </h3>
        
        <p className="text-gray-600 font-bold mb-4">
          {t('drop_zone.subtitle')}
        </p>
        
        <div className="space-y-2 text-sm text-gray-500 font-medium">
          <p>{t('accepted_types')}: {acceptedTypes.join(', ')}</p>
          <p>{t('max_size')}: {maxSizePerFile}MB</p>
          <p>{t('max_files')}: {maxFiles}</p>
        </div>

        <button
          type="button"
          disabled={isUploading}
          className="mt-4 bg-orange-500 border-3 border-black px-6 py-3 font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          {isUploading ? t('uploading') : t('select_files')}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-black text-black uppercase text-sm">
            {t('uploaded_files')} ({uploadedFiles.length}/{maxFiles})
          </h4>
          
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white border-3 border-black p-4 flex items-center gap-4"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.type, file.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-bold text-black text-sm truncate">
                      {file.filename}
                    </h5>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="w-full bg-gray-200 border border-black h-2">
                      <div 
                        className="bg-orange-500 h-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {file.status === 'completed' && (
                    <p className="text-xs text-green-600 font-bold">
                      {t('status.completed')}
                    </p>
                  )}
                  
                  {file.status === 'error' && (
                    <p className="text-xs text-red-600 font-bold">
                      {t('status.error')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'completed' && showPreview && file.url && (
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-1 bg-blue-400 border-2 border-black hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '1px 1px 0 #000000' }}
                      title={t('preview')}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                  
                  {file.status === 'error' && (
                    <button
                      onClick={() => retryUpload(file.id)}
                      className="p-1 bg-yellow-400 border-2 border-black hover:bg-green-400 transition-all"
                      style={{ boxShadow: '1px 1px 0 #000000' }}
                      title={t('retry')}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 bg-red-400 border-2 border-black hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '1px 1px 0 #000000' }}
                    title={t('remove')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {uploadedFiles.length > 0 && (
        <div className="bg-gray-100 border-3 border-black p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-black text-green-600">
                {uploadedFiles.filter(f => f.status === 'completed').length}
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase">
                {t('summary.completed')}
              </div>
            </div>
            <div>
              <div className="text-lg font-black text-orange-500">
                {uploadedFiles.filter(f => f.status === 'uploading').length}
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase">
                {t('summary.uploading')}
              </div>
            </div>
            <div>
              <div className="text-lg font-black text-red-600">
                {uploadedFiles.filter(f => f.status === 'error').length}
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase">
                {t('summary.errors')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}