'use client'

import * as React from 'react'

interface UseTableStateOptions {
  defaultSortKey?: string
  defaultSortDir?: 'asc' | 'desc'
  pageSize?: number
}

interface UseTableStateReturn {
  page:             number
  setPage:          (page: number) => void
  sortKey:          string
  sortDir:          'asc' | 'desc'
  handleSort:       (key: string, dir: 'asc' | 'desc') => void
  selectedIds:      string[]
  toggleSelect:     (id: string) => void
  toggleSelectAll:  (ids: string[]) => void
  clearSelection:   () => void
  editingRowId:     string | null
  startEdit:        (id: string) => void
  cancelEdit:       () => void
  searchQuery:      string
  setSearchQuery:   (q: string) => void
}

/** Manages common table state — sort, page, selection, quick edit, and search. */
export function useTableState<T>({
  defaultSortKey = '',
  defaultSortDir = 'asc',
  pageSize: _pageSize = 20,
}: UseTableStateOptions = {}): UseTableStateReturn {
  const [page,         setPage]         = React.useState(1)
  const [sortKey,      setSortKey]      = React.useState(defaultSortKey)
  const [sortDir,      setSortDir]      = React.useState<'asc' | 'desc'>(defaultSortDir)
  const [selectedIds,  setSelectedIds]  = React.useState<string[]>([])
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null)
  const [searchQuery,  setSearchQuery]  = React.useState('')

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSortKey(key)
    setSortDir(dir)
    setPage(1)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds(prev =>
      ids.every(id => prev.includes(id))
        ? prev.filter(id => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    )
  }

  function clearSelection() { setSelectedIds([]) }
  function startEdit(id: string) { setEditingRowId(id) }
  function cancelEdit() { setEditingRowId(null) }

  return {
    page, setPage,
    sortKey, sortDir, handleSort,
    selectedIds, toggleSelect, toggleSelectAll, clearSelection,
    editingRowId, startEdit, cancelEdit,
    searchQuery, setSearchQuery,
  }
}
