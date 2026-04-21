export type ProjectEntry = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription?: string;
  highlights?: string[];
  tags: string[];
  image?: string;    // thumbnail — path from /public
  images?: string[]; // catalogue gallery images — paths from /public/img/
  href?: string;
};

export const PROJECTS_DATA: ProjectEntry[] = [
  {
    slug: "ashaos",
    title: "AshaOS",
    subtitle: "Stichting Asha — Utrecht",
    description: "Internal laptop management system for an NGO's complete device fleet — from intake to helpdesk.",
    longDescription:
      "Designed and built from scratch as a solo intern project. AshaOS manages Stichting Asha's full laptop fleet — tracking device status, handling reservations, managing software licences, and running a helpdesk for client intake. An AI assistant powered by the Groq API offers contextual support during helpdesk sessions.",
    highlights: [
      "Fullstack monorepo: Next.js, Node.js, GraphQL, PostgreSQL in Turborepo",
      "Reservation system with conflict detection and bulk actions",
      "Software licence management with per-seat control",
      "AI-powered helpdesk intake via Groq API",
      "Independently designed database schema (Prisma ORM), API layer and UI",
      "Deployed via Railway (PostgreSQL) and Vercel",
    ],
    tags: ["Next.js", "Node.js", "GraphQL", "PostgreSQL", "Prisma", "Turborepo", "Groq API"],
    image: "/img/ashaos-project.png",
    images: [
      "/img/ashaos-1.png",
      "/img/ashaos-3.png",
      "/img/ashaos-4.png",
      "/img/ashaos-5.png",
      "/img/ashaos-6.png",
    ],
  },
  {
    slug: "atta-logical",
    title: "ATTA logical",
    subtitle: "Personal",
    description:
      "This page. A living identity — driven by a 3-day temporal cycle that shifts the layout, weight, and position of everything on it.",
    longDescription:
      "A personal site that treats time as a design material. The Temporal Evolution engine maps the current moment onto a 3-day sine wave, continuously varying font weight, letter spacing, scale, and position across every element on the page. No two visits are quite the same.",
    highlights: [
      "3-day sine wave drives all layout parameters simultaneously",
      "Single rAF loop with frame throttle — zero React re-renders during animation",
      "Motion SVG path-draw animations for chip label graphics",
      "Spring-physics 3D card tilt with cursor-tracked glare overlay",
      "Bilingual (EN / NL) with keyword-based chip navigation",
    ],
    tags: ["Next.js", "Motion", "TypeScript", "Temporal Evolution"],
    href: "https://attalogical.com",
    image: "/img/atta-project.png",
    images: [],
  },
  {
    slug: "follow-ai",
    title: "Follow-AI",
    subtitle: "follow-ai.nl",
    description: "AI-powered lead generation and appointment booking — every lead becomes a meeting.",
    longDescription:
      "Follow-AI is a Dutch AI platform that turns inbound leads into booked appointments automatically. It qualifies leads, initiates personalised outreach, and schedules meetings — keeping your pipeline full without manual follow-up.",
    highlights: [
      "Automated lead qualification and personalised outreach",
      "AI-driven appointment booking — no manual follow-up needed",
      "Dutch-market focus with localised copy and flows",
      "Landing page built to convert: 'Elke lead wordt een afspraak'",
    ],
    tags: ["AI", "Lead Generation", "Automation", "Next.js"],
    href: "https://follow-ai.nl",
    image: "/img/followai-project.png",
    images: [
      "/img/followai-1.png",
      "/img/followai-3.png",
      "/img/followai-4.png",
    ],
  },
];
