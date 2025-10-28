"use client"

import * as React from "react"
import { SectionProps } from "../types"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function Section({
  title,
  description,
  collapsible = false,
  defaultCollapsed = false,
  children,
}: SectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {collapsible && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <Separator className="mt-4" />
        </div>
      )}

      {(!collapsible || !isCollapsed) && (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  )
}

Section.displayName = "Section"
