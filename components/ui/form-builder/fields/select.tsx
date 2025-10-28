"use client"

import * as React from "react"
import {
  Select as SelectUI,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { SelectProps } from "../types"

export function Select(props: SelectProps) {
  const {
    accessor,
    label,
    placeholder = "Select an option",
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = "",
    className,
    options,
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

  const handleChange = (newValue: string) => {
    setValue(accessor, newValue)
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
      <SelectUI
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={fieldId} aria-invalid={isTouched && !!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectUI>
    </FieldWrapper>
  )
}

Select.displayName = "Select"
