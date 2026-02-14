'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getProjectFiles(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project files:', error);
        return [];
    }

    return data;
}

export async function deleteProjectFile(fileId: string, filePath: string, pathToRevalidate: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath]);

    if (storageError) {
        console.error('Error deleting file from storage:', storageError);
    }

    // Delete from database
    const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting project file:', error);
        throw new Error('Failed to delete file');
    }

    revalidatePath(pathToRevalidate);
}

export async function addProjectFileRecord(data: {
    projectId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    storagePath: string;
    pathToRevalidate: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('project_files')
        .insert({
            user_id: user.id,
            project_id: data.projectId,
            file_name: data.fileName,
            file_url: data.fileUrl,
            file_size: data.fileSize,
            file_type: data.fileType,
            storage_path: data.storagePath,
        });

    if (error) {
        console.error('Error adding file record:', error);
        throw new Error('Failed to save file record');
    }

    revalidatePath(data.pathToRevalidate);
}
