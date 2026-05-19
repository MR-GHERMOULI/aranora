import {
  Users,
  Briefcase,
  FileText,
  Shield,
  Clock,
  CheckSquare,
  CalendarDays,
  UserPlus,
  FileInput,
  BarChart3,
  LucideIcon
} from "lucide-react";

export interface ToolFeature {
  title: string;
  desc: string;
}

export interface ToolUseCase {
  role: string;
  scenario: string;
}

export interface ToolData {
  slug: string;
  title: string;
  iconName: string;
  shortDesc: string;
  fullDesc: string;
  detailedPoints: string[];
  features: ToolFeature[];
  useCases: ToolUseCase[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
  };
  benefits: string[];
}

export const toolsRegistry: ToolData[] = [
  {
    slug: "client-management",
    title: "Client Management",
    iconName: "Users",
    shortDesc: "A centralized CRM designed specifically for freelancers to organize contacts, track communication histories, and build long-lasting professional relationships.",
    fullDesc: "Managing client relationships shouldn't mean digging through chaotic email chains or scattered notes. Our Client CRM gives independent professionals a unified hub to manage everything about their clients. Track contact details, note communication histories, centralize project files, and maintain clean audit trails of every interaction. Start operating like a fully-fledged enterprise with structured onboarding details, private client notes, and real-time activity indicators.",
    detailedPoints: [
      "Keep all client contact details, timezones, and preferred billing methods in one organized database.",
      "Track every milestone, transaction, and email correspondence without leaving your workspace.",
      "Store private notes and dynamic intake responses to prepare yourself perfectly for every call.",
      "Seamlessly transition prospects from new leads to active accounts with automated onboarding triggers."
    ],
    features: [
      {
        title: "Unified Client Profiles",
        desc: "Access active projects, past invoices, signed contracts, and outstanding balances from a single dashboard."
      },
      {
        title: "Interaction Timelines",
        desc: "Chronologically track email exchanges, deliverables sent, feedback received, and scheduled check-ins."
      },
      {
        title: "Secure Private Notes",
        desc: "Save personal preferences, project guidelines, key constraints, and specific style sheets directly inside the CRM."
      },
      {
        title: "Self-Serve Client Portals",
        desc: "Grant clients clean read-only access to view active milestones, share files, and pay invoices instantly."
      }
    ],
    useCases: [
      {
        role: "Independent Web Designer",
        scenario: "Keeps track of multiple client design guidelines, style directions, and brand assets in dedicated client portals, ensuring that revisions never get lost."
      },
      {
        role: "Freelance Copywriter",
        scenario: "Reviews past messaging logs and client preference notes to maintain a consistent brand tone across campaigns and deliver tailored draft variations."
      }
    ],
    testimonial: {
      quote: "Before using this CRM, my client notes were scattered across notebooks and Google Docs. Now, I have a single point of truth that keeps me looking incredibly professional.",
      author: "Sarah Jenkins",
      role: "Brand Identity Designer"
    },
    benefits: [
      "99% Reduction in lost client project notes",
      "Saves an average of 4 hours of admin work every week",
      "Increases client retention rate through systematic touchpoints",
      "Supports global currency and custom tax settings per client profile"
    ]
  },
  {
    slug: "project-tracking",
    title: "Project Tracking",
    iconName: "Briefcase",
    shortDesc: "Manage and deliver complex projects on schedule with real-time milestones, interactive gantt-style timelines, and progress indicators.",
    fullDesc: "Deliver your freelance work with professional confidence. Our project tracking dashboard is engineered to provide end-to-end visibility into every contract. Define precise project scopes, break milestones down into executable items, track deadlines, and share real-time progress indicators with your clients. Prevent scope creep by housing deliverables and active guidelines in one shared portal that automatically keeps stakeholders aligned.",
    detailedPoints: [
      "Deconstruct massive initiatives into structured phases, milestones, and daily checklist items.",
      "Create client-facing project trackers that demonstrate your value transparently.",
      "Protect your delivery margin by comparing planned scope against active task logs.",
      "Centralize feedback loops directly on active milestones to avoid communication delays."
    ],
    features: [
      {
        title: "Interactive Milestones",
        desc: "Set clear payment-tied milestones so clients know exactly when stages are completed and payments are triggered."
      },
      {
        title: "Client-Facing Portals",
        desc: "Reduce email status inquiries by giving clients a beautiful, clean timeline view of active progress."
      },
      {
        title: "Centralized Resource Vault",
        desc: "Upload project deliverables, brand assets, mockups, and spreadsheets directly to specific phases."
      },
      {
        title: "Scope Creep Defense",
        desc: "Log baseline features and contrast them against new client feature requests to manage budget expansions."
      }
    ],
    useCases: [
      {
        role: "Software Developer",
        scenario: "Presents code milestones and database schema rollouts to client non-technical teams via a clean, high-fidelity visual roadmap."
      },
      {
        role: "Marketing Specialist",
        scenario: "Coordinates multiple social media launch campaigns, displaying live progress indicators and tracking draft asset review stages."
      }
    ],
    testimonial: {
      quote: "Clients constantly compliment me on the project portal. They love seeing real-time progress, and it completely stopped their late-night 'how's it going?' emails.",
      author: "David Chen",
      role: "Full-Stack Engineer"
    },
    benefits: [
      "Eliminates up to 90% of status check-in emails from clients",
      "Boosts on-time project completion rates to over 95%",
      "Provides transparent proof-of-work to expedite milestone payments",
      "Adaptable layouts suitable for agile, waterfall, or retainer-based structures"
    ]
  },
  {
    slug: "smart-invoicing",
    title: "Smart Invoicing",
    iconName: "FileText",
    shortDesc: "Generate beautiful, compliant invoices, automate late payment follow-ups, and get paid faster with secure payment gateway integrations.",
    fullDesc: "Get paid on time, every time. Smart Invoicing combines high-quality PDF invoice generation with payment automations. Hook up your payment processors to accept credit cards, bank transfers, and local payment methods with ease. Avoid uncomfortable conversations by setting up automated reminder campaigns that gently prompt clients about upcoming or overdue payments.",
    detailedPoints: [
      "Create and send professional-grade invoices tailored with your logo and brand colors in seconds.",
      "Connect seamlessly with popular payment processors to accept global credit cards and direct deposits.",
      "Set custom tax rates, multi-currency lines, early payment discounts, and automatic late fees.",
      "Set up recurring retainers that automatically bill clients monthly and notify you upon payment."
    ],
    features: [
      {
        title: "Automated Reminders",
        desc: "Configure automated emails that follow up on pending bills at custom intervals: 3 days before, on the due date, or weekly after."
      },
      {
        title: "Recurring Subscriptions",
        desc: "Perfect for retainers. Automatically generate and mail monthly or quarterly invoices to recurring clients."
      },
      {
        title: "One-Click Quick Pay",
        desc: "Include secure online payment links directly inside your invoice emails for instant credit card settlement."
      },
      {
        title: "Clean Tax Reporting",
        desc: "Export comprehensive spreadsheets compiling standard taxes collected, billings by client, and unpaid invoices."
      }
    ],
    useCases: [
      {
        role: "Creative Consultant",
        scenario: "Bills monthly retainer fees automatically using recurring invoices, leaving billing entirely on autopilot while focusing on project delivery."
      },
      {
        role: "Videographer",
        scenario: "Generates quick multi-part itemized deposit invoices for high-budget productions right from their mobile device on-set."
      }
    ],
    testimonial: {
      quote: "The automated payment reminders are a godsend. My average payment time dropped from 22 days down to just 3. No more chasing late invoices manually!",
      author: "Marcus Aurelius",
      role: "Motion Graphics Designer"
    },
    benefits: [
      "Average invoice settlement time reduced to under 72 hours",
      "Fully automates recurring billing cycles for monthly retainer clients",
      "Seamless support for over 135 global currencies and regional VAT/tax profiles",
      "Clean financial exports compatible with standard accounting software"
    ]
  },
  {
    slug: "contracts-signatures",
    title: "Contracts & E-Signatures",
    iconName: "Shield",
    shortDesc: "Generate legally binding freelance contracts, capture secure digital signatures, and export professional PDFs without leaving your dashboard.",
    fullDesc: "Protect your intellectual property, clarify project scopes, and secure your income with airtight agreements. Our Contracts module eliminates the need for expensive third-party electronic signature tools. Generate comprehensive freelance agreements, customize legal clauses, collect legally binding electronic signatures, and securely archive completed documents inside your workspace. Work with complete peace of mind knowing that every agreement includes detailed audit trails.",
    detailedPoints: [
      "Draft, customize, and issue comprehensive freelance service agreements in less than 5 minutes.",
      "Gather secure, legally binding electronic signatures that are fully compliant with global standards.",
      "Automatically lock project parameters once a contract is signed to prevent modifications.",
      "Maintain a transparent audit trail detailing exact timestamps and IP addresses of signees."
    ],
    features: [
      {
        title: "E-Signature Engine",
        desc: "Fully secure digital signing tools allow clients to review and sign agreements on any desktop or mobile device."
      },
      {
        title: "Smart Placeholders",
        desc: "Insert dynamic placeholders that pull client names, project prices, and start dates directly from your CRM data."
      },
      {
        title: "Legally Secure Templates",
        desc: "Access ready-to-use template outlines for popular creative, technical, and consulting freelance roles."
      },
      {
        title: "Audit Trail Ledger",
        desc: "Each signed contract includes an official audit page documenting email invites, viewings, signatures, and IP addresses."
      }
    ],
    useCases: [
      {
        role: "Freelance Translator",
        scenario: "Issues standard non-disclosure agreements (NDAs) and project terms to new clients, securing sign-offs before translating sensitive materials."
      },
      {
        role: "SEO Strategist",
        scenario: "Protects their ongoing search optimization services with structured annual retainer contracts and clear payment schedules."
      }
    ],
    testimonial: {
      quote: "I used to pay a fortune for digital signature platforms. Having professional contracts and legally binding signatures built right in saves me money and looks highly cohesive.",
      author: "Elena Petrova",
      role: "SEO Specialist"
    },
    benefits: [
      "100% Secure digital signatures fully compliant with modern e-sign directives",
      "Saves up to $40/month by replacing third-party digital signature tools",
      "Ensures zero work begins without an active signed contract in place",
      "Beautiful exportable PDFs with complete audit certificates attached"
    ]
  },
  {
    slug: "time-tracking",
    title: "Time Tracking",
    iconName: "Clock",
    shortDesc: "Log billable hours in real-time, organize timer entries by project milestones, and instantly convert tracked time into accurate invoices.",
    fullDesc: "Maximize your earning potential and bill for every single minute of hard work. Our integrated Time Tracker bridges the gap between active work and invoicing. Launch timers inside your browser, log manual entries, categorize hours by project, and attach descriptive notes. When billing cycles end, compile those logged hours directly onto professional invoices with a single click, providing clients with immediate itemized transparency.",
    detailedPoints: [
      "Record every minute of project work with an elegant, responsive timer that stays out of your way.",
      "Classify entries as billable or non-billable to analyze your real hourly return on investment.",
      "Add detailed notes to time entries so clients see exactly what value was generated during those hours.",
      "Automatically group logged hours by project phase and generate itemized invoices in seconds."
    ],
    features: [
      {
        title: "Seamless Active Timers",
        desc: "Start and pause timers in your workspace as you transition between active client tasks."
      },
      {
        title: "Itemized Time Logs",
        desc: "Provide comprehensive breakdowns detailing dates, specific tasks, durations, and detailed notes on invoices."
      },
      {
        title: "Manual Adjustments",
        desc: "Easily log offline brainstorms, client phone calls, or on-site visits with intuitive manual entry controls."
      },
      {
        title: "Hourly Analytics Dashboard",
        desc: "Review visual charts showing hours logged per day, high-value clients, and productive time trends."
      }
    ],
    useCases: [
      {
        role: "Web Developer",
        scenario: "Logs precise system engineering hours for active clients, detailing bug fixes, API integrations, and code reviews for complete invoice backing."
      },
      {
        role: "Virtual Assistant",
        scenario: "Tracks multi-task administrative activities for diverse clients, compiling daily timesheet logs for simple weekly invoice creation."
      }
    ],
    testimonial: {
      quote: "Converting hours to invoices is literally one click. It used to take me hours at the end of the month to calculate my timesheets. Now, it takes five seconds.",
      author: "Jordan Miller",
      role: "Technical Consultant"
    },
    benefits: [
      "Reduces timesheet disputes by providing clear itemized breakdowns",
      "Increases billed hours by capturing previously forgotten tasks",
      "Integrates directly with project milestones and client portal logs",
      "Fully responsive tracker works seamlessly on desktop and mobile browsers"
    ]
  },
  {
    slug: "task-management",
    title: "Task Management",
    iconName: "CheckSquare",
    shortDesc: "Organize project deliverables into nested checklists, set priorities, establish due dates, and track task completion.",
    fullDesc: "Clarity is the secret to timely deliveries. The Task Management engine helps you dissect complex project briefs into manageable daily checklists. Organize tasks by milestone, set priority tiers (Low, Medium, High), add due dates, write detailed task instructions, and monitor progress. If you work with other freelancers, delegate tasks instantly and receive alerts as they move to completion.",
    detailedPoints: [
      "Transform long client briefs into structured, interactive task lists grouped by milestones.",
      "Set absolute due dates and priority levels to manage your focus and daily workflow.",
      "Attach custom links, instructions, and asset references directly inside specific task cards.",
      "Monitor real-time task completion ratios across all active client projects."
    ],
    features: [
      {
        title: "Milestone-Grouped Tasks",
        desc: "Structure your workflows so that completing tasks systematically drives the overall project milestone percentage."
      },
      {
        title: "Visual Priority Tiers",
        desc: "Clearly tag tasks with custom priorities so you always tackle critical bottlenecks first."
      },
      {
        title: "Active Collaborator Assigns",
        desc: "Delegate specific tasks to team members or sub-contractors, complete with custom guidelines."
      },
      {
        title: "Real-Time Activity Feeds",
        desc: "Receive instant notifications as tasks are created, updated, commented on, or completed."
      }
    ],
    useCases: [
      {
        role: "Graphic Design Agency Lead",
        scenario: "Dissects a massive brand overhaul into visual tasks, assigning illustration, layout, and copy phases to specialized team members."
      },
      {
        role: "E-commerce Specialist",
        scenario: "Tracks step-by-step store setup checklists, ensuring payment gateways, product feeds, and shipping rates are fully validated before launching."
      }
    ],
    testimonial: {
      quote: "Having my tasks linked directly to my milestones and client portals is amazing. It creates a seamless workflow that keeps everyone on the exact same page.",
      author: "Sophia Patel",
      role: "Digital Project Manager"
    },
    benefits: [
      "98% Improvement in team task accountability and visibility",
      "Allows simple task delegation to sub-contractors with custom priorities",
      "Keeps delivery teams focused on highest-value tasks first",
      "Seamless integration with visual calendars and active timeline boards"
    ]
  },
  {
    slug: "calendar-scheduling",
    title: "Calendar & Scheduling",
    iconName: "CalendarDays",
    shortDesc: "A centralized master calendar uniting your project deadlines, milestones, tasks, and client appointments in one responsive interface.",
    fullDesc: "Take complete control of your timeline. The unified Calendar brings together every time-sensitive element of your freelance operations. View project launch dates, contract sign-offs, payment due dates, and scheduled tasks in a clean grid layout. Prevent calendar collisions and double-booking, ensuring you maintain a sustainable workflow that allows you to deliver premium results without burning out.",
    detailedPoints: [
      "Visualize your entire work week or month at a glance, highlighting key deadlines and deliverables.",
      "Map out tasks chronologically to ensure realistic project commitments and timelines.",
      "Sync invoice due dates and contract deadlines to track your active business operations.",
      "Prevent scheduling bottlenecks by balancing team workloads in one shared calendar."
    ],
    features: [
      {
        title: "Unified Master Grid",
        desc: "Bring milestones, invoice due dates, task deadlines, and client meetings together in a single view."
      },
      {
        title: "Dynamic Timeline Balancing",
        desc: "Easily drag and drop tasks on the calendar to adjust due dates and balance your week's commitments."
      },
      {
        title: "Color-Coded Projects",
        desc: "Organize calendar items with distinct project colors to instantly assess time allocation across clients."
      },
      {
        title: "Deadline Alert Systems",
        desc: "Set advance alerts for major project milestones so you never have to rush a deliverable."
      }
    ],
    useCases: [
      {
        role: "Freelance Photographer",
        scenario: "Manages shoot dates, client preview deadlines, and edit delivery milestones in a highly organized, visual layout."
      },
      {
        role: "Social Media Manager",
        scenario: "Maps out content drafting schedules, client approval deadlines, and publishing calendars for multiple brand accounts."
      }
    ],
    testimonial: {
      quote: "The unified calendar saved my sanity. I can see all my project milestones alongside invoice due dates, which helps me pace my work and manage cash flow effortlessly.",
      author: "Liam O'Connor",
      role: "Creative Director"
    },
    benefits: [
      "Eliminates double-booking and unrealistic project commitments",
      "Reduces calendar drift by keeping timelines connected to active tasks",
      "Provides teams with absolute clarity on upcoming project goals",
      "Adapts smoothly to desktop layouts and mobile schedules"
    ]
  },
  {
    slug: "team-collaboration",
    title: "Team Collaboration",
    iconName: "UserPlus",
    shortDesc: "Invite subcontractors, designers, or client stakeholders to collaborate on projects, share tasks, and coordinate in real-time.",
    fullDesc: "Scale your freelance operations beyond your personal hours. Team Collaboration enables you to bring in specialist support when projects grow. Seamlessly invite other freelancers, subcontractors, or specialists into specific client workspaces. Assign roles with customized security access, delegate tasks, log collaborative hours, and coordinate deliveries with ease.",
    detailedPoints: [
      "Invite key specialists to collaborate on specific projects while maintaining complete security.",
      "Delegate tasks with clear responsibilities, deadlines, and project context.",
      "Track team activity logs in real-time to monitor progress across workstreams.",
      "Manage subcontractor payouts and time logs in one centralized workspace."
    ],
    features: [
      {
        title: "Granular Team Roles",
        desc: "Configure role-based access to keep sensitive financial details private while sharing task boards."
      },
      {
        title: "Collaborator Activity Feeds",
        desc: "View chronologically compiled updates on task completions, file uploads, and team discussions."
      },
      {
        title: "Subcontractor Timesheets",
        desc: "Allow invited specialists to track time directly against tasks for transparent payroll verification."
      },
      {
        title: "Shared Resource Vaults",
        desc: "Provide team members with direct access to design guidelines, code repositories, and asset libraries."
      }
    ],
    useCases: [
      {
        role: "Agency Founder",
        scenario: "Invites contract designers and content writers to collaborate on a large-scale client project, keeping client communication centralized."
      },
      {
        role: "Technical Team Lead",
        scenario: "Coordinates code reviews and system deployments with distributed engineers, tracking task handoffs in real-time."
      }
    ],
    testimonial: {
      quote: "Being able to bring subcontractors directly into a project workspace has changed how I scale my business. I can delegate tasks, verify timesheets, and deliver fast.",
      author: "Amina Yusuf",
      role: "Studio Director"
    },
    benefits: [
      "Reduces administrative friction when scaling freelance teams",
      "Maintains absolute client data privacy with granular permissions",
      "Expedites team delivery cycles by keeping tasks and assets unified",
      "Provides real-time activity tracking to keep everyone aligned"
    ]
  },
  {
    slug: "client-intake-forms",
    title: "Client Intake Forms",
    iconName: "FileInput",
    shortDesc: "Build customized onboarding forms and questionnaires to collect project requirements, files, and briefs professionally.",
    fullDesc: "Ditch the tedious email onboarding threads. Client Intake Forms help you collect detailed project parameters, design preferences, and brand assets before the project even kicks off. Design beautiful onboarding questionnaires, share secure links, and let new clients submit their briefs directly. Submitted data is automatically populated into your CRM, letting you launch projects instantly.",
    detailedPoints: [
      "Create professional onboarding forms that match your brand identity in minutes.",
      "Request project guidelines, design inspirations, assets, and budgets in a single link.",
      "Automatically generate structured client profiles in your CRM upon form completion.",
      "Eliminate repetitive discovery calls by gathering critical details upfront."
    ],
    features: [
      {
        title: "Drag-and-Drop Builders",
        desc: "Easily add text areas, select dropdowns, checklist options, and file upload fields to your forms."
      },
      {
        title: "Secure Asset Uploads",
        desc: "Allow clients to upload high-resolution brand assets, logo files, and creative briefs directly to their profiles."
      },
      {
        title: "CRM Auto-Sync",
        desc: "Onboarding form responses immediately sync with new client records, keeping details ready for delivery."
      },
      {
        title: "Direct Share Links",
        desc: "Embed intake form links directly on your website, pricing pages, or email signature blocks."
      }
    ],
    useCases: [
      {
        role: "Identity Designer",
        scenario: "Sends a custom aesthetic questionnaire to new clients, gathering color preferences and design benchmarks before sketching."
      },
      {
        role: "SEO Consultant",
        scenario: "Collects target search keywords, competitor URLs, and analytics access details automatically during onboarding."
      }
    ],
    testimonial: {
      quote: "Onboarding clients used to take a dozen emails back and forth. Now, they fill out my custom intake form, and I have everything I need to start building immediately.",
      author: "Chloe Dubois",
      role: "Brand Identity Designer"
    },
    benefits: [
      "Saves an average of 3 hours per client during onboarding",
      "Gathers all essential brand assets and credentials in one step",
      "Reduces scope ambiguity by capturing initial project briefs securely",
      "Professional client presentation that builds trust from day one"
    ]
  },
  {
    slug: "reports-analytics",
    title: "Reports & Analytics",
    iconName: "BarChart3",
    shortDesc: "Get a clear view of your business health with real-time reports tracking revenue, outstanding invoices, and productive hour distributions.",
    fullDesc: "Run your freelance career like a seasoned business owner. Reports & Analytics gives you instant access to your financial health and team productivity metrics. Review outstanding invoice accounts, track revenue growth trends, evaluate your average hourly return on investment, and audit your most profitable clients. Visual dashboards convert complex business data into simple, actionable insights.",
    detailedPoints: [
      "Monitor your net income, tax-ready expense logs, and unpaid invoices in a unified dashboard.",
      "Identify your highest-paying clients and analyze your most profitable project structures.",
      "Track billable vs non-billable hour ratios to optimize your daily focus.",
      "Export clean financial balance sheets and tax-ready summaries with a single click."
    ],
    features: [
      {
        title: "Revenue Tracking Bars",
        desc: "Monitor paid, pending, and overdue invoices month-by-month to optimize cash flow management."
      },
      {
        title: "Client Value Charts",
        desc: "Analyze revenue by client to pinpoint your best partnerships and guide marketing goals."
      },
      {
        title: "Hourly Yield Metrics",
        desc: "Review your actual hourly earnings by dividing total milestone payouts by hours tracked."
      },
      {
        title: "Tax-Ready Reporting",
        desc: "Export itemized revenue summaries and tax calculations to hand to your accountant in seconds."
      }
    ],
    useCases: [
      {
        role: "Studio Owner",
        scenario: "Reviews quarterly revenue reports to assess growth, set future pricing tiers, and allocate investment budgets."
      },
      {
        role: "Freelance Marketer",
        scenario: "Compares time invested against retainer revenue to optimize monthly service scopes and increase margins."
      }
    ],
    testimonial: {
      quote: "The analytics tools showed me that one client took up 50% of my time but only generated 15% of my revenue. That single insight completely changed how I price my services.",
      author: "Tyler Vance",
      role: "Content Strategist"
    },
    benefits: [
      "Provides absolute clarity on freelance business health and growth",
      "Highlights your most profitable services and clients to maximize income",
      "Saves days of manual spreadsheet math at the end of the fiscal year",
      "Clean visual graphics suitable for business performance reviews"
    ]
  }
];

export const getToolBySlug = (slug: string): ToolData | undefined => {
  return toolsRegistry.find((t) => t.slug === slug);
};
