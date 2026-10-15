"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
export type TreeNode = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children?: TreeNode[];
  /** Pass-through payload. */
  data?: unknown;
  disabled?: boolean;
};
export interface ForenTreeViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  data: TreeNode[];
  /** Initial expanded ids when uncontrolled. */
  defaultExpandedIds?: string[];
  /** Controlled expanded ids. */
  expandedIds?: string[];
  onExpandedChange?: (next: string[]) => void;
  /** Controlled selection. */
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (next: string[]) => void;
  onNodeClick?: (node: TreeNode) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  /** Render guide lines between siblings. */
  showLines?: boolean;
  /** Render leading icon slot (folder / file fallback or node.icon). */
  showIcons?: boolean;
  /** Indent unit in px per depth. */
  indent?: number;
  /** Disable expand animation. */
  animateExpand?: boolean;
}
const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const FolderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const FolderOpenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3Z" />
    <path d="m3 9 1.7 8.4A2 2 0 0 0 6.66 19h10.68a2 2 0 0 0 1.96-1.6L21 9" />
  </svg>
);
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
    <path d="M14 3v6h6" />
  </svg>
);
export function ForenTreeView({
  data,
  className,
  defaultExpandedIds = [],
  expandedIds,
  onExpandedChange,
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  onNodeClick,
  selectable = true,
  multiSelect = false,
  showLines = true,
  showIcons = true,
  indent = 20,
  animateExpand = true,
  ...props
}: ForenTreeViewProps) {
  const expandedControlled = expandedIds !== undefined;
  const selectionControlled = selectedIds !== undefined;
  const [internalExpanded, setInternalExpanded] = React.useState<string[]>(defaultExpandedIds);
  const [internalSelected, setInternalSelected] = React.useState<string[]>(defaultSelectedIds);
  const currentExpanded = expandedControlled ? expandedIds! : internalExpanded;
  const currentSelected = selectionControlled ? selectedIds! : internalSelected;
  function setExpanded(next: string[]) {
    if (!expandedControlled) setInternalExpanded(next);
    onExpandedChange?.(next);
  }
  function setSelected(next: string[]) {
    if (!selectionControlled) setInternalSelected(next);
    onSelectionChange?.(next);
  }
  function toggleExpanded(id: string) {
    if (currentExpanded.includes(id)) {
      setExpanded(currentExpanded.filter((x) => x !== id));
    } else {
      setExpanded([...currentExpanded, id]);
    }
  }
  function handleSelect(node: TreeNode, multiKey: boolean) {
    if (!selectable || node.disabled) return;
    let next: string[];
    if (multiSelect && multiKey) {
      next = currentSelected.includes(node.id)
        ? currentSelected.filter((x) => x !== node.id)
        : [...currentSelected, node.id];
    } else {
      next = currentSelected.includes(node.id) && currentSelected.length === 1 ? [] : [node.id];
    }
    setSelected(next);
  }
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-[var(--color-foren-border-muted)] bg-[var(--color-foren-bg-default)] p-1.5",
        className
      )}
      role="tree"
      {...props}
    >
      {data.map((node, i) => (
        <TreeRow
          key={node.id}
          node={node}
          level={0}
          isLast={i === data.length - 1}
          parentLasts={[]}
          expanded={currentExpanded}
          selected={currentSelected}
          toggleExpanded={toggleExpanded}
          handleSelect={handleSelect}
          onNodeClick={onNodeClick}
          showLines={showLines}
          showIcons={showIcons}
          indent={indent}
          animateExpand={animateExpand}
        />
      ))}
    </div>
  );
}
interface TreeRowProps {
  node: TreeNode;
  level: number;
  /** True when this node is the last child of its parent. */
  isLast: boolean;
  /** For each ancestor depth, whether that ancestor was last-at-its-level. */
  parentLasts: boolean[];
  expanded: string[];
  selected: string[];
  toggleExpanded: (id: string) => void;
  handleSelect: (node: TreeNode, multiKey: boolean) => void;
  onNodeClick?: (node: TreeNode) => void;
  showLines: boolean;
  showIcons: boolean;
  indent: number;
  animateExpand: boolean;
}
function TreeRow({
  node,
  level,
  isLast,
  parentLasts,
  expanded,
  selected,
  toggleExpanded,
  handleSelect,
  onNodeClick,
  showLines,
  showIcons,
  indent,
  animateExpand,
}: TreeRowProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const isOpen = expanded.includes(node.id);
  const isSelected = selected.includes(node.id);
  const defaultIcon = hasChildren ? (isOpen ? <FolderOpenIcon /> : <FolderIcon />) : <FileIcon />;
  function onRowClick(e: React.MouseEvent<HTMLDivElement>) {
    if (node.disabled) return;
    if (hasChildren) toggleExpanded(node.id);
    handleSelect(node, e.metaKey || e.ctrlKey);
    onNodeClick?.(node);
  }
  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (node.disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hasChildren) toggleExpanded(node.id);
      handleSelect(node, e.metaKey || e.ctrlKey);
      onNodeClick?.(node);
    } else if (e.key === "ArrowRight" && hasChildren && !isOpen) {
      e.preventDefault();
      toggleExpanded(node.id);
    } else if (e.key === "ArrowLeft" && hasChildren && isOpen) {
      e.preventDefault();
      toggleExpanded(node.id);
    }
  }
  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-selected={isSelected}
      aria-disabled={node.disabled || undefined}
      className="select-none"
    >
      <div
        tabIndex={node.disabled ? -1 : 0}
        onClick={onRowClick}
        onKeyDown={onKey}
        className={cn(
          "relative flex items-center gap-1.5 py-1.5 pr-2 rounded-md cursor-pointer outline-none transition-colors duration-150",
          "text-[13px] leading-[18px] tracking-[0.01em] font-medium text-[var(--color-foren-text-primary)]",
          "hover:bg-[var(--color-foren-bg-sunken)] focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)]",
          isSelected && "bg-[var(--color-foren-bg-subtle)]",
          node.disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ paddingLeft: 8 + level * indent }}
      >
        {showLines && level > 0 && (
          <>
            {/* Ancestor vertical rails — drop the rail past any ancestor
                that was the last child at its own level. */}
            {parentLasts.map((wasLast, d) =>
              wasLast ? null : (
                <span
                  key={d}
                  aria-hidden
                  className="absolute top-0 bottom-0 border-l border-[var(--color-foren-border-muted)] pointer-events-none"
                  style={{ left: d * indent + 14 }}
                />
              )
            )}
            {/* Immediate parent rail — full height if more siblings follow,
                top→midpoint (L-bend) if this row is the last child. */}
            <span
              aria-hidden
              className="absolute left-0 border-l border-[var(--color-foren-border-muted)] pointer-events-none"
              style={{
                left: (level - 1) * indent + 14,
                top: 0,
                height: isLast ? "50%" : "100%",
              }}
            />
            {/* Horizontal connector from parent rail to row content. */}
            <span
              aria-hidden
              className="absolute border-t border-[var(--color-foren-border-muted)] pointer-events-none"
              style={{
                left: (level - 1) * indent + 14,
                width: indent - 6,
                top: "50%",
              }}
            />
          </>
        )}
        <span
          className={cn(
            "inline-flex items-center justify-center size-4 shrink-0 text-[var(--color-foren-text-tertiary)] transition-transform duration-150 ease-out",
            hasChildren ? (isOpen ? "rotate-90" : "rotate-0") : "opacity-0"
          )}
          aria-hidden
        >
          <ChevronIcon />
        </span>
        {showIcons && (
          <span className="inline-flex items-center justify-center size-4 shrink-0 text-[var(--color-foren-text-secondary)]" aria-hidden>
            {node.icon ? (
              node.icon
            ) : hasChildren ? (
              <span className="t-icon-swap" data-state={isOpen ? "a" : "b"}>
                <span className="t-icon" data-icon="a">
                  <FolderOpenIcon />
                </span>
                <span className="t-icon" data-icon="b">
                  <FolderIcon />
                </span>
              </span>
            ) : (
              <FileIcon />
            )}
          </span>
        )}
        <span className="truncate flex-1">{node.label}</span>
      </div>
      {hasChildren && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] ease-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            animateExpand ? "duration-200" : "duration-0"
          )}
          aria-hidden={!isOpen}
        >
          <div className="overflow-hidden">
            {node.children!.map((child, i) => (
              <TreeRow
                key={child.id}
                node={child}
                level={level + 1}
                isLast={i === node.children!.length - 1}
                parentLasts={[...parentLasts, isLast]}
                expanded={expanded}
                selected={selected}
                toggleExpanded={toggleExpanded}
                handleSelect={handleSelect}
                onNodeClick={onNodeClick}
                showLines={showLines}
                showIcons={showIcons}
                indent={indent}
                animateExpand={animateExpand}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}