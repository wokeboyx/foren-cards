import * as React from "react";

/**
 * Page title block, spaced like the Foren Business Banking Figma: title and description 8px apart,
 * actions on the right, optional tabs below, and 24px to the content that follows.
 */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  tabs,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] leading-[32px] font-semibold tracking-[-0.01em] text-fg">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-[14px] leading-[21px] text-fg-2">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
      </div>
      {tabs && <div className="mt-6 max-w-full overflow-x-auto">{tabs}</div>}
    </header>
  );
}
