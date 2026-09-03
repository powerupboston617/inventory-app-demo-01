"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { findItemBySerial } from "@/lib/actions-scan";

export function ScanLookupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [miss, setMiss] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onResult(text: string) {
    setOpen(false);
    startTransition(async () => {
      const result = await findItemBySerial(text);
      if (result.found) {
        router.push(`/items/${result.id}`);
        return;
      }
      setMiss(result.serial ?? text);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMiss(null);
          setOpen(true);
        }}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-navy bg-white px-4 text-sm font-semibold text-navy"
      >
        <ScanLine className="h-4 w-4" />
        Scan barcode
      </button>

      {open ? (
        <BarcodeScanner onResult={onResult} onClose={() => setOpen(false)} />
      ) : null}

      {miss ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50"
            aria-label="Close"
            onClick={() => setMiss(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-navy">No match</h2>
            <p className="mt-2 text-sm text-mute">
              Nothing in inventory has serial{" "}
              <span className="font-medium text-navy">{miss}</span>.
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMiss(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-navy"
              >
                Close
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  router.push(`/items/new?serial=${encodeURIComponent(miss)}`)
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange px-4 text-sm font-semibold text-white"
              >
                Create item with this serial
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
