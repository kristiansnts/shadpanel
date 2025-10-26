"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { RichEditorProps } from "../types"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function RichEditor(props: RichEditorProps) {
  const {
    accessor,
    label,
    placeholder = "Start typing...",
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = "",
    className,
    height = "300px",
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const value = (values[accessor] ?? defaultValue) as string
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`
  const editorRef = React.useRef<HTMLDivElement>(null)

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

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      setValue(accessor, editorRef.current.innerHTML)
    }
  }

  const handleBlur = () => {
    setTouched(accessor, true)
    validateField(accessor)
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const toolbar = [
    { icon: Bold, command: "bold", label: "Bold" },
    { icon: Italic, command: "italic", label: "Italic" },
    { icon: Underline, command: "underline", label: "Underline" },
    { icon: Strikethrough, command: "strikeThrough", label: "Strikethrough" },
    { icon: AlignLeft, command: "justifyLeft", label: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", label: "Align Center" },
    { icon: AlignRight, command: "justifyRight", label: "Align Right" },
    { icon: List, command: "insertUnorderedList", label: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
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
        <div className="flex items-center gap-1 border-b pb-2">
          {toolbar.map((item, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand(item.command)}
              disabled={disabled}
              title={item.label}
              className="h-8 w-8 p-0"
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div
          ref={editorRef}
          id={fieldId}
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleBlur}
          data-placeholder={placeholder}
          className={cn(
            "rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none overflow-auto",
            "focus:border-ring focus:ring-ring/50 focus:ring-[3px]",
            isTouched && error && "border-destructive ring-destructive/20",
            disabled && "cursor-not-allowed opacity-50",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
          )}
          style={{ minHeight: height }}
          aria-invalid={isTouched && !!error}
        />
      </div>
    </FieldWrapper>
  )
}

RichEditor.displayName = "RichEditor"
