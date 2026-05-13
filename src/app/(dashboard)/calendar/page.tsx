import { getCalendarEvents } from "./actions";
import { getTasks } from "@/app/(dashboard)/tasks/actions";
import { getProjects } from "@/app/(dashboard)/projects/actions";
import { CalendarClient } from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
    const [tasks, events, projects] = await Promise.all([
        getTasks(),
        getCalendarEvents(),
        getProjects(),
    ]);

    return (
        <CalendarClient
            events={events}
            tasks={tasks}
            projects={projects}
        />
    );
}
