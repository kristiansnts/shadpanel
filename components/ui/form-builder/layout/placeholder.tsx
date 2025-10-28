"use client"

import * as React from "react"
import { PlaceholderProps } from "../types"
import { FileQuestion } from "lucide-react"
import { cn } from "@/lib/utils"

export function Placeholder({
  text = "No content",
  icon,
  height = "200px",
}: PlaceholderProps) {
  const Icon = icon || FileQuestion

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed",
        "bg-muted/30 text-muted-foreground"
      )}
      style={{ minHeight: height }}
    >
      {typeof Icon === "function" ? (
        <Icon className="h-12 w-12 mb-4 opacity-50" />
      ) : (
        <div className="mb-4 opacity-50">{Icon}</div>
      )}
      <p className="text-sm">{text}</p>
    </div>
  )
}

Placeholder.displayName = "Placeholder"
