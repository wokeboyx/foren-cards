import type { Component } from "vue";

export type TreeNode = {
  id: string;
  label: string;
  icon?: Component;
  children?: TreeNode[];
  /** Pass-through payload. */
  data?: unknown;
  disabled?: boolean;
};
