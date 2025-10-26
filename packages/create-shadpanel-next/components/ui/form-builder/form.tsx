"use client"

import * as React from "react"
import { FormContext } from "./form-context"
import { ValidationRule } from "./types"
import { cn } from "@/lib/utils"

interface FormProps<TData = Record<string, unknown>> {
  children: React.ReactNode
  initialValues?: TData
  onSubmit?: (values: TData) => void | Promise<void>
  onChange?: (values: TData) => void
  className?: string
}

export function Form<TData = Record<string, unknown>>({
  children,
  initialValues = {} as TData,
  onSubmit,
  onChange,
  className,
}: FormProps<TData>) {
  const [values, setValues] = React.useState<Record<string, unknown>>(
    initialValues as Record<string, unknown>
  )
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const validationRulesRef = React.useRef<Record<string, ValidationRule>>({})

  // Notify parent of changes
  React.useEffect(() => {
    if (onChange) {
      onChange(values as TData)
    }
  }, [values, onChange])

  const validateField = React.useCallback(
    (accessor: string): boolean => {
      const value = values[accessor]
      const rules = validationRulesRef.current[accessor]

      if (!rules) return true

      // Required validation
      if (rules.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)

        if (isEmpty) {
          const message =
            typeof rules.required === "string"
              ? rules.required
              : `This field is required`
          setErrors((prev) => ({ ...prev, [accessor]: message }))
          return false
        }
      }

      // MinLength validation
      if (rules.minLength && typeof value === "string") {
        if (value.length < rules.minLength.value) {
          setErrors((prev) => ({ ...prev, [accessor]: rules.minLength!.message }))
          return false
        }
      }

      // MaxLength validation
      if (rules.maxLength && typeof value === "string") {
        if (value.length > rules.maxLength.value) {
          setErrors((prev) => ({ ...prev, [accessor]: rules.maxLength!.message }))
          return false
        }
      }

      // Min validation
      if (rules.min && typeof value === "number") {
        if (value < rules.min.value) {
          setErrors((prev) => ({ ...prev, [accessor]: rules.min!.message }))
          return false
        }
      }

      // Max validation
      if (rules.max && typeof value === "number") {
        if (value > rules.max.value) {
          setErrors((prev) => ({ ...prev, [accessor]: rules.max!.message }))
          return false
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === "string") {
        if (!rules.pattern.value.test(value)) {
          setErrors((prev) => ({ ...prev, [accessor]: rules.pattern!.message }))
          return false
        }
      }

      // Custom validation
      if (rules.validate) {
        const result = rules.validate(value)
        if (result !== true) {
          const message = typeof result === "string" ? result : "Validation failed"
          setErrors((prev) => ({ ...prev, [accessor]: message }))
          return false
        }
      }

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[accessor]
        return newErrors
      })

      return true
    },
    [values]
  )

  const setValue = React.useCallback((accessor: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [accessor]: value }))
  }, [])

  const setError = React.useCallback((accessor: string, error: string) => {
    setErrors((prev) => ({ ...prev, [accessor]: error }))
  }, [])

  const setTouchedValue = React.useCallback((accessor: string, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [accessor]: isTouched }))
  }, [])

  const registerField = React.useCallback(
    (accessor: string, validation?: ValidationRule) => {
      if (validation) {
        validationRulesRef.current[accessor] = validation
      }
    },
    []
  )

  const unregisterField = React.useCallback((accessor: string) => {
    delete validationRulesRef.current[accessor]
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!onSubmit) return

    setIsSubmitting(true)

    // Validate all fields
    const accessors = Object.keys(validationRulesRef.current)
    const validationResults = accessors.map((accessor) => validateField(accessor))
    const isValid = validationResults.every((result) => result)

    // Mark all fields as touched
    const allTouched = accessors.reduce(
      (acc, accessor) => ({ ...acc, [accessor]: true }),
      {}
    )
    setTouched(allTouched)

    if (isValid) {
      try {
        await onSubmit(values as TData)
      } catch (error) {
        console.error("Form submission error:", error)
      }
    }

    setIsSubmitting(false)
  }

  const contextValue = React.useMemo(
    () => ({
      values,
      errors,
      touched,
      isSubmitting,
      setValue,
      setError,
      setTouched: setTouchedValue,
      validateField,
      registerField,
      unregisterField,
    }),
    [
      values,
      errors,
      touched,
      isSubmitting,
      setValue,
      setError,
      setTouchedValue,
      validateField,
      registerField,
      unregisterField,
    ]
  )

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={cn("px-8 pb-8 space-y-6", className)}>
        {children}
      </form>
    </FormContext.Provider>
  )
}
