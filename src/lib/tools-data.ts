import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileInput,
  Briefcase,
  UsersRound,
  Network,
  CheckSquare,
  CalendarDays,
  Clock,
  Shield,
  FileText,
  CreditCard,
  BarChart3
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
    slug: "dashboard",
    title: "Dashboard",
    iconName: "LayoutDashboard",
    shortDesc: "A centralized command center designed to give you a complete high-level snapshot of your freelance operations, tasks, finances, and active schedules.",
    fullDesc: "Your freelance business deserves a proper home screen. The central Dashboard brings together all critical elements of your active operations in one elegant workspace. See pending client payments, active task counters, upcoming delivery schedules, recent activity streams, and quick-action shortcuts. Save time by bypassing complex navigation and start each day with absolute clarity on what requires your attention.",
    detailedPoints: [
      "Track active task percentages and outstanding project milestones at a glance.",
      "Monitor monthly revenue streams, pending invoices, and upcoming payment schedules.",
      "Stay updated on subcontractor and client portals through integrated recent activity feeds.",
      "Launch quick-action modals to add clients, start new contracts, or issue invoices instantly."
    ],
    features: [
      {
        title: "Unified Snapshot Grid",
        desc: "View active projects, upcoming deadlines, outstanding balances, and recent work history side-by-side."
      },
      {
        title: "Dynamic Metrics Counters",
        desc: "Stay informed on exactly how many tasks are active, invoices are overdue, or contracts are awaiting signature."
      },
      {
        title: "Activity Stream Ledger",
        desc: "Review a chronological timeline detailing client views, subcontractor uploads, and milestone updates."
      },
      {
        title: "Quick-Action Shortcuts",
        desc: "Create new invoices, log manual time entries, or launch new client forms in a single click."
      }
    ],
    useCases: [
      {
        role: "Freelance Creative Lead",
        scenario: "Starts every morning by checking the central dashboard to review team tasks completed overnight, check pending invoice payments, and outline the day's delivery focus."
      },
      {
        role: "Independent Consultant",
        scenario: "Uses the dashboard's instant summaries to keep client metrics in check, ensuring no active proposals or signed contracts get lost in the shuffle."
      }
    ],
    testimonial: {
      quote: "The dashboard is the first page I load when I log in. It tells me exactly where my business stands financially and operationally within five seconds.",
      author: "Nadia Rahmani",
      role: "Creative Director"
    },
    benefits: [
      "Provides complete operational visibility on a single screen",
      "Eliminates hours of hunting through scattered project sub-menus",
      "Offers instant visual warnings for overdue invoices or missed deadlines",
      "Tailors its view dynamic layout based on active workspace permissions"
    ]
  },
  {
    slug: "projects",
    title: "Projects",
    iconName: "FolderKanban",
    shortDesc: "Organize client deliverables with high-fidelity milestone timelines, drag-and-drop workflow boards, and shareable client progress portals.",
    fullDesc: "Deliver premium results on schedule. The Projects module is engineered to give you and your clients end-to-end transparency. Construct detailed project phases, tie milestones to contract payments, organize internal assets, and share live read-only progress views with client stakeholders. Protect your project margins and defend against scope creep by housing all deliverables, active feedback logs, and task cards in one clean visual board.",
    detailedPoints: [
      "Construct detailed project outlines, milestones, and phases matching your signed scope.",
      "Grant clients secure read-only portal links to showcase live project delivery streams.",
      "Organize assets, attachments, visual mockups, and spreadsheets inside specific phases.",
      "Connect time logs directly to projects to track total engineering or design effort."
    ],
    features: [
      {
        title: "Milestone-Tied Payments",
        desc: "Establish structured milestones that automatically prompt invoicing or update client status sheets when reached."
      },
      {
        title: "Client Tracking Portals",
        desc: "Minimize endless progress updates by sharing clean, secure dashboards showing real-time milestone completions."
      },
      {
        title: "Scope-Creep Controls",
        desc: "Contrast actual project tasks against original contract statements to capture out-of-scope requests."
      },
      {
        title: "Phase Asset Archives",
        desc: "Store and access brand guides, content calendars, source code repos, and deliverable files per phase."
      }
    ],
    useCases: [
      {
        role: "Software Developer",
        scenario: "Maps database design, API implementation, and deployment phases onto clear payment-linked milestones for client transparency."
      },
      {
        role: "Brand Identity Agency",
        scenario: "Invites contract designers and content creators to work under unified project scopes, managing creative asset reviews in one place."
      }
    ],
    testimonial: {
      quote: "Before, I was constantly answering client emails asking for status. Now, I just share their project portal. They love the transparency, and it keeps them aligned.",
      author: "Jonathan Cole",
      role: "Web Application Developer"
    },
    benefits: [
      "90% reduction in client check-in emails and communication friction",
      "Keeps project files and deliverables structured chronologically",
      "Verifies and displays proof of execution for faster milestone payouts",
      "Scales beautifully from simple freelance retainers to complex agency phases"
    ]
  },
  {
    slug: "clients",
    title: "Clients",
    iconName: "Users",
    shortDesc: "A centralized CRM designed specifically for freelancers to manage client profiles, communications, billing histories, and onboarding data.",
    fullDesc: "Your client relationships are your most valuable asset. The Clients CRM compiles active contact information, interaction timelines, billing profiles, contract files, and personal preferences in one secure vault. Build professional trust from day one with structured CRM onboarding details, transaction ledgers, and secure client-facing portals that make collaborating feel premium and effortless.",
    detailedPoints: [
      "Access active contracts, past invoices, outstanding balances, and active timelines from one profile.",
      "Record comprehensive notes, project style preferences, brand assets, and tax specifications.",
      "Automatically populate client records through custom dynamic onboarding forms.",
      "Accept global credit cards and local payment methods with custom currency settings per client."
    ],
    features: [
      {
        title: "Client-Centric Timeline",
        desc: "See a chronological feed of invoices sent, contracts signed, messages exchanged, and project stages completed."
      },
      {
        title: "Interactive Client Portals",
        desc: "Give clients a dedicated login to pay outstanding bills, sign new contracts, and check live milestones."
      },
      {
        title: "Workspace CRM Sync",
        desc: "New leads and onboarding briefs feed straight into active CRM profiles, keeping you organized."
      },
      {
        title: "Custom Tax & Currency rules",
        desc: "Set specific tax profiles, VAT rules, and local currency rules for every individual client account."
      }
    ],
    useCases: [
      {
        role: "Independent Copywriter",
        scenario: "Keeps detailed profiles on their ongoing clients, tracking individual tone guidelines, editing style sheets, and past payment histories."
      },
      {
        role: "SEO Consultant",
        scenario: "Reviews client-submitted SEO access keys and past search performance audits saved inside the CRM before every kickoff call."
      }
    ],
    testimonial: {
      quote: "I used to have client notes in Notion, contracts in my inbox, and billing in spreadsheets. Bringing it all under one CRM profile made my operations 10x simpler.",
      author: "Sophia Sterling",
      role: "SEO Consultant"
    },
    benefits: [
      "95% reduction in scattered admin records and manual CRM updates",
      "Boosts long-term client retention rates through organized touchpoints",
      "Supports multi-currency billing and compliance profiles per record",
      "Protects privacy with enterprise-grade data security guidelines"
    ]
  },
  {
    slug: "intake-forms",
    title: "Intake Forms",
    iconName: "FileInput",
    shortDesc: "Build beautiful onboarding questionnaires and intake briefs to gather files, requirements, and scope metrics professionally.",
    fullDesc: "onboard your clients like a top-tier agency. The Intake Forms builder replaces chaotic email chains with structured questionnaires. Construct drag-and-drop forms to collect project briefs, aesthetic guidelines, target budgets, and brand assets before coding or designing even begins. Once a client completes the form, the system automatically builds their CRM profile and organizes files in their project folder.",
    detailedPoints: [
      "Design customized onboarding forms matching your branding in less than 5 minutes.",
      "Add file upload boxes, select checkboxes, budget dropdowns, and target due dates.",
      "Auto-sync form responses to create client CRM records and launch active project spaces.",
      "Share forms via custom links or embed them on your pricing pages or email signatures."
    ],
    features: [
      {
        title: "Drag-and-Drop Form Builder",
        desc: "Easily design fields to collect text guidelines, logo assets, brand colors, or legal agreements."
      },
      {
        title: "Secure File Uploads",
        desc: "Allow clients to drag and drop heavy zip folders, design files, or spreadsheets directly into the form."
      },
      {
        title: "Instant CRM Automation",
        desc: "Responses immediately generate client entries and project templates, removing all manual copy-pasting."
      },
      {
        title: "Branded Share Links",
        desc: "Share polished, custom-branded intake links that look highly professional and build client confidence."
      }
    ],
    useCases: [
      {
        role: "Identity Designer",
        scenario: "Uses an intake form to collect target audiences, color preferences, and visual benchmarks from a brand client before sketch phase."
      },
      {
        role: "Growth Marketer",
        scenario: "Onboards new accounts by gathering Google Analytics, pixel tracking tags, and product catalogs automatically via the form."
      }
    ],
    testimonial: {
      quote: "The intake forms saved me three hours per client. I no longer have to chase people for their assets and brand briefs. I just send them a link and get to work.",
      author: "Amelie Laurent",
      role: "Visual Identity Designer"
    },
    benefits: [
      "Eliminates on average 5 back-and-forth emails per client kickoff",
      "Organizes brand briefs and logins in one centralized folder",
      "Increases customer onboarding conversion rates with a sleek interface",
      "Allows simple customization for technical, creative, or consulting niches"
    ]
  },
  {
    slug: "collaborators",
    title: "Collaborators",
    iconName: "Briefcase",
    shortDesc: "Bring in subcontractors and specialists, coordinate tasks, log hours, and manage contractor payroll securely.",
    fullDesc: "Scale your capabilities beyond your personal hours. Collaborators makes it simple to hire subcontractors and invite external specialists into specific client workspaces. Assign roles with customized security access, delegate tasks, log collaborative hours, and manage subcontractor payouts. Keep sensitive financial details private while building a powerful, distributed freelance delivery network.",
    detailedPoints: [
      "Invite niche specialists to specific client projects while protecting other workspace profiles.",
      "Delegate tasks with clear guidelines, checklists, due dates, and priorities.",
      "Allow collaborators to log billable time against tasks for simple payroll checks.",
      "Maintain a unified ledger detailing subcontractor invoices, payouts, and overall margins."
    ],
    features: [
      {
        title: "Granular Sub-Access",
        desc: "Control exactly what clients, invoices, or dashboards external collaborators can view in your workspace."
      },
      {
        title: "Collaborator Time Logs",
        desc: "Track the precise billable hours logged by subcontractors to ensure payroll accuracy and protect margins."
      },
      {
        title: "Sub-Agency Task Routing",
        desc: "Route and assign complex tasks to specialists while monitoring their execution streams."
      },
      {
        title: "Margin Calculation Tools",
        desc: "Compare client payments against subcontractor costs to verify your real freelance project margins."
      }
    ],
    useCases: [
      {
        role: "Freelance Agency Founder",
        scenario: "Invites a freelance copywriter and SEO specialist to work on a major web design account, coordinating drafts without exposing client financials."
      },
      {
        role: "Development Lead",
        scenario: "Coordinates code reviews and system deployments with a distributed engineering contractor, monitoring tasks in real-time."
      }
    ],
    testimonial: {
      quote: "Hiring subcontractors used to be a logistical headache. Bringing them into my workspace with custom permissions lets me scale my freelance business like a real agency.",
      author: "Derrick Vance",
      role: "SEO & Growth Studio Director"
    },
    benefits: [
      "Allows frictionless onboarding of freelance delivery specialists",
      "Maintains absolute client and accounting data privacy",
      "Saves hours of payroll math by unifying contractor timesheets",
      "Protects project delivery timelines with centralized activity feeds"
    ]
  },
  {
    slug: "team",
    title: "Team",
    iconName: "UsersRound",
    shortDesc: "Invite internal staff and partners to coordinate tasks, balance workloads, and track team-wide activity streams.",
    fullDesc: "Run your freelance business together with your partners. The Team panel is built for growing agencies and co-working groups that need a unified operational hub. Invite full team members, assign global roles, coordinate task boards across multiple active client accounts, and track team-wide activity streams. Ensure workloads are balanced sustainably and no deliverables fall behind.",
    detailedPoints: [
      "Invite internal co-founders, assistants, or project managers with shared workspace roles.",
      "Coordinate high-level task boards across dozens of active client projects.",
      "Analyze team capacity to distribute tasks sustainably and prevent employee burnout.",
      "Review collaborative activity streams detailing tasks completed and assets uploaded."
    ],
    features: [
      {
        title: "Global Team Roles",
        desc: "Assign Administrator, Project Manager, or Member permissions to manage global settings and data access."
      },
      {
        title: "Cross-Project Task Boards",
        desc: "View, filter, and prioritize tasks assigned to different team members across all clients."
      },
      {
        title: "Unified Team Activity",
        desc: "A centralized, searchable ledger detailing all actions taken by team members inside the workspace."
      },
      {
        title: "Capacity Assessment Tools",
        desc: "Analyze active time tracking logs and task counts to balance workloads across your organization."
      }
    ],
    useCases: [
      {
        role: "Boutique Design Studio Owners",
        scenario: "Co-manage their shared agency workspace, assigning tasks, analyzing monthly revenue curves, and tracking client feedback side-by-side."
      },
      {
        role: "Freelance Copy Group",
        scenario: "Coordinates draft writing, editing, and publishing stages for key accounts, tracking team task handoffs in one feed."
      }
    ],
    testimonial: {
      quote: "Our boutique agency runs on this tool. We co-manage our client list, track team tasks, and review our project timelines in one highly collaborative, beautiful space.",
      author: "Clara & Leo",
      role: "Design Studio Founders"
    },
    benefits: [
      "Streamlines cross-project workflows and team task coordination",
      "Unifies client operations and files in one collaborative workspace",
      "Improves capacity planning to scale your business sustainably",
      "Eliminates duplicate software costs for team task boards"
    ]
  },
  {
    slug: "nexus",
    title: "Nexus",
    iconName: "Network",
    shortDesc: "An interactive, visual whiteboard workspace to map out workflows, plan project dependencies, and auto-convert drawings into active task lists.",
    fullDesc: "Welcome to the future of project planning. Nexus is an advanced, fully interactive visual canvas engineered to bridge the gap between creative brainstorming and task execution. Map out complex workflow diagrams, connect project dependencies, sketch freehand ideas, and link deliverables. With our integrated task converter, select your visual whiteboard shapes and instantly convert them into executable task checklists within your active project dashboards.",
    detailedPoints: [
      "Brainstorm and plan complex project architectures on an infinite interactive whiteboard.",
      "Map out task dependencies, user flows, database structures, and design sitemaps visually.",
      "Convert your visual canvas shapes and connections into live tasks with a single click.",
      "Collaborate visually with team members on a premium, smooth vector canvas."
    ],
    features: [
      {
        title: "Interactive Canvas Whiteboard",
        desc: "Create vector shapes, draw freehand paths, and write notes on an infinite visual planning canvas."
      },
      {
        title: "Task Conversion Engine",
        desc: "Instantly convert visual shapes and connections into actionable tasks with assigned priorities and due dates."
      },
      {
        title: "Visual Dependency Mapping",
        desc: "Draw connection lines between tasks to visually represent workflows and plan delivery pipelines."
      },
      {
        title: "Canvas Minimap & Grid Snapping",
        desc: "Navigate complex diagrams easily with minimaps and keep layouts perfectly aligned with smart grid snapping."
      }
    ],
    useCases: [
      {
        role: "Technical Architect",
        scenario: "Maps out complex software integration components and data flows on the Nexus whiteboard, instantly converting the diagram into a 20-step project task checklist."
      },
      {
        role: "UX/UI Designer",
        scenario: "Brainstorms client website sitemaps and user flows visually with a partner, keeping design concepts linked directly to active project milestones."
      }
    ],
    testimonial: {
      quote: "Nexus is completely revolutionary. I can draw a project workflow diagram and convert the entire board into active, prioritized tasks in one click. It saves me hours of planning.",
      author: "Evelyn Moreau",
      role: "Product Strategy Consultant"
    },
    benefits: [
      "Saves up to 80% of project planning and task creation time",
      "Bridges the gap between creative visual thinking and task execution",
      "Provides clients with highly impressive, visual project sitemaps",
      "Supports smooth vector rendering and dark mode canvas styling"
    ]
  },
  {
    slug: "tasks",
    title: "Tasks",
    iconName: "CheckSquare",
    shortDesc: "Dissect project briefs into manageable daily checklists, set priorities, establish due dates, and track task completion ratios.",
    fullDesc: "Clarity is the secret to timely project delivery. The Tasks engine helps you break down massive client briefs into manageable daily checklists. Organize tasks by milestone, set priority tiers (Low, Medium, High), add due dates, write detailed task instructions, and monitor progress. If you work with other team members or subcontractors, delegate tasks instantly and receive real-time alerts as they move to completion.",
    detailedPoints: [
      "Deconstruct complex briefs into structured, interactive task lists grouped by milestones.",
      "Establish priority tiers and due dates to organize your focus and daily workflows.",
      "Attach custom links, file references, and guidelines directly inside specific task cards.",
      "Monitor task completion percentages across all active client projects in real-time."
    ],
    features: [
      {
        title: "Milestone-Linked Tasks",
        desc: "Structure workflows so that completing daily checklists systematically drives overall project milestone completion."
      },
      {
        title: "Priority Tagging Systems",
        desc: "Highlight critical path tasks with custom colors and priorities so you always tackle bottlenecks first."
      },
      {
        title: "Subcontractor Assignments",
        desc: "Delegate specific tasks to collaborators or team members, complete with instructions and feedback logs."
      },
      {
        title: "Integrated Checklist Cards",
        desc: "Add sub-tasks and step-by-step checklists to individual tasks to track microscopic progress details."
      }
    ],
    useCases: [
      {
        role: "Marketing Manager",
        scenario: "Breaks a campaign launch down into copywriting, asset design, and email scheduling tasks, assigning them to different specialists."
      },
      {
        role: "E-commerce Consultant",
        scenario: "Follows a strict store setup checklist, verifying payment gateways, shipping rules, and product feeds before project handoff."
      }
    ],
    testimonial: {
      quote: "Having my tasks linked directly to my milestones and client portals is amazing. It creates a seamless workflow that keeps everyone on the exact same page.",
      author: "Sophia Patel",
      role: "Digital Project Manager"
    },
    benefits: [
      "98% improvement in team task accountability and visibility",
      "Reduces project delivery delays through clear milestone tracking",
      "Provides contractors with absolute clarity on active due dates",
      "Integrates seamlessly with visual calendars and master schedules"
    ]
  },
  {
    slug: "calendar",
    title: "Calendar",
    iconName: "CalendarDays",
    shortDesc: "A unified master calendar bringing together your project deadlines, milestones, tasks, and client appointments in one visual interface.",
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
        title: "Dynamic Drag-and-Drop",
        desc: "Easily adjust task due dates and balance your week's commitments directly on the calendar grid."
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
    slug: "time-tracking",
    title: "Time Tracking",
    iconName: "Clock",
    shortDesc: "Log billable hours in real-time, organize timer entries by project milestones, and convert tracked time into itemized invoices.",
    fullDesc: "Maximize your earning potential and bill for every single minute of hard work. Our integrated Time Tracker bridges the gap between active work and invoicing. Launch timers inside your browser, log manual entries, categorize hours by project, and attach descriptive notes. When billing cycles end, compile those logged hours directly onto professional invoices with a single click, providing clients with immediate itemized transparency.",
    detailedPoints: [
      "Record every minute of project work with an elegant, responsive timer that stays out of your way.",
      "Classify entries as billable or non-billable to analyze your real hourly return on investment.",
      "Add detailed notes to time entries so clients see exactly what value was generated during those hours.",
      "Automatically group logged hours by project phase and generate itemized invoices in seconds."
    ],
    features: [
      {
        title: "Active Browser Timers",
        desc: "Start and pause timers instantly in your workspace as you transition between active client tasks."
      },
      {
        title: "One-Click Invoicing",
        desc: "Convert logged hours directly into itemized invoices, pulling task descriptions and hourly rates automatically."
      },
      {
        title: "Timesheet Logs",
        desc: "Review detailed lists of time entries with dates, durations, specific tasks, and descriptive notes."
      },
      {
        title: "Billable Hour Analytics",
        desc: "Analyze visual charts showing your productive hours per day, high-value clients, and project time splits."
      }
    ],
    useCases: [
      {
        role: "Web Designer",
        scenario: "Tracks precise design revision hours, detailing client change requests to ensure out-of-scope work is billed accurately."
      },
      {
        role: "Virtual Assistant",
        scenario: "Logs daily administrative tasks for multiple clients, generating clean weekly timesheets for instant billing."
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
    slug: "contracts",
    title: "Contracts",
    iconName: "Shield",
    shortDesc: "Draft legally binding freelance agreements, collect secure e-signatures, and export professional PDFs in minutes.",
    fullDesc: "Protect your intellectual property, clarify project scopes, and secure your income with airtight agreements. The Contracts module eliminates the need for expensive third-party electronic signature tools. Generate comprehensive freelance agreements, customize legal clauses, collect legally binding electronic signatures, and securely archive completed documents inside your workspace. Work with complete peace of mind knowing that every agreement includes detailed audit trails.",
    detailedPoints: [
      "Draft, customize, and issue comprehensive freelance service agreements in less than 5 minutes.",
      "Gather secure, legally binding electronic signatures that are fully compliant with global standards.",
      "Automatically lock project parameters once a contract is signed to prevent modifications.",
      "Maintain a transparent audit trail detailing exact timestamps and IP addresses of signees."
    ],
    features: [
      {
        title: "Legally Binding E-Signatures",
        desc: "Fully secure digital signing tools allow clients to review and sign agreements on any desktop or mobile device."
      },
      {
        title: "Clause Customization Builder",
        desc: "Add custom payment terms, liability limits, copyright transfers, and NDA clauses matching your project requirements."
      },
      {
        title: "Dynamic Placeholders",
        desc: "Insert dynamic placeholders that pull client names, project prices, and start dates directly from your CRM data."
      },
      {
        title: "Audit Trail Certificates",
        desc: "Each signed contract includes an official audit page documenting email invites, viewings, signatures, and IP addresses."
      }
    ],
    useCases: [
      {
        role: "Independent Web Designer",
        scenario: "Drafts standard design service contracts, securing intellectual property rights transfer only after full invoice settlement."
      },
      {
        role: "Marketing Agency",
        scenario: "Onboards consulting clients with standard retainer contracts, setting up ongoing marketing scope boundaries legally."
      }
    ],
    testimonial: {
      quote: "Having contract templates and legally binding signatures built right in looks incredibly professional and has saved me thousands in legal software subscriptions.",
      author: "Elena Rostova",
      role: "Brand Consultant"
    },
    benefits: [
      "100% secure digital signatures compliant with modern e-sign directives",
      "Ensures zero project work begins without active signed agreements in place",
      "Saves on average $40/month by replacing third-party signature platforms",
      "Exports beautiful, print-ready PDF contract documents with audit details"
    ]
  },
  {
    slug: "invoices",
    title: "Invoices",
    iconName: "FileText",
    shortDesc: "Generate beautiful, compliant invoices, connect global payment gateways, and automate late payment follow-ups.",
    fullDesc: "Get paid on time, every time. The Invoices system combines high-quality billing generation with powerful payment automations. Connect popular payment processors to accept credit cards, bank transfers, and local payment methods with ease. Avoid uncomfortable conversations by setting up automated reminder campaigns that gently prompt clients about upcoming or overdue payments.",
    detailedPoints: [
      "Create and send professional-grade invoices tailored with your logo and brand colors in seconds.",
      "Connect seamlessly with popular payment processors to accept global credit cards and direct deposits.",
      "Set custom tax rates, multi-currency lines, early payment discounts, and automatic late fees.",
      "Access clean financial reports detailing revenue collected, pending balances, and unpaid accounts."
    ],
    features: [
      {
        title: "One-Click Quick Pay",
        desc: "Include secure online payment links directly inside your invoice emails for instant credit card settlement."
      },
      {
        title: "Automated Payment Reminders",
        desc: "Configure automated emails that follow up on pending bills at custom intervals: 3 days before, on the due date, or weekly after."
      },
      {
        title: "Multi-Currency Support",
        desc: "Bill global clients in their local currency while receiving payouts in your preferred account."
      },
      {
        title: "Itemized Billing Inputs",
        desc: "Add standard flat fees, hourly timesheet groups, or recurring subscription items onto invoices in seconds."
      }
    ],
    useCases: [
      {
        role: "Freelance Photographer",
        scenario: "Issues itemized deposit and final balance invoices for high-budget productions right from their mobile device on-set."
      },
      {
        role: "SEO Consultant",
        scenario: "Bills monthly consulting services, attaching time logs and search analytics sheets to verify invoice details."
      }
    ],
    testimonial: {
      quote: "My average payment time dropped from 24 days to under 3 days after setting up the automated payment reminders. It's a absolute game-changer.",
      author: "Marcus Vance",
      role: "Motion Graphics Designer"
    },
    benefits: [
      "Reduces late payments by up to 80% through automated reminders",
      "Accepts credit cards and direct deposits globally in over 135 currencies",
      "Maintains tax-ready financial ledger summaries for simple tax filing",
      "Presents clients with clean, professional, branded invoicing sheets"
    ]
  },
  {
    slug: "subscriptions",
    title: "Subscriptions",
    iconName: "CreditCard",
    shortDesc: "Manage monthly retainer billing packages, set up automated recurring plans, and receive automatic payment alerts.",
    fullDesc: "Put your freelance income on autopilot. Subscriptions is the ultimate tool for managing retainer packages, design-productized billing, or ongoing service plans. Create custom billing tiers, set up automated monthly or annual recurring schedules, collect client credit cards securely, and let the billing system generate invoices and process payouts on autopilot.",
    detailedPoints: [
      "Configure custom monthly, quarterly, or annual recurring retainer billing tiers.",
      "Collect and save client card profiles securely to process ongoing retainers automatically.",
      "Auto-generate and email matching invoices to clients upon every subscription renewal.",
      "Track active subscriber counts, MRR (Monthly Recurring Revenue), and plan distributions."
    ],
    features: [
      {
        title: "Automated Recurring Billing",
        desc: "Set the package price, choose the billing interval, and let the system bill client cards automatically."
      },
      {
        title: "Sleek Retainer Packages",
        desc: "Offer productized service packages (e.g. 10 design hours per month) that clients can subscribe to directly."
      },
      {
        title: "Secure Card Vaulting",
        desc: "Save and update client payment card credentials safely via integrated payment compliance systems."
      },
      {
        title: "MRR Growth Charts",
        desc: "Visualize your predictable recurring income stream over time to pace future business expansions."
      }
    ],
    useCases: [
      {
        role: "Retainer-based Marketer",
        scenario: "Bills monthly content creation services automatically via a recurring subscription, maintaining steady cash flow on autopilot."
      },
      {
        role: "Productized Designer",
        scenario: "Offers unlimited graphic design plans (e.g. $1,999/month), inviting clients to subscribe directly via their website."
      }
    ],
    testimonial: {
      quote: "Moving my clients onto recurring monthly subscriptions gave me predictable monthly revenue for the first time in my freelance career. It completely changed my business.",
      author: "Julien Mercer",
      role: "Productized Web Designer"
    },
    benefits: [
      "Secures predictable, recurring monthly income streams for freelancers",
      "Removes the administrative hassle of manual invoicing every month",
      "Secures client credit cards securely under strict payment compliance",
      "Presents agency retainers in clear, premium package subscription plans"
    ]
  },
  {
    slug: "reports",
    title: "Reports",
    iconName: "BarChart3",
    shortDesc: "Access deep financial and operational analytics, track net revenues, audit client profits, and export tax summaries.",
    fullDesc: "Run your freelance career with complete financial clarity. The Reports module provides real-time visibility into your operational health and margins. Analyze monthly net income, trace accounts receivable, compare billable vs non-billable hours, identify your most profitable clients, and export comprehensive tax-ready spreadsheets. Convert complex business data into clean, visual graphs that guide your future pricing and growth decisions.",
    detailedPoints: [
      "Monitor paid, pending, and overdue revenues month-by-month in a unified ledger.",
      "Measure your actual hourly yield by dividing project payouts by hours tracked.",
      "Trace client profitability metrics to identify your best partnerships and guide business goals.",
      "Export clean financial statements and tax-ready summaries to hand to your accountant in seconds."
    ],
    features: [
      {
        title: "Revenue Ledger Bars",
        desc: "Track total revenue received, pending amounts, and outstanding invoices to manage business cash flow."
      },
      {
        title: "Hourly Yield Calculators",
        desc: "Understand your real earning rate per hour across active contracts to optimize project pricing."
      },
      {
        title: "Client Profitability Charts",
        desc: "Identify exactly which clients yield the highest returns compared to time and resource investments."
      },
      {
        title: "One-Click Tax Exports",
        desc: "Compile and download spreadsheets detailing invoices, taxes collected, and billings for simple tax compliance."
      }
    ],
    useCases: [
      {
        role: "Studio Director",
        scenario: "Analyzes quarterly revenue growth to adjust pricing structures, assess hiring needs, and plan studio goals."
      },
      {
        role: "Independent Consultant",
        scenario: "Compares time tracker logs against flat-rate milestone payments to optimize future consulting packages and increase margins."
      }
    ],
    testimonial: {
      quote: "The hourly yield report showed me that one of my flat-rate clients paid less than minimum wage when time was accounted for. That insight saved me from massive losses.",
      author: "Vance Caldwell",
      role: "Growth Strategy Advisor"
    },
    benefits: [
      "Provides complete operational and financial visibility in one place",
      "Saves days of manual financial spreadsheet math at the end of the year",
      "Identifies your most profitable services and clients to maximize income",
      "Generates clear, print-ready reports perfect for business performance audits"
    ]
  }
];

export const getToolBySlug = (slug: string): ToolData | undefined => {
  return toolsRegistry.find((t) => t.slug === slug);
};
