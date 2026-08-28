"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Eye, EyeOff } from "lucide-react";

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
      // Sanctum SPA authentication uses CSRF cookie if domains match, 
      // but we are using Token-based authentication based on our api.ts setup.
      const res = await api.post("/api/login", { email, password });
      
      const token = res.data.data.token;
      const user = res.data.data.user;
      
      login(token, user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
            Otel Yönetim Paneli
          </h1>
          <p className="mt-2 text-sm font-medium text-[var(--muted)]">
            Sisteme giriş yapmak için bilgilerinizi girin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="E-posta">
            <Input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@hotel.test"
            />
          </FormField>

          <FormField label="Şifre">
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FormField>

          {error && (
            <div className="rounded-[var(--radius-control)] bg-[var(--crit-soft)] p-3 text-sm font-medium text-[var(--crit)]">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
        
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 text-center text-xs text-[var(--muted)]">
            <p>Admin: admin@hotel.test / password</p>
            <p>Personel: personel@hotel.test / password</p>
          </div>
        )}
      </div>
    </div>
  );
}
