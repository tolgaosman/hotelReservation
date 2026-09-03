"use client";

import { useState } from "react";
import { tr } from "@/lib/dictionary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createReview, ApiError } from "@/lib/api";
import type { Reservation } from "@/lib/types";
import { Star } from "lucide-react";

export function ReviewModal({
  reservation,
  token,
  open,
  onOpenChange,
}: {
  reservation: Reservation;
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createReview(
        {
          reservation_id: reservation.id,
          rating,
          comment,
        },
        token,
      );
      setSuccess(true);
      setTimeout(() => onOpenChange(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yorum kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Konaklamanızı Değerlendirin</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center text-emerald-600">
            <p>Değerlendirmeniz için teşekkür ederiz!</p>
            <p className="text-sm mt-2 opacity-80">Yorumunuz yönetici onayından sonra yayınlanacaktır.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="flex flex-col gap-2 items-center">
              <span className="text-sm text-ink/70">Nasıl bir deneyimdi?</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="p-1"
                  >
                    <Star
                      className={`size-8 transition-colors ${
                        i <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-line"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="comment" className="text-[11px] uppercase tracking-[0.1em] text-label">
                Yorumunuz (İsteğe Bağlı)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px] w-full border-b border-line bg-transparent p-2 text-sm outline-none transition-colors focus:border-ink/40"
                placeholder="Deneyiminizi anlatın..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={submitting}
              className="mt-4 h-11 w-full rounded-none bg-brand text-[11px] tracking-[0.14em] text-white hover:bg-brand-hover"
            >
              {submitting ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
