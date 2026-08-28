# Otel Rezervasyon Sistemi — Frontend

Next.js 16 (App Router) + React 19 + TypeScript admin paneli. `backend/`
altındaki Laravel API'sine HTTP üzerinden bağlanır — bağımsız bir veri
katmanı veya mock veri kullanmaz.

## Gereksinimler

- Node.js 18+
- Çalışan bir backend örneği (bkz. [../backend/README.md](../backend/README.md))

## Kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` içindeki `NEXT_PUBLIC_API_URL`, backend'in adresini gösterir
(varsayılan `http://localhost:8000`). Backend farklı bir adres/portta
çalışıyorsa burayı güncelleyin.

## Çalıştırma

```bash
npm run dev     # http://localhost:3000
```

Diğer komutlar:

```bash
npm run build   # production build
npm run start   # production build'i çalıştırır
npm run lint    # ESLint
npx tsc --noEmit -p tsconfig.json   # tip kontrolü (ayrı bir test runner yok)
```

## Proje Yapısı (`src/`)

```
app/(app)/          Sayfalar: dashboard, reservations, calendar, guests, rooms,
                     housekeeping, room-service, payments, employees, roles, settings
app/login/           Kimlik doğrulama gerektirmeyen giriş sayfası
components/<feature>/ Sayfaları yansıtan özellik bazlı bileşenler
components/ui/        Paylaşılan primitifler (DataTable, Drawer, Skeleton, Toast, ...)
lib/
  api.ts             Tek axios örneği; camelCase ⇄ snake_case otomatik dönüşümü
  auth.tsx           Sanctum token + kullanıcı/izin durumu (AuthProvider/useAuth)
  store.tsx          Uygulama genelindeki tek veri kaynağı (StoreProvider/useStore)
  fetchAllPages.ts   Sunucu tarafı sayfalı listeleri tümüyle çeken yardımcı
  selectors.ts       Dashboard istatistikleri, gelir serileri, filtreleme yardımcıları
  availability.ts    Oda müsaitlik / tarih çakışması kontrolü (backend ile aynı kural)
  nav.ts             Sidebar'ın tek doğruluk kaynağı: sayfalar, ikonlar, gerekli izinler
  types.ts           Backend API kaynak şekillerinin (camelCase) TS karşılıkları
```

## Kimlik Doğrulama

`localStorage`'da tutulan bir Sanctum bearer token ile çalışır. Giriş
ekranındaki hesaplar için bkz. kök [README.md](../README.md#test-hesapları-seed-sonrası).

## Bilinen Sınırlamalar

- Rota koruması istemci tarafında yapılır (`middleware.ts` yok); korumalı bir
  sayfa, yönlendirmeden önce kısa süreliğine render edilebilir.
- Backend tamamen erişilemez olduğunda arayüz şu an "kayıt yok" (boş liste)
  gösterir; ayrı bir "bağlantı hatası" durumu henüz yok.
