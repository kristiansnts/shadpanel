import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import { logger } from "../utils/logger"

// Simple helpers
function pascalCase(str: string) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (m) => m.toUpperCase())
}

function kebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase()
}

function singularize(name: string) {
  if (name.endsWith("s") && name.length > 1) return name.slice(0, -1)
  return name
}

const SCALAR_TYPES = new Set([
  "Int",
  "String",
  "Boolean",
  "DateTime",
  "Float",
  "Decimal",
  "Json",
  "Bytes",
])

type Field = {
  name: string
  type: string
  required: boolean
  isId: boolean
  isRelation: boolean
  isEnum: boolean
  default?: string
}

function parsePrismaSchema(content: string) {
  const enums: Record<string, string[]> = {}
  const models: Record<string, Field[]> = {}

  // parse enums
  const enumRegex = /enum\s+(\w+)\s*\{([\s\S]*?)\}/g
  let m
  while ((m = enumRegex.exec(content))) {
    const name = m[1]
    const body = m[2]
    const values = body
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(" ")[0])
    enums[name] = values
  }

  // parse models
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g
  while ((m = modelRegex.exec(content))) {
    const modelName = m[1]
    const body = m[2]
    const lines = body.split(/\n/)
    const fields: Field[] = []
    for (let raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith("//")) continue
      // skip @@ attributes
      if (line.startsWith("@@")) continue
      const parts = line.split(/\s+/)
      const fname = parts[0]
      const ftypeRaw = parts[1]
      if (!fname || !ftypeRaw) continue
      const required = !ftypeRaw.endsWith("?")
      const ftype = ftypeRaw.replace(/\?$/, "")
      const attrs = line.slice(line.indexOf(ftypeRaw) + ftypeRaw.length)

      const isId = /@id\b/.test(line)
      const defaultMatch = line.match(/@default\(([^)]+)\)/)
      const isEnum = !!enums[ftype]
      const isRelation = !SCALAR_TYPES.has(ftype) && !isEnum

      fields.push({
        name: fname,
        type: ftype,
        required,
        isId,
        isRelation,
        isEnum,
        default: defaultMatch ? defaultMatch[1] : undefined,
      })
    }
    models[modelName] = fields
  }

  return { enums, models }
}

function humanize(str: string) {
  return str
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase())
}

function prismaDelegate(modelName: string) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

export function resourceCommand(): Command {
  const cmd = new Command("resource")

  cmd
    .description("Scaffold a Next.js App Router resource from a Prisma model")
    .alias("r")
    .argument("<name>", "Resource name (singular or plural)")
    .option("--force", "Overwrite existing files")
    .option("--skip-menu", "Do not modify config/menu.ts")
    .option("--path <projectPath>", "Target project path", process.cwd())
    .option("--dry-run", "Print diffs without writing files")
    .action(async (name: string, options: any) => {
      const projectPath = path.resolve(options.path || process.cwd())
      logger.info(`Scaffolding resource '${name}' in ${projectPath}`)

      const schemaPath = path.join(projectPath, "prisma", "schema.prisma")
      if (!(await fs.pathExists(schemaPath))) {
        logger.error(`Prisma schema not found at ${schemaPath}`)
        process.exit(2)
      }

      const schema = await fs.readFile(schemaPath, "utf-8")
      const { enums, models } = parsePrismaSchema(schema)

      const provided = name.toLowerCase()
      const singular = singularize(provided)

      // find model by case-insensitive match of model name
      const modelEntry = Object.keys(models).find((m) => {
        const mLower = m.toLowerCase()
        return (
          mLower === provided ||
          mLower === singular ||
          mLower === (provided.endsWith("s") ? provided.slice(0, -1) : provided + "s")
        )
      })

      if (!modelEntry) {
        logger.error(`Model for '${name}' not found in schema.`)
        logger.info("Available models:")
        Object.keys(models).forEach((m) => logger.info(`  - ${m}`))
        process.exit(3)
      }

      const modelName = modelEntry
      const fields = models[modelName]

      // Determine plural folder name
  const plural = provided.endsWith("s") ? provided : provided + "s"
  const folderName = kebabCase(plural)
      const pascal = pascalCase(singular)
      const idField = fields.find((f) => f.isId) || fields.find((f) => f.name === "id")
      const idIsNumber = idField?.type === "Int"

      // Prepare target paths
  const baseTarget = path.join(projectPath, "app", "admin", "dashboard", folderName)
      const filesToWrite: Array<{ filePath: string; content: string }> = []

      // actions.ts (server)
      const actionsContent = `// generated by shadpanel CLI
"use server"

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function get${pascal}s() {
  try {
    const rows = await prisma.${prismaDelegate(modelName)}.findMany({ take: 100 })
    return rows
  } catch (error) {
    console.error('Failed to fetch ${plural}:', error)
    throw new Error('Failed to fetch ${plural}')
  }
}

export async function get${pascal}ById(id: ${idIsNumber ? 'number' : 'string'}) {
  try {
    const row = await prisma.${prismaDelegate(modelName)}.findUnique({ where: { ${idField?.name}: ${idIsNumber ? 'Number(id)' : 'id'} } })
    return row
  } catch (error) {
    console.error('Failed to fetch ${singular}:', error)
    throw new Error('Failed to fetch ${singular}')
  }
}

export async function create${pascal}(data: Record<string, any>) {
  try {
    const row = await prisma.${prismaDelegate(modelName)}.create({ data })
    revalidatePath('/admin/dashboard/${folderName}')
    return { success: true, message: '${pascal} created successfully', ${singular}: row }
  } catch (error: any) {
    console.error('Error creating ${singular}:', error)
    return { success: false, message: 'Failed to create ${singular}.' }
  }
}

export async function update${pascal}(id: ${idIsNumber ? 'number' : 'string'}, data: Record<string, any>) {
  try {
    const row = await prisma.${prismaDelegate(modelName)}.update({ where: { ${idField?.name}: ${idIsNumber ? 'Number(id)' : 'id'} }, data })
    revalidatePath('/admin/dashboard/${folderName}')
    return { success: true, message: '${pascal} updated successfully', ${singular}: row }
  } catch (error) {
    console.error('Error updating ${singular}:', error)
    return { success: false, message: 'Failed to update ${singular}.' }
  }
}

export async function delete${pascal}(id: ${idIsNumber ? 'number' : 'string'}) {
  try {
    await prisma.${prismaDelegate(modelName)}.delete({ where: { ${idField?.name}: ${idIsNumber ? 'Number(id)' : 'id'} } })
    revalidatePath('/admin/dashboard/${folderName}')
    return { success: true, message: '${pascal} deleted' }
  } catch (error) {
    console.error('Error deleting ${singular}:', error)
    return { success: false, message: 'Failed to delete ${singular}.' }
  }
}
`

      filesToWrite.push({ filePath: path.join(baseTarget, "actions.ts"), content: actionsContent })

      // page.tsx (list) using DataTable components
      const listContent = `// generated by shadpanel CLI
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableSelectColumn, TableTextColumn, TableActionsColumn, TableAction, Button } from '@/components/ui'
import { Plus, Edit, Trash } from 'lucide-react'
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
          ${idField?.name}: r.${idField?.name},
${fields.filter(f=>!f.isRelation && f.name !== idField?.name).slice(0,2).map(f=>`          ${f.name}: r.${f.name} ?? ''`).join(',\n')}
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

  const handleEdit = (row: any) => {
    router.push('/admin/dashboard/${folderName}/edit/' + row.${idField?.name})
  }

  const handleDelete = async (row: any) => {
    try {
      const res = await delete${pascal}(row.${idField?.name})
      if (res.success) {
        toast.success('${pascal} deleted')
        setData(prev => prev.filter(r => r.${idField?.name} !== row.${idField?.name}))
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
${fields.filter(f=>!f.isRelation && f.name !== idField?.name).slice(0,2).map(f=>{
  const header = humanize(f.name)
  const searchable = ["name","title","email"].some(k=>f.name.toLowerCase().includes(k))
  return `        <TableTextColumn accessor='${f.name}' header='${header}'${searchable? ' searchable':''} />`
}).join('\n')}
        <TableActionsColumn>
          <TableAction icon={Edit} label='Edit' onClick={(row)=> handleEdit(row as any)} />
          <TableAction separator label='' onClick={()=>{}} />
          <TableAction icon={Trash} label='Delete' onClick={(row)=> handleDelete(row as any)} variant='destructive' />
        </TableActionsColumn>
      </Table>
    </div>
  )
}
`

      filesToWrite.push({ filePath: path.join(baseTarget, "page.tsx"), content: listContent })

      // create page (server) + client form component
      const createContent = `// generated by shadpanel CLI
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
      import { Form, FormInput, FormCheckbox, FormSection, FormGrid, Button } from '@/components/ui'
import { toast } from 'sonner'
import { create${pascal} } from '../actions'

export default function Create${pascal}Page() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      const result = await create${pascal}({
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>`        ${f.name}: values.${f.name} as any`).join(',\n')}
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
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>`        ${f.name}: ${f.type==='Boolean' ? 'false' : "''"}`).join(',\n')}
      }} onSubmit={handleSubmit}>
        <FormSection title='${pascal} Information' description='Enter details'>
          <FormGrid columns={{ sm: 1, md: 2 }} gap={4}>
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>{
  const label = humanize(f.name)
  if (f.type==='Boolean') return `            <FormCheckbox accessor='${f.name}' label='${label}' />`
  if (f.type==='Int' || f.type==='Float' || f.type==='Decimal') return `            <FormInput accessor='${f.name}' label='${label}' numeric />`
  const type = f.name.toLowerCase().includes('email') ? 'email' : 'text'
  return `            <FormInput accessor='${f.name}' label='${label}' type='${type}' />`
}).join('\n')}
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

      filesToWrite.push({ filePath: path.join(baseTarget, "create", "page.tsx"), content: createContent })

      // edit page (server) renders client form component
      const editContent = `// generated by shadpanel CLI
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
      import { Form, FormInput, FormCheckbox, FormSection, FormGrid, Button } from '@/components/ui'
import { toast } from 'sonner'
import { get${pascal}ById, update${pascal} } from '../../actions'

export default function Edit${pascal}Page() {
  const params = useParams()
  const router = useRouter()
  const idParam = params?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialValues, setInitialValues] = useState({
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>`    ${f.name}: ${f.type==='Boolean' ? 'false' : "''"}`).join(',\n')}
  })

  useEffect(() => {
    async function fetchData() {
      if (!idParam) {
        setError('Missing ${singular} id')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const row = await get${pascal}ById(${idIsNumber ? 'Number(idParam as string)' : 'String(idParam)'} as any)
        if (row) {
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>`          ;(initialValues as any).${f.name} = (row as any).${f.name} ?? ${f.type==='Boolean' ? 'false' : "''"}`).join('\n')}
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
      const result = await update${pascal}(${idIsNumber ? 'Number(idParam as string)' : 'String(idParam)'} as any, {
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>`        ${f.name}: values.${f.name} as any`).join(',\n')}
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
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>{
  const label = humanize(f.name)
  if (f.type==='Boolean') return `            <FormCheckbox accessor='${f.name}' label='${label}' />`
  if (f.type==='Int' || f.type==='Float' || f.type==='Decimal') return `            <FormInput accessor='${f.name}' label='${label}' numeric />`
  const type = f.name.toLowerCase().includes('email') ? 'email' : 'text'
  return `            <FormInput accessor='${f.name}' label='${label}' type='${type}' />`
}).join('\n')}
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

      // shared client form component
  const formContent = `// generated by shadpanel CLI
'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Form, FormInput, FormCheckbox, FormDatePicker, FormSelect } from '@/components/ui/form-builder'

interface ${pascal}FormProps {
  mode: 'create' | 'edit'
  id?: string
  initialValues?: any
}

export function ${pascal}Form({ mode, id, initialValues = {} }: ${pascal}FormProps) {
  const router = useRouter()

  async function onSubmit(values: any) {
    const url = mode === 'create' ? '/api/${folderName}' : '/api/${folderName}/' + id
    const method = mode === 'create' ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      router.push('/admin/dashboard/${folderName}')
    } else {
      const text = await res.text()
      alert('Failed to save: ' + text)
    }
  }

  return (
    <Form initialValues={initialValues} onSubmit={onSubmit}>
${fields.filter(f=>!f.isId && !f.isRelation).map(f=>{
  const label = humanize(f.name)
  if (f.isEnum) {
    return `      <FormSelect accessor="${f.name}" label="${label}" options={[${(enums[f.type]||[]).map(v=>`{ label: '${v}', value: '${v}' }`).join(', ')}]} />`
  }
  if (f.type === 'Boolean') {
    return `      <FormCheckbox accessor="${f.name}" label="${label}" />`
  }
  if (f.type === 'DateTime') {
    return `      <FormDatePicker accessor="${f.name}" label="${label}" />`
  }
  if (f.type === 'Int' || f.type === 'Float' || f.type === 'Decimal') {
    return `      <FormInput accessor="${f.name}" label="${label}" numeric />`
  }
  const type = f.name.toLowerCase().includes('email') ? 'email' : 'text'
  return `      <FormInput accessor="${f.name}" label="${label}" type="${type}" />`
}).join('\n')}
    </Form>
  )
}
`

      filesToWrite.push({ filePath: path.join(baseTarget, "edit", "[id]", "page.tsx"), content: editContent })

      // no extra types, shared form file, or API routes to keep parity with users

      // Prepare file writes
      const created: string[] = []
      for (const f of filesToWrite) {
        const exists = await fs.pathExists(f.filePath)
        if (exists && !options.force) {
          logger.error(`File exists: ${f.filePath} (use --force to overwrite)`)
          process.exit(4)
        }

        if (options.dryRun) {
          logger.info(`Would write: ${f.filePath}`)
        } else {
          await fs.ensureDir(path.dirname(f.filePath))
          await fs.writeFile(f.filePath, f.content, "utf-8")
          created.push(f.filePath)
        }
      }

      // Update menu unless skipped
      if (!options.skipMenu) {
        const menuPath = path.join(projectPath, "config", "menu.ts")
        const importLine = `import { Users } from 'lucide-react'\n` // keep simple; may duplicate
        let menuUpdated = false
        if (await fs.pathExists(menuPath)) {
          let menuContent = await fs.readFile(menuPath, "utf-8")
          if (!/Users/.test(menuContent)) {
            // add import (naive)
            menuContent = importLine + menuContent
          }
          // Insert menu item under navMain first group items if possible
          menuContent = menuContent.replace(/(navMain: \[\s*\{[\s\S]*?items:\s*\[)/, `$1\n    { title: "${humanize(plural)}", url: "/admin/dashboard/${folderName}", icon: Users },`)
          await fs.writeFile(menuPath, menuContent, "utf-8")
          menuUpdated = true
        } else {
          // Create a minimal menu.ts
          const content = `import { LucideIcon, Users } from 'lucide-react'\n\nexport const defaultMenuConfig = { navMain: [ { title: 'Content', items: [ { title: '${humanize(plural)}', url: '/admin/dashboard/${folderName}', icon: Users } ] } ] }\n`
          await fs.ensureDir(path.dirname(menuPath))
          await fs.writeFile(menuPath, content, "utf-8")
          menuUpdated = true
        }
        if (menuUpdated && !options.dryRun) created.push(menuPath)
      }

      // Print concise summary
      if (options.dryRun) {
        logger.info('Dry run complete. No files were written.')
      } else {
        // Output only created/updated file paths as final output
        created.forEach((p) => console.log(p))
      }
    })

  return cmd
}

export default resourceCommand
