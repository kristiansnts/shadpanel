"use client"

import * as React from "react"
import { FieldsetProps } from "../types"

export function Fieldset({ legend, children }: FieldsetProps) {
  return (
    <fieldset className="space-y-4 rounded-lg border p-4">
      {legend && (
        <legend className="px-2 text-sm font-medium">{legend}</legend>
      )}
      <div className="space-y-4">{children}</div>
    </fieldset>
  )
}

Fieldset.displayName = "Fieldset"
