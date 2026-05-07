import { NexusWrapper } from "@/components/nexus/nexus-wrapper";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NexusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch projects for linking generated tasks
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id);

  return <NexusWrapper projects={projects || []} userId={user.id} />;
}
