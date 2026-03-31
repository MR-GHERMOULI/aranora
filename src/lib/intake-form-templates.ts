import { IntakeFormField } from "@/types";

/**
 * Pre-built intake form templates for common freelance services.
 * These are pure data — no server dependency — so they can be imported
 * by both server and client components.
 */
export function getFormTemplates(): { name: string; description: string; fields: IntakeFormField[]; settings: Record<string, any> }[] {
    return [
        {
            name: "✨ Start from Scratch",
            description: "Build a completely custom form from the ground up tailored to your specific needs.",
            settings: { welcomeMessage: "Welcome! Please fill out the form below.", thankYouMessage: "Thank you for your submission!", collectPhone: false, collectCompany: false },
            fields: []
        },
        {
            name: "🎨 Web Design Request",
            description: "Collect all the details needed for a web design project — from brand identity to technical requirements.",
            settings: { welcomeMessage: "Tell us about your web design vision!", thankYouMessage: "Thank you! We'll review your project details and get back to you within 24 hours.", collectPhone: true, collectCompany: true },
            fields: [
                { id: "t1", type: "section_header", label: "Project Overview", required: false, helpText: "Help us understand the big picture" },
                { id: "t2", type: "select", label: "Project Type", required: true, options: ["New Website", "Website Redesign", "Landing Page", "E-commerce Store", "Web Application", "Other"], placeholder: "Select project type" },
                { id: "t3", type: "textarea", label: "Project Description", required: true, placeholder: "Describe your project, goals, and what you'd like to achieve...", helpText: "The more detail you provide, the better we can help" },
                { id: "t4", type: "text", label: "Target Audience", required: true, placeholder: "e.g. Small business owners aged 25-45" },
                { id: "t5", type: "section_header", label: "Design Preferences", required: false },
                { id: "t6", type: "multiselect", label: "Design Style", required: false, options: ["Modern & Minimal", "Bold & Colorful", "Corporate & Professional", "Creative & Artistic", "Dark & Elegant", "Warm & Friendly"] },
                { id: "t7", type: "textarea", label: "Reference Websites", required: false, placeholder: "Share URLs of websites you like and explain what you admire about them", helpText: "This helps us understand your taste" },
                { id: "t8", type: "text", label: "Brand Colors (if any)", required: false, placeholder: "e.g. #2563EB, Navy Blue, Gold" },
                { id: "t9", type: "section_header", label: "Technical Details", required: false },
                { id: "t10", type: "number", label: "Estimated Number of Pages", required: false, placeholder: "e.g. 5" },
                { id: "t11", type: "select", label: "Content Readiness", required: true, options: ["All content is ready", "Content is partially ready", "I need help with content", "I'm not sure yet"] },
                { id: "t12", type: "multiselect", label: "Required Features", required: false, options: ["Contact Form", "Blog", "Online Store", "User Accounts", "Search Functionality", "Multilingual", "Analytics Integration", "Email Newsletter", "Social Media Integration", "Custom Animations"] },
                { id: "t13", type: "section_header", label: "Timeline & Budget", required: false },
                { id: "t14", type: "budget_range", label: "Budget Range", required: true, helpText: "This helps us propose the right scope" },
                { id: "t15", type: "date", label: "Desired Launch Date", required: false },
                { id: "t16", type: "textarea", label: "Additional Notes", required: false, placeholder: "Anything else you'd like us to know?" },
            ]
        },
        {
            name: "📱 App Development Brief",
            description: "Gather comprehensive requirements for mobile or web application development projects.",
            settings: { welcomeMessage: "Let's bring your app idea to life!", thankYouMessage: "We've received your brief. Our team will analyze your requirements and schedule a consultation.", collectPhone: true, collectCompany: true },
            fields: [
                { id: "a1", type: "section_header", label: "App Overview", required: false },
                { id: "a2", type: "text", label: "App Name / Working Title", required: true, placeholder: "e.g. FitTracker Pro" },
                { id: "a3", type: "textarea", label: "App Description", required: true, placeholder: "Describe what your app does, the problem it solves, and who it's for..." },
                { id: "a4", type: "multiselect", label: "Target Platforms", required: true, options: ["iOS (iPhone)", "iOS (iPad)", "Android", "Web App", "Desktop (Windows)", "Desktop (Mac)"] },
                { id: "a5", type: "section_header", label: "Features & Functionality", required: false },
                { id: "a6", type: "multiselect", label: "Core Features", required: true, options: ["User Authentication", "Push Notifications", "In-App Payments", "Chat / Messaging", "Social Sharing", "GPS / Maps", "Camera / Media", "Offline Mode", "Admin Dashboard", "Analytics", "API Integrations", "Real-time Updates"] },
                { id: "a7", type: "textarea", label: "Key User Flows", required: false, placeholder: "Describe the main journeys a user would take in the app...", helpText: "e.g. User signs up → Creates profile → Browses products → Makes purchase" },
                { id: "a8", type: "textarea", label: "Third-Party Integrations", required: false, placeholder: "e.g. Stripe for payments, Google Maps, Firebase..." },
                { id: "a9", type: "section_header", label: "Design & UX", required: false },
                { id: "a10", type: "select", label: "Design Status", required: true, options: ["No designs yet — need everything", "Have wireframes", "Have full designs (Figma/Sketch)", "Have a prototype", "Redesigning an existing app"] },
                { id: "a11", type: "textarea", label: "Competitor Apps", required: false, placeholder: "List similar apps and what you'd do differently..." },
                { id: "a12", type: "section_header", label: "Project Details", required: false },
                { id: "a13", type: "budget_range", label: "Budget Range", required: true },
                { id: "a14", type: "date", label: "Target Launch Date", required: false },
                { id: "a15", type: "select", label: "Project Urgency", required: true, options: ["Flexible — no rush", "Moderate — within 3 months", "Urgent — within 1 month", "ASAP — top priority"] },
            ]
        },
        {
            name: "✍️ Content & Copywriting",
            description: "Perfect for writers and content creators — collect content briefs with tone, audience, and specifications.",
            settings: { welcomeMessage: "Help us craft the perfect content for you!", thankYouMessage: "Your brief has been received. We'll review it and send you a proposal shortly.", collectPhone: false, collectCompany: true },
            fields: [
                { id: "c1", type: "section_header", label: "Content Overview", required: false },
                { id: "c2", type: "select", label: "Content Type", required: true, options: ["Website Copy", "Blog Articles", "Social Media Content", "Email Newsletter", "Product Descriptions", "Case Studies", "White Papers", "Press Release", "Video Script", "Ad Copy", "Other"] },
                { id: "c3", type: "number", label: "Number of Pieces", required: true, placeholder: "e.g. 5" },
                { id: "c4", type: "textarea", label: "Project Description", required: true, placeholder: "What content do you need and what goals should it achieve?" },
                { id: "c5", type: "section_header", label: "Brand Voice & Audience", required: false },
                { id: "c6", type: "select", label: "Tone of Voice", required: true, options: ["Professional & Formal", "Friendly & Conversational", "Bold & Energetic", "Calm & Reassuring", "Witty & Humorous", "Technical & Authoritative", "Inspirational & Motivating"] },
                { id: "c7", type: "text", label: "Target Audience", required: true, placeholder: "e.g. B2B SaaS decision makers, ages 30-50" },
                { id: "c8", type: "textarea", label: "Key Messages / Topics", required: false, placeholder: "What are the main messages or topics to cover?" },
                { id: "c9", type: "text", label: "Keywords / SEO Focus", required: false, placeholder: "List any target keywords for SEO" },
                { id: "c10", type: "section_header", label: "Specifications", required: false },
                { id: "c11", type: "select", label: "Word Count Range", required: false, options: ["Under 300 words", "300-500 words", "500-1000 words", "1000-2000 words", "2000+ words", "Not sure — advise me"] },
                { id: "c12", type: "textarea", label: "Reference Links", required: false, placeholder: "Share any reference articles, brands, or styles you like..." },
                { id: "c13", type: "budget_range", label: "Budget", required: true },
                { id: "c14", type: "date", label: "Deadline", required: true },
            ]
        },
        {
            name: "📸 Photography & Video",
            description: "Collect shoot details, locations, style references, and deliverable expectations from clients.",
            settings: { welcomeMessage: "Let's plan something visual and stunning!", thankYouMessage: "Your request has been submitted! We'll reach out to discuss the details and confirm availability.", collectPhone: true, collectCompany: false },
            fields: [
                { id: "p1", type: "section_header", label: "Project Details", required: false },
                { id: "p2", type: "select", label: "Service Type", required: true, options: ["Photography", "Videography", "Both Photography & Video", "Drone / Aerial", "Photo Editing / Retouching", "Video Editing"] },
                { id: "p3", type: "select", label: "Category", required: true, options: ["Wedding / Engagement", "Corporate / Business", "Product Photography", "Real Estate", "Portrait / Headshots", "Event Coverage", "Fashion / Editorial", "Food & Restaurant", "Social Media Content", "Commercial / Ad Campaign", "Other"] },
                { id: "p4", type: "textarea", label: "Project Description", required: true, placeholder: "Describe the shoot, the vibe you're looking for, and any special requirements..." },
                { id: "p5", type: "section_header", label: "Logistics", required: false },
                { id: "p6", type: "date", label: "Preferred Date", required: true },
                { id: "p7", type: "text", label: "Location", required: true, placeholder: "Full address or venue name" },
                { id: "p8", type: "select", label: "Duration", required: true, options: ["1-2 hours", "Half day (3-4 hours)", "Full day (6-8 hours)", "Multi-day", "Not sure yet"] },
                { id: "p9", type: "section_header", label: "Style & Deliverables", required: false },
                { id: "p10", type: "textarea", label: "Style References", required: false, placeholder: "Share links to photos/videos or describe the style you'd like...", helpText: "Pinterest boards, Instagram profiles, or specific images work great" },
                { id: "p11", type: "multiselect", label: "Deliverables Needed", required: true, options: ["High-res edited photos", "Raw/unedited files", "Edited video (short-form)", "Edited video (long-form)", "Social media cuts", "Photo prints", "Online gallery", "Behind-the-scenes content"] },
                { id: "p12", type: "budget_range", label: "Budget Range", required: true },
                { id: "p13", type: "textarea", label: "Additional Notes", required: false, placeholder: "Any other details or special requests?" },
            ]
        },
        {
            name: "🔧 General Service Request",
            description: "A versatile intake form for any type of freelance service — consulting, design, development, or more.",
            settings: { welcomeMessage: "Tell us how we can help!", thankYouMessage: "Thank you for reaching out! We'll review your request and respond within 1-2 business days.", collectPhone: true, collectCompany: true },
            fields: [
                { id: "g1", type: "section_header", label: "About Your Request", required: false },
                { id: "g2", type: "text", label: "Service You're Looking For", required: true, placeholder: "e.g. Logo Design, SEO Optimization, Business Consulting..." },
                { id: "g3", type: "textarea", label: "Project Description", required: true, placeholder: "Describe your project, goals, and what you need help with...", helpText: "Be as detailed as possible — it helps us provide an accurate proposal" },
                { id: "g4", type: "select", label: "Project Type", required: true, options: ["One-time project", "Ongoing / Retainer", "Consultation", "Not sure yet"] },
                { id: "g5", type: "section_header", label: "Requirements", required: false },
                { id: "g6", type: "textarea", label: "Specific Requirements", required: false, placeholder: "List any must-haves, technical requirements, or constraints..." },
                { id: "g7", type: "textarea", label: "Inspiration / References", required: false, placeholder: "Share links to examples, competitors, or work you admire..." },
                { id: "g8", type: "select", label: "How Soon Do You Need This?", required: true, options: ["No rush — flexible timeline", "Within 2-4 weeks", "Within 1-2 weeks", "Urgent — ASAP", "Just exploring options"] },
                { id: "g9", type: "section_header", label: "Budget & Next Steps", required: false },
                { id: "g10", type: "budget_range", label: "Budget Range", required: true },
                { id: "g11", type: "select", label: "How Did You Find Us?", required: false, options: ["Google Search", "Social Media", "Referral", "Portfolio / Website", "Previous Client", "Other"] },
                { id: "g12", type: "textarea", label: "Anything Else?", required: false, placeholder: "Questions, concerns, or other notes..." },
            ]
        }
    ];
}
