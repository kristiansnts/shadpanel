/**
 * Generated-app stack pins for NEW apps (ShadPanel 1.5+).
 * Existing 1.4.0 apps are not migrated.
 */
export const GENERATED_NEXT = "^16.0.0"
export const GENERATED_ESLINT_CONFIG_NEXT = "^16.0.0"
export const GENERATED_BETTER_AUTH = "^1.7.2"
export const GENERATED_REACT = "^19.0.0"

export function nextMajor(version: string | undefined): number | null {
  if (!version) return null
  const match = version.match(/(\d+)/)
  return match ? Number(match[1]) : null
}
