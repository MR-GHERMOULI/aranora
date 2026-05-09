'use client';

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

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

export function NexusWrapper({ projects, userId }: { projects: any[]; userId: string }) {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');
  const initialCanvasName = searchParams.get('name');

  return (
    <NexusCanvas 
      projects={projects} 
      userId={userId} 
      initialProjectId={initialProjectId}
      initialCanvasName={initialCanvasName}
    />
  );
}
