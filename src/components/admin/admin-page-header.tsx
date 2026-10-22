import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-3xl text-ink-50">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.14em] text-ink-500 uppercase">{label}</p>
        {Icon && <Icon className="size-4 text-brand-500" />}
      </div>
      <p className="font-display mt-3 text-3xl text-ink-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
