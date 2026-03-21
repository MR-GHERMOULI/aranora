import { ArticleEditor } from "@/components/admin/article-editor"

export default function NewArticlePage() {
    const emptyArticle = {
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        cover_image: "",
        author_name: "Aranora Team",
        status: "draft",
        tags: [],
        meta_description: "",
    }

    return <ArticleEditor initialData={emptyArticle} isNew={true} />
}
