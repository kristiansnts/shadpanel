import { ColumnDef } from "@tanstack/react-table"
import { LucideIcon } from "lucide-react"

export interface BaseColumnProps {
  accessor?: string
  header?: string
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  hideable?: boolean
}

export interface TextColumnProps extends BaseColumnProps {
  filterOptions?: Array<{ label: string; value: string }>
  transform?: (value: unknown) => string
  numeric?: boolean
  format?: (value: number) => string
}

export interface ImageColumnProps extends BaseColumnProps {
  className?: string
  alt?: (row: unknown) => string
}

export interface ActionProps {
  icon?: LucideIcon
  label: string
  onClick: (row: unknown) => void
  variant?: "default" | "destructive"
  separator?: boolean
}

export interface ColumnComponentProps {
  _columnType?: string
  _columnDef?: ColumnDef<unknown>
}
