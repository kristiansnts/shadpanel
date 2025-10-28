export { DataTable as Table } from "./data-table"
export { SelectColumn as TableSelectColumn } from "./columns/select-column"
export { TextColumn as TableTextColumn } from "./columns/text-column"
export { ImageColumn as TableImageColumn } from "./columns/image-column"
export { ActionsColumn as TableActionsColumn } from "./columns/actions-column"
export { Action as TableAction } from "./columns/action"

export type {
  BaseColumnProps as TableBaseColumnProps,
  TextColumnProps as TableTextColumnProps,
  ImageColumnProps as TableImageColumnProps,
  ActionProps as TableActionProps,
} from "./types"
