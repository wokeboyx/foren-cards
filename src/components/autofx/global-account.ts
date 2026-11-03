import type { Component } from "vue";
import {
  RiArrowUpDownLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiFlashlightLine,
  RiScales3Line,
  RiShieldCheckLine,
  RiTimeLine,
} from "@/components/icons";
import type { BadgeColor } from "@/components/ui/foren-badge";
import type { Currency, GoalStatus, GoalType } from "@/domain/types";
import { asset } from "@/lib/base-path";

export const GOAL_TYPES: Record<
  GoalType,
  { title: string; line: string; icon: Component }
> = {
  keep_min: {
    title: "Keep a minimum balance",
    line: "Top a currency up from another balance when it drops below a floor.",
    icon: RiShieldCheckLine,
  },
  target_rate: {
    title: "Convert at a target rate",
    line: "Convert an amount automatically once the exchange rate reaches your target.",
    icon: RiArrowUpDownLine,
  },
  cap: {
    title: "Cap a balance",
    line: "Move anything above a ceiling into another currency.",
    icon: RiScales3Line,
  },
};

export const GOAL_TYPE_IDS = Object.keys(GOAL_TYPES) as GoalType[];

export const STATUS: Record<
  GoalStatus,
  { label: string; color: BadgeColor; icon: Component }
> = {
  on_track: { label: "On track", color: "success", icon: RiCheckboxCircleLine },
  waiting_for_rate: {
    label: "Waiting for rate",
    color: "indigo",
    icon: RiTimeLine,
  },
  action_taken: {
    label: "Action taken",
    color: "primary",
    icon: RiFlashlightLine,
  },
  unable_to_act: {
    label: "Unable to act",
    color: "error",
    icon: RiCloseCircleLine,
  },
};

export const FLAGS: Partial<Record<Currency, string>> = {
  USD: asset("/foren/wallet/flag-usd.png"),
  GBP: asset("/foren/wallet/flag-gbp.png"),
  CAD: asset("/foren/wallet/flag-cad.png"),
};
