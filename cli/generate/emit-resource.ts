import type { Field } from "./parse-prisma"
import { humanize, kebabCase, pascalCase, pluralize, prismaDelegate, singularize } from "./names"
import {
  isFormValueWidget,
  isViewRelationWidget,
  mapScalarWidget,
  type RelationWidgetMeta,
  type WidgetContext,
  type WidgetResult,
} from "./widgets"

export type EmittedFile = {
  relativePath: string
  content: string
}

export type EmitResourceOptions = {
  modelName: string
  fields: Field[]
  enums: Record<string, string[]>
  resourceName: string
  models?: Record<string, Field[]>
}

export type MenuPatch = {
  relativePath: string
  title: string
  url: string
}

const FORM_IMPORT_ORDER = [
  "Form",
  "FormInput",
  "FormTextarea",
  "FormCheckbox",
  "FormDateTimePicker",
  "FormSelect",
  "FormSection",
  "FormGrid",
  "Button",
] as const

function resourceNames(options: EmitResourceOptions) {
  const provided = options.resourceName.toLowerCase()
  const singular = singularize(provided)
  const plural = pluralize(provided)
  return {
    provided,
    singular,
    plural,
    folderName: kebabCase(plural),
    pascal: pascalCase(singular),
    idField: options.fields.find((f) => f.isId) || options.fields.find((f) => f.name === "id"),
  }
}

function widgetContext(options: EmitResourceOptions): WidgetContext {
  return {
    enums: options.enums,
    models: options.models || { [options.modelName]: options.fields },
    modelName: options.modelName,
  }
}

function widgetsFor(options: EmitResourceOptions): { field: Field; widget: WidgetResult }[] {
  const ctx = widgetContext(options)
  return options.fields.map((field) => ({
    field,
    widget: mapScalarWidget(field, options.enums, ctx),
  }))
}

function formWidgets(options: EmitResourceOptions) {
  return widgetsFor(options).filter(
    ({ widget }) => widget.kind !== "skip" || widget.reason === "bytes"
  )
}

function valueWidgets(options: EmitResourceOptions) {
  return widgetsFor(options).filter(({ widget }) => isFormValueWidget(widget))
}

function viewRelationWidgets(options: EmitResourceOptions) {
  return widgetsFor(options).filter(({ widget }) => isViewRelationWidget(widget))
}

function belongsToMetas(options: EmitResourceOptions): RelationWidgetMeta[] {
  const seen = new Set<string>()
  const metas: RelationWidgetMeta[] = []
  for (const { widget } of valueWidgets(options)) {
    if (widget.relation?.kind === "belongsTo" && !seen.has(widget.relation.relatedModel)) {
      seen.add(widget.relation.relatedModel)
      metas.push(widget.relation)
    }
  }
  return metas
}

function formComponentImports(options: EmitResourceOptions): string {
  const used = new Set<string>(["Form", "FormSection", "FormGrid", "Button"])
  for (const { widget } of valueWidgets(options)) {
    for (const name of widget.imports) used.add(name)
  }
  const names = FORM_IMPORT_ORDER.filter((name) => used.has(name))
  return names.join(", ")
}

function includeObject(options: EmitResourceOptions): string {
  const relations = options.fields.filter((f) => f.isRelation)
  if (!relations.length) return ""
  const entries = relations.map((f) => `${f.name}: true`).join(", ")
  return `{ ${entries} }`
}

function submitExpr(widget: WidgetResult): string {
  const name = widget.accessor
  if (widget.relation?.kind === "belongsTo") {
    if (widget.relation.fkIsNumber) {
      return `        ${name}: values.${name} === '' || values.${name} == null ? null : Number(values.${name})`
    }
    return `        ${name}: values.${name} === '' ? null : values.${name}`
  }
  return `        ${name}: values.${name} as any`
}

function hydrateExpr(widget: WidgetResult): string {
  const name = widget.accessor
  if (widget.relation?.kind === "belongsTo") {
    return `          ;(initialValues as any).${name} = (row as any).${name} != null ? String((row as any).${name}) : ${widget.initialValue}`
  }
  return `          ;(initialValues as any).${name} = (row as any).${name} ?? ${widget.initialValue}`
}

function emitRelatedOptionActions(options: EmitResourceOptions): string {
  const metas = belongsToMetas(options)
  if (!metas.length) return ""
  return (
    "\n" +
    metas
      .map((meta) => {
        const plural = pluralize(meta.relatedDelegate)
        return `
export async function ${meta.optionsGetter}() {
  try {
    const rows = await prisma.${meta.relatedDelegate}.findMany({ take: 100 })
    return rows
  } catch (error) {
    console.error('Failed to fetch ${plural}:', error)
    throw new Error('Failed to fetch ${plural}')
  }
}
`
      })
      .join("")
  )
}

function emitActions(options: EmitResourceOptions): string {
  const { singular, plural, folderName, pascal, idField } = resourceNames(options)
  const idIsNumber = idField?.type === "Int"
  const idName = idField?.name || "id"
  const delegate = prismaDelegate(options.modelName)
  const idType = idIsNumber ? "number" : "string"
  const idExpr = idIsNumber ? "Number(id)" : "id"
  const include = includeObject(options)
  const findManyArgs = include ? `{ take: 100, include: ${include} }` : "{ take: 100 }"
  const findUniqueArgs = include
    ? `{ where: { ${idName}: ${idExpr} }, include: ${include} }`
    : `{ where: { ${idName}: ${idExpr} } }`

  return `// generated by shadpanel CLI
"use server"

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function get${pascal}s() {
  try {
    const rows = await prisma.${delegate}.findMany(${findManyArgs})
    return rows
  } catch (error) {
    console.error('Failed to fetch ${plural}:', error)
    throw new Error('Failed to fetch ${plural}')
  }
}

export async function get${pascal}ById(id: ${idType}) {
  try {
    const row = await prisma.${delegate}.findUnique(${findUniqueArgs})
    return row
  } catch (error) {
    console.error('Failed to fetch ${singular}:', error)
    throw new Error('Failed to fetch ${singular}')
  }
}

export async function create${pascal}(data: Record<string, any>) {
  try {
    const row = await prisma.${delegate}.create({ data })
    revalidatePath('/admin/dashboard/${folderName}')
    return { success: true, message: '${pascal} created successfully', ${singular}: row }
  } catch (error: any) {
    console.error('Error creating ${singular}:', error)
    return { success: false, message: 'Failed to create ${singular}.' }
  }
}

export async function update${pascal}(id: ${idType}, data: Record<string, any>) {
  try {
    const row = await prisma.${delegate}.update({ where: { ${idName}: ${idIsNumber ? "Number(id)" : "id"} }, data })
    revalidatePath('/admin/dashboard/${folderName}')
    return { success: true, message: '${pascal} updated successfully', ${singular}: row }
  } catch (error) {
    console.error('Error updating ${singular}:', error)
    return { success: false, message: 'Failed to update ${singular}.' }
  }
}

export async function delete${pascal}(id: ${idType}) {
  try {
    await prisma.${delegate}.delete({ where: { ${idName}: ${idIsNumber ? "Number(id)" : "id"} } })
    revalidatePath('/admin/dashboard/${folderName}')
    return { success: true, message: '${pascal} deleted' }
  } catch (error) {
    console.error('Error deleting ${singular}:', error)
    return { success: false, message: 'Failed to delete ${singular}.' }
  }
}
${emitRelatedOptionActions(options)}`
}

function emitListPage(options: EmitResourceOptions): string {
  const { fields } = options
  const { singular, plural, folderName, pascal, idField } = resourceNames(options)
  const idName = idField?.name || "id"
  const listFields = fields
    .filter((f) => !f.isRelation && !f.isForeignKey && f.name !== idName)
    .slice(0, 2)

  const normalizedFields = listFields
    .map((f) => `          ${f.name}: r.${f.name} ?? ''`)
    .join(",\n")

  const columns = listFields
    .map((f) => {
      const header = humanize(f.name)
      const searchable = ["name", "title", "email"].some((k) =>
        f.name.toLowerCase().includes(k)
      )
      return `        <TableTextColumn accessor='${f.name}' header='${header}'${searchable ? " searchable" : ""} />`
    })
    .join("\n")

  return `// generated by shadpanel CLI
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableSelectColumn, TableTextColumn, TableActionsColumn, TableAction, Button } from '@/components/ui'
import { Plus, Edit, Trash, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { get${pascal}s, delete${pascal} } from '@/app/admin/dashboard/${folderName}/actions'

export default function ${pascal}sPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const rows = await get${pascal}s()
        const normalized = (rows || []).map((r: any) => ({
          ${idName}: r.${idName},
${normalizedFields}
        }))
        setData(normalized)
      } catch (err: any) {
        setError(err?.message || 'Failed to load ${plural}')
        toast.error('Failed to load ${plural}')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleView = (row: any) => {
    router.push('/admin/dashboard/${folderName}/view/' + row.${idName})
  }

  const handleEdit = (row: any) => {
    router.push('/admin/dashboard/${folderName}/edit/' + row.${idName})
  }

  const handleDelete = async (row: any) => {
    try {
      const res = await delete${pascal}(row.${idName})
      if (res.success) {
        toast.success('${pascal} deleted')
        setData(prev => prev.filter(r => r.${idName} !== row.${idName}))
      } else {
        toast.error(res.message || 'Failed to delete ${singular}')
      }
    } catch (err) {
      toast.error('Failed to delete ${singular}')
    }
  }

  if (loading) {
    return (
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between p-8 pb-4'>
          <div>
            <h1 className='text-4xl font-bold'>${humanize(plural)}</h1>
            <p className='mt-2 text-muted-foreground'>Loading ${plural}...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between p-8 pb-4'>
          <div>
            <h1 className='text-4xl font-bold'>${humanize(plural)}</h1>
            <p className='mt-2 text-destructive'>Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between p-8 pb-4'>
        <div>
          <h1 className='text-4xl font-bold'>${humanize(plural)}</h1>
          <p className='mt-2 text-muted-foreground'>Manage ${plural}</p>
        </div>
        <Button className='hover:cursor-pointer' onClick={() => router.push('/admin/dashboard/${folderName}/create')}>
          <Plus className='mr-2 h-4 w-4' />
          Create ${pascal}
        </Button>
      </div>

      <Table data={data}>
        <TableSelectColumn />
${columns}
        <TableActionsColumn>
          <TableAction icon={Eye} label='View' onClick={(row)=> handleView(row as any)} />
          <TableAction icon={Edit} label='Edit' onClick={(row)=> handleEdit(row as any)} />
          <TableAction separator label='' onClick={()=>{}} />
          <TableAction icon={Trash} label='Delete' onClick={(row)=> handleDelete(row as any)} variant='destructive' />
        </TableActionsColumn>
      </Table>
    </div>
  )
}
`
}

function relatedOptionsState(metas: RelationWidgetMeta[]): string {
  if (!metas.length) return ""
  return metas
    .map(
      (meta) =>
        `  const [${meta.optionsVar}, set${meta.relatedModel}Options] = useState<Array<{ label: string; value: string }>>([])`
    )
    .join("\n")
}

function relatedOptionsEffect(metas: RelationWidgetMeta[]): string {
  if (!metas.length) return ""
  const loads = metas
    .map(
      (meta) => `        const ${meta.relatedDelegate}Rows = await ${meta.optionsGetter}()
        if (cancelled) return
        set${meta.relatedModel}Options((${meta.relatedDelegate}Rows || []).map((r: any) => ({
          label: r.${meta.labelField} != null && r.${meta.labelField} !== '' ? String(r.${meta.labelField}) : String(r.${meta.idField}),
          value: String(r.${meta.idField}),
        })))`
    )
    .join("\n")
  return `
  useEffect(() => {
    let cancelled = false
    async function loadRelated() {
      try {
${loads}
      } catch (error) {
        if (!cancelled) toast.error('Failed to load related records')
      }
    }
    loadRelated()
    return () => {
      cancelled = true
    }
  }, [])
`
}

function relatedOptionsImports(metas: RelationWidgetMeta[]): string {
  return metas.map((m) => m.optionsGetter).join(", ")
}

function emitCreatePage(options: EmitResourceOptions): string {
  const { singular, folderName, pascal } = resourceNames(options)
  const values = valueWidgets(options)
  const widgets = formWidgets(options)
  const imports = formComponentImports(options)
  const metas = belongsToMetas(options)
  const optionGetters = relatedOptionsImports(metas)
  const actionImports = optionGetters
    ? `import { create${pascal}, ${optionGetters} } from '../actions'`
    : `import { create${pascal} } from '../actions'`
  const reactImports = metas.length
    ? "import { useState, useEffect } from 'react'"
    : "import { useState } from 'react'"

  const initial = values
    .map(({ widget }) => `        ${widget.accessor}: ${widget.initialValue}`)
    .join(",\n")

  const submit = values.map(({ widget }) => submitExpr(widget)).join(",\n")

  const controls = widgets
    .map(({ widget }) => `            ${widget.jsx}`)
    .join("\n")

  return `// generated by shadpanel CLI
'use client'

${reactImports}
import { useRouter } from 'next/navigation'
import { ${imports} } from '@/components/ui'
import { toast } from 'sonner'
${actionImports}

export default function Create${pascal}Page() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
${relatedOptionsState(metas)}
${relatedOptionsEffect(metas)}
  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      const result = await create${pascal}({
${submit}
      })
      if (result.success) {
        toast.success('Success!', { description: result.message })
        setTimeout(() => router.push('/admin/dashboard/${folderName}'), 700)
      } else {
        toast.error('Error!', { description: result.message })
      }
    } catch (error) {
      toast.error('Error!', { description: 'An unexpected error occurred.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => router.push('/admin/dashboard/${folderName}')

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between p-8 pb-4'>
        <div>
          <h1 className='text-4xl font-bold'>Create New ${pascal}</h1>
          <p className='mt-2 text-muted-foreground'>Add a new ${singular} to the system</p>
        </div>
      </div>

      <Form initialValues={{
${initial}
      }} onSubmit={handleSubmit}>
        <FormSection title='${pascal} Information' description='Enter details'>
          <FormGrid columns={{ sm: 1, md: 2 }} gap={4}>
${controls}
          </FormGrid>
        </FormSection>

        <div className='flex gap-4'>
          <Button type='submit' className='hover:cursor-pointer' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create ${pascal}'}
          </Button>
          <Button type='button' variant='outline' onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
`
}

function emitEditPage(options: EmitResourceOptions): string {
  const { singular, folderName, pascal, idField } = resourceNames(options)
  const idIsNumber = idField?.type === "Int"
  const idCast = idIsNumber ? "Number(idParam as string)" : "String(idParam)"
  const values = valueWidgets(options)
  const widgets = formWidgets(options)
  const imports = formComponentImports(options)
  const metas = belongsToMetas(options)
  const optionGetters = relatedOptionsImports(metas)
  const actionImports = optionGetters
    ? `import { get${pascal}ById, update${pascal}, ${optionGetters} } from '../../actions'`
    : `import { get${pascal}ById, update${pascal} } from '../../actions'`

  const initial = values
    .map(({ widget }) => `    ${widget.accessor}: ${widget.initialValue}`)
    .join(",\n")

  const hydrate = values.map(({ widget }) => hydrateExpr(widget)).join("\n")

  const submit = values.map(({ widget }) => submitExpr(widget)).join(",\n")

  const controls = widgets
    .map(({ widget }) => `            ${widget.jsx}`)
    .join("\n")

  return `// generated by shadpanel CLI
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ${imports} } from '@/components/ui'
import { toast } from 'sonner'
${actionImports}

export default function Edit${pascal}Page() {
  const params = useParams()
  const router = useRouter()
  const idParam = params?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
${relatedOptionsState(metas)}
  const [initialValues, setInitialValues] = useState({
${initial}
  })
${relatedOptionsEffect(metas)}
  useEffect(() => {
    async function fetchData() {
      if (!idParam) {
        setError('Missing ${singular} id')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const row = await get${pascal}ById(${idCast} as any)
        if (row) {
${hydrate}
          setInitialValues({ ...initialValues })
        } else {
          setError('${pascal} not found')
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load ${singular}')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  const handleSubmit = async (values: Record<string, any>) => {
    if (!idParam) return
    setIsSubmitting(true)
    try {
      const result = await update${pascal}(${idCast} as any, {
${submit}
      })
      if (result.success) {
        toast.success('Updated', { description: result.message })
        setTimeout(() => router.push('/admin/dashboard/${folderName}'), 700)
      } else {
        toast.error('Error updating ${singular}', { description: result.message })
      }
    } catch (err) {
      toast.error('Error updating ${singular}')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className='p-8'>Loading ${singular}...</div>
  if (error) return <div className='p-8 text-destructive'>{error}</div>

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between p-8 pb-4'>
        <div>
          <h1 className='text-4xl font-bold'>Edit ${pascal}</h1>
          <p className='mt-2 text-muted-foreground'>Update ${singular} details</p>
        </div>
      </div>

      <Form initialValues={initialValues} onSubmit={handleSubmit}>
        <FormSection title='${pascal} Information' description='Update details'>
          <FormGrid columns={{ sm: 1, md: 2 }} gap={4}>
${controls}
          </FormGrid>
        </FormSection>

        <div className='flex gap-4'>
          <Button type='submit' className='hover:cursor-pointer' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type='button' variant='outline' onClick={() => router.push('/admin/dashboard/${folderName}')} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
`
}

function viewScalarRows(options: EmitResourceOptions): string {
  const { idField } = resourceNames(options)
  const idName = idField?.name || "id"
  return options.fields
    .filter((f) => !f.isRelation && !f.isForeignKey)
    .map((f) => {
      const label = humanize(f.name)
      return `          <div>
            <dt className='text-sm font-medium text-muted-foreground'>${label}</dt>
            <dd className='mt-1'>${f.name === idName ? `{String(row.${f.name} ?? '')}` : `{row.${f.name} == null ? '—' : String(row.${f.name})}`}</dd>
          </div>`
    })
    .join("\n")
}

function viewRelationSections(options: EmitResourceOptions): string {
  const rels = viewRelationWidgets(options)
  if (!rels.length) return ""
  return rels
    .map(({ field, widget }) => {
      const meta = widget.relation
      const heading = meta?.label || humanize(field.name)
      const labelField = meta?.labelField || "id"
      const idField = meta?.idField || "id"
      const listExpr = field.isList
        ? `(row.${field.name} || [])`
        : `(row.${field.name} ? [row.${field.name}] : [])`
      return `
        <section className='space-y-2' data-relation='${field.name}' data-relation-kind='${field.relationKind || widget.reason}'>
          <h2 className='text-lg font-semibold'>${heading}</h2>
          {${listExpr}.length === 0 ? (
            <p className='text-muted-foreground'>No ${field.name}</p>
          ) : (
            <ul className='list-disc space-y-1 pl-6'>
              {${listExpr}.map((item: any) => (
                <li key={String(item.${idField})}>
                  {item.${labelField} != null && item.${labelField} !== '' ? String(item.${labelField}) : String(item.${idField})}
                </li>
              ))}
            </ul>
          )}
        </section>`
    })
    .join("\n")
}

function emitViewPage(options: EmitResourceOptions): string {
  const { singular, folderName, pascal, idField } = resourceNames(options)
  const idIsNumber = idField?.type === "Int"
  const idCast = idIsNumber ? "Number(idParam as string)" : "String(idParam)"
  const scalars = viewScalarRows(options)
  const relations = viewRelationSections(options)

  return `// generated by shadpanel CLI
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from 'sonner'
import { get${pascal}ById } from '../../actions'

export default function View${pascal}Page() {
  const params = useParams()
  const router = useRouter()
  const idParam = params?.id
  const [row, setRow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!idParam) {
        setError('Missing ${singular} id')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const record = await get${pascal}ById(${idCast} as any)
        if (record) {
          setRow(record)
        } else {
          setError('${pascal} not found')
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load ${singular}')
        toast.error('Failed to load ${singular}')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [idParam])

  if (loading) return <div className='p-8'>Loading ${singular}...</div>
  if (error) return <div className='p-8 text-destructive'>{error}</div>
  if (!row) return <div className='p-8'>${pascal} not found</div>

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between p-8 pb-4'>
        <div>
          <h1 className='text-4xl font-bold'>${pascal}</h1>
          <p className='mt-2 text-muted-foreground'>View ${singular} details</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => router.push('/admin/dashboard/${folderName}')}>
            Back
          </Button>
          <Button onClick={() => router.push('/admin/dashboard/${folderName}/edit/' + idParam)}>
            Edit
          </Button>
        </div>
      </div>

      <div className='space-y-8 px-8 pb-8'>
        <dl className='grid gap-4 sm:grid-cols-2'>
${scalars}
        </dl>
${relations}
      </div>
    </div>
  )
}
`
}

export function emitResource(options: EmitResourceOptions): EmittedFile[] {
  const { folderName } = resourceNames(options)
  const base = `app/admin/dashboard/${folderName}`

  return [
    { relativePath: `${base}/actions.ts`, content: emitActions(options) },
    { relativePath: `${base}/page.tsx`, content: emitListPage(options) },
    { relativePath: `${base}/create/page.tsx`, content: emitCreatePage(options) },
    { relativePath: `${base}/edit/[id]/page.tsx`, content: emitEditPage(options) },
    { relativePath: `${base}/view/[id]/page.tsx`, content: emitViewPage(options) },
  ]
}

export function resourceMenuItem(options: EmitResourceOptions): MenuPatch {
  const { plural, folderName } = resourceNames(options)
  return {
    relativePath: "config/menu.ts",
    title: humanize(plural),
    url: `/admin/dashboard/${folderName}`,
  }
}

export function menuHasUrl(content: string, url: string): boolean {
  return content.includes(`"${url}"`) || content.includes(`'${url}'`)
}

export function applyMenuPatch(
  existing: string | null,
  item: MenuPatch
): { content: string; action: "created" | "patched" | "skipped" } {
  if (existing && menuHasUrl(existing, item.url)) {
    return { content: existing, action: "skipped" }
  }

  if (!existing) {
    return {
      content: `import { LucideIcon, Users } from 'lucide-react'

export const defaultMenuConfig = { navMain: [ { title: 'Content', items: [ { title: '${item.title}', url: '${item.url}', icon: Users } ] } ] }
`,
      action: "created",
    }
  }

  let next = existing
  if (!/Users/.test(next)) {
    next = `import { Users } from 'lucide-react'\n` + next
  }

  const patched = next.replace(
    /(navMain: \[\s*\{[\s\S]*?items:\s*\[)/,
    `$1\n    { title: "${item.title}", url: "${item.url}", icon: Users },`
  )

  if (patched === next) {
    return { content: existing, action: "skipped" }
  }

  return { content: patched, action: "patched" }
}
