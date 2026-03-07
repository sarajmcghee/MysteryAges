import type { PropsWithChildren, ReactNode } from "react";

type Tone = "neutral" | "brand" | "ok" | "warn" | "danger";

const toneClassMap: Record<Tone, string> = {
  neutral: "tone-neutral",
  brand: "tone-brand",
  ok: "tone-ok",
  warn: "tone-warn",
  danger: "tone-danger"
};

export function Card({ title, actions, children }: PropsWithChildren<{ title?: string; actions?: ReactNode }>) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card-head">
          {title ? <h3>{title}</h3> : <span />}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({ tone = "neutral", children }: PropsWithChildren<{ tone?: Tone }>) {
  return <span className={`badge ${toneClassMap[tone]}`}>{children}</span>;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  return <button type={type} className={`btn btn-${variant} btn-${size}`} {...props} />;
}
