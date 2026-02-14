"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { addProjectFileRecord, deleteProjectFile } from "@/app/(dashboard)/projects/file-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const pathname = usePathname()

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
                pathToRevalidate: pathname,
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

    const handleDownload = async (file: ProjectFile) => {
        setDownloadingId(file.id)
        try {
            const supabase = createClient()
            const storagePath = file.storage_path || `${projectId}/${file.file_name}`

            const { data, error } = await supabase.storage
                .from('project-files')
                .createSignedUrl(storagePath, 60, {
                    download: true,
                })

            if (error) throw error

            const link = document.createElement('a')
            link.href = data.signedUrl
            link.setAttribute('download', file.file_name)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            console.error('Download error:', err)
            toast.error("Failed to download file")
        } finally {
            setDownloadingId(null)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, file: ProjectFile) => {
        e.stopPropagation()
        setFileToDelete(file)
    }

    const confirmDelete = async () => {
        if (!fileToDelete) return

        setIsDeleting(true)
        try {
            await deleteProjectFile(
                fileToDelete.id,
                fileToDelete.storage_path || `${projectId}/${fileToDelete.file_name}`,
                pathname
            )
            toast.success("File deleted")
            router.refresh()
            setFileToDelete(null)
        } catch {
            toast.error("Failed to delete file")
        } finally {
            setIsDeleting(false)
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
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleDownload(file)}
                                        disabled={downloadingId === file.id}
                                    >
                                        {downloadingId === file.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => handleDeleteClick(e, file)}
                                        disabled={isDeleting || downloadingId === file.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete File</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{fileToDelete?.file_name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFileToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete File"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
