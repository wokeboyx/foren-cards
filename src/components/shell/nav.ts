import type { Component } from "vue";
import { toast } from "vue-sonner";

export type NavItem = {
  label: string;
  icon?: Component;
  href?: string;
  badge?: number;
  match?: (p: string) => boolean;
  children?: NavItem[];
};

export const navItemCls =
  "flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] font-medium tracking-[0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus [&_svg]:size-[14px] [&_svg]:shrink-0";

export const soon = (label: string) =>
  toast(`${label} isn’t part of the cards prototype.`);

export const ROLE_LABEL = {
  owner: "Account owner",
  cardholder: "Cardholder",
  finance: "Finance lead",
} as const;
