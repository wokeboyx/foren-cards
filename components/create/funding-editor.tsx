"use client";
import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiArrowDownLine, RiArrowUpLine, RiDraggable } from "@remixicon/react";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { FundingPath } from "@/components/card/funding-path";
import { Money } from "@/components/money";
import { STRATEGY } from "@/domain/labels";
import { convert, CURRENCY_NAME } from "@/domain/money";
import type { Currency, FundingConfig, FundingStrategy } from "@/domain/types";
import { useStore } from "@/lib/store";
import { ChoiceCard } from "./choice-card";
import { CurrencySelect } from "@/components/currency-select";

export function FundingEditor({ value, onChange }: { value: FundingConfig; onChange: (f: FundingConfig) => void }) {
  const balances = useStore((s) => s.balances);
  const set = (patch: Partial<FundingConfig>) => onChange({ ...value, ...patch });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.order.length) return;
    set({ order: arrayMove(value.order, i, j) });
  };
  // Suggest protecting the largest balance; the user can pick any currency.
  const largestBalance = (): Currency =>
    [...balances].sort((a, b) => convert(b.available, "USD").minor - convert(a.available, "USD").minor)[0]?.currency ?? value.order[0];
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    set({ order: arrayMove(value.order, value.order.indexOf(e.active.id as Currency), value.order.indexOf(e.over.id as Currency)) });
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-[14px] font-medium text-fg">Funding strategy</legend>
        <div className="grid gap-2">
          {(Object.keys(STRATEGY) as FundingStrategy[]).map((k) => (
            <ChoiceCard
              key={k}
              name="strategy"
              value={k}
              checked={value.strategy === k}
              onChange={(v) => set({ strategy: v as FundingStrategy, ...(v === "protect" && !value.protect ? { protect: largestBalance() } : {}) })}
              title={STRATEGY[k].label}
              badge={k === "cheapest_fx" ? <ForenBadge size="sm" color="success">Recommended</ForenBadge> : undefined}
              description={STRATEGY[k].line}
            />
          ))}
        </div>
      </fieldset>

      {value.strategy === "protect" && (
        <div>
          <CurrencySelect label="Which currency do you want to protect?" value={value.protect} options={value.order} balances={balances} onChange={(c) => set({ protect: c })} />
          <p className="mt-2 text-[13px] leading-[18px] text-fg-2">Usually the one you hold for savings or to pay suppliers. Charges in that currency still use it first, so there’s no conversion.</p>
        </div>
      )}

      {value.strategy === "custom" && (
        <div>
          <div className="mb-2 text-[14px] font-medium text-fg" id="order-label">
            Balance order
          </div>
          <p className="mb-3 text-[13px] text-fg-2">Drag to reorder, or use the arrow buttons. Balances are tried from the top.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={value.order} strategy={verticalListSortingStrategy}>
              <ol aria-labelledby="order-label" className="space-y-2">
                {value.order.map((c, i) => (
                  <SortableRow
                    key={c}
                    id={c}
                    index={i}
                    total={value.order.length}
                    onMove={(d) => move(i, d)}
                    available={balances.find((b) => b.currency === c)?.available}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </div>
      )}


      <div>
        <div className="mb-2 text-[14px] font-medium text-fg">Where this card’s money will come from</div>
        <FundingPath funding={value} className="rounded-[16px] border border-line p-4" />
      </div>
    </div>
  );
}

function SortableRow({ id, index, total, onMove, available }: { id: Currency; index: number; total: number; onMove: (d: -1 | 1) => void; available?: { minor: number; currency: Currency } }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-[14px] border border-line bg-surface px-3 py-2.5 ${isDragging ? "z-10 shadow-[var(--shadow-foren-lg)]" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab rounded-md p-1 text-fg-3 outline-none focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing"
        aria-label={`Drag to reorder ${id}`}
        {...attributes}
        {...listeners}
      >
        <RiDraggable className="size-5" aria-hidden />
      </button>
      <span className="tnum grid size-6 place-items-center rounded-full bg-subtle text-[12px] font-semibold text-fg-2">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-fg">{id}</div>
        <div className="truncate text-[12px] text-fg-3">
          {CURRENCY_NAME[id]}
          {available && (
            <>
              {" · "}
              <Money value={available} /> available
            </>
          )}
        </div>
      </div>
      <ForenButton type="button" variant="ghost" size="xxs" className="px-2" aria-label={`Move ${id} up`} disabled={index === 0} onClick={() => onMove(-1)} leadingIcon={<RiArrowUpLine />} />
      <ForenButton type="button" variant="ghost" size="xxs" className="px-2" aria-label={`Move ${id} down`} disabled={index === total - 1} onClick={() => onMove(1)} leadingIcon={<RiArrowDownLine />} />
    </li>
  );
}
