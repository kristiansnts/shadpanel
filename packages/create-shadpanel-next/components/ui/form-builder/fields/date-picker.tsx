"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { DatePickerProps } from "../types"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function DatePicker(props: DatePickerProps) {
  const {
    accessor,
    label,
    placeholder = "Select date",
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue,
    className,
    minDate,
    maxDate,
    native = true,
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const value = values[accessor]
  const error = errors[accessor]
  const isTouched = touched[accessor]
  const fieldId = `field-${accessor}`
  const [open, setOpen] = React.useState(false)

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

  const handleBlur = () => {
    setTouched(accessor, true)
    validateField(accessor)
  }

  // Format date to YYYY-MM-DD for native input
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return ""
    const d = date instanceof Date ? date : new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const minDateStr = minDate ? formatDateForInput(minDate) : undefined
  const maxDateStr = maxDate ? formatDateForInput(maxDate) : undefined

  // Parse date from various formats
  const parseDate = (dateValue: unknown): Date | undefined => {
    if (!dateValue) return undefined
    if (dateValue instanceof Date) return dateValue
    if (typeof dateValue === "string") {
      const parsed = new Date(dateValue)
      return isNaN(parsed.getTime()) ? undefined : parsed
    }
    return undefined
  }

  const selectedDate = parseDate(value)

  // Native HTML5 date picker
  if (native) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(accessor, e.target.value)
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
        <Input
          id={fieldId}
          type="date"
          value={formatDateForInput(value as string | Date)}
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

  // Shadcn date picker with calendar
  const handleSelect = (date: Date | undefined) => {
    setValue(accessor, date)
    setTouched(accessor, true)
    validateField(accessor)
    setOpen(false)
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            variant="outline"
            disabled={disabled}
            onBlur={handleBlur}
            className={cn(
              "w-full justify-between font-normal",
              !selectedDate && "text-muted-foreground",
              isTouched && error && "border-destructive"
            )}
            aria-invalid={isTouched && !!error}
          >
            {selectedDate ? selectedDate.toLocaleDateString() : placeholder}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            captionLayout="dropdown"
            disabled={(date: Date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            defaultMonth={selectedDate}
            startMonth={minDate || new Date(1900, 0)}
            endMonth={maxDate || new Date(new Date().getFullYear() + 10, 11)}
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  )
}

DatePicker.displayName = "DatePicker"
