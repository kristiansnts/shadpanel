import { idFieldName, type Field, type RelationKind } from "./parse-prisma"
import { humanize, prismaDelegate } from "./names"

export type WidgetKind =
  | "FormInput"
  | "FormInputNumeric"
  | "FormCheckbox"
  | "FormDateTimePicker"
  | "FormSelect"
  | "FormTextarea"
  | "skip"

export type RelationWidgetMeta = {
  kind: RelationKind
  relatedModel: string
  relatedDelegate: string
  accessor: string
  label: string
  labelField: string
  idField: string
  optionsVar: string
  optionsGetter: string
  fkIsNumber: boolean
}

export type WidgetResult = {
  kind: WidgetKind
  accessor: string
  jsx: string
  imports: string[]
  initialValue: string
  reason?: "id" | "relation" | "bytes" | "fk" | "hasMany" | "manyToMany" | "list"
  relation?: RelationWidgetMeta
}

export type WidgetContext = {
  enums?: Record<string, string[]>
  models?: Record<string, Field[]>
  modelName?: string
}

const LABEL_CANDIDATES = ["name", "title", "email", "label"] as const

export function pickRelationLabelField(fields: Field[] | undefined): string {
  if (!fields?.length) return "id"
  for (const candidate of LABEL_CANDIDATES) {
    const match = fields.find(
      (f) => f.name === candidate && f.type === "String" && !f.isList && !f.isRelation
    )
    if (match) return match.name
  }
  return idFieldName(fields)
}

function stripDefaultParens(value: string): string {
  return value.replace(/^\(|\)$/g, "").trim()
}

function requiredAttr(field: Field): string {
  return field.required && !field.default ? " required" : ""
}

function optionsVarName(relatedModel: string): string {
  const delegate = prismaDelegate(relatedModel)
  return `${delegate}Options`
}

function optionsGetterName(relatedModel: string): string {
  return `get${relatedModel}Options`
}

function ownerFieldsFor(
  field: Field,
  models: Record<string, Field[]>,
  modelName?: string
): Field[] {
  if (modelName && models[modelName]) return models[modelName]
  return (
    Object.values(models).find((fields) =>
      fields.some((f) => f.name === field.name && f.type === field.type && f.isRelation)
    ) || []
  )
}

function belongsToMeta(
  field: Field,
  models: Record<string, Field[]> = {},
  modelName?: string
): RelationWidgetMeta | null {
  const fromFields = field.relationFromFields || []
  if (fromFields.length !== 1) return null
  const accessor = fromFields[0]
  const relatedFields = models[field.type]
  const fkField = ownerFieldsFor(field, models, modelName).find((f) => f.name === accessor)
  const fkIsNumber =
    fkField?.type === "Int" || fkField?.type === "Float" || fkField?.type === "Decimal"

  return {
    kind: "belongsTo",
    relatedModel: field.type,
    relatedDelegate: prismaDelegate(field.type),
    accessor,
    label: humanize(field.name),
    labelField: pickRelationLabelField(relatedFields),
    idField: idFieldName(relatedFields),
    optionsVar: optionsVarName(field.type),
    optionsGetter: optionsGetterName(field.type),
    fkIsNumber,
  }
}

function skip(
  reason: NonNullable<WidgetResult["reason"]>,
  extras: Partial<WidgetResult> = {}
): WidgetResult {
  return {
    kind: "skip",
    accessor: extras.accessor || "",
    jsx: extras.jsx || "",
    imports: extras.imports || [],
    initialValue: extras.initialValue || "",
    reason,
    ...extras,
  }
}

export function mapScalarWidget(
  field: Field,
  enums: Record<string, string[]> = {},
  context: WidgetContext = {}
): WidgetResult {
  const models = context.models || {}

  if (field.isId) {
    return skip("id", { accessor: field.name })
  }

  if (field.isForeignKey) {
    return skip("fk", { accessor: field.name })
  }

  if (field.isList && !field.isRelation) {
    return skip("list", { accessor: field.name })
  }

  const relationKind: RelationKind | undefined =
    field.relationKind ||
    (field.isRelation && field.relationFromFields?.length
      ? "belongsTo"
      : field.isRelation && field.isList
        ? "hasMany"
        : field.isRelation
          ? "hasMany"
          : undefined)

  if (relationKind === "belongsTo") {
    const meta = belongsToMeta(field, models, context.modelName)
    if (!meta) {
      return skip("relation", { accessor: field.name })
    }
    const required = requiredAttr(field)
    return {
      kind: "FormSelect",
      accessor: meta.accessor,
      jsx: `<FormSelect accessor='${meta.accessor}' label='${meta.label}' options={${meta.optionsVar}}${required} />`,
      imports: ["FormSelect"],
      initialValue: "''",
      relation: meta,
    }
  }

  if (relationKind === "hasMany" || relationKind === "manyToMany") {
    const relatedFields = models[field.type]
    const labelField = pickRelationLabelField(relatedFields)
    return skip(relationKind, {
      accessor: field.name,
      relation: {
        kind: relationKind,
        relatedModel: field.type,
        relatedDelegate: prismaDelegate(field.type),
        accessor: field.name,
        label: humanize(field.name),
        labelField,
        idField: idFieldName(relatedFields),
        optionsVar: optionsVarName(field.type),
        optionsGetter: optionsGetterName(field.type),
        fkIsNumber: false,
      },
    })
  }

  if (field.isRelation || field.type.endsWith("[]")) {
    return skip("relation", { accessor: field.name })
  }

  if (field.type === "Bytes") {
    return skip("bytes", {
      accessor: field.name,
      jsx: `{/* Bytes field "${field.name}" skipped — no widget */}`,
    })
  }

  const label = humanize(field.name)
  const required = requiredAttr(field)

  if (field.type === "Boolean") {
    return {
      kind: "FormCheckbox",
      accessor: field.name,
      jsx: `<FormCheckbox accessor='${field.name}' label='${label}'${required} />`,
      imports: ["FormCheckbox"],
      initialValue: "false",
    }
  }

  if (field.type === "Int" || field.type === "Float" || field.type === "Decimal") {
    return {
      kind: "FormInputNumeric",
      accessor: field.name,
      jsx: `<FormInput accessor='${field.name}' label='${label}' numeric${required} />`,
      imports: ["FormInput"],
      initialValue: "''",
    }
  }

  if (field.type === "DateTime") {
    return {
      kind: "FormDateTimePicker",
      accessor: field.name,
      jsx: `<FormDateTimePicker accessor='${field.name}' label='${label}'${required} />`,
      imports: ["FormDateTimePicker"],
      initialValue: "''",
    }
  }

  if (field.isEnum) {
    const values = (context.enums || enums)[field.type] || []
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
      accessor: field.name,
      jsx: `<FormSelect accessor='${field.name}' label='${label}' options={[${options}]}${required} />`,
      imports: ["FormSelect"],
      initialValue: initial,
    }
  }

  if (field.type === "Json") {
    return {
      kind: "FormTextarea",
      accessor: field.name,
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
    accessor: field.name,
    jsx: `<FormInput accessor='${field.name}' label='${label}' type='${inputType}'${required} />`,
    imports: ["FormInput"],
    initialValue: "''",
  }
}

export function isFormValueWidget(widget: WidgetResult): boolean {
  return widget.kind !== "skip"
}

export function isViewRelationWidget(widget: WidgetResult): boolean {
  return widget.reason === "hasMany" || widget.reason === "manyToMany"
}
