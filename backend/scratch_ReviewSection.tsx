"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getReviews } from "@/lib/api";
import type { Review } from "@/lib/types";
import { format } from "date-fns";
import { tr as trLocale } from "date-fns/locale";

export function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    getReviews().then(setReviews).catch(console.error);
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-canvas py-16 lg:py-24">
      <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
        <h2 className="text-center font-serif text-3xl text-ink">Misafirlerimiz Ne Dedi?</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review) => (
            <div key={review.id} className="bg-surface p-6 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i <= review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-line"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm italic text-ink/80 mb-4">&quot;{review.comment}&quot;</p>
              <div className="text-xs text-ink">
                <strong>{review.reservation?.guest?.full_name || "Misafir"}</strong>
                <span className="opacity-50 ml-2">
                  {format(new Date(review.created_at), "d MMM yyyy", { locale: trLocale })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
