import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconBolt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" /></svg>
);

export const IconGauge = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M12 14 4 6" /><path d="M3.3 14a9 9 0 1 1 17.4 0" /></svg>
);

export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 3v18h18" /><path d="M7 15l3-4 3 3 4-6" /></svg>
);

export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);

export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
);

export const IconLeaf = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></svg>
);

export const IconServer = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="2" y="3" width="20" height="8" rx="2" /><rect x="2" y="13" width="20" height="8" rx="2" /><path d="M6 7h.01M6 17h.01" /></svg>
);

export const IconPeak = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg>
);

export const IconList = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>
);

export const IconChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="m15 18-6-6 6-6" /></svg>
);

export const IconChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="m9 18 6-6-6-6" /></svg>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>
);
