'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'

interface PhotoGridProps {
  photos: string[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  const open = (url: string) => {
    setActivePhoto(url)
    dialogRef.current?.showModal()
  }

  const close = () => {
    dialogRef.current?.close()
    setActivePhoto(null)
  }

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(url)}
            className="aspect-square relative overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            aria-label={`View progress photo ${i + 1} full screen`}
          >
            <Image
              src={url}
              alt={`Progress photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>

      {/* Native <dialog> lightbox — Escape key and backdrop click close it */}
      <dialog
        ref={dialogRef}
        onClick={close}
        className="fixed inset-0 m-0 max-h-none max-w-none h-screen w-screen bg-black/90 p-4 backdrop:bg-transparent"
        style={{ padding: '1rem' }}
      >
        {activePhoto && (
          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={activePhoto}
              alt="Progress photo — full screen"
              fill
              className="object-contain"
              sizes="100vw"
            />
            <button
              type="button"
              onClick={close}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label="Close photo"
            >
              ✕
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
