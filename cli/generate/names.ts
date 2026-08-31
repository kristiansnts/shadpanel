export function pascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (m) => m.toUpperCase())
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase()
}

export function singularize(name: string): string {
  if (name.endsWith("s") && name.length > 1) return name.slice(0, -1)
  return name
}

export function pluralize(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith("s")) return lower
  return `${lower}s`
}

export function humanize(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase())
}

export function prismaDelegate(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}
