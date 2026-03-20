import { useCallback, useEffect, useState } from "react"

interface DebouncedSearchOptions {
  debounceMs?: number
}

export const useDebouncedSearch = (
  valueFromOutside: string,
  onCommit: (value: string) => void,
  { debounceMs = 500 }: DebouncedSearchOptions = {}
) => {
  const [localValue, setLocalValue] = useState(valueFromOutside)
  const [prevExternal, setPrevExternal] = useState(valueFromOutside)

  if (prevExternal !== valueFromOutside) {
    setPrevExternal(valueFromOutside)
    setLocalValue(valueFromOutside)
  }

  const isUserChange = localValue !== valueFromOutside

  useEffect(() => {
    if (!isUserChange) return

    const trimmed = localValue.trim()

    if (trimmed === "") {
      onCommit("")
      return
    }

    const timer = setTimeout(() => {
      onCommit(trimmed)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, isUserChange, debounceMs, onCommit])

  const clear = useCallback(() => {
    setLocalValue("")
    onCommit("")
  }, [onCommit])

  return {
    value: localValue,
    onChange: setLocalValue,
    clear,
  }
}
