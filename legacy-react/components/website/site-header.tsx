import Link from "next/link";
import { asset } from "@/lib/base-path";

const NAV = ["Business", "Personal", "Platform", "Use Cases", "Resources", "Company"];

/** foren.co top bar (website Figma 3011:3933). Links other than Log in and Get started are for show. */
export function SiteHeader() {
  return (
    <header className="bg-[#17120d]">
      <div className="relative mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <Link href="/website" aria-label="Foren home" className="rounded outline-none focus-visible:ring-2 focus-visible:ring-white/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/website/foren-wordmark-light.svg")} alt="Foren" width={100} height={24} className="h-6 w-[100px]" />
        </Link>
        <nav aria-label="Main" className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 gap-1 lg:flex">
          {NAV.map((n) => (
            <span key={n} className="inline-flex h-8 items-center rounded-full px-3 text-[14px] font-medium text-[#d8d6d5]">
              {n}
            </span>
          ))}
        </nav>
        <div className="flex gap-2 sm:gap-4">
          <Link href="/" className="inline-flex h-8 items-center rounded-full bg-[rgba(253,254,255,0.15)] px-3 text-[14px] font-medium text-[#f4f4f3] outline-none hover:bg-[rgba(253,254,255,0.25)] focus-visible:ring-2 focus-visible:ring-white/50">
            Log In
          </Link>
          <Link href="/onboarding" className="inline-flex h-8 items-center rounded-full bg-[#f2f2f2] px-3 text-[14px] font-semibold tracking-[0.175px] text-[#2f2d2b] outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-white/50">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
