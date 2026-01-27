"use client"

import { useState, useEffect } from "react"
import { Search as SearchIcon, Loader2, User, Briefcase, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { globalSearch, SearchResult } from "@/app/(dashboard)/search-action"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useDebounce } from "../../hooks/use-debounce"

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const debouncedQuery = useDebounce(query, 300)

    useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const searchResults = await globalSearch(debouncedQuery)
                setResults(searchResults)
            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    const handleSelect = (href: string) => {
        setOpen(false)
        setQuery("")
        router.push(href)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="px-3 mb-6 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition">
                        <SearchIcon className="h-4 w-4" />
                        <span className="text-sm">Search...</span>
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
                <div className="flex items-center border-b px-3">
                    <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search clients, projects, invoices..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {query.length > 0 && results.length === 0 && !loading && (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            No results found for "{query}"
                        </p>
                    )}
                    {results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result.href)}
                                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition"
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full 
                                        ${result.type === 'client' ? 'bg-blue-100 text-blue-600' :
                                            result.type === 'project' ? 'bg-pink-100 text-pink-600' :
                                                'bg-orange-100 text-orange-600'}`}>
                                        {result.type === 'client' && <User className="h-4 w-4" />}
                                        {result.type === 'project' && <Briefcase className="h-4 w-4" />}
                                        {result.type === 'invoice' && <FileText className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{result.title}</span>
                                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {query.length === 0 && (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            Start typing to search...
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
