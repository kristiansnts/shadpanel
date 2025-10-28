"use client"

import { createContext, useContext } from "react"
import { FormContextValue } from "./types"

export const FormContext = createContext<FormContextValue | null>(null)

export function useFormContext() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error("Form fields must be used within a Form component")
  }
  return context
}
