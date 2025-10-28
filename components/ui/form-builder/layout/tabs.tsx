"use client"

import * as React from "react"
import {
  Tabs as TabsUI,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TabsProps } from "../types"

export function Tabs({ tabs, defaultTab, children }: TabsProps) {
  const childArray = React.Children.toArray(children)

  return (
    <TabsUI defaultValue={defaultTab || tabs[0]?.value} className="space-y-4">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab, index) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4">
          {childArray[index]}
        </TabsContent>
      ))}
    </TabsUI>
  )
}

Tabs.displayName = "Tabs"
