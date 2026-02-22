import { redirect } from "next/navigation";

export default function TeamSettingsPage() {
    // Redirect to the modern workspaces page
    redirect('/teams');
}
