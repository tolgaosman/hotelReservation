"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

const FIELD_CLASS =
  "h-[52px] rounded-full border-[var(--line)] bg-[var(--surface-alt)]/80 py-0 text-[15px] " +
  "transition-[border-color,background-color,box-shadow] duration-200 " +
  "focus:ring-4 focus:ring-[var(--accent-soft)]/60";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post("/api/login", { email, password });
      login(res.data.data.token, res.data.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--canvas)] p-4">
      {/* Referanstaki mavi bloom'un açık zemin karşılığı: blur'lanmış lacivert auralar. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Centered via left/margin, not translate-x, so the drift keyframe's own transform doesn't fight the centering. */}
        <div className="absolute -bottom-40 left-1/2 h-[560px] w-[820px] -ml-[410px]">
          <div className="ambient-drift h-full w-full rounded-full bg-[var(--accent)]/14 blur-[130px]" />
        </div>
        <div className="ambient-drift absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-[var(--info)]/18 blur-[120px] [animation-delay:-6s]" />
        <div className="absolute -top-32 right-0 h-[380px] w-[520px] rounded-full bg-[var(--accent-soft)]/50 blur-[120px]" />
      </div>

      <div
        className="animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-[400px] rounded-[28px] border border-white/80 bg-gradient-to-b from-white/90 to-white/65 p-8 shadow-[var(--shadow-pop)] ring-1 ring-[var(--accent)]/[0.06] backdrop-blur-xl duration-500 [animation-timing-function:var(--ease-organic)]"
      >
        <div className="mb-8 text-center">
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)]">
            Giriş Yap
          </h1>
          <p className="mx-auto mt-3 max-w-[300px] text-balance text-sm leading-relaxed text-[var(--muted)]">
            Otel yönetim paneline giriş yapın ve rezervasyonları kaldığınız yerden yönetmeye devam edin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="animate-in fade-in slide-in-from-bottom-2 relative duration-500 [animation-delay:80ms] [animation-fill-mode:backwards] [animation-timing-function:var(--ease-organic)]">
            <label htmlFor="login-email" className="sr-only">
              E-posta adresi
            </label>
            <Mail
              size={17}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresinizi girin"
              className={`${FIELD_CLASS} pl-11 pr-4`}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 relative duration-500 [animation-delay:140ms] [animation-fill-mode:backwards] [animation-timing-function:var(--ease-organic)]">
            <label htmlFor="login-password" className="sr-only">
              Şifre
            </label>
            <Lock
              size={17}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className={`${FIELD_CLASS} pl-11 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-colors duration-200 [transition-timing-function:var(--ease-organic)] hover:text-[var(--accent)]"
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="animate-in fade-in slide-in-from-top-1 rounded-2xl bg-[var(--crit-soft)] px-4 py-3 text-sm font-medium text-[var(--crit)] duration-300 [animation-timing-function:var(--ease-organic)]"
            >
              {error}
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-2 pt-2 duration-500 [animation-delay:200ms] [animation-fill-mode:backwards] [animation-timing-function:var(--ease-organic)]">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[52px] w-full rounded-full py-0 text-[15px] shadow-[0_8px_24px_-10px_var(--accent)] hover:shadow-[0_14px_32px_-12px_var(--accent)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Giriş yapılıyor…
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-7 border-t border-[var(--line)] pt-5">
          <p className="mb-3 text-center text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
            Demo Hesapları (Tek Tıkla Giriş)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Sistem Yöneticisi", role: "Admin", email: "admin@hotel.test", password: "password" },
              { name: "Elif Demir", role: "Resepsiyonist", email: "elif.demir@hotel.test", password: "12345678" },
              { name: "Ayşe Yıldız", role: "Muhasebeci", email: "ayse.yildiz@hotel.test", password: "12345678" },
              { name: "Hatice Aydın", role: "Temizlikçi", email: "hatice.aydin@hotel.test", password: "12345678" },
              { name: "Deniz Aksoy", role: "Garson", email: "deniz.aksoy@hotel.test", password: "12345678" },
              { name: "Burak Şahin", role: "Resepsiyon Amiri", email: "burak.sahin@hotel.test", password: "12345678" },
              { name: "Kemal Er", role: "Muhasebe Müdürü", email: "kemal.er@hotel.test", password: "12345678" },
              { name: "Mehmet Kaya", role: "Temizlik Sorumlusu", email: "mehmet.kaya@hotel.test", password: "12345678" },
              { name: "Serkan Yılmaz", role: "Garson Şefi", email: "serkan.yilmaz@hotel.test", password: "12345678" },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="group flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2 text-center transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 hover:shadow-sm"
              >
                <span className="text-[11px] font-medium text-[var(--ink)] group-hover:text-[var(--accent)]">{acc.name}</span>
                <span className="text-[9px] text-[var(--muted)]">{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
