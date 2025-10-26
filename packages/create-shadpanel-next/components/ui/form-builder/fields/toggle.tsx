"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useFormContext } from "../form-context"
import { ToggleProps } from "../types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toggle(props: ToggleProps) {
  const {
    accessor,
    label,
    helperText,
    description,
    disabled,
    required,
    tooltip,
    validation,
    defaultValue = false,
    className,
  } = props

  const { values, errors, touched, setValue, setTouched, validateField, registerField, unregisterField } =
    useFormContext()

  const value = (values[accessor] ?? defaultValue) as boolean
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

  const handleChange = (checked: boolean) => {
    setValue(accessor, checked)
    setTouched(accessor, true)
    validateField(accessor)
  }

  const showError = isTouched && error

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Label
              htmlFor={fieldId}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {(description || helperText) && !showError && (
            <p className="text-sm text-muted-foreground">
              {description || helperText}
            </p>
          )}
          {showError && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Switch
          id={fieldId}
          checked={value}
          onCheckedChange={handleChange}
          disabled={disabled}
          aria-invalid={isTouched && !!error}
        />
      </div>
    </div>
  )
}

Toggle.displayName = "Toggle"
