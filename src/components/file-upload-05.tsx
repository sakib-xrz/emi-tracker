"use client"

import Image from "next/image"
import { AlertCircle, FileText, ImageIcon, Upload, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FileUpload05Props = {
  id: string
  name: string
  accept: string
  required?: boolean
  maxSizeMB?: number
  value: File | null
  onFileChange: (file: File | null) => void
}

function matchesAccept(file: File, accept: string) {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean)

  return rules.some((rule) => {
    if (rule === "image/*") return file.type.startsWith("image/")
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule.toLowerCase())
    return file.type === rule
  })
}

export function FileUpload05({
  id,
  name,
  accept,
  required,
  maxSizeMB = 8,
  value,
  onFileChange,
}: FileUpload05Props) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => {
    if (!value || !value.type.startsWith("image/")) return null
    return URL.createObjectURL(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const commitFile = (file: File | null) => {
    if (!file) {
      onFileChange(null)
      setError(null)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
      return
    }

    if (!matchesAccept(file, accept)) {
      setError("Unsupported file type. Please upload an image or PDF.")
      return
    }

    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    setError(null)
    onFileChange(file)

    if (inputRef.current) {
      try {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        inputRef.current.files = dataTransfer.files
      } catch {
        // Some environments restrict programmatic FileList assignment.
      }
    }
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required && !value}
        className="sr-only"
        onChange={(event) => {
          commitFile(event.target.files?.[0] ?? null)
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          commitFile(event.dataTransfer.files?.[0] ?? null)
        }}
        className={cn(
          "bg-muted/20 hover:bg-muted/35 border-input flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center transition",
          dragActive && "border-primary bg-muted/50"
        )}
      >
        <div className="bg-background inline-flex size-9 items-center justify-center rounded-full border border-white/10">
          <Upload className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Drop your receipt file here</p>
          <p className="text-muted-foreground text-xs">Image or PDF, up to {maxSizeMB}MB</p>
        </div>
        <span className="text-primary text-sm font-semibold underline underline-offset-4">Select file</span>
      </button>

      {value ? (
        <div className="bg-muted/30 grid gap-3 rounded-xl border border-white/10 p-3">
          <div className="flex items-center gap-2">
            {value.type.startsWith("image/") ? (
              <ImageIcon className="size-4 text-emerald-300" />
            ) : (
              <FileText className="size-4 text-red-300" />
            )}
            <span className="max-w-[60%] truncate text-sm font-medium">{value.name}</span>
            <span className="text-muted-foreground text-xs">({(value.size / 1024).toFixed(0)} KB)</span>
            <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => commitFile(null)}>
              <X className="size-3.5" />
              Remove
            </Button>
          </div>
          {previewUrl ? (
            <div className="relative h-52 w-full overflow-hidden rounded-lg border border-white/10">
              <Image src={previewUrl} alt="Selected receipt preview" fill unoptimized className="object-cover" />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              PDF selected. It will be available from payment history after upload.
            </p>
          )}
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
