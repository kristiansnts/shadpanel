"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { TextInputProps } from "../types"
import { cn } from "@/lib/utils"

export function TextInput(props: TextInputProps) {
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
    numeric = false,
    type = "text",
    prefix,
    suffix,
    min,
    max,
    step,
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const value = (values[accessor] ?? defaultValue) as string | number
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`

  React.useEffect(() => {
    // Register field with validation rules
    registerField(accessor, {
      ...validation,
      required: required || validation?.required,
    })

    // Set default value
    if (defaultValue !== undefined && values[accessor] === undefined) {
      setValue(accessor, defaultValue)
    }

    return () => {
      unregisterField(accessor)
    }
  }, [accessor, validation, required, defaultValue, registerField, unregisterField, setValue, values])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = e.target.value

    if (numeric && newValue !== "") {
      newValue = parseFloat(newValue)
      if (isNaN(newValue)) {
        return
      }
    }

    setValue(accessor, newValue)
  }

  const handleBlur = () => {
    setTouched(accessor, true)
    validateField(accessor)
  }

  const inputType = numeric ? "number" : type
  const hasWrapper = prefix || suffix

  const inputElement = (
    <Input
      id={fieldId}
      type={inputType}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      aria-invalid={isTouched && !!error}
      className={cn(!hasWrapper && className)}
      min={min}
      max={max}
      step={step}
    />
  )

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
      {hasWrapper ? (
        <div className="flex items-center gap-2">
          {prefix && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {prefix}
            </span>
          )}
          {inputElement}
          {suffix && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {suffix}
            </span>
          )}
        </div>
      ) : (
        inputElement
      )}
    </FieldWrapper>
  )
}

// For compatibility with the Form component
TextInput.displayName = "TextInput"
