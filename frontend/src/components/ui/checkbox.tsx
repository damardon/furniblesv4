// src/components/ui/checkbox.tsx
interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

export function Checkbox({ checked, onCheckedChange, className }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={`w-4 h-4 border-2 border-black ${className}`}
    />
  )
}