import { getProjects } from "./actions";
import { getClients } from "@/app/(dashboard)/clients/actions";
import { ProjectsClient } from "@/components/projects/projects-client";

export default async function ProjectsPage() {
    const [projects, clients] = await Promise.all([
        getProjects(),
        getClients(),
    ]);

    return <ProjectsClient projects={projects} clients={clients} />;
}
