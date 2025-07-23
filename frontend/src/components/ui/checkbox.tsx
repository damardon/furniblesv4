import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  label?: string
  description?: string
  disabled?: boolean
  id?: string
}

export function Checkbox({ 
  checked, 
  onCheckedChange, 
  className,
  label,
  description,
  disabled = false,
  id
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

  if (label || description) {
    return (
      <div className={cn("flex items-start space-x-3", className)}>
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={disabled}
            className={cn(
              "w-4 h-4 rounded border-2 border-gray-300 text-sabda-primary",
              "focus:ring-2 focus:ring-sabda-primary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200",
              checked && "bg-sabda-primary border-sabda-primary",
              "hover:border-gray-400 focus:border-sabda-primary"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          {label && (
            <label 
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium text-gray-900 cursor-pointer",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              "text-sm text-gray-600 mt-1",
              disabled && "opacity-50"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Checkbox simple sin label
  return (
    <input
      id={checkboxId}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={cn(
        "w-4 h-4 rounded border-2 border-gray-300 text-sabda-primary",
        "focus:ring-2 focus:ring-sabda-primary focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors duration-200",
        checked && "bg-sabda-primary border-sabda-primary",
        "hover:border-gray-400 focus:border-sabda-primary",
        className
      )}
    />
  )
}