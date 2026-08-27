"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <ErrorState
        title="Bu sayfa yüklenirken bir hata oluştu"
        description="Beklenmeyen bir sorun oluştu. Tekrar denemek verileri yeniden yüklemeye çalışır."
        onRetry={reset}
      />
    </div>
  );
}
