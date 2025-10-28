"use client"

import * as React from "react"
import { Textarea as TextareaUI } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { MarkdownEditorProps } from "../types"
import { Bold, Italic, Link, Code, List, ListOrdered } from "lucide-react"
import { cn } from "@/lib/utils"

export function MarkdownEditor(props: MarkdownEditorProps) {
  const {
    accessor,
    label,
    placeholder = "Write in markdown...",
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = "",
    className,
    height = "200px",
    preview = false,
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const value = (values[accessor] ?? defaultValue) as string
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = React.useState(false)

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(accessor, e.target.value)
  }

  const handleBlur = () => {
    setTouched(accessor, true)
    validateField(accessor)
  }

  const insertMarkdown = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end)

    setValue(accessor, newText)
    textarea.focus()

    // Set cursor position after inserted text
    setTimeout(() => {
      const newPosition = start + before.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const toolbar = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), label: "Bold" },
    { icon: Italic, action: () => insertMarkdown("_", "_"), label: "Italic" },
    { icon: Code, action: () => insertMarkdown("`", "`"), label: "Code" },
    { icon: Link, action: () => insertMarkdown("[", "](url)"), label: "Link" },
    { icon: List, action: () => insertMarkdown("\n- ", ""), label: "List" },
    { icon: ListOrdered, action: () => insertMarkdown("\n1. ", ""), label: "Ordered List" },
  ]

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
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b pb-2">
          <div className="flex items-center gap-1">
            {toolbar.map((item, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={item.action}
                disabled={disabled}
                title={item.label}
                className="h-8 w-8 p-0"
              >
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={disabled}
            >
              {showPreview ? "Edit" : "Preview"}
            </Button>
          )}
        </div>

        {showPreview ? (
          <div
            className={cn(
              "prose prose-sm max-w-none rounded-md border p-3 overflow-auto",
              "bg-muted/30"
            )}
            style={{ height }}
            dangerouslySetInnerHTML={{
              __html: value
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/_(.*?)_/g, "<em>$1</em>")
                .replace(/`(.*?)`/g, "<code>$1</code>")
                .replace(/\n/g, "<br/>"),
            }}
          />
        ) : (
          <TextareaUI
            ref={textareaRef}
            id={fieldId}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={isTouched && !!error}
            style={{ height }}
            className="font-mono text-sm resize-none"
          />
        )}
      </div>
    </FieldWrapper>
  )
}

MarkdownEditor.displayName = "MarkdownEditor"
