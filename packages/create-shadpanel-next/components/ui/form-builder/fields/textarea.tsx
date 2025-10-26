"use client"

import * as React from "react"
import { Textarea as TextareaUI } from "@/components/ui/textarea"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { TextareaProps } from "../types"

export function Textarea(props: TextareaProps) {
  const {
    accessor,
    label,
    placeholder,
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = "",
    className,
    rows = 4,
    resize = "vertical",
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const value = (values[accessor] ?? defaultValue) as string
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`

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

  const resizeClass = {
    none: "resize-none",
    both: "resize",
    horizontal: "resize-x",
    vertical: "resize-y",
  }[resize]

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
      <TextareaUI
        id={fieldId}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={isTouched && !!error}
        className={resizeClass}
      />
    </FieldWrapper>
  )
}

Textarea.displayName = "Textarea"
