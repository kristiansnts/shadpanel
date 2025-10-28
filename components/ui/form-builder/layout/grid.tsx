"use client"

import * as React from "react"
import { GridProps } from "../types"
import { cn } from "@/lib/utils"

export function Grid({ columns = 2, gap = 4, children }: GridProps) {
  // Map column numbers to actual Tailwind classes
  const getColumnClass = (cols: number) => {
    const colMap: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
      8: "grid-cols-8",
      9: "grid-cols-9",
      10: "grid-cols-10",
      11: "grid-cols-11",
      12: "grid-cols-12",
    }
    return colMap[cols] || "grid-cols-1"
  }

  // Map gap numbers to actual Tailwind classes
  const getGapClass = (gapSize: number) => {
    const gapMap: Record<number, string> = {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      7: "gap-7",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
      16: "gap-16",
    }
    return gapMap[gapSize] || "gap-4"
  }

  // Build responsive column classes
  const getResponsiveClasses = () => {
    if (typeof columns === "number") {
      return getColumnClass(columns)
    }

    const classes: string[] = []

    // Default to 1 column if no sm specified
    if (columns.sm) {
      classes.push(getColumnClass(columns.sm))
    } else {
      classes.push("grid-cols-1")
    }

    if (columns.md) {
      const mdMap: Record<number, string> = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
        7: "md:grid-cols-7",
        8: "md:grid-cols-8",
        9: "md:grid-cols-9",
        10: "md:grid-cols-10",
        11: "md:grid-cols-11",
        12: "md:grid-cols-12",
      }
      classes.push(mdMap[columns.md] || "md:grid-cols-2")
    }

    if (columns.lg) {
      const lgMap: Record<number, string> = {
        1: "lg:grid-cols-1",
        2: "lg:grid-cols-2",
        3: "lg:grid-cols-3",
        4: "lg:grid-cols-4",
        5: "lg:grid-cols-5",
        6: "lg:grid-cols-6",
        7: "lg:grid-cols-7",
        8: "lg:grid-cols-8",
        9: "lg:grid-cols-9",
        10: "lg:grid-cols-10",
        11: "lg:grid-cols-11",
        12: "lg:grid-cols-12",
      }
      classes.push(lgMap[columns.lg] || "lg:grid-cols-3")
    }

    if (columns.xl) {
      const xlMap: Record<number, string> = {
        1: "xl:grid-cols-1",
        2: "xl:grid-cols-2",
        3: "xl:grid-cols-3",
        4: "xl:grid-cols-4",
        5: "xl:grid-cols-5",
        6: "xl:grid-cols-6",
        7: "xl:grid-cols-7",
        8: "xl:grid-cols-8",
        9: "xl:grid-cols-9",
        10: "xl:grid-cols-10",
        11: "xl:grid-cols-11",
        12: "xl:grid-cols-12",
      }
      classes.push(xlMap[columns.xl] || "xl:grid-cols-4")
    }

    return classes.join(" ")
  }

  return (
    <div
      className={cn(
        "grid",
        getGapClass(gap),
        getResponsiveClasses()
      )}
    >
      {children}
    </div>
  )
}

Grid.displayName = "Grid"
