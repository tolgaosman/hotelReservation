# Agent Skills & Design Guidelines

Bu dosya, projedeki geliştirme süreçlerinde yapay zeka asistanının veya geliştiricilerin takip etmesi gereken temel "yetenek" (skill) ve prensipleri içermektedir.

---

## 1. Impeccable (Kusursuz Kodlama)
**"Impeccable"** prensibi, kodun ilk yazıldığında kusursuz çalışmasını hedefler. 
- **Sıfır Hata:** Kod yazılırken syntax hataları, eksik import'lar veya type (TypeScript) hataları bırakılamaz.
- **Edge Case (Uç Durum) Yönetimi:** Tüm olası uç durumlar önceden düşünülür ve kodda handle edilir (null check'ler, empty state'ler, loading durumları).
- **Temiz Kod:** Gereksiz tekrarlardan kaçınılır. Fonksiyonlar ve değişkenler ne iş yaptıklarını açıkça belirtecek şekilde isimlendirilir.
- **Performans:** Render optimizasyonları ve bellek yönetimi (useMemo, useCallback gibi) doğru yerlerde kullanılır.

---

## 2. Taste (İyi Tasarım Zevki)
**"Taste"**, arayüzün sadece çalışmasını değil, aynı zamanda modern, estetik ve premium hissettirmesini sağlar.
- **Tipografi:** Doğru font ağırlıkları (font-weights) ve hiyerarşi kullanılır. Modern fontlar (Inter, Roboto, SF Pro) tercih edilir.
- **Boşluk (Whitespace):** Elementler arası boşluklar nefes alacak şekilde ayarlanır. Çok sıkışık veya çok kopuk tasarımlardan kaçınılır.
- **Renk Paleti:** Göz yormayan, uyumlu Tailwind renkleri (Zinc, Slate) ve vurgu renkleri (Indigo, Blue) ustaca kullanılır.
- **Modern UI Kalıpları:** Hafif gölgeler (subtle shadows), cam efekti (glassmorphism), yuvarlatılmış köşeler ve ince kenarlıklar (borders) kullanılarak estetik bir görünüm elde edilir.

---

## 3. Emil Kowalski (Akıcı Etkileşimler)
Bu yetenek, ünlü UI mühendisi Emil Kowalski'nin tarzını yansıtır; tamamen akıcı, etkileşimli ve animasyonlu kullanıcı arayüzleri oluşturmaya odaklanır.
- **Animasyon ve Geçişler:** Tıklamalar, hover durumları ve sayfa geçişleri için akıcı animasyonlar (Framer Motion) kullanılır.
- **Spring (Yay) Fiziği:** Lineer animasyonlar yerine, daha doğal hissettiren "spring" fizikli animasyonlar tercih edilir.
- **Mikro Etkileşimler:** Butonlara tıklandığında hafif küçülme (scale-down) efekti gibi detaylı mikro etkileşimler eklenir.
- **Erişilebilirlik + Etkileşim:** Erişilebilirlikten ödün vermeden (Radix UI veya Vaul gibi kütüphanelerle) native hissi veren component'ler geliştirilir.

---

## 4. Anti Slop (Temiz ve Net Yapı)
**"Anti Slop"**, yapay zeka veya dikkatsiz geliştiriciler tarafından üretilen kalitesiz, gereksiz uzun veya şişirilmiş kod yığınlarını (slop) reddetmektir.
- **Gereksiz Sarmalayıcılar Yok:** Yalnızca tek bir elementi ortalamak için gereksiz yere içiçe geçmiş `<div>`'ler kullanılmaz.
- **Yalınlık:** Aşırı mühendislikten (over-engineering) kaçınılır. En basit ve okunabilir çözüm tercih edilir.
- **Klişelerden Kaçınma:** Jenerik ve ruhsuz UI kodlarından, sadece "çalışsın yeter" mantığından uzak durulur. Her kod satırının bir amacı olmalıdır.
- **Tailwind Optimizasyonu:** Gereksiz ve çelişen Tailwind class'ları kullanılmaz, `cn()` veya `clsx` gibi araçlarla class'lar temiz tutulur.

---

## 5. Anthropic Security Audit
Bu yetenek, kod tabanında veya belirli bileşenlerde güvenlik denetimleri yapmak için endüstri standartlarına dayalı yapılandırılmış bir metodoloji sunar.

### Denetim İş Akışı (Audit Workflow)
Bir güvenlik denetimi istendiğinde, şu adımlar izlenir:

**1. Bilgi Toplama ve Tehdit Modelleme:**
- **Kapsamı Belirleme:** Hangi dosyaların veya servislerin denetleneceğini netleştirin.
- **Veri Akışını Anlama:** Hassas verilerin (PII, ödeme bilgileri) sisteme nereden girip, nasıl taşındığını ve nasıl çıktığını izleyin.
- **Güven Sınırları:** Verilerin dışarıdan (kullanıcı girdisi, API'ler) uygulamaya geçtiği sınırları belirleyin.

**2. Güvenlik Açığı Taraması (Manuel ve Statik Analiz):**
- **Enjeksiyon (Injection):** Tüm girdiler sanitize ediliyor mu (SQL, OS Command)?
- **Kimlik Doğrulama/Yetkilendirme:** Oturumlar güvenli mi? İzinler her sınırda kontrol ediliyor mu?
- **Hassas Veri İfşası:** API anahtarları (secrets) koda gömülmüş mü? Veriler şifreleniyor mu?
- **XSS & CSRF:** Zararlı script çalıştırılma riski (`dangerouslySetInnerHTML` vb.) var mı? 
- **IDOR (Güvensiz Doğrudan Nesne Referansı):** Bir kullanıcı URL'deki ID'yi değiştirerek başkasının verisine ulaşabiliyor mu?

**3. Bağımlılık ve Yapılandırma İncelemesi:**
- `package.json` dosyasında bilinen açıkları olan veya güncel olmayan paketleri kontrol edin.
- `.env` değişkenlerinin yanlışlıkla frontend'e sızmadığından emin olun (örn. `NEXT_PUBLIC_` ön ekinin yanlış kullanımı).

**4. Raporlama:**
Bulgular açıkça raporlanır:
- **Önem Derecesi:** (Kritik, Yüksek, Orta, Düşük)
- **Açıklama:** Güvenlik açığı nedir?
- **Etki:** İstismar edilirse ne olur?
- **Çözüm:** Açığı kapatmak için gerekli kod düzenlemeleri.

**Yürütme Kuralları (Execution Rules):**
- Denetim sırasında güvenilmeyen kodları **çalıştırmayın**.
- Kritik bir açık (örneğin koda yazılmış DB şifresi) bulursanız, denetimi bitirmeyi beklemeden derhal uyarın.
