"use client"

import * as React from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { FileUploadProps } from "../types"
import { Upload, X, File } from "lucide-react"

export function FileUpload(props: FileUploadProps) {
  const {
    accessor,
    label,
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    className,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    preview = true,
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const files = (values[accessor] ?? []) as File[]
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    registerField(accessor, {
      ...validation,
      required: required || validation?.required,
    })

    return () => {
      unregisterField(accessor)
    }
  }, [accessor, validation, required, registerField, unregisterField])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Validate file size
    if (maxSize) {
      const oversizedFiles = selectedFiles.filter(file => file.size > maxSize)
      if (oversizedFiles.length > 0) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
        setValue(accessor, [])
        validateField(accessor)
        alert(`File size exceeds ${maxSizeMB}MB limit`)
        return
      }
    }

    // Validate max files
    if (maxFiles && selectedFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`)
      return
    }

    setValue(accessor, multiple ? selectedFiles : selectedFiles.slice(0, 1))
    setTouched(accessor, true)
    validateField(accessor)
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setValue(accessor, newFiles)
    setTouched(accessor, true)
    validateField(accessor)

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <FieldWrapper
      label={label}
      required={required}
      tooltip={tooltip}
      helperText={helperText}
      error={error}
      touched={isTouched}
      htmlFor={fieldId}
      className={className}
    >
      <div className="space-y-4">
        <Input
          ref={inputRef}
          id={fieldId}
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          required={required}
          accept={accept}
          multiple={multiple}
          className="hidden"
          aria-invalid={isTouched && !!error}
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {files.length > 0 ? "Change file(s)" : "Choose file(s)"}
        </Button>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                {preview && file.type.startsWith("image/") ? (
                  <div className="relative h-10 w-10 rounded overflow-hidden">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <File className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldWrapper>
  )
}

FileUpload.displayName = "FileUpload"
