"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { asset } from "@/lib/base-path";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  RiArrowDownLine,
  RiArrowLeftRightFill,
  RiArrowRightSLine,
  RiBankCardLine,
  RiCoinLine,
  RiDashboardLine,
  RiEarthLine,
  RiExpandUpDownLine,
  RiHomeLine,
  RiKeyLine,
  RiLineChartLine,
  RiCloseLine,
  RiMenuLine,
  RiSendPlaneLine,
  RiSettings4Line,
  RiSettings5Line,
  RiSparkling2Line,
  RiStarSLine,
  RiTeamLine,
  RiUserSettingsLine,
} from "@remixicon/react";
import { toast, Toaster } from "sonner";
import { ForenAvatar } from "@/components/ui/foren-avatar";
import { Skeleton } from "@/components/states";
import { COMPANY } from "@/fixtures/seed";
import { can } from "@/lib/permissions";
import { currentUserId, personById, requestState, useNow, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/domain/types";
import { restoreExpiredLimits } from "@/lib/actions";
import { OnboardingDemoPanel } from "@/components/onboarding/demo-panel";
import { isOnboarding, useOnboarding } from "@/lib/onboarding-store";
import { DemoPanel } from "./demo-panel";
import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notifications";

const noopSubscribe = () => () => {};

const ROLE_LABEL: Record<Exclude<Role, "individual">, string> = {
  owner: "Account owner",
  cardholder: "Cardholder",
  finance: "Finance lead",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  // All prototype state lives in localStorage, so render only on the client.
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  if (!mounted) return <ShellSkeleton />;
  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const role = useStore((s) => s.role);
  const now = useNow(5000);
  const [navOpen, setNavOpen] = React.useState(false);
  // The GitHub Pages build uses trailingSlash (/cards/new/); route checks below expect no trailing slash.
  const pathname = usePathname().replace(/(.)\/+$/, "$1");

  // Temporary limit changes restore themselves when their period ends (prototype clock).
  React.useEffect(() => restoreExpiredLimits(now), [now]);

  // Sign-up has its own layout (rail + inset panel) from the onboarding Figma.
  if (isOnboardingRoute(pathname))
    return (
      <>
        {children}
        <OnboardingDemoPanel />
        <Toaster position="top-center" toastOptions={{ className: "!rounded-[16px] !font-sans" }} />
      </>
    );

  // Creation and full edit flows take over the screen (Mercury-style focus mode).
  if (isFocusRoute(pathname))
    return (
      <div className="min-h-dvh bg-surface">
        <main id="main">{children}</main>
        <DemoPanel placement="edge" />
        {/* Top-center so toasts never cover the sticky Create card footer */}
        <Toaster position="top-center" toastOptions={{ className: "!rounded-[16px] !font-sans" }} />
      </div>
    );

  const sidebar = <Sidebar pathname={pathname} onNavigate={() => setNavOpen(false)} />;

  return (
    <div className="min-h-dvh bg-surface lg:pl-[230px]">
      {/* Desktop sidebar (Foren Business Banking "NEW IA") */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[230px] bg-surface lg:block">{sidebar}</aside>

      {/* Phone/tablet menu: full screen, like the Figma "Menu" pattern. */}
      <Dialog.Root open={navOpen} onOpenChange={setNavOpen}>
        <Dialog.Portal>
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-surface outline-none lg:hidden">
            <Dialog.Description className="sr-only">Main navigation</Dialog.Description>
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <Dialog.Title className="text-[18px] leading-[28px] font-semibold text-fg">Menu</Dialog.Title>
              <Dialog.Close
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
              >
                <RiCloseLine className="size-[22px]" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <RoleSwitch />
              <NotificationBell />
            </div>
            <div className="min-h-0 flex-1">{sidebar}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Content sits in an inset panel on the sunken background, like the Figma frames. */}
      <div className="min-h-dvh bg-canvas lg:m-2 lg:min-h-[calc(100dvh-16px)] lg:rounded-[20px]">
        {/* Phone/tablet top bar (Figma responsive screens): workspace pill with an outlined Menu button. */}
        <header className="sticky top-0 z-20 bg-surface px-5 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-canvas py-1.5 pr-2.5 pl-3 shadow-[0_1px_1px_rgba(36,28,21,0.05)]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line">
                <Image src={asset("/foren-logo.svg")} alt="" width={16} height={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] leading-[21px] font-medium text-fg">{COMPANY.name}</div>
                <div className="truncate text-[12px] leading-[18px] text-fg-2">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border-[1.2px] border-line-2 px-3 text-[12px] font-medium text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            >
              <RiMenuLine className="size-4" aria-hidden />
              Menu
            </button>
          </div>
        </header>
        <header className="sticky top-0 z-20 hidden h-16 items-center gap-4 border-b-[0.6px] border-line bg-canvas/90 px-10 backdrop-blur lg:flex lg:rounded-t-[20px]">
          <Breadcrumb pathname={pathname} />
          <div className="mx-auto w-[320px]">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            <RoleSwitch />
            <NotificationBell />
            <UserBadge />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1195px] px-5 pt-10 pb-28 lg:px-10 lg:pt-12">
          <div className="mb-10 lg:hidden">
            <Breadcrumb pathname={pathname} />
          </div>
          {children}
        </main>
      </div>
      <DemoPanel />
      <Toaster position="bottom-center" toastOptions={{ className: "!rounded-[16px] !font-sans" }} />
    </div>
  );
}

export const isOnboardingRoute = (p: string) => p === "/onboarding" || p.startsWith("/onboarding/");

export function isFocusRoute(p: string) {
  return p === "/cards/new" || p === "/cards/request" || /^\/cards\/[^/]+\/edit$/.test(p);
}

// ---------------------------------------------------------------- sidebar

type Item = { label: string; icon?: React.ReactNode; href?: string; badge?: number; match?: (p: string) => boolean; children?: Item[] };

const CARD_ROUTES = /^\/(cards|subscriptions|requests|travel)(\/|$)/;

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const role = useStore((s) => s.role);
  const requests = useStore((s) => s.requests);
  const now = useNow(5000);
  const pendingCount = role === "owner" ? requests.filter((r) => requestState(r, now) === "pending").length : 0;
  const onboarding = useOnboarding((s) => isOnboarding(s));

  const cards: Item = {
    label: "Cards",
    icon: <RiBankCardLine />,
    match: (p) => CARD_ROUTES.test(p),
    badge: pendingCount,
    children: [
      { label: "Overview", href: "/cards", match: (p) => p.startsWith("/cards") || p.startsWith("/subscriptions") },
      { label: "Requests", href: "/requests", badge: pendingCount },
      { label: "Spending abroad", href: "/travel" },
    ],
  };

  const groups: { title?: string; items: Item[] }[] = [
    {
      items: [
        // Until compliance approves the account, setup tasks live here (Figma "Verify your business").
        ...(onboarding && role === "owner" ? [{ label: "Get started", icon: <RiSparkling2Line />, href: "/get-started" }] : []),
        { label: "Home", icon: <RiStarSLine /> },
        { label: "Dashboard", icon: <RiDashboardLine /> },
        { label: "Global accounts", icon: <RiEarthLine />, href: can(role, "autofx") ? "/global-account" : undefined },
      ],
    },
    {
      title: "Move money",
      items: [
        { label: "Send", icon: <RiSendPlaneLine /> },
        { label: "Receive", icon: <RiArrowDownLine />, children: [] },
        { label: "Swap", icon: <RiArrowLeftRightFill /> },
        cards,
      ],
    },
    { title: "Records", items: [{ label: "Transactions", icon: <RiCoinLine /> }, { label: "Analytics", icon: <RiLineChartLine /> }] },
    {
      title: "Manage",
      items: [
        { label: "Recipients", icon: <RiTeamLine /> },
        { label: "Team & approvals", icon: <RiUserSettingsLine /> },
        { label: "Settings", icon: <RiSettings4Line /> },
      ],
    },
  ];

  return (
    <nav aria-label="Main" className="flex h-full flex-col overflow-y-auto px-3 pt-5 pb-8">
      <Workspace />
      <div className="mt-8 space-y-6">
        {groups.map((g, i) => (
          <NavGroup key={i} title={g.title} items={g.items} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="mt-auto pt-8">
        <NavGroup
          title="Developers"
          items={[
            { label: "API Payouts", icon: <RiEarthLine /> },
            { label: "Keys & Web-hooks", icon: <RiKeyLine /> },
            { label: "Configuration", icon: <RiSettings5Line /> },
          ]}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );
}

function Workspace() {
  // While a sign-up is being activated, the workspace is the business that just signed up.
  const name = useOnboarding((s) => (isOnboarding(s) && s.business?.name) || COMPANY.name);
  return (
    <div className="flex h-10 items-center gap-3 rounded-[12px] bg-canvas pr-2.5 pl-3 shadow-[0_1px_1px_rgba(36,28,21,0.05)]">
      <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-surface ring-1 ring-line">
        <Image src={asset("/foren-logo.svg")} alt="" width={12} height={12} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[0.01em] text-fg-2">{name}</span>
      <RiExpandUpDownLine className="size-4 shrink-0 text-fg-3" aria-hidden />
    </div>
  );
}

const itemCls =
  "flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] font-medium tracking-[0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus [&_svg]:size-[14px] [&_svg]:shrink-0";

function NavGroup({ title, items, pathname, onNavigate }: { title?: string; items: Item[]; pathname: string; onNavigate: () => void }) {
  return (
    <div className="space-y-1">
      {title && <div className="flex h-6 items-center px-3 text-[12px] font-semibold tracking-[0.01em] text-fg-3 uppercase">{title}</div>}
      <ul className="space-y-1">
        {items.map((it) => (
          <NavEntry key={it.label} item={it} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  );
}

function NavEntry({ item, pathname, onNavigate }: { item: Item; pathname: string; onNavigate: () => void }) {
  const active = item.match ? item.match(pathname) : !!item.href && pathname.startsWith(item.href);
  const expandable = !!item.children;
  // Open while you're in this section, unless you've closed it yourself.
  const [toggled, setOpen] = React.useState<boolean | null>(null);
  const open = toggled ?? active;

  const badge = !!item.badge && !(expandable && open) && (
    <span className="tnum grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-foren-bg-button-primary)] px-1.5 text-[11px] font-semibold text-[var(--color-foren-text-inverse)]">
      {item.badge}
      <span className="sr-only"> pending</span>
    </span>
  );

  if (expandable) {
    const hasChildren = (item.children?.length ?? 0) > 0;
    return (
      <li>
        <button
          type="button"
          aria-expanded={hasChildren ? open : undefined}
          onClick={() => (hasChildren ? setOpen(!open) : soon(item.label))}
          className={cn(itemCls, active && !open ? "bg-subtle text-fg" : active ? "text-fg" : "text-fg-3 hover:bg-subtle/70 hover:text-fg-2")}
        >
          {item.icon}
          <span className="flex-1">{item.label}</span>
          {badge}
          <RiArrowRightSLine className={cn("!size-4 text-fg-3 transition-transform", open && hasChildren && "rotate-90")} aria-hidden />
        </button>
        {open && hasChildren && (
          <ul className="mt-1 space-y-1">
            {item.children!.map((c) => (
              <NavEntry key={c.label} item={c} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const inner = (
    <>
      {/* Sub-items keep the icon slot empty so their labels line up with the parent's. */}
      {item.icon ?? <span className="size-[14px] shrink-0" aria-hidden />}
      <span className="flex-1">{item.label}</span>
      {badge}
    </>
  );
  return (
    <li>
      {item.href ? (
        <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn(itemCls, active ? "bg-subtle text-fg" : "text-fg-3 hover:bg-subtle/70 hover:text-fg-2")}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={() => soon(item.label)} className={cn(itemCls, "text-fg-3 hover:bg-subtle/70 hover:text-fg-2")}>
          {inner}
        </button>
      )}
    </li>
  );
}

const soon = (label: string) => toast(`${label} isn’t part of the cards prototype.`);

// ---------------------------------------------------------------- top bar

function Breadcrumb({ pathname }: { pathname: string }) {
  const cards = useStore((s) => s.cards);
  const crumbs: { label: string; href?: string }[] = [];
  const m = pathname.match(/^\/cards\/([^/]+)(\/(transactions))?$/);
  if (m && m[1] !== "check-merchant") {
    const card = cards.find((c) => c.id === m[1]);
    crumbs.push({ label: "Cards", href: "/cards" }, { label: card?.nickname ?? "Card", href: m[2] ? `/cards/${m[1]}` : undefined });
    if (m[3]) crumbs.push({ label: "Transactions" });
  } else {
    const page = PAGE_TITLES.find(([re]) => re.test(pathname));
    if (pathname.startsWith("/global-account")) crumbs.push({ label: "Global accounts" });
    else if (pathname.startsWith("/get-started")) crumbs.push({ label: "Get started", href: pathname === "/get-started" ? undefined : "/get-started" }, ...(GET_STARTED[pathname] ? [{ label: GET_STARTED[pathname] }] : []));
    else if (page && page[1] !== "Cards") crumbs.push({ label: "Cards", href: "/cards" }, { label: page[1] });
    else crumbs.push({ label: page?.[1] ?? "Cards" });
  }
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-[14px]">
        <li className="shrink-0">
          <RiHomeLine className="size-[14px] text-fg" aria-hidden />
        </li>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", !last && "hidden sm:flex")}>
              {i > 0 && <span className="text-fg-3" aria-hidden>/</span>}
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className="truncate font-semibold text-fg">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate font-medium text-fg-2 hover:text-fg">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const GET_STARTED: Record<string, string> = {
  "/get-started/stakeholders": "Stakeholders",
  "/get-started/verification": "Stakeholder verification",
  "/get-started/documents": "Business documents",
  "/get-started/questionnaire": "Questionnaire",
};

const PAGE_TITLES: [RegExp, string][] = [
  [/^\/cards\/check-merchant/, "Check a merchant"],
  [/^\/subscriptions/, "Subscriptions"],
  [/^\/requests/, "Requests"],
  [/^\/travel/, "Spending abroad"],
  [/^\/qa/, "State coverage"],
  [/^\/cards/, "Cards"],
];

/** Prototype control: who you're viewing the app as. Sits where the Figma top bar has "Test mode". */
function RoleSwitch() {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[12px] font-medium text-fg-3">
      Viewing as
      <select
        id="role-switch"
        value={role}
        onChange={(e) => {
          setRole(e.target.value as Role);
          router.push("/cards");
        }}
        className="h-7 rounded-full bg-subtle pr-7 pl-3 text-[12px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserBadge() {
  const role = useStore((s) => s.role);
  const person = personById(currentUserId(role));
  return (
    <ForenAvatar
      size="sm"
      name={person?.name}
      initials={person?.name.split(" ").map((x) => x[0]).join("")}
      fallback="initials"
      title={`${person?.name} · ${ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? ""}`}
    />
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-surface lg:pl-[230px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[230px] bg-surface lg:block" />
      <div className="min-h-dvh bg-canvas lg:m-2 lg:min-h-[calc(100dvh-16px)] lg:rounded-[20px]">
        <main className="mx-auto max-w-[1195px] space-y-4 px-4 pt-20 sm:px-6 lg:px-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </main>
      </div>
    </div>
  );
}
