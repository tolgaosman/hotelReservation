# Otel Rezervasyon Sistemi — Backend API

Laravel 11 + MySQL ile yazılmış, `frontend/` altındaki Next.js arayüzüne hizmet
verecek JSON API. Oda, misafir, rezervasyon ve ödeme yönetimini; rol tabanlı
yetkilendirmeyi (Admin / Personel); müsaitlik-çakışma kontrolünü; ve tutarlı
bir API cevap yapısını içerir.

## Gereksinimler

- PHP ^8.2 (gerekli uzantılar: `pdo_mysql`, `bcmath`, `mbstring`, `json`)
- Composer 2
- MySQL 8 (veya MariaDB 10.4+)

## Kurulum

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

`.env` içinde `DB_*` değerlerini kendi MySQL kurulumunuza göre düzenleyin
(varsayılan port `3306`'dır; XAMPP gibi bazı kurulumlarda farklı bir port
kullanılıyor olabilir — bu durumda `DB_PORT`'u ona göre güncelleyin).
Ardından veritabanını oluşturun:

```sql
CREATE DATABASE hotel_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Migration ve seed işlemlerini çalıştırın:

```bash
php artisan migrate --seed
```

Bu komut şemayı oluşturur ve gerçekçi geliştirme verisi (60 oda, 200 misafir,
geçmiş/güncel/gelecek tarihli rezervasyonlar ve ödemeler) ile birlikte iki
test kullanıcısı ekler.

## Çalıştırma

```bash
php artisan serve
```

API varsayılan olarak `http://127.0.0.1:8000` üzerinde çalışır. Next.js
frontend'in adresi `FRONTEND_URL` (varsayılan `http://localhost:3000`)
üzerinden CORS yapılandırmasına bağlanır.

## Test Kullanıcıları

| Rol      | E-posta             | Şifre    |
|----------|----------------------|----------|
| Admin    | admin@hotel.test     | password |
| Personel | personel@hotel.test  | password |

## Kimlik Doğrulama

API, Laravel Sanctum ile bearer token tabanlı kimlik doğrulama kullanır.

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.test","password":"password"}'
```

Dönen `data.token` değeri sonraki isteklerde şu şekilde kullanılır:

```bash
curl http://127.0.0.1:8000/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

`POST /api/logout` mevcut token'ı iptal eder, `GET /api/me` giriş yapan
kullanıcının bilgilerini döner.

## API Cevap Yapısı

Tüm cevaplar aynı zarf (envelope) içinde döner:

```json
// Başarılı
{ "success": true, "message": "Rezervasyon oluşturuldu.", "data": { ... } }

// Doğrulama/iş kuralı hatası (422)
{ "success": false, "message": "...", "errors": { "room_id": ["..."] } }
```

Sayfalanan listeler `data` içinde `items` ve `meta` (current_page, last_page,
per_page, total) alanlarını barındırır.

## Uç Noktalar (özet)

Tüm uç noktalar `POST /api/login` hariç `Authorization: Bearer <token>`
gerektirir. Tam liste için: `php artisan route:list --path=api`.

```
POST   /api/login
POST   /api/logout
GET    /api/me

GET    /api/rooms                          ?search=&status=&active=&per_page=
POST   /api/rooms                          (admin)
GET    /api/rooms/{room}
PATCH  /api/rooms/{room}                   (admin)
PATCH  /api/rooms/{room}/deactivate        (admin)
PATCH  /api/rooms/{room}/activate          (admin)
GET    /api/rooms/{room}/availability      ?check_in=&check_out=

GET    /api/guests                         ?search=&per_page=
POST   /api/guests
GET    /api/guests/{guest}
PATCH  /api/guests/{guest}
GET    /api/guests/{guest}/reservations

GET    /api/reservations                   ?status=&guest_id=&room_id=&per_page=
POST   /api/reservations
GET    /api/reservations/{reservation}
PATCH  /api/reservations/{reservation}
POST   /api/reservations/{reservation}/confirm
POST   /api/reservations/{reservation}/cancel
POST   /api/reservations/{reservation}/check-in
POST   /api/reservations/{reservation}/check-out
GET    /api/reservations/{reservation}/payments

GET    /api/payments                       (admin) ?reservation_id=&per_page=
POST   /api/payments                       (admin)

GET    /api/dashboard/stats
GET    /api/dashboard/today
GET    /api/dashboard/revenue              ?from=&to=&bucket=day|week|month
```

## İş Kuralları

- **Çakışma kontrolü**: Aynı oda için, aktif durumdaki (pending/confirmed/
  checked_in) rezervasyonlar arasında tarih çakışması engellenir. Bir
  rezervasyonun check-out tarihi ile başka bir rezervasyonun check-in tarihi
  aynı güne denk gelebilir (aynı gün devir/turnover desteklenir).
- **Durum geçişleri**: `pending → confirmed → checked_in → completed`, veya
  `pending|confirmed → cancelled`. Başka geçişler reddedilir. Check-in odayı
  `occupied`, check-out ise `available` durumuna geçirir.
- **Ödeme sınırı**: Bir rezervasyona yapılan ödemelerin toplamı, rezervasyonun
  `total_amount` değerini aşamaz.
- **Toplam tutar**: `nightly_rate * gece_sayısı` olarak sunucu tarafında
  hesaplanır; istemciden gönderilen bir değer kabul edilmez.
- Rezervasyonlar hiçbir zaman silinmez, yalnızca durum değiştirir (geçmiş
  konaklamalar saklanır). Dolu bir oda pasife alınamaz.

## Rol Yetkileri

- **Admin**: Odalar, misafirler, rezervasyonlar ve ödemeler üzerinde tam
  yetki.
- **Personel**: Rezervasyon oluşturma/güncelleme, check-in/check-out, misafir
  görüntüleme/oluşturma. Oda yönetimi ve ödeme listeleme/oluşturma admin'e
  özeldir.

## Testler

```bash
php artisan test
```

`tests/Feature/` altında; çakışma kuralı (`ReservationConflictTest`), durum
geçişleri (`ReservationLifecycleTest`), ödeme bakiye sınırı (`PaymentTest`),
rol yetkilendirmesi (`AuthorizationTest`) ve oda pasife alma kısıtı
(`RoomDeactivationTest`) için testler bulunur.

Testler `.env.testing` dosyasındaki ayrı bir veritabanını (`hotel_reservation_test`)
kullanır ve her testten önce şemayı sıfırlar (`RefreshDatabase`).
