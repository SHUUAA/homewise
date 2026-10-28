export type SectionId = "home" | "services" | "technologies" | "clients" | "contacts";

export const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "technologies", label: "Technologies" },
  { id: "clients", label: "Our Clients" },
  { id: "contacts", label: "Contacts" },
];

export type ServiceKey = "automation" | "energy" | "security" | "concierge" | "analytics";

export const SERVICES: { key: ServiceKey; label: string; title: string; image: string }[] = [
  { key: "automation", label: "Automation", title: "Automation", image: "/images/service-automation.png" },
  { key: "energy", label: "Energy", title: "Energy", image: "/images/service-energy.png" },
  { key: "security", label: "Security", title: "Security", image: "/images/service-security.png" },
  { key: "concierge", label: "Concierge", title: "Virtual Concierge", image: "/images/service-concierge.png" },
  { key: "analytics", label: "Analytics", title: "Analytics", image: "/images/service-analytics.png" },
];

/**
 * Order in which the pinned services section reveals each service while
 * scrolling. Matches the reference: it lands on SECURITY, then CONCIERGE,
 * and continues around the (looping) tab rail.
 */
export const SERVICE_SEQUENCE: number[] = [2, 3, 4, 0, 1];
/** Steps of SERVICE_SEQUENCE that highlight "Technologies" in the nav. */
export const TECHNOLOGY_STEP_START = 2;

export type Client = {
  id: string;
  image: string;
  name: string;
  avatar: string;
  quote: string;
};

export const CLIENTS: Client[] = [
  {
    id: "c1",
    image: "/images/client-1.png",
    name: "Marcus",
    avatar: "/images/avatar-3.png",
    quote:
      "“Arriving home now feels choreographed — the gate opens, the hall lights warm up and the heating is already where I like it. I barely touch a switch any more.”",
  },
  {
    id: "c2",
    image: "/images/client-2.png",
    name: "Sarah",
    avatar: "/images/avatar-1.png",
    quote:
      "“HomeWise made our house feel calm and safe. Alerts are quiet but precise, our energy bill dropped within a month, and I can run the whole place by voice.”",
  },
  {
    id: "c3",
    image: "/images/client-3.png",
    name: "Helen",
    avatar: "/images/avatar-4.png",
    quote:
      "“The concierge books cleaners, tracks deliveries and reminds me about the garage door. It is like having a thoughtful house manager who never sleeps.”",
  },
  {
    id: "c4",
    image: "/images/client-4.png",
    name: "Jason\n& Emily",
    avatar: "/images/avatar-2.png",
    quote:
      "“Movie nights are a different experience now — lights dim, blinds close and the sound follows us room to room. Automation that genuinely adds a bit of magic.”",
  },
  {
    id: "c5",
    image: "/images/client-5.png",
    name: "Daniel",
    avatar: "/images/avatar-3.png",
    quote:
      "“Pool, garden and solar are all on one dashboard. The analytics showed us exactly where we were wasting power and the system fixed most of it automatically.”",
  },
  {
    id: "c6",
    image: "/images/client-6.png",
    name: "Olivia",
    avatar: "/images/avatar-1.png",
    quote:
      "“We travel a lot, so checking cameras and locks from anywhere is priceless. Setup took one afternoon and support has been friendly and fast ever since.”",
  },
  {
    id: "c7",
    image: "/images/client-2.png",
    name: "Noah",
    avatar: "/images/avatar-3.png",
    quote:
      "“Our fireplace room has its own scenes now — warm light, music and heating in one tap. Guests always ask how it works.”",
  },
  {
    id: "c8",
    image: "/images/client-4.png",
    name: "Grace",
    avatar: "/images/avatar-4.png",
    quote:
      "“I love that it learns. After two weeks the house started anticipating our routines without us programming a single rule.”",
  },
];
