# Agent Skills & Design Guidelines

Bu dosya, projedeki geliştirme süreçlerinde yapay zeka asistanının veya geliştiricilerin takip etmesi gereken temel "yetenek" (skill) ve prensipleri içermektedir. Amacımız, sadece çalışan bir kod yazmak değil; kusursuz, güvenli, estetik ve premium hissettiren bir kullanıcı deneyimi sunmaktır.

---

## 1. Impeccable (Kusursuz Kodlama)
**"Impeccable"** prensibi, kodun ilk yazıldığında kusursuz çalışmasını hedefler. 
- **Sıfır Hata:** Kod yazılırken syntax hataları, eksik import'lar veya type (TypeScript) hataları bırakılamaz. Kod, daha test edilmeden bile kalitesini belli etmelidir.
- **Edge Case (Uç Durum) Yönetimi:** Tüm olası uç durumlar önceden düşünülür ve kodda handle edilir (null check'ler, empty state'ler, loading durumları). Uygulama hiçbir senaryoda çökmemelidir.
- **Temiz Kod:** Gereksiz tekrarlardan (DRY) kaçınılır. Fonksiyonlar ve değişkenler ne iş yaptıklarını açıkça belirtecek şekilde isimlendirilir.
- **Performans:** Render optimizasyonları ve bellek yönetimi (useMemo, useCallback, lazy loading gibi) doğru yerlerde kullanılır. İhtiyaç olmayan re-render'lar baştan engellenir.

---

## 2. Taste (İyi Tasarım Zevki)
**"Taste"**, arayüzün sadece çalışmasını değil, aynı zamanda modern, estetik ve premium hissettirmesini sağlar.
- **Tipografi:** Doğru font ağırlıkları (font-weights) ve hiyerarşi kullanılır. Modern fontlar (Inter, Roboto, SF Pro) tercih edilir ve okunabilirlik en üst düzeyde tutulur.
- **Boşluk (Whitespace):** Elementler arası boşluklar nefes alacak şekilde ayarlanır. Çok sıkışık veya çok kopuk tasarımlardan kaçınılır; mantıksal gruplama boşluklar ile sağlanır.
- **Renk Paleti:** Göz yormayan, uyumlu Tailwind renkleri (Zinc, Slate) ve vurgu renkleri (Indigo, Blue, Violet) ustaca kullanılır. Renk kontrastlarına dikkat edilir.
- **Modern UI Kalıpları:** Hafif gölgeler (subtle shadows), cam efekti (glassmorphism), yuvarlatılmış köşeler (border-radius) ve ince kenarlıklar (borders) kullanılarak derinlik hissi yaratılır.

---

## 3. Emil Kowalski (Akıcı Etkileşimler)
Bu yetenek, ünlü UI mühendisi Emil Kowalski'nin tarzını yansıtır; tamamen akıcı, etkileşimli ve animasyonlu kullanıcı arayüzleri oluşturmaya odaklanır.
- **Animasyon ve Geçişler:** Tıklamalar, hover durumları ve sayfa geçişleri için akıcı animasyonlar (Framer Motion) kullanılır.
- **Spring (Yay) Fiziği:** Lineer animasyonlar (linear, ease-in) yerine, daha doğal ve organik hissettiren "spring" fizikli animasyonlar tercih edilir. Arayüz "canlı" hissettirmelidir.
- **Mikro Etkileşimler:** Butonlara tıklandığında hafif küçülme (scale-down) efekti, ikonların durum değişimindeki dönüşümleri gibi detaylı mikro etkileşimler eklenir.
- **Erişilebilirlik + Etkileşim:** Erişilebilirlikten ödün vermeden (Radix UI veya Vaul gibi kütüphanelerle) native uygulama hissi veren component'ler geliştirilir.

---

## 4. Anti Slop (Temiz ve Net Yapı)
**"Anti Slop"**, yapay zeka veya dikkatsiz geliştiriciler tarafından üretilen kalitesiz, gereksiz uzun veya şişirilmiş kod yığınlarını (slop) reddetmektir.
- **Gereksiz Sarmalayıcılar Yok:** Yalnızca tek bir elementi ortalamak için gereksiz yere içiçe geçmiş `<div>` cehennemleri oluşturulmaz. DOM ağacı olabildiğince düz tutulur.
- **Yalınlık:** Aşırı mühendislikten (over-engineering) ve karmaşık abstract (soyut) yapılardan kaçınılır. En basit ve doğrudan okunabilir çözüm tercih edilir.
- **Klişelerden Kaçınma:** Jenerik ve ruhsuz UI kodlarından, sadece "çalışsın yeter" mantığından uzak durulur. Her kod satırının bir amacı ve karakteri olmalıdır.
- **Tailwind Optimizasyonu:** Gereksiz ve çelişen Tailwind class'ları kullanılmaz, `cn()` veya `clsx` gibi araçlarla class birleştirmeleri mantıklı ve temiz tutulur.

---

## 5. Anthropic Security Audit
Bu yetenek, kod tabanında veya belirli bileşenlerde güvenlik denetimleri yapmak için endüstri standartlarına dayalı yapılandırılmış bir metodoloji sunar.

### Denetim İş Akışı (Audit Workflow)
- **1. Bilgi Toplama ve Tehdit Modelleme:** Kapsamı belirle, veri akışını (PII, ödeme bilgileri) izle ve uygulamanın dış dünyayla temas ettiği güven sınırlarını tespit et.
- **2. Güvenlik Açığı Taraması (Manuel ve Statik Analiz):** SQL/Command Injection kontrolleri, XSS/CSRF riskleri (`dangerouslySetInnerHTML`), IDOR (Güvensiz Doğrudan Nesne Referansı) açıklıkları ve kimlik doğrulama/yetkilendirme zafiyetlerini kontrol et.
- **3. Bağımlılık ve Yapılandırma İncelemesi:** Güncel olmayan paketler, `.env` değişkenlerinin (örneğin API anahtarlarının) yanlışlıkla frontend'e sızıp sızmadığının kontrolü.
- **4. Raporlama:** Bulunan açıkları Önem Derecesi, Açıklama, Etki ve Çözüm başlıklarıyla net bir şekilde raporla ve hemen müdahale et.

---

## 6. Superpowers (Süper Güçler)
**"Superpowers"**, yapay zeka asistanının gelişmiş bilişsel yeteneklerini kullanarak projeyi sıradan bir kodlamadan, vizyoner bir mühendisliğe taşımasıdır.
- **Derinlemesine Analiz:** Kod yazmadan önce problemi çok yönlü analiz etme. Yalnızca isteneni değil, gelecekteki potansiyel darboğazları da önceden görüp proaktif davranma.
- **Kök Neden Çözümü:** Sadece karşılaşılan hatayı (semptomu) düzeltmekle kalmayıp, o hatanın kök nedenini (root cause) analiz ederek sistemin tamamındaki benzer riskleri yok etme.
- **Mimari Vizyon:** Küçük bir bileşen veya fonksiyon yazarken bile, bunun uygulamanın genel mimarisine (state yönetimi, routing, ağ çağrıları) nasıl entegre olacağını hesaplama.
- **Hız ve Kesinlik:** Geliştirme hızını artırırken kaliteden ödün vermeme, doğrudan hedefe yönelik, hatasız ve nokta atışı çözümler üretme.

---

## 7. Claude-mem (Hafıza ve Bağlam Yönetimi)
**"Claude-mem"**, projenin başından sonuna kadar proje bağlamını (context), alınan mimari kararları ve proje ruhunu kesintisiz hafızada tutmayı amaçlar.
- **Geçmiş Kararların İzlenmesi:** Daha önce alınmış mimari kararlara, oluşturulan tasarım sistemine ve dosya hiyerarşisine sıkı sıkıya sadık kalma.
- **Bağlam Bütünlüğü (Context Cohesion):** Farklı dosyalarda ve klasörlerde yapılan değişikliklerin birbirleriyle olan ilişkisini unutmadan, sistemi birleşik bir bütün olarak ele alma.
- **Tekerleği Yeniden İcat Etmeme:** Projede zaten var olan utility fonksiyonlarını, UI bileşenlerini veya custom hook'ları tespit edip tekrar kullanma.
- **Kendini Düzeltme Mekanizması:** Geçmişte yapılan hatalardan veya kullanıcının verdiği feedback'lerden ders çıkararak, aynı düzeltmeleri tekrar tekrar yapmaya gerek bırakmama.

---

## 8. Task Observer (Görev Gözlemcisi)
**"Task Observer"**, sadece söylenen komutu uygulayan bir 'kodlayıcı' olmak yerine, görevin mantığını, gidişatını ve verimliliğini üstten bir bakış açısıyla gözlemlemektir.
- **Körleme Uygulama Yok:** Kullanıcının istediği şeyi yapmadan önce "Bu mantıklı mı?", "Bu mimari olarak doğru bir adım mı?" diye sorgulama ve gerekirse daha iyi bir yol önerme.
- **Gidişat Kontrolü (Course Correction):** Eğer kodlama esnasında mevcut yaklaşım bir çıkmaza, aşırı karmaşıklığa veya slop'a doğru gidiyorsa, durup rotayı düzeltme (refactor) kararı alma.
- **Makro Perspektif:** Çok adımlı görevlerde hangi aşamada olunduğunu takip etme; sadece backend'e veya frontend'e değil, ikisinin arasındaki sözleşmeye (API entegrasyonuna) odaklanma.
- **Süreç Raporlama:** Yapılan işin durumunu ve kalan adımları şeffaf bir şekilde yönetme.

---

## 9. Frontend Design (Önyüz Tasarımı - Mimari Boyut)
**"Frontend Design"**, kodlanan arayüzün sadece görsel değil, mimari olarak da sağlam temeller üzerine, modern prensiplerle inşa edilmesini ifade eder.
- **Bileşen Hiyerarşisi:** Mantıksal, küçük ve tekrar kullanılabilir bileşen (component) yapısı kurgulama. "Smart" (akıllı/veri çeken) ve "Dumb" (aptal/sadece UI çizen) bileşen ayrımını doğru yapma.
- **Kusursuz Responsive (Duyarlı) Tasarım:** Mobil, tablet ve masaüstü görünümlerin sadece "çalışması" değil, her ekranda o ekrana özel tasarlanmış gibi hissettirmesi.
- **Durum (State) Yönetimi Kuralları:** Local ve global state'i birbirine karıştırmama. URL'i state olarak kullanmanın avantajlarından faydalanma, sadece gerektiğinde Context veya Zustand kullanma.
- **Veri Çekme Yaşam Döngüsü (Data Fetching):** Yükleme (loading), hata (error), yeniden deneme (retry) ve boş (empty) durumların, kullanıcının güvenini kırmayacak ve estetik görünecek şekilde tasarlanması.

---

## 10. Code Review (Kod İnceleme ve Öz-denetim)
**"Code Review"**, kod tabanına entegre edilecek her satır kodun acımasız bir kalite standartları süzgecinden geçirilmesi yeteneğidir.
- **Öz-Eleştiri (Self-Review):** Üretilen kodun kullanıcıya sunulmadan önce yapay zekanın kendisi tarafından "Bu kod production'a çıkmaya hazır mı?" diye denetlenmesi.
- **Güvenlik, Performans ve Mantık:** Olası bellek sızıntılarını (useEffect cleanup eksikliği), gereksiz bağımlılıkları ve performans darboğazlarını daha oluşmadan yakalama.
- **İleriye Dönük Okunabilirlik:** "Bu kodu 6 ay sonra ben veya başkası okuduğunda anlar mı?" sorusuna yanıt arama. Kodun kendi kendini açıklaması, karmaşık mantıkların açıklayıcı yorumlarla desteklenmesi.
- **Standartlara Tam Uyum:** Linting kurallarına, TypeScript strict mod gereksinimlerine ve projenin mevcut stil rehberine tavizsiz bir şekilde uyma.

---

## 11. Security Guidance (Güvenlik Rehberliği)
**"Security Guidance"**, sadece denetim yapmakla (Audit) kalmayıp, kod yazım sürecinin en başından itibaren "güvenli geliştirme" kültürünü uygulamaktır.
- **Secure By Default (Varsayılan Olarak Güvenli):** Sistemleri en güvenli konfigürasyonlarla kurma (cookie'lerde `HttpOnly/Secure` flag'leri, CORS ayarlarının sıkı tutulması, CSP kullanımı).
- **Sıfır Güven (Zero Trust):** İstemciden (frontend) gelen hiçbir veriye güvenmeme; her zaman backend tarafında veriyi doğrulama (Zod gibi kütüphanelerle şema validasyonu).
- **Veri Minimizasyonu:** Sadece o an gerekli olan veriyi istemciden alma veya sunucudan istemciye gönderme. API yanıtlarında gereksiz hassas verilerin (over-fetching) dışarı sızmasını önleme.
- **Proaktif Uyarı:** Geliştirici potansiyel olarak tehlikeli bir yol izlemek istediğinde (örn. şifresiz veri transferi, zayıf hash kullanımı) anında uyarıp güvenli alternatifi uygulama.

---

## 12. Framer Motion (İleri Seviye Animasyon Ustalığı)
**"Framer Motion"**, arayüzleri statik sayfalardan, yaşayan ve etkileşimli deneyimlere dönüştürme uzmanlığıdır. Emil Kowalski yeteneğinin en büyük silahıdır.
- **Donanım Hızlandırmalı Performans:** Layout thrashing (düzenin tekrar hesaplanması) yaratmayan, CPU yerine GPU'yu kullanan (`transform`, `opacity`) animasyonlar kullanma.
- **Orkestrasyon ve Varyantlar (Variants):** Karmaşık, birbirini takip eden (staggered) veya koşula bağlı çalışan animasyonları temiz ve yönetilebilir bir yapıda (Variants) tasarlama.
- **Sayfa ve Element Geçişleri (`AnimatePresence`):** React'ın doğası gereği aniden yok olan elementleri, ekrandan çıkış animasyonlarıyla (exit) zarifçe veda edecek şekilde ayarlama.
- **Layout Animasyonları:** `layoutId` (shared layout animations) kullanarak elementlerin farklı DOM konumları arasında pürüzsüzce süzülmesini sağlama.

---

## 13. UI/UX Pro Max (Kusursuz Kullanıcı Deneyimi)
**"UI/UX Pro Max"**, temel arayüz tasarımının ötesine geçerek, uygulamanın kullanımını bağımlılık yapıcı, pürüzsüz ve üst düzey bir deneyime dönüştürmektir.
- **Sıfır Sürtünme (Zero Friction):** Kullanıcının hedefine (satın alma, form doldurma) ulaşmasındaki tüm pürüzleri yok etme. Modalların klavye ile (ESC) kapanabilmesi, formların otomatik odaklanması (auto-focus) ve mantıklı varsayılan değerler sunulması.
- **İyimser UI (Optimistic UI):** Kullanıcı bir eylem yaptığında (örneğin favoriye ekleme), ağ (network) yanıtını beklemeden arayüzü anında güncelleyerek uygulamanın "ışık hızında" hissettirmesi.
- **İskelet Ekranlar (Skeleton Loaders):** Veri yüklenirken boş sayfa veya can sıkıcı dönen bir spinner yerine, içeriğin şekline ve yapısına uygun skeleton'lar göstererek algılanan performansı artırma.
- **Erişilebilir Mükemmellik (a11y):** Uygulamanın sadece fare ile değil, klavye ile (tabbing) de kusursuz gezilebilir olması, yeterli renk kontrastı ve ARIA etiketleri ile herkes için kapsayıcı bir tasarım sunulması.
