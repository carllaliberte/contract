import { type ButtonHTMLAttributes, type ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-45 active:not-disabled:scale-[0.98]";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.06)_inset] h-11 px-5",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 px-4",
  outline:
    "border border-border bg-transparent hover:bg-secondary/80 h-11 px-4",
  ghost: "hover:bg-secondary h-10 px-3 font-medium",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-8 text-[13px]" : "size-9 text-sm";
  const label = size === "sm" ? "text-[15px]" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid ${box} place-items-center rounded-[10px] bg-primary font-bold text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]`}
      >
        C
      </span>
      <span className={`${label} font-semibold tracking-tight`}>CreatorFlow</span>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idea: "bg-status-idea/15 text-status-idea",
    script: "bg-status-script/15 text-status-script",
    production: "bg-status-production/15 text-status-production",
    ready: "bg-status-ready/15 text-status-ready",
    published: "bg-status-published/15 text-status-published",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${colors[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 ${className}`}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
      {children}
    </label>
  );
}
