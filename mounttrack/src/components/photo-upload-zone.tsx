'use client'
import { useDropzone } from 'react-dropzone'
import { useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPhotoUploadUrls } from '@/actions/jobs'
import { X } from 'lucide-react'

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
}
const MAX_SIZE = 5 * 1024 * 1024  // 5MB
const MAX_FILES = 10

interface PhotoFile {
  file: File
  preview: string
  id: string
}

export interface PhotoUploadZoneProps {
  jobId: string
  onUploadComplete: (paths: string[]) => void
  capture?: 'environment' | 'user' | boolean
}

// Handle exposed via forwardRef so parent form can call uploadAll imperatively
export interface PhotoUploadZoneHandle {
  uploadAll: () => Promise<string[]>
}

export const PhotoUploadZone = forwardRef<PhotoUploadZoneHandle, PhotoUploadZoneProps>(
  function PhotoUploadZone({ jobId, onUploadComplete, capture }, ref) {
    const [photos, setPhotos] = useState<PhotoFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        const remaining = MAX_FILES - photos.length
        const toAdd = acceptedFiles.slice(0, remaining).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${file.name}`,
        }))
        setPhotos((prev) => [...prev, ...toAdd])
      },
      [photos.length]
    )

    const removePhoto = (id: string) => {
      setPhotos((prev) => {
        const removed = prev.find((p) => p.id === id)
        if (removed) URL.revokeObjectURL(removed.preview)
        return prev.filter((p) => p.id !== id)
      })
    }

    // Upload all pending photos via signed URLs.
    // Called imperatively from the parent form's onSubmit before createJob.
    const uploadAll = useCallback(async (): Promise<string[]> => {
      if (photos.length === 0) return []
      setUploading(true)
      setUploadError(null)

      const { signedUrls, error } = await getPhotoUploadUrls(
        jobId,
        photos.map((p) => p.file.name)
      )
      if (error || !signedUrls.length) {
        setUploadError(error ?? 'Failed to get upload URLs')
        setUploading(false)
        return []
      }

      const supabase = createClient()
      const paths = await Promise.all(
        signedUrls.map(async ({ path, token }, i) => {
          const { error: upErr } = await supabase.storage
            .from('job-photos')
            .uploadToSignedUrl(path, token, photos[i].file)
          return upErr ? null : path
        })
      )
      setUploading(false)
      const uploaded = paths.filter((p): p is string => p !== null)
      onUploadComplete(uploaded)
      return uploaded
    }, [photos, jobId, onUploadComplete])

    // Expose uploadAll via ref so parent form can call it
    useImperativeHandle(ref, () => ({ uploadAll }), [uploadAll])

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
      onDrop,
      accept: ACCEPTED,
      maxSize: MAX_SIZE,
      maxFiles: MAX_FILES - photos.length,
      multiple: true,
      disabled: uploading,
    })

    return (
      <div className="space-y-3">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-muted hover:border-muted-foreground/50'}`}
        >
          <input {...getInputProps()} capture={capture} />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop photos here' : 'Drag photos here or click to select'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, HEIC — max 5MB each, up to {MAX_FILES} photos
          </p>
        </div>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative h-16 w-16 rounded overflow-hidden border group">
                <img
                  src={photo.preview}
                  alt="preview"
                  className="h-full w-full object-cover"
                  onLoad={() => URL.revokeObjectURL(photo.preview)}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {fileRejections.length > 0 && (
          <p className="text-xs text-red-500">
            {fileRejections[0].errors[0].message}
          </p>
        )}

        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}

        {uploading && (
          <p className="text-xs text-muted-foreground">Uploading photos...</p>
        )}
      </div>
    )
  }
)
