import { createClient } from "@/lib/supabase/server";
import { PricingPageData, PricingPageClientWrap } from "./pricing-client";

export default async function PricingPage() {
    const supabase = await createClient();

    const { data: pricingSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "pricing_page")
        .single();

    const defaultData: PricingPageData = {
        hero_title: "Simple, transparent pricing",
        hero_subtitle: "Start with your first month free. No credit card required. Upgrade when you're ready to take your freelance business to the next level.",
        monthly_price: 19,
        annual_price: 190,
        features: [
            'Unlimited projects & clients',
            'Smart invoicing & contracts',
            'E-signatures & PDF generation',
            'Time tracking & reports',
            'Team collaboration',
            'Calendar & task management',
            'Client intake forms',
            'File management',
            'Client portal with progress sharing',
            'Priority support',
        ],
        faqs: [
            {
                question: "What is included in the 30-day free trial?",
                answer: "You get full, unrestricted access to all default features of Aranora during your trial. This includes unlimited clients, smart invoicing, contract generation, time tracking, and team collaboration."
            },
            {
                question: "Do I need a credit card to sign up for the free trial?",
                answer: "No! We believe you should try before you buy. You can sign up and start managing your freelance business immediately without providing any payment information."
            },
            {
                question: "Can I cancel my subscription at any time?",
                answer: "Absolutely. There are no long-term contracts. You can easily switch between monthly and annual plans, or cancel your subscription directly from your settings at any time without penalties."
            },
            {
                question: "How secure is my data and my clients' data?",
                answer: "Very secure. We use enterprise-grade encryption and industry-standard security protocols to protect all your data, contracts, and invoicing details."
            },
            {
                question: "Can I invite my team or collaborators?",
                answer: "Yes, Aranora is built to scale with you. You can invite team members and assign specific tools, projects, and access permissions seamlessly."
            }
        ]
    };

    const content: PricingPageData = pricingSetting?.value
        ? { ...defaultData, ...(pricingSetting.value as Partial<PricingPageData>) }
        : defaultData;

    return <PricingPageClientWrap data={content} />;
}
