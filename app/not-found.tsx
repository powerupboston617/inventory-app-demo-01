import { EmptyState } from "@/components/EmptyState";
import { Package } from "lucide-react";

export default function NotFound() {
  return (
    <EmptyState
      icon={Package}
      title="We couldn't find that"
      description="It may have been deleted, or the link is off. Head back to the dashboard and start from there."
      actionHref="/"
      actionLabel="Go to dashboard"
    />
  );
}
