"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { DateTimePickerProps } from "../types"

export function DateTimePicker(props: DateTimePickerProps) {
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
    minDate,
    maxDate,
    showTime = true,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(accessor, e.target.value)
  }

  const handleBlur = () => {
    setTouched(accessor, true)
    validateField(accessor)
  }

  // Format datetime to YYYY-MM-DDTHH:mm for input
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const minDateStr = minDate ? formatDateTime(minDate) : undefined
  const maxDateStr = maxDate ? formatDateTime(maxDate) : undefined

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
      <Input
        id={fieldId}
        type={showTime ? "datetime-local" : "date"}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={isTouched && !!error}
        min={minDateStr}
        max={maxDateStr}
      />
    </FieldWrapper>
  )
}

DateTimePicker.displayName = "DateTimePicker"
