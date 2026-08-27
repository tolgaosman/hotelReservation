# Otel Rezervasyon ve Konaklama Yönetim Sistemi

Bir otelin oda, misafir, rezervasyon ve ödeme süreçlerini tek panelden yönetmeyi
sağlayan bir yönetim uygulaması.

## Proje Durumu

`backend/` altında Laravel 11 + MySQL ile yazılmış, rol tabanlı yetkilendirme
(Admin/Personel), müsaitlik-çakışma kontrolü ve tutarlı bir API cevap yapısı
içeren bir JSON API bulunuyor — kurulum ve uç nokta dokümantasyonu için
[backend/README.md](backend/README.md) dosyasına bakın.

Frontend (`frontend/`) şu an bu API'ye bağlı değil; hâlâ tarayıcıda önceden
tanımlanmış (seed) veriyle başlatılıp `localStorage` üzerinde tutulan
bağımsız bir durumla çalışıyor (`frontend/src/lib/store.tsx`, anahtar:
`yunma-store-v1`). Bu nedenle:

- Sayfayı yenilemek verileri sıfırlamaz (localStorage'da kalıcıdır).
- Farklı bir tarayıcı/cihazdan girildiğinde veriler paylaşılmaz.
- Frontend'de kimlik doğrulama / Admin-Personel rol ayrımı henüz yok —
  backend'i frontend'e bağlamak ve bu ayrımı arayüze taşımak bir sonraki
  aşamadır.

## Teknoloji Yığını

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** — arayüz stilleri
- **Recharts** — dashboard grafikleri
- Veri katmanı: `frontend/src/lib/store.tsx` (React Context + `useReducer`),
  seed veri `frontend/src/lib/data.ts`, iş kuralları/hesaplamalar
  `frontend/src/lib/selectors.ts` ve `frontend/src/lib/availability.ts`

## Kurulum ve Çalıştırma

Gereksinim: Node.js 18+ (Next.js 16 için önerilen sürüm).

```bash
cd frontend
npm install
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000)
adresinde çalışır ve doğrudan `/dashboard` sayfasına yönlendirir.

Diğer komutlar (hepsi `frontend/` içinde çalıştırılır):

```bash
npm run build   # production build
npm run start   # production build'i çalıştırır
npm run lint    # ESLint kontrolü
```

Verileri sıfırlamak (seed'e dönmek) için tarayıcıda o sekmenin
localStorage'ındaki `yunma-store-v1` anahtarını silmek yeterlidir
(DevTools → Application → Local Storage).

## Proje Yapısı (frontend/src)

```
app/(app)/            Sayfalar: dashboard, reservations, rooms, guests, payments, settings
components/           Sayfa/özellik bazlı bileşenler (dashboard, rooms, guests, reservations, payments, ui)
lib/
  types.ts            Ortak tip tanımları (Room, Guest, Reservation, Payment, ...)
  data.ts             Deterministik seed veri (oda, misafir, rezervasyon, ödeme geçmişi)
  store.tsx           Uygulama durumu, CRUD işlemleri ve iş kuralları (React Context)
  availability.ts     Oda müsaitlik / tarih çakışması kontrolü
  selectors.ts        Dashboard istatistikleri, gelir/rezervasyon serileri, filtreleme yardımcıları
  format.ts           Para/tarih biçimlendirme yardımcıları
```

## Kapsanan Özellikler

- **Oda yönetimi**: ekleme, düzenleme, pasife alma; tip, kapasite, gecelik
  ücret, özellikler, durum (müsait/dolu/bakımda)
- **Misafir yönetimi**: iletişim bilgileri, kimlik/pasaport no, geçmiş
  rezervasyonların görüntülenmesi
- **Rezervasyon yönetimi**: oda/tarih/misafir sayısı seçimi, otomatik toplam
  ücret hesaplama, durum takibi (beklemede/onaylandı/iptal/tamamlandı),
  detay ekranı
- **Müsaitlik kontrolü**: aynı oda için çakışan tarihli aktif rezervasyon
  engellenir; check-out ile aynı güne denk gelen yeni check-in'e izin
  verilir (`frontend/src/lib/availability.ts`)
- **Check-in / Check-out**: rezervasyon durumunu günceller, check-out sonrası
  oda tekrar müsait duruma döner, geçmiş konaklamalar saklanır
- **Ödeme yönetimi**: toplam/ödenen/kalan tutar takibi, bir rezervasyona
  birden fazla ödeme kaydı girilebilir
- **Dashboard**: bugünkü giriş/çıkışlar, oda durum dağılımı, aktif rezervasyon
  sayısı, toplam tahsilat, seçilen zaman aralığına göre gelir raporu
- **Tablo altyapısı**: tüm liste ekranlarında arama, sütun filtreleme ve
  sayfalama (`components/ui/DataTable.tsx`)
- **Durum yönetimi**: yükleniyor/boş/hata durumları için ortak bileşenler
  (`components/ui/Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`)

## Bilinen Eksikler / Sonraki Adımlar

- Frontend'in `backend/` API'sine bağlanması (şu an mock veri + localStorage
  ile bağımsız çalışıyor)
- Frontend'de kimlik doğrulama ve Admin/Personel rol ayrımı (backend'de mevcut)
- E-posta bildirimleri, oda fotoğrafları, kupon/indirim sistemi
