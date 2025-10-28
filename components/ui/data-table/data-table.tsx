"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData> {
  data: TData[]
  children: React.ReactNode
  className?: string
}

export function DataTable<TData>({
  data,
  children,
  className = "px-8 pb-8",
}: DataTableProps<TData>) {
  // Extract column definitions from children
  const columns = React.useMemo(() => {
    const childArray = React.Children.toArray(children)
    return childArray
      .map((child) => {
        if (React.isValidElement(child)) {
          const columnType = child.type as {
            createColumnDef?: (props: unknown) => ColumnDef<TData>
          }
          if (typeof columnType?.createColumnDef === "function") {
            return columnType.createColumnDef(child.props)
          }
        }
        return null
      })
      .filter(Boolean) as ColumnDef<TData>[]
  }, [children])

  // Extract searchable and filterable column configs
  const { searchableColumns, filterableColumns } = React.useMemo(() => {
    const childArray = React.Children.toArray(children)
    const searchable: string[] = []
    const filterable: Array<{
      id: string
      title: string
      options: Array<{ label: string; value: string }>
    }> = []

    childArray.forEach((child) => {
      if (React.isValidElement(child)) {
        const props = child.props as {
          searchable?: boolean
          accessor?: string
          filterable?: boolean
          filterOptions?: Array<{ label: string; value: string }>
          header?: string
        }
        if (props.searchable && props.accessor) {
          searchable.push(props.accessor)
        }
        if (props.filterable && props.accessor && props.filterOptions) {
          filterable.push({
            id: props.accessor,
            title: props.header || props.accessor,
            options: props.filterOptions,
          })
        }
      }
    })

    return { searchableColumns: searchable, filterableColumns: filterable }
  }, [children])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      // Search across all searchable columns
      const searchValue = String(filterValue).toLowerCase()

      return searchableColumns.some((accessor) => {
        // Handle nested accessors like "company.name"
        const keys = accessor.split(".")
        let value: unknown = row.original
        for (const key of keys) {
          value = (value as Record<string, unknown>)?.[key]
        }

        return String(value).toLowerCase().includes(searchValue)
      })
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  })

  const isFiltered = columnFilters.length > 0 || globalFilter.length > 0
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const totalFilteredRows = table.getFilteredRowModel().rows.length
  const currentPageRows = table.getRowModel().rows.length
  const isAllPageRowsSelected = table.getIsAllPageRowsSelected()
  const hasMoreRows = totalFilteredRows > currentPageRows

  // Generate search placeholder text
  const searchPlaceholder = React.useMemo(() => {
    if (searchableColumns.length === 0) return "Search..."
    if (searchableColumns.length === 1) return `Search by ${searchableColumns[0]}...`
    return `Search across ${searchableColumns.length} fields...`
  }, [searchableColumns])

  return (
    <div className={cn("space-y-4", className)}>
      {selectedRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-primary bg-primary/10 px-4 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {selectedRows.length} row(s) selected
              </span>
              {isAllPageRowsSelected && hasMoreRows && (
                <div className="text-xs">
                  {selectedRows.length === totalFilteredRows ? (
                    <span className="text-muted-foreground">
                      All {totalFilteredRows} rows are selected
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        table.toggleAllRowsSelected(true)
                      }}
                      className="text-primary hover:underline text-left font-medium"
                    >
                      Select all {totalFilteredRows} rows
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Export selected:", selectedRows.length, "rows")
                  alert(`Export ${selectedRows.length} selected rows (demo)`)
                }}
              >
                Export selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${selectedRows.length} selected rows?`)) {
                    console.log("Delete selected:", selectedRows.length, "rows")
                    alert("Selected rows deleted (demo)")
                    table.resetRowSelection()
                  }
                }}
                className="text-destructive"
              >
                Delete selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetRowSelection()}
              >
                Clear selection
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          {searchableColumns.length > 0 && (
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 w-full max-w-sm"
            />
          )}
          {filterableColumns.map((column) => {
            const selectedValues = new Set(
              table.getColumn(column.id)?.getFilterValue() as string[]
            )
            return (
              <DropdownMenu key={column.id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-dashed">
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {column.title}
                    {selectedValues?.size > 0 && (
                      <>
                        <span className="mx-2">·</span>
                        <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
                          {selectedValues.size}
                        </span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {column.options.map((option) => {
                    const isSelected = selectedValues.has(option.value)
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectedValues.add(option.value)
                          } else {
                            selectedValues.delete(option.value)
                          }
                          const filterValues = Array.from(selectedValues)
                          table
                            .getColumn(column.id)
                            ?.setFilterValue(
                              filterValues.length ? filterValues : undefined
                            )
                        }}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                table.resetColumnFilters()
                setGlobalFilter("")
              }}
              className="h-9 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.resetRowSelection()}
              className="h-9"
            >
              Clear ({selectedRows.length})
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.toggleAllRowsSelected(true)}
              className="h-9"
            >
              Select All
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <div className="relative overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-9 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedRows.length > 0 ? (
              <>
                {selectedRows.length} of {totalFilteredRows} row(s) selected
              </>
            ) : (
              <>
                Showing {currentPageRows} of {totalFilteredRows} row(s)
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
