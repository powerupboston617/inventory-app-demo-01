export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="10" fill="#FF7300" />
      <path
        d="M23 5.5 10 20.5h8.6L15.2 34.5 30.5 17.2h-8.4L23 5.5z"
        fill="#ffffff"
      />
    </svg>
  );
}
