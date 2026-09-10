import { cn } from "cn";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("size-8 shrink-0", className)}
      aria-hidden
    >
      <rect width="48" height="48" rx="10.5" fill="#111827" />
      <path
        d="M14 14L24 24L14 34"
        stroke="#6366F1"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 34H34" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="30" cy="18" r="4" fill="#6366F1" />
    </svg>
  );
}
