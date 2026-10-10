'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { readImageSize, shrinkImage } from '@/lib/shrinkImage'
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, checkImage, MAX_IMAGE_MB } from '@/lib/validation/media'

type Props = {
  name: string
  label: string
  // The image already saved (shown until a new one is picked)
  currentSrc?: string | null
  // Server-side error for this field
  error?: string
  // circle for avatars, square for logos (shown with object-contain, never cropped)
  shape?: 'square' | 'circle'
}

// File picker with drag and drop, instant preview and friendly errors. The chosen file is
// placed in a regular <input type="file"> so the surrounding form submits it as usual.
// Removing a saved image sends `${name}Remove=1`.
export function ImageUpload({ name, label, currentSrc, error, shape = 'square' }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Free the preview's memory when it changes or the component unmounts
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  const clearInput = () => {
    if (input.current) input.current.value = ''
  }

  async function choose(file: File | undefined) {
    if (!file) return
    setMessage(null)
    const dims = await readImageSize(file)
    const problem = checkImage({ type: file.type, size: file.size, ...dims }) ?? (dims ? null : 'This file is not a valid image.')
    if (problem) {
      setMessage(problem)
      clearInput()
      return
    }
    setPreparing(true)
    const ready = await shrinkImage(file)
    setPreparing(false)
    // Put the (possibly shrunk) file back into the real input so the form uploads it.
    // Very old browsers can't build a FileList: they simply upload the original file.
    if (ready !== file && input.current && typeof DataTransfer === 'function') {
      const transfer = new DataTransfer()
      transfer.items.add(ready)
      input.current.files = transfer.files
    }
    setPreview(URL.createObjectURL(ready))
    setRemoved(false)
  }

  function remove() {
    clearInput()
    setPreview(null)
    setMessage(null)
    if (currentSrc) setRemoved(true)
  }

  const shown = preview ?? (removed ? null : currentSrc)
  const shownError = message ?? error
  const errorId = `${name}-error`

  return (
    <div className="space-y-2" data-testid={`image-upload-${name}`}>
      <p id={`${name}-label`} className="text-sm leading-none font-medium">
        {label}
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void choose(e.dataTransfer.files[0])
        }}
        className={cn(
          'flex items-center gap-4 rounded-xl border border-dashed p-4 transition-colors',
          dragging ? 'border-primary bg-secondary' : 'border-input',
          shownError && 'border-destructive',
        )}
      >
        <div
          className={cn(
            'bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center overflow-hidden',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg border bg-white',
          )}
        >
          {preparing ? (
            <Loader2 className="size-5 animate-spin" aria-label="Preparing image" />
          ) : shown ? (
            // Plain <img>: previews are local blob: URLs that next/image cannot optimize
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt="Selected image preview"
              className={cn('size-full', shape === 'circle' ? 'object-cover' : 'object-contain')}
            />
          ) : (
            <ImagePlus className="size-6" aria-hidden />
          )}
        </div>

        <div className="min-w-0 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
              {shown ? 'Change image' : 'Choose image'}
            </Button>
            {shown && (
              <Button type="button" variant="ghost" size="sm" onClick={remove}>
                <X aria-hidden /> Remove
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB. Drag and drop works too.
          </p>
        </div>

        <input
          ref={input}
          id={name}
          name={name}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          aria-labelledby={`${name}-label`}
          aria-invalid={Boolean(shownError) || undefined}
          aria-describedby={shownError ? errorId : undefined}
          onChange={(e) => void choose(e.target.files?.[0])}
        />
        {removed && <input type="hidden" name={`${name}Remove`} value="1" />}
      </div>
      {shownError && (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {shownError}
        </p>
      )}
    </div>
  )
}
