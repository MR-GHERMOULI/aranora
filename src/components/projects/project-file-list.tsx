"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { addProjectFileRecord, deleteProjectFile } from "@/app/(dashboard)/projects/file-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { File, Upload, Trash2, Download, Loader2, FileText, FileImage, FileArchive } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface ProjectFile {
    id: string
    file_name: string
    file_url: string
    file_size: number
    file_type: string
    storage_path?: string
    created_at: string
}

interface ProjectFileListProps {
    files: ProjectFile[]
    projectId: string
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(type: string) {
    if (type?.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />
    if (type?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (type?.includes('zip') || type?.includes('rar') || type?.includes('archive')) return <FileArchive className="h-5 w-5 text-yellow-500" />
    return <File className="h-5 w-5 text-gray-500" />
}

export function ProjectFileList({ files, projectId }: ProjectFileListProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type.startsWith('video/')) {
            toast.error("Video uploads are not allowed")
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setIsUploading(true)
        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const storagePath = `${projectId}/${Date.now()}-${file.name}`

            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(storagePath, file)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                toast.error("Failed to upload file: " + uploadError.message)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(storagePath)

            await addProjectFileRecord({
                projectId,
                fileName: file.name,
                fileUrl: publicUrl,
                fileSize: file.size,
                fileType: file.type,
                storagePath,
            })

            toast.success("File uploaded successfully")
            router.refresh()
        } catch (err) {
            console.error(err)
            toast.error("Failed to upload file")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleDelete = async (file: ProjectFile) => {
        if (!confirm(`Delete "${file.file_name}"?`)) return
        setDeletingId(file.id)
        try {
            await deleteProjectFile(file.id, file.storage_path || `${projectId}/${file.file_name}`)
            toast.success("File deleted")
            router.refresh()
        } catch {
            toast.error("Failed to delete file")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <File className="h-4 w-4" /> Files
                    </CardTitle>
                    <CardDescription>Upload and manage project documents.</CardDescription>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleUpload}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload File"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {files.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No files uploaded yet. Click "Upload File" to add documents.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                                <div className="shrink-0">
                                    {getFileIcon(file.file_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(file.file_size)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">·</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(file.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        asChild
                                    >
                                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(file)}
                                        disabled={deletingId === file.id}
                                    >
                                        {deletingId === file.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
