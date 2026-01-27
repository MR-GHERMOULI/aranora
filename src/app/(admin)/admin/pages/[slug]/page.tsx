import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PageEditor } from "./page-editor"

interface PageEditorPageProps {
    params: Promise<{ slug: string }>
}

export default async function PageEditorPage({ params }: PageEditorPageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch page data
    const { data: page } = await supabase
        .from("static_pages")
        .select("*")
        .eq("slug", slug)
        .single()

    // Fetch revisions
    const { data: revisions } = await supabase
        .from("page_revisions")
        .select("id, title, content, created_at, edited_by")
        .eq("page_id", page?.id || "")
        .order("created_at", { ascending: false })
        .limit(10)

    // Define page titles
    const pageTitles: Record<string, { title: string; titleAr: string }> = {
        about: { title: "About Us", titleAr: "من نحن" },
        privacy: { title: "Privacy Policy", titleAr: "سياسة الخصوصية" },
        terms: { title: "Terms of Service", titleAr: "شروط الخدمة" },
        faq: { title: "FAQ", titleAr: "الأسئلة الشائعة" },
        contact: { title: "Contact Us", titleAr: "اتصل بنا" },
    }

    if (!pageTitles[slug]) {
        notFound()
    }

    return (
        <PageEditor
            slug={slug}
            initialData={{
                id: page?.id,
                title: page?.title || pageTitles[slug].title,
                titleAr: page?.title_ar || pageTitles[slug].titleAr,
                content: page?.content || "",
                contentAr: page?.content_ar || "",
                contactInfo: page?.contact_info || {},
                metaDescription: page?.meta_description || "",
            }}
            revisions={revisions || []}
        />
    )
}
