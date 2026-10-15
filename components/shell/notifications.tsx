"use client";
import * as React from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { RiNotification3Line } from "@remixicon/react";
import { useStore } from "@/lib/store";

export function NotificationBell() {
  const role = useStore((s) => s.role);
  const all = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markAllRead);
  const mine = all.filter((n) => n.forRole === role);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <Popover.Root onOpenChange={(o) => !o && unread && markAllRead(role)}>
      <Popover.Trigger
        className="relative grid size-7 place-items-center rounded-[8px] border border-line bg-surface text-fg shadow-[0_2px_4px_-1px_rgba(36,28,21,0.08)] outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <RiNotification3Line className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="tnum absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold text-white" aria-hidden>
            {unread}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-[20px] bg-surface p-2 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none">
          <div className="px-3 pt-2 pb-1 text-[13px] font-semibold text-fg">Notifications</div>
          {mine.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-fg-3">You’re all caught up.</p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto">
              {mine.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <Popover.Close asChild>
                    <Link href={n.href ?? "#"} className="block rounded-[14px] px-3 py-2.5 hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="size-2 rounded-full bg-[var(--color-foren-primary-dot)]" aria-label="Unread" />}
                        <span className="text-[13px] font-semibold text-fg">{n.title}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-fg-2">{n.body}</p>
                    </Link>
                  </Popover.Close>
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
