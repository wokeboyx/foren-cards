import type { Component, VNode } from "vue";

export type ForenSearchResult = {
  /** Unique value passed back with the `select` event. */
  value: string;
  /** Display label. */
  label: string;
  /** Optional secondary text below the label. */
  description?: string;
  /** Optional leading icon: a component or a vnode made with `h()`. Defaults to a cube. */
  icon?: Component | VNode;
};

export interface ForenSearchProps {
  /** Controlled input value (v-model). */
  modelValue?: string;
  defaultValue?: string;
  /** Static list of results, or use `onSearch` for custom filtering. */
  results?: ForenSearchResult[];
  /** Override the default substring filter. Return a list given the query. */
  onSearch?: (query: string) => ForenSearchResult[];
  placeholder?: string;
  size?: "xs" | "md" | "lg";
  /** Show a × clear button when value is non-empty. Defaults true. */
  clearable?: boolean;
  /** Show the results panel even when query is empty. */
  alwaysShowResults?: boolean;
  /** Class for the <input>. */
  class?: string;
  containerClassName?: string;
  /** Hide built-in result panel — useful when you want to manage UI yourself. */
  hideResults?: boolean;
  /** aria-label for the input. */
  ariaLabel?: string;
  disabled?: boolean;
}
