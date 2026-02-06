"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportCSVButtonProps {
    data: any[]
    filename: string
}

export function ExportCSVButton({ data, filename }: ExportCSVButtonProps) {
    const handleExport = () => {
        if (data.length === 0) {
            alert("No data to export")
            return
        }

        // Get headers from first object
        const headers = Object.keys(data[0])

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header]
                    // Handle values that might contain commas or quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`
                    }
                    return value
                }).join(',')
            )
        ].join('\n')

        // Create and download blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    )
}
