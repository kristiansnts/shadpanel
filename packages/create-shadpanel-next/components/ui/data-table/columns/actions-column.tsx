"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { ActionProps } from "../types"
import { ReactElement } from "react"
import { Row } from "@tanstack/react-table"

interface ActionsColumnProps {
  children?: ReactElement<ActionProps> | ReactElement<ActionProps>[]
  header?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ActionsColumn(_props: ActionsColumnProps) {
  // This component doesn't render anything - it's just for configuration
  return null
}

// Column definition generator
ActionsColumn.createColumnDef = (props: ActionsColumnProps) => {
  const { children, header = "Actions" } = props

  // Extract action configurations from children
  const actions = React.Children.toArray(children)
    .filter((child): child is ReactElement<ActionProps> =>
      React.isValidElement(child) && child.props !== undefined
    )
    .map((child) => child.props)

  return {
    id: "actions",
    header: header,
    cell: ({ row }: { row: Row<unknown> }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {actions.map((action, index) => {
              const Icon = action.icon
              const key = `action-${index}`

              if (action.separator) {
                return <DropdownMenuSeparator key={key} />
              }

              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => action.onClick(row.original)}
                  className={action.variant === "destructive" ? "text-destructive" : ""}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  }
}
