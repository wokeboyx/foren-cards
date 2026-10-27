/** Website palette, from the foren.co Figma (midnight espresso + warm greys). */
export const ink = "text-[#2f2d2b]";
export const muted = "text-[#95908b]";

export const inputCls =
  "h-12 w-full rounded-[16px] border border-[#e6e4e2] bg-white px-4 text-[15px] font-medium text-[#2f2d2b] outline-none placeholder:text-[#b5b0ab] focus-visible:border-[#2f2d2b] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/15 aria-[invalid=true]:border-[#d92d20]";

export const primaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1e1711] px-6 text-[14px] font-semibold tracking-[0.175px] text-[#eee] outline-none transition-colors hover:bg-[#3a2f26] focus-visible:ring-2 focus-visible:ring-[#1e1711]/40 focus-visible:ring-offset-2 disabled:opacity-40";

/** Secondary action: never competes with the one dark button in a panel. */
export const secondaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ebe9e5] px-6 text-[14px] font-semibold tracking-[0.175px] text-[#2f2d2b] outline-none transition-colors hover:bg-[#dfdcd7] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30";

export const linkBtn = "text-[14px] font-medium text-[#6b6661] underline underline-offset-4 outline-none hover:text-[#2f2d2b] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30 rounded";

export const validPhone = (n: string) => n.replace(/\D/g, "").length >= 7;
