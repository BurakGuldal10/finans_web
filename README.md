# 📊 Finansman Asistanı (`finans_web`)

> [!CAUTION]
> ## ⚠️ YASAL UYARI VE SORUMLULUK REDDİ BEYANI (YATIRIM TAVSİYESİ DEĞİLDİR)
>
> **Bu proje, kaynak kodları, web arayüzü ve ürettiği tüm çıktılar YALNIZCA YAZILIM GELİŞTİRME, EĞİTİM, AKADEMİK ARAŞTIRMA VE KİŞİSEL PORTFÖY GÖSTERİMİ AMACIYLA hazırlanmıştır; KESİNLİKLE YATIRIM TAVSİYESİ VEYA YATIRIM DANIŞMANLIĞI AMACIYLA YAPILMAMIŞTIR.**
>
> 1. **Yatırım Danışmanlığı Değildir:** Bu uygulama içerisinde yer alan hiçbir fiyat verisi, grafik, algoritmik skor, teknik analiz seviyesi (alım bölgesi, stop-loss, hedef fiyat), temel analiz rasyosu, 3 ay – 5 yıl vadeli bilanço yorumu, **"Boğa / Baz / Ayı" tahmini fiyat projeksiyonları**, günlük bülten özetleri veya yapay zeka (AI) yorumları; **6362 sayılı Sermaye Piyasası Kanunu (SPK)** ve ilgili uluslararası mevzuat kapsamında **"Yatırım Danışmanlığı"**, **"Portföy Yöneticiliği"** veya **"Al-Sat-Tut Tavsiyesi"** niteliği taşımaz.
> 2. **Veriler Ciddiye Alınmamalıdır:** Sistemde gösterilen tüm fiyat hedefleri, senaryo hesaplamaları ve bilanço puanlamaları geçmiş volatilite ve genel çarpanlara dayalı **deneysel matematiksel simülasyonlardır**. Üçüncü taraf açık kaynaklardan (Yahoo Finance, Binance, Google News RSS, FMP, SEC EDGAR vb.) çekilen veriler gecikmeli, eksik, yanlış veya güncel olmayan bilgiler içerebilir. **Bu projedeki veriler, analizler ve tahminler ciddiye alınmamalı ve bunlara dayanılarak kesinlikle gerçek finansal işlem yapılmamalıdır.**
> 3. **Sorumluluk Reddi:** Yatırım danışmanlığı hizmeti; yalnızca yetkili aracı kurumlar, portföy yönetim şirketleri ve mevduat kabul etmeyen bankalar ile müşteri arasında imzalanacak yatırım danışmanlığı sözleşmesi çerçevesinde sunulmaktadır. Bu yazılımı kullanan veya inceleyen herkes, buradaki bilgilere dayanarak alacağı her türlü kararın hukuki ve mali sorumluluğunun tek başına kendisine ait olduğunu; proje geliştiricisinin doğabilecek doğrudan veya dolaylı hiçbir maddi/manevi zarardan sorumlu tutulamayacağını peşinen kabul eder.

---

## 🎯 Proje Hakkında

**Finansman Asistanı**, Next.js (App Router), TypeScript, Tailwind CSS ve yerel SQLite (`node:sqlite`) kullanılarak geliştirilmiş, açık kaynaklı ve yerel çalışan bir **finansal veri görselleştirme ve algoritmik analiz simülasyon panelidir**.

### Öne Çıkan Özellikler

- **Çoklu Piyasa İzleme:** Kripto (`USDT` pariteleri - Binance API), ABD Hisseleri ve BIST Hisseleri (`.IS` - Yahoo Finance) için fiyat ve hacim takibi.
- **Teknik Analiz Simülasyonu:** SMA, EMA, RSI, MACD, ATR, destek/direnç seviyeleri, çoklu zaman dilimi (`15m`, `1h`, `4h`, `1d`) teyidi ve algoritmik karar skoru.
- **3 Ay – 5 Yıl Bilanço Yorumlama & Senaryo Projeksiyonları (`Uzun Vade` Sekmesi):**
  - `3 Ay (3M)`, `6 Ay (6M)`, `1 Yıl (1Y)`, `3 Yıl (3Y)` ve `5 Yıl (5Y)` zaman ufukları.
  - Çeyreklik bilanço dayanıklılığı, marj trendleri, borç/likidite ve serbest nakit akışı değerlendirmesi.
  - Tarihsel volatilite kanalları ve sektörel çarpanlara (`F/K`, `PD/DD`, `FD/FAVÖK`) dayalı **Boğa (İyimser)**, **Baz (Beklenen)** ve **Ayı (Kötümser)** senaryo simülasyonları.
- **Günlük Piyasa Bülteni:** Seçili temalar (AI altyapısı, yarı iletkenler, enerji, veri merkezleri vb.) için son 24 saatlik Google News RSS haber keşif akışı.
- **Yerel Kayıt ve Takip (SQLite):** Portföy simülasyonu, işlem günlüğü (trade journal), fiyat uyarıları, analiz geçmişi (snapshot) ve JSON/CSV dışa/içe aktarma.

---

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js (App Router, Turbopack), React, TypeScript
- **Stil & UI:** Tailwind CSS, Recharts, `lucide-react`
- **Veritabanı:** Node.js yerleşik SQLite (`node:sqlite` — `data/finansman.db`)
- **Harici Veri Kaynakları:** Binance Public API, Yahoo Finance, Google News RSS, isteğe bağlı Financial Modeling Prep (`FMP_API_KEY`), SEC EDGAR (`SEC_USER_AGENT`) ve OpenAI Responses API (`OPENAI_API_KEY`)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Ortam Değişkenlerini Yapılandırın (İsteğe Bağlı)

`.env.example` dosyasını `.env.local` olarak kopyalayıp kendi API anahtarlarınızı tanımlayabilirsiniz (anahtarlar olmadan da temel Yahoo/Binance yedek katmanlarıyla çalışır):

```env
FMP_API_KEY=
LOCAL_APP_PASSWORD=
OPENAI_API_KEY=
OPENAI_MODEL=
SEC_USER_AGENT=
```

### 3. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açarak uygulamayı görüntüleyebilirsiniz.

### 4. Doğrulama ve Test Komutları

```bash
npm run lint
npm run build
npm run test:api
npm run test:page
```

---

## ⚖️ Tekrar Hatırlatma: Hukuki Not (Disclaimer)

Bu depo (`finans_web`) bir **yazılım mühendisliği çalışmasıdır**. İçerdiği hiçbir algoritma, formül, bilanço yorumu veya fiyat projeksiyonu gerçek piyasa koşullarında getiri vaat etmez ve yatırım danışmanlığı yerine geçmez. Finansal kararlarınız için lütfen SPK lisanslı yatırım kuruluşlarına başvurunuz.
