"use client"

import * as React from "react"
import { GroupProps } from "../types"

export function Group({ children }: GroupProps) {
  return <div className="space-y-4">{children}</div>
}

Group.displayName = "Group"
