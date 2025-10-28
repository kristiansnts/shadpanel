"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldWrapper } from "../field-wrapper"
import { useFormContext } from "../form-context"
import { KeyValueProps } from "../types"
import { Plus, X } from "lucide-react"

type KeyValuePair = { key: string; value: string }

export function KeyValue(props: KeyValueProps) {
  const {
    accessor,
    label,
    helperText,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = [],
    className,
    keyLabel = "Key",
    valueLabel = "Value",
    addLabel = "Add item",
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const pairs = (values[accessor] ?? defaultValue) as KeyValuePair[]
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

  const addPair = () => {
    const newPairs = [...pairs, { key: "", value: "" }]
    setValue(accessor, newPairs)
    setTouched(accessor, true)
  }

  const removePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index)
    setValue(accessor, newPairs)
    setTouched(accessor, true)
    validateField(accessor)
  }

  const updatePair = (index: number, field: "key" | "value", newValue: string) => {
    const newPairs = [...pairs]
    newPairs[index][field] = newValue
    setValue(accessor, newPairs)
    setTouched(accessor, true)
  }

  const handleBlur = () => {
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
      <div className="space-y-2">
        {pairs.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-medium text-muted-foreground mb-2">
            <span>{keyLabel}</span>
            <span>{valueLabel}</span>
            <span className="w-9"></span>
          </div>
        )}

        {pairs.map((pair, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              value={pair.key}
              onChange={(e) => updatePair(index, "key", e.target.value)}
              onBlur={handleBlur}
              placeholder={keyLabel}
              disabled={disabled}
              aria-invalid={isTouched && !!error}
            />
            <Input
              value={pair.value}
              onChange={(e) => updatePair(index, "value", e.target.value)}
              onBlur={handleBlur}
              placeholder={valueLabel}
              disabled={disabled}
              aria-invalid={isTouched && !!error}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePair(index)}
              disabled={disabled}
              className="h-9 w-9 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPair}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
    </FieldWrapper>
  )
}

KeyValue.displayName = "KeyValue"
