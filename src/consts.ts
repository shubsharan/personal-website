// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "shub.gg";
export const SITE_DESCRIPTION =
  "Shubhankar Sharan — founder and builder. Projects, essays, and notes on what I’m reading.";
export const AUTHOR = "Shubhankar Sharan";
export const AUTHOR_EMAIL = "shubhankarsharan@gmail.com";

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/art", label: "Art" },
  { href: "/contact", label: "Contact" },
] as const;

export const SOCIALS = {
  github: "https://github.com/shubsharan",
  linkedin: "https://linkedin.com/in/shubsharan",
  instagram: "https://instagram.com/shubadub",
} as const;

// The status ledger. `dot` picks how the mark next to a project is drawn.
export const PROJECT_STATUS = {
  active: { label: "Active", dot: "live" },
  shipped: { label: "Shipped", dot: "solid" },
  ended: { label: "Ended", dot: "hollow" },
} as const;

