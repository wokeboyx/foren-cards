import * as React from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/foren-button";
import { cn } from "@/lib/utils";

/** A Next.js Link styled as a Foren button — for navigation actions. */
export function LinkButton({
  href,
  variant,
  size,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: { href: string; leadingIcon?: React.ReactNode; trailingIcon?: React.ReactNode; className?: string; children?: React.ReactNode } & Omit<
  VariantProps<typeof buttonVariants>,
  "destructive"
> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      {leadingIcon}
      {children != null && <span>{children}</span>}
      {trailingIcon}
    </Link>
  );
}
