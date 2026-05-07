import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const NexusCanvas = dynamic(() => import("@/components/nexus/nexus-canvas").then(mod => mod.NexusCanvas), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-12 w-12 rounded-2xl bg-blue-100" />
        <div className="h-4 w-32 rounded-full bg-gray-200" />
      </div>
    </div>
  )
});
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

  return <NexusCanvas projects={projects || []} userId={user.id} />;
}
