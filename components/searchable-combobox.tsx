'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface ComboboxOption {
  value: string
  label: string
}

interface SearchableComboboxProps {
  id: string
  label: string
  value: string
  options: ComboboxOption[]
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  allowCustomValue?: boolean
}

export function SearchableCombobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Rechercher...',
  required = false,
  disabled = false,
  allowCustomValue = false,
}: SearchableComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setQuery(options.find(option => option.value === value)?.label ?? value)
  }, [options, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 12)
    return options
      .filter(
        o =>
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q)
      )
      .slice(0, 12)
  }, [options, query])

  return (
    <div className="flex flex-col gap-1 relative">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full"
        onChange={e => {
          setQuery(e.target.value)
          if (allowCustomValue) {
            onChange(e.target.value)
          } else if (value) {
            onChange('')
          }
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false)
            if (!allowCustomValue) {
              const selected = options.find(option => option.value === value)
              setQuery(selected?.label ?? '')
            }
          }, 150)
        }}
        autoComplete="off"
        required={required}
      />
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          Aucune option existante
        </div>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.map(option => (
            <li key={option.value}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                onMouseDown={e => {
                  e.preventDefault()
                  setQuery(option.label)
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
