"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FieldWrapperProps {
  label?: string
  required?: boolean
  tooltip?: string
  helperText?: string
  error?: string
  touched?: boolean
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

export function FieldWrapper({
  label,
  required,
  tooltip,
  helperText,
  error,
  touched,
  children,
  htmlFor,
  className,
}: FieldWrapperProps) {
  const showError = touched && error

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label htmlFor={htmlFor} className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
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
      )}
      {children}
      {helperText && !showError && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {showError && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
