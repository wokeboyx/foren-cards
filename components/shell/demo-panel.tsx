"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { RiFlaskLine, RiRefreshLine } from "@remixicon/react";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { ForenToggle } from "@/components/ui/foren-toggle";
import type { Role } from "@/domain/types";
import { useNow, useStore } from "@/lib/store";
import { demoMerchantsSwitch } from "@/lib/actions";



/**
 * Prototype-only controls: switch role, force failures/slow loads, move the clock and
 * reset data. This is how every state in the §10 checklist is reached during testing.
 */
export function DemoPanel({ placement = "right" }: { placement?: "left" | "right" | "edge" }) {
  const s = useStore();
  const router = useRouter();
  const now = useNow(1000);
  const [panelOpen, setPanelOpen] = React.useState(false);

  return (
    <Popover.Root open={panelOpen} onOpenChange={setPanelOpen}>
      <Popover.Trigger asChild>
        <button
          className={
            placement === "edge"
              ? // Phone screens pin their main button to the bottom, so the control sits on the right edge instead.
                "fixed top-1/2 right-0 z-40 inline-flex h-10 -translate-y-1/2 items-center rounded-l-full bg-[var(--color-foren-bg-button-primary)] pr-2 pl-3 text-[var(--color-foren-text-inverse)] opacity-80 shadow-[var(--shadow-foren-lg)] outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus"
              : `fixed bottom-4 z-40 ${placement === "left" ? "left-4" : "right-4"} inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-foren-bg-button-primary)] px-4 text-[13px] font-semibold text-[var(--color-foren-text-inverse)] shadow-[var(--shadow-foren-lg)] outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2`
          }
          aria-label="Open prototype demo controls"
        >
          <RiFlaskLine className="size-4" aria-hidden />
          {placement !== "edge" && "Demo"}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={placement === "edge" ? "left" : "top"}
          align={placement === "left" ? "start" : placement === "edge" ? "center" : "end"}
          sideOffset={10}
          collisionPadding={12}
          className="z-50 max-h-[80dvh] w-[360px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[24px] bg-surface p-5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <div className="mb-1 text-[15px] font-semibold text-fg">Prototype controls</div>
          <p className="mb-4 text-[12px] leading-[16px] text-fg-3">
            Test data only. These controls exist for design review and usability testing.{" "}
            <Link href="/qa" className="font-semibold text-fg underline underline-offset-2">
              State coverage list
            </Link>
          </p>

          <Group label="View as">
            <select
              value={s.role}
              onChange={(e) => {
                const r = e.target.value as Role;
                s.setRole(r);
                router.push("/cards");
              }}
              className="h-10 w-full rounded-full bg-subtle px-4 text-[13px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-label="View as role"
            >
              <option value="owner">Account owner — Amara</option>
              <option value="cardholder">Cardholder — Tunde</option>
              <option value="finance">Finance lead — Chidi</option>
            </select>
          </Group>

          <Group label="Network speed">
            <ForenSegmentedControl
              size="sm"
              fullWidth
              ariaLabel="Simulated latency"
              value={String(s.demo.latencyMs)}
              onChange={(v) => s.setDemo({ latencyMs: Number(v) })}
              options={[
                { value: "0", label: "Instant" },
                { value: "500", label: "Normal" },
                { value: "2500", label: "Slow" },
              ]}
            />
          </Group>

          <Group label="Failures">
            <div className="space-y-3">
              <ForenToggle size="sm" label="Fail page loads" description="Shows error + Retry states" checked={s.demo.failLoads} onCheckedChange={(v) => s.setDemo({ failLoads: v })} />
              <ForenToggle size="sm" label="Fail saves and actions" description="Issue, freeze, save, approve…" checked={s.demo.failSaves} onCheckedChange={(v) => s.setDemo({ failSaves: v })} />
            </div>
          </Group>

          <Group label={`Clock · ${now.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}>
            <div className="flex flex-wrap gap-2">
              <ForenButton size="xxs" variant="secondary" onClick={() => s.advanceClock(5)}>
                +5 min
              </ForenButton>
              <ForenButton size="xxs" variant="secondary" onClick={() => s.advanceClock(16)}>
                +16 min
              </ForenButton>
              <ForenButton size="xxs" variant="secondary" onClick={() => s.advanceClock(60 * 24)}>
                +1 day
              </ForenButton>
              <ForenButton size="xxs" variant="ghost" onClick={() => s.setDemo({ clockOffsetMs: 0 })}>
                Real time
              </ForenButton>
            </div>
          </Group>

          <Group label="FX rates (test)">
            <div className="flex items-center gap-2 text-[13px] text-fg-2">
              <span className="tnum flex-1">1 USD = {s.rates.NGN.toLocaleString()} NGN</span>
              <ForenButton size="xxs" variant="secondary" onClick={() => s.setRate("NGN", Math.round(s.rates.NGN * 0.97))}>
                −3%
              </ForenButton>
              <ForenButton size="xxs" variant="secondary" onClick={() => s.setRate("NGN", Math.round(s.rates.NGN * 1.03))}>
                +3%
              </ForenButton>
            </div>
          </Group>

          <Group label="Balances">
            <div className="flex flex-wrap gap-2">
              <ForenButton size="xxs" variant="secondary" onClick={() => { s.scaleBalances(0.01); toast("Balances set very low — subscriptions may show as at risk"); }}>
                Simulate low balances
              </ForenButton>
              <ForenButton size="xxs" variant="secondary" onClick={() => { s.loadSampleGoals(); toast("Sample AutoFX goals loaded"); }}>
                Load sample AutoFX goals
              </ForenButton>
            </div>
          </Group>

          <Group label="Merchant cards">
            <div className="flex flex-wrap gap-2">
              <ForenButton
                size="xxs"
                variant="secondary"
                onClick={async () => {
                  try {
                    const n = await demoMerchantsSwitch();
                    toast(`${n} merchant${n === 1 ? "" : "s"} charged ${n === 1 ? "its" : "their"} new card`);
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                Merchant switches to its new card
              </ForenButton>
            </div>
          </Group>

          <ForenButton
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              s.emptyAccount();
              s.setRole("owner");
              router.push("/cards");
              toast("Showing a new account with no cards");
            }}
          >
            Start as a new account (no cards)
          </ForenButton>
          <ForenButton
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            leadingIcon={<RiRefreshLine />}
            onClick={() => {
              s.resetDemo();
              toast("Demo data reset");
              router.push("/cards");
            }}
          >
            Reset demo data
          </ForenButton>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 border-t border-line pt-3">
      <div className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-fg-3 uppercase">{label}</div>
      {children}
    </section>
  );
}
