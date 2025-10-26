"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { TagsInputProps } from "../types"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function TagsInput(props: TagsInputProps) {
  const {
    accessor,
    label,
    placeholder = "Type and press Enter",
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = [],
    className,
    maxTags,
    separator = ",",
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const tags = (values[accessor] ?? defaultValue) as string[]
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    registerField(accessor, {
      ...validation,
      required: required || validation?.required,
    })

    if (defaultValue !== undefined && values[accessor] === undefined) {
      setValue(accessor, defaultValue)
    }

    return () => {
      unregisterField(accessor)
    }
  }, [accessor, validation, required, defaultValue, registerField, unregisterField, setValue, values])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (!trimmedTag) return
    if (tags.includes(trimmedTag)) return
    if (maxTags && tags.length >= maxTags) return

    const newTags = [...tags, trimmedTag]
    setValue(accessor, newTags)
    setTouched(accessor, true)
    validateField(accessor)
    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setValue(accessor, newTags)
    setTouched(accessor, true)
    validateField(accessor)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === separator.trim()) {
      e.preventDefault()
      addTag(inputValue)
    }
  }

  const handleBlur = () => {
    if (inputValue) {
      addTag(inputValue)
    }
    setTouched(accessor, true)
    validateField(accessor)
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
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          disabled && "cursor-not-allowed opacity-50",
          isTouched && error && "border-destructive ring-destructive/20"
        )}
      >
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          id={fieldId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 min-w-[120px]"
        />
      </div>
    </FieldWrapper>
  )
}

TagsInput.displayName = "TagsInput"
