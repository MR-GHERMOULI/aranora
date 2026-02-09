import { getProject } from "../get-project-action";
import { notFound, redirect } from "next/navigation";

export default async function ProjectIdPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    // Resolve params for Next.js 15+
    const { id } = await params;

    const project = await getProject(id);

    if (!project) {
        notFound();
    }

    // Redirect to the full URL with slug
    redirect(`/projects/${id}/${project.slug}`);
}
