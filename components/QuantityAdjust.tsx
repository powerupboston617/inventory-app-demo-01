"use client";

import { useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { adjustQuantity } from "@/lib/actions";

export function QuantityAdjust({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) {
  const [pending, startTransition] = useTransition();

  function bump(delta: number) {
    startTransition(() => {
      void adjustQuantity(itemId, delta);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending || quantity <= 0}
        onClick={() => bump(-1)}
        aria-label="Decrease quantity"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-page text-navy ring-1 ring-black/5 disabled:opacity-40"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="min-w-14 text-center">
        <p className="text-3xl font-bold tabular-nums leading-none text-navy">
          {quantity}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-mute">
          Qty
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => bump(1)}
        aria-label="Increase quantity"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange text-white disabled:opacity-40"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
