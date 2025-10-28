import { ReactNode } from "react"

export type ValidationRule = {
  required?: boolean | string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  min?: { value: number; message: string }
  max?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  validate?: (value: unknown) => boolean | string
}

export interface BaseFieldProps {
  accessor: string
  label?: string
  placeholder?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  tooltip?: string
  validation?: ValidationRule
  defaultValue?: unknown
  className?: string
}

export interface TextInputProps extends BaseFieldProps {
  numeric?: boolean
  type?: "text" | "email" | "password" | "url" | "tel" | "number"
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
}

export interface TextareaProps extends BaseFieldProps {
  rows?: number
  minRows?: number
  maxRows?: number
  resize?: "none" | "both" | "horizontal" | "vertical"
}

export interface CheckboxProps extends BaseFieldProps {
  description?: string
}

export interface ToggleProps extends BaseFieldProps {
  description?: string
}

export interface SelectProps extends BaseFieldProps {
  options: Array<{ label: string; value: string | number; disabled?: boolean }>
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  native?: boolean
}

export interface TagsInputProps extends BaseFieldProps {
  suggestions?: string[]
  maxTags?: number
  separator?: string
}

export interface DatePickerProps extends BaseFieldProps {
  minDate?: Date
  maxDate?: Date
  format?: string
  disablePast?: boolean
  disableFuture?: boolean
  native?: boolean
}

export interface DateTimePickerProps extends DatePickerProps {
  showTime?: boolean
  timeFormat?: "12h" | "24h"
}

export interface FileUploadProps extends BaseFieldProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  preview?: boolean
}

export interface KeyValueProps extends BaseFieldProps {
  keyLabel?: string
  valueLabel?: string
  addLabel?: string
  removeLabel?: string
}

export interface MarkdownEditorProps extends BaseFieldProps {
  height?: string
  preview?: boolean
}

export interface RichEditorProps extends BaseFieldProps {
  height?: string
  toolbar?: string[]
}

// Layout components
export interface GridProps {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number
  children: ReactNode
}

export interface SectionProps {
  title?: string
  description?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: ReactNode
}

export interface FieldsetProps {
  legend?: string
  children: ReactNode
}

export interface TabsProps {
  tabs: Array<{ label: string; value: string; icon?: ReactNode }>
  defaultTab?: string
  children: ReactNode
}

export interface GroupProps {
  children: ReactNode
}

export interface PlaceholderProps {
  text?: string
  icon?: ReactNode
  height?: string
}

// Form context types
export interface FormContextValue {
  values: Record<string, unknown>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  setValue: (accessor: string, value: unknown) => void
  setError: (accessor: string, error: string) => void
  setTouched: (accessor: string, touched: boolean) => void
  validateField: (accessor: string) => boolean
  registerField: (accessor: string, validation?: ValidationRule) => void
  unregisterField: (accessor: string) => void
}

export interface FieldComponentProps {
  _fieldType?: string
  _renderField?: (context: FormContextValue) => ReactNode
}
