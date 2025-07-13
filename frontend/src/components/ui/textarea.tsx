interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea 
      className={`w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${className}`}
      {...props}
    />
  )
}