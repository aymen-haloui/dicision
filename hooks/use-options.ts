import { useState, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

function normalizeOptions(data: unknown): Option[] {
  if (Array.isArray(data)) {
    return data.filter(
      (item): item is Option =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as Option).value === 'string' &&
        typeof (item as Option).label === 'string'
    )
  }
  return []
}

export function useOptions(category: string): Option[] {
  const [options, setOptions] = useState<Option[]>([])

  useEffect(() => {
    let cancelled = false

    fetch(`/api/options/${category}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          console.error(`Failed to fetch options for "${category}":`, data)
          return []
        }
        return normalizeOptions(data)
      })
      .then(data => {
        if (!cancelled) setOptions(data)
      })
      .catch(err => {
        console.error(`Failed to fetch options for "${category}":`, err)
        if (!cancelled) setOptions([])
      })

    return () => {
      cancelled = true
    }
  }, [category])

  return options
}