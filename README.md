# Otel Rezervasyon ve Konaklama Yönetim Sistemi

Bir otelin oda, misafir, rezervasyon, ödeme, housekeeping ve personel
süreçlerini tek panelden yönetmeyi sağlayan bir yönetim uygulaması.

İki bağımsız uygulamadan oluşur, ortak bir build adımı yoktur — her biri
kendi dizininde kurulup çalıştırılır:

- **`backend/`** — Laravel 11 JSON API (PHP 8.2, MySQL), Sanctum bearer-token
  kimlik doğrulama. Kurulum, uç nokta listesi, iş kuralları ve rol
  yetkileri için [backend/README.md](backend/README.md).
- **`frontend/`** — Next.js 16 (App Router) + React 19 + TypeScript admin
  paneli, backend'e HTTP üzerinden bağlanır. Kurulum için
  [frontend/README.md](frontend/README.md).

## Hızlı Başlangıç

```bash
# 1) Backend
cd backend
composer install
cp .env.example .env && php artisan key:generate
# .env içinde DB_* değerlerini kendi MySQL kurulumunuza göre düzenleyin
php artisan migrate --seed
php artisan serve            # http://127.0.0.1:8000

# 2) Frontend (ayrı bir terminalde)
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL varsayılanı backend'i işaret eder
npm run dev                  # http://localhost:3000
```

Tarayıcıda `http://localhost:3000` açılınca `/dashboard`'a yönlendirilir ve
giriş ekranı görüntülenir.

### Test hesapları (seed sonrası)

| Rol      | E-posta              | Şifre    |
|----------|-----------------------|----------|
| Admin    | admin@hotel.test      | password |
| Personel | personel@hotel.test   | password |

## Production Deploy (Docker / Coolify)

Repo kökündeki `docker-compose.yml`, `backend/Dockerfile` ve
`frontend/Dockerfile` ile 4 container ayağa kalkar: `hotel-db` (MySQL 8),
`hotel-backend` (Laravel, sadece iç ağda — dışarı açılmaz), `hotel-scheduler`
(günlük `Schedule::command()` işleri için `php artisan schedule:work`) ve
`hotel-frontend` (Next.js, tek dışarı açık port). Tarayıcı backend'e hiç
doğrudan bağlanmaz; tüm `/api/*` istekleri frontend container'ı üzerinden
proxy'lenir (`frontend/next.config.ts`), bu yüzden sadece tek bir port
açmak yeterli.

Tüm servisler tek bir kök `.env` dosyasını okur (`env_file: .env` —
`backend/.env` değil), çünkü Coolify'ın "Environment Variables" ekranına
girilen değerler de tam olarak bu dosyaya (`docker-compose.yml`'in yanına)
yazılıyor.

**Manuel (SSH ile docker compose):**
```bash
# Sunucuda, repo kökünde:
cp .env.production.example .env
# .env içindeki APP_KEY / DB_PASSWORD / MYSQL_ROOT_PASSWORD
# değerlerini gerçek, üretilmiş değerlerle değiştirin (dosyanın içindeki
# yorumlarda üretim komutu var) — APP_URL ve FRONTEND_URL'i sunucunun
# gerçek IP:port'una göre güncelleyin.

docker compose up -d --build
```

**Coolify (Docker Compose resource):**
Repoyu bağlayıp compose dosyası olarak kök dizindeki `docker-compose.yml`'i
gösterin, sonra resource'un Environment Variables > Production kutusuna
`.env.production.example` içeriğini gerçek değerlerle doldurup yapıştırın —
ayrıca sunucuya SSH ile bağlanıp elle bir `.env` dosyası oluşturmaya gerek
yok.

İlk ayağa kalkışta migration'lar otomatik çalışır (`RUN_MIGRATIONS=true`
olan `backend` servisi). Demo/seed verisi otomatik yüklenmez — isterseniz
tek seferlik çalıştırın:

```bash
docker compose exec backend php artisan db:seed --force
```

Uygulama `http://<sunucu-ip>:4008` üzerinden erişilebilir olur. Port
numarasını değiştirmek için `docker-compose.yml`'deki `frontend.ports`
altındaki `"4008:3000"` satırını güncelleyin — sol taraf (4008) dışarı
açılan port, sağ taraf (3000) container içindeki sabit Next.js portu.

## Teknoloji Yığını

- **Backend**: Laravel 11, MySQL, Sanctum, `barryvdh/laravel-dompdf` (fatura PDF)
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
  Recharts (dashboard grafikleri), d3-geo/topojson (dünya haritası), jsPDF
  (fiş çıktısı)

Frontend ↔ backend bağlantısı `frontend/src/lib/api.ts`'teki tek bir axios
örneği üzerinden yürür; istek/cevap interceptor'ları tüm gövdeleri
camelCase (JS) ⇄ snake_case (PHP/JSON) arasında otomatik dönüştürür.
Kimlik doğrulama `frontend/src/lib/auth.tsx`, uygulama genelindeki tek veri
kaynağı ise `frontend/src/lib/store.tsx` üzerinden yönetilir (bkz. mimari
detaylar için [CLAUDE.md](CLAUDE.md)).

## Kapsanan Özellikler

- **Oda yönetimi**: ekleme, düzenleme, pasife/aktife alma; tip, kapasite,
  gecelik ücret, özellikler, durum (müsait/dolu/bakımda), housekeeping durumu
- **Misafir yönetimi**: iletişim bilgileri, kimlik/pasaport no, geçmiş
  rezervasyonların görüntülenmesi
- **Rezervasyon yönetimi**: oda/tarih/misafir sayısı seçimi, sunucu tarafında
  hesaplanan toplam ücret, durum takibi (beklemede/onaylandı/konaklamada/
  tamamlandı/iptal), refakatçi ekleme, detay ekranı, PDF fatura
- **Müsaitlik kontrolü**: aynı oda için çakışan tarihli aktif rezervasyon
  engellenir; check-out ile aynı güne denk gelen yeni check-in'e izin verilir
- **Check-in / Check-out**: rezervasyon ve oda durumunu günceller, check-out
  sonrası oda "müsait + kirli" durumuna döner, geçmiş konaklamalar saklanır
- **Ödeme yönetimi**: toplam/ödenen/kalan tutar takibi, bir rezervasyona
  birden fazla ödeme kaydı girilebilir, ödeme toplam tutarı aşamaz
- **Housekeeping**: oda temizlik durumu (kirli/temizleniyor/temiz), bakım
  notu, öncelikli temizlik işaretleme, personel ataması
- **Oda içi sipariş (room service)**: rezervasyona ek ücret ekleme/silme,
  ekstre görüntüleme, fiş çıktısı
- **Dashboard**: bugünkü giriş/çıkışlar, oda durum dağılımı, aktif
  rezervasyon sayısı, toplam tahsilat, seçilen zaman aralığına göre gelir
  raporu, ülkeye göre rezervasyon dağılımı (dünya haritası)
- **Roller ve izinler**: sistem rolleri + özel roller, sayfa/aksiyon bazlı
  izin matrisi, personel yönetimi
- **Tablo altyapısı**: tüm liste ekranlarında arama, sütun filtreleme ve
  sayfalama
- **Durum yönetimi**: yükleniyor/boş/hata durumları için ortak bileşenler

## Bilinen Sınırlamalar

- E-posta bildirimleri ve oda fotoğrafları henüz yok
  (görev dokümanının opsiyonel maddeleri).
- Frontend'de sunucu tarafı sayfalama/filtreleme yerine tüm veri girişte
  indirilip tarayıcıda filtreleniyor — küçük/orta veri hacmi için sorun
  değil, çok büyük veri setlerinde yeniden ele alınmalı.
- Otomatik test kapsamı backend'de kısmi (bkz. `backend/README.md`),
  frontend'de henüz yok.
