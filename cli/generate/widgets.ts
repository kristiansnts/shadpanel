import type { Field } from "./parse-prisma"
import { humanize } from "./names"

export type WidgetKind =
  | "FormInput"
  | "FormInputNumeric"
  | "FormCheckbox"
  | "FormDateTimePicker"
  | "FormSelect"
  | "FormTextarea"
  | "skip"

export type WidgetResult = {
  kind: WidgetKind
  jsx: string
  imports: string[]
  initialValue: string
  reason?: "id" | "relation" | "bytes"
}

function stripDefaultParens(value: string): string {
  return value.replace(/^\(|\)$/g, "").trim()
}

function requiredAttr(field: Field): string {
  return field.required && !field.default ? " required" : ""
}

export function mapScalarWidget(
  field: Field,
  enums: Record<string, string[]> = {}
): WidgetResult {
  if (field.isId) {
    return { kind: "skip", jsx: "", imports: [], initialValue: "", reason: "id" }
  }

  if (field.isRelation || field.type.endsWith("[]")) {
    return { kind: "skip", jsx: "", imports: [], initialValue: "", reason: "relation" }
  }

  if (field.type === "Bytes") {
    return {
      kind: "skip",
      jsx: `{/* Bytes field "${field.name}" skipped — no widget */}`,
      imports: [],
      initialValue: "",
      reason: "bytes",
    }
  }

  const label = humanize(field.name)
  const required = requiredAttr(field)

  if (field.type === "Boolean") {
    return {
      kind: "FormCheckbox",
      jsx: `<FormCheckbox accessor='${field.name}' label='${label}'${required} />`,
      imports: ["FormCheckbox"],
      initialValue: "false",
    }
  }

  if (field.type === "Int" || field.type === "Float" || field.type === "Decimal") {
    return {
      kind: "FormInputNumeric",
      jsx: `<FormInput accessor='${field.name}' label='${label}' numeric${required} />`,
      imports: ["FormInput"],
      initialValue: "''",
    }
  }

  if (field.type === "DateTime") {
    return {
      kind: "FormDateTimePicker",
      jsx: `<FormDateTimePicker accessor='${field.name}' label='${label}'${required} />`,
      imports: ["FormDateTimePicker"],
      initialValue: "''",
    }
  }

  if (field.isEnum) {
    const values = enums[field.type] || []
    const options = values
      .map((v) => `{ label: '${v}', value: '${v}' }`)
      .join(", ")
    let initial: string
    if (field.default) {
      initial = `'${stripDefaultParens(field.default)}'`
    } else if (values[0]) {
      initial = `'${values[0]}'`
    } else {
      initial = "''"
    }
    return {
      kind: "FormSelect",
      jsx: `<FormSelect accessor='${field.name}' label='${label}' options={[${options}]}${required} />`,
      imports: ["FormSelect"],
      initialValue: initial,
    }
  }

  if (field.type === "Json") {
    return {
      kind: "FormTextarea",
      jsx: `<FormTextarea accessor='${field.name}' label='${label}'${required} />`,
      imports: ["FormTextarea"],
      initialValue: "''",
    }
  }

  const lower = field.name.toLowerCase()
  const inputType = lower.includes("email")
    ? "email"
    : lower.includes("password")
      ? "password"
      : "text"

  return {
    kind: "FormInput",
    jsx: `<FormInput accessor='${field.name}' label='${label}' type='${inputType}'${required} />`,
    imports: ["FormInput"],
    initialValue: "''",
  }
}

export function isFormValueWidget(widget: WidgetResult): boolean {
  return widget.kind !== "skip"
}
