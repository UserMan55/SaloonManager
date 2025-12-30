MERHABA BEN İLHAMİ

# 🎱 SaloonManager Proje Yapılacaklar Listesi

Bu dosya, projenin mevcut durumunu, eksikliklerini ve planlanan geliştirmeleri takip etmek için oluşturulmuştur.

## 🚀 Öncelikli Görevler (High Priority)

- [ ] **Güvenlik (RBAC) Aktivasyonu:**
    - `/super-admin` sayfası şu an geliştirme kolaylığı için herkese açık. Rol tabanlı koruma (middleware veya HOC ile) tekrar aktif edilmeli.
    - Sadece `super_admin` rolüne sahip kullanıcılar bu sayfaya erişebilmeli.
- [ ] **Firestore Güvenlik Kuralları:**
    - Firestore Security Rules güncellenerek veritabanı okuma/yazma izinleri sıkılaştırılmalı.
    - Kullanıcılar sadece kendi salonlarına ait verilere erişebilmeli.
- [ ] **Hata Yönetimi ve Bildirimler:**
    - İşlem sonuçları (başarılı/hatalı) için `Toast` (sonner veya react-hot-toast) bildirim sistemi entegre edilmeli. Şu an `alert` veya konsol logları kullanılıyor.

## 🏆 Turnuva Modülü (Ana Özellik)

- [ ] **Turnuva Oluşturma:**
    - Turnuva adı, tipi (Eleme, Lig vb.), tarih, katılım ücreti gibi alanları içeren form.
- [ ] **Eşleşme Sistemi (Bracket):**
    - Oyuncuların otomatik veya manuel eşleştirilmesi.
    - Turnuva ağacı (bracket) görselleştirmesi.
- [ ] **Maç Yönetimi:**
    - Maç sonuçlarını girme, kazananı belirleme ve bir üst tura taşıma.

## ⚙️ Ayarlar ve Profil Yönetimi

- [ ] **Salon Ayarları:**
    - Salon logosu, adresi ve iletişim bilgilerini güncelleme ekranı.
- [ ] **Admin Profili:**
    - Şifre değiştirme, e-posta güncelleme işlemleri.
- [ ] **Sistem Ayarları:**
    - Tema ayarları (varsa), dil seçenekleri.

## 📱 UI/UX İyileştirmeleri

- [x] **Super Admin Tasarımı:** Premium Glassmorphism (Tamamlandı).
- [x] **Dashboard Tasarımı:** Premium Glassmorphism (Tamamlandı).
- [ ] **Mobil Uyumluluk Testleri:**
    - Tüm tabloların ve modalların mobil cihazlarda düzgün göründüğünden emin olunmalı.
- [ ] **Loading State'leri:**
    - Veri yüklenirken daha şık "Skeleton" bileşenleri kullanılmalı.

## 🔧 Teknik Borç ve Refactoring

- [ ] **Bileşen Ayrıştırma:**
    - `dashboard/page.tsx` ve `super-admin/page.tsx` içindeki büyük bloklar (örn: Card yapıları) daha küçük, yeniden kullanılabilir bileşenlere (component) ayrılmalı.
- [ ] **Tip Güvenliği (TypeScript):**
    - `any` tipi kullanılan yerler (özellikle Firestore verileri) için proper interface'ler (örn: `Salon`, `Admin`) tanımlanmalı.
- [ ] **Performans:**
    - Gereksiz re-render'ları önlemek için memoization teknikleri gözden geçirilmeli.

## 📞 İletişim ve Entegrasyonlar

- [ ] **SMS / WhatsApp Bildirimleri:**
    - Kayıtlı telefon numaralarına turnuva veya maç bilgilendirmesi göndermek için altyapı araştırması (Twilio, Netgsm vb.).
- [ ] **QR Menü / Skorboard Entegrasyonu:**
    - (İleri aşama) Oyuncuların kendi profillerini görebileceği public sayfalar.

---

**Son Güncelleme:** 30 Aralık 2024
**Versiyon:** 0.1.5 (Geliştirme Aşaması)
