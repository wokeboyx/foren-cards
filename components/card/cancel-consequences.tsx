import { RiCloseCircleLine, RiForbidLine, RiSnowflakeLine } from "@remixicon/react";

/** Revolut-style list of what cancelling does, with the reversible alternative called out. */
export function CancelConsequences({ canFreeze }: { canFreeze: boolean }) {
  const row = "flex items-start gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0";
  return (
    <ul className="space-y-2.5 rounded-[16px] bg-subtle px-4 py-3 text-[14px] leading-[20px] text-fg">
      <li className={row}>
        <RiCloseCircleLine aria-hidden className="text-error" />
        This card can’t be used again. This can’t be undone.
      </li>
      <li className={row}>
        <RiForbidLine aria-hidden className="text-fg-2" />
        New charges and subscriptions on it will be declined.
      </li>
      {canFreeze && (
        <li className={row}>
          <RiSnowflakeLine aria-hidden className="text-fg-2" />
          To pause spending instead, freeze it. You can unfreeze it later.
        </li>
      )}
    </ul>
  );
}
