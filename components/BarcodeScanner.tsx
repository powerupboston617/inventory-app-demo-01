"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function BarcodeScanner({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const done = useRef(false);
  const onResultRef = useRef(onResult);
  const onCloseRef = useRef(onClose);
  onResultRef.current = onResult;
  onCloseRef.current = onClose;

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear?: () => void } | null = null;
    const regionId = "pub-qr-reader";

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const inst = new Html5Qrcode(regionId);
        scanner = inst;
        running.current = true;
        await inst.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (done.current) return;
            done.current = true;
            const text = decoded.trim();
            inst
              .stop()
              .catch(() => undefined)
              .finally(() => {
                running.current = false;
                if (text) onResultRef.current(text);
                else onCloseRef.current();
              });
          },
          () => undefined,
        );
      } catch (err) {
        running.current = false;
        const name = err instanceof Error ? err.name : "";
        const message = err instanceof Error ? err.message : "";
        if (name === "NotAllowedError" || /permission/i.test(message)) {
          setError("Camera permission was denied. You can still type the serial number.");
        } else if (/camera|video|NotFound/i.test(message + name)) {
          setError("No camera was found on this device. Type the serial number instead.");
        } else {
          setError(
            "Could not start the camera. Use HTTPS or localhost, and keep typing the serial by hand.",
          );
        }
      }
    }

    void start();

    return () => {
      if (scanner && running.current) {
        scanner.stop().catch(() => undefined);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close scanner"
        className="absolute inset-0 bg-navy/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Scan barcode</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-mute hover:bg-page"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {error ? (
          <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
            {error}
          </p>
        ) : (
          <p className="mb-3 text-sm text-mute">
            Point the camera at a barcode or QR of the serial number.
          </p>
        )}
        <div id="pub-qr-reader" className="overflow-hidden rounded-xl bg-black" />
      </div>
    </div>
  );
}
