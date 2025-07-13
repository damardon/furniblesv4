// src/components/ui/table.tsx (Versión simplificada)
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ className, children }: { className?: string, children: React.ReactNode }) {
  return <tr className={className}>{children}</tr>
}

export function TableHead({ className, children }: { className?: string, children: React.ReactNode }) {
  return <th className={`p-3 text-left border-b-2 border-black ${className}`}>{children}</th>
}

export function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="p-3 border-b border-gray-200">{children}</td>
}
