interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input 
      className={`w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
      {...props}
    />
  )
}