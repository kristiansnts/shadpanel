"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Table } from "@tanstack/react-table"
import { Row } from "@tanstack/react-table"

export function SelectColumn() {
  // This component doesn't render anything - it's just for configuration
  return null
}

// Column definition generator
SelectColumn.createColumnDef = () => ({
  id: "select",
  header: ({ table }: { table: Table<unknown> }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }: { row: Row<unknown> }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
})
