import { isDirectory2, isFile2 } from 'common/filesystem'

export const MAX_RECENTLY_USED_DOCUMENTS = 12

/** Recently used paths, kept as separate lists so menus can group folders and files. */
export interface RecentlyUsedDocuments {
  files: string[]
  directories: string[]
}

/**
 * Move `pathname` to the front of `list`, capping length at `max`.
 * Returns whether the list content changed.
 */
export const prependRecentPath = (
  list: string[],
  pathname: string,
  max: number
): boolean => {
  const index = list.indexOf(pathname)
  if (index === 0 && list.length <= max) {
    return false
  }
  if (index > 0) {
    list.splice(index, 1)
  }
  if (index !== 0) {
    list.unshift(pathname)
  }
  if (list.length > max) {
    list.splice(max, list.length - max)
  }
  return true
}

const trimRecentList = (list: string[]): string[] => {
  const filtered = list.filter((f) => f && (isFile2(f) || isDirectory2(f)))
  if (filtered.length > MAX_RECENTLY_USED_DOCUMENTS) {
    filtered.splice(
      MAX_RECENTLY_USED_DOCUMENTS,
      filtered.length - MAX_RECENTLY_USED_DOCUMENTS
    )
  }
  return filtered
}

/**
 * Accept both the current `{ files, directories }` shape and the legacy flat
 * `string[]`. `migrated` is true when the on-disk format should be rewritten.
 */
export const normalizeRecentlyUsedDocuments = (
  raw: unknown
): { documents: RecentlyUsedDocuments; migrated: boolean } => {
  if (Array.isArray(raw)) {
    const files: string[] = []
    const directories: string[] = []
    for (const item of raw) {
      if (typeof item !== 'string' || !item) continue
      if (isDirectory2(item)) {
        directories.push(item)
      } else if (isFile2(item)) {
        files.push(item)
      }
    }
    return {
      documents: {
        files: trimRecentList(files),
        directories: trimRecentList(directories)
      },
      migrated: true
    }
  }

  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    const files = Array.isArray(record.files)
      ? trimRecentList(record.files.filter((f): f is string => typeof f === 'string'))
      : []
    const directories = Array.isArray(record.directories)
      ? trimRecentList(record.directories.filter((f): f is string => typeof f === 'string'))
      : []
    // Drop paths that no longer match their list (e.g. a file recorded as a directory).
    return {
      documents: {
        files: files.filter((f) => isFile2(f)),
        directories: directories.filter((f) => isDirectory2(f))
      },
      migrated: false
    }
  }

  return { documents: { files: [], directories: [] }, migrated: true }
}
