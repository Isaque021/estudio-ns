import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="display text-3xl text-ink-50 sm:text-4xl md:text-5xl">{title}</h2>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-ink-400 sm:text-base">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
