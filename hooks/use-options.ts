import { useState, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

export function useOptions(category: string): Option[] {
  const [options, setOptions] = useState<Option[]>([])

  useEffect(() => {
    fetch(`/api/options/${category}`)
      .then(res => res.json())
      .then(setOptions)
      .catch(err => console.error('Failed to fetch options:', err))
  }, [category])

  return options
}