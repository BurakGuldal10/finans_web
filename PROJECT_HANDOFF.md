# Finansman Asistani - Proje Devam Notu

Bu proje Next.js, React ve TypeScript ile yazilmis bir finans karar destek panelidir. Mevcut uygulama kisa vadeli teknik analiz, portfoy takibi, uyarilar, trade gunlugu ve analiz kayitlari sunar. Yeni hedef, uygulamayi uzun vadeli yatirim karar destegine genisletmektir.

## Mevcut durum

- Ana panel: `src/components/market-dashboard.tsx`
- Teknik analiz motoru: `src/lib/analysis.ts`
- Kripto veri kaynagi: `src/lib/binance.ts`
- ABD/BIST hisse veri kaynagi: `src/lib/yahoo.ts`
- Temel analiz: `src/lib/fundamentals.ts`
- Yerel veritabani: `src/lib/local-db.ts`
- Yeni gunluk bulten motoru: `src/lib/daily-briefing.ts`
- Yeni gunluk bulten API endpoint'i: `src/app/api/daily-briefing/route.ts`
- Yeni gunluk bulten arayuzu: `src/components/daily-briefing-panel.tsx`

## Yeni stratejik hedef

Uygulama sadece kisa vadeli trade paneli olmaktan cikacak; AI altyapisi, veri merkezi, enerji, chip, bulut capex, nükleer/yenilenebilir enerji ve kiymetli madenler gibi uzun vadeli temalari takip eden bir yatirim bulteni ve portfoy yorumlama sistemine donusecek.

## Gunluk bulten kapsamı

Her gun son 24 saatte su basliklar taranacak:

1. Yapay zeka
2. Veri merkezi insaati ve kapasitesi
3. Enerji tuketimi ve guc altyapisi
4. GPU ve ozel AI cipleri
5. Sogutma teknolojileri
6. Nukleer ve yenilenebilir enerji ile AI iliskisi
7. AWS, Azure, Google Cloud altyapi yatirimlari
8. Halka acik sirket haberleri ve yatirimci sunumlari
9. Kiymetli madenler, ozellikle altin ve gumus

## Uygulamada eklenen ilk surum

- Ana dashboard'a `Bulten` sekmesi eklendi.
- Kullanici site uzerinden takip edecegi sirketleri, endeksleri, kriptolari ve kiymetli madenleri ekleyebilir.
- Varsayilan takip listesi: `NVDA`, `AMD`, `MSFT`, `GOOGL`, `AMZN`, `GC=F`, `SI=F`.
- `Spekulatif` rozet secenegi eklendi.
- Bulten API'si son 24 saat haber akisi ve 1 ay / 1 yil fiyat performansini birlikte yorumlar.
- Haber bulunamazsa bunu acikca soyler; bulteni doldurmak icin yapay manşet uretmez.

## Sonraki gelistirme adimlari

1. Haber kaynagi icin daha guvenilir MCP/API entegrasyonu ekle.
2. Bultenleri veritabanina kaydet.
3. Portfoyde bulunan varliklari otomatik bulten takip listesine dahil et.
4. Sirketleri sektor, tema ve ulke riskine gore siniflandir.
5. Makro veri modulu ekle: FED, ECB, TCMB faiz kararlari, enflasyon, tahvil faizi, DXY.
6. Endeks karsilastirmasi ekle: S&P 500, Nasdaq, BIST 100, sektor endeksleri.
7. Uzun vadeli skor modeli ekle:
   - Temel analiz
   - Teknik trend
   - Endekse gore guc
   - Makro uyum
   - Haber duyarliligi
   - Portfoy agirligi

## Yeni ChatGPT hesabinda devam promptu

Bu projeyi ac ve once `PROJECT_HANDOFF.md`, `DAILY_BULLETIN_SKILL.md`, `MCP_DATA_SOURCES.md`, `PROJECT.md` ve `UYGULAMA_OZETI.md` dosyalarini oku. Proje Next.js/TypeScript finans paneli. Amac: kisa vadeli teknik analiz uygulamasini uzun vadeli AI altyapisi, enerji, chip, veri merkezi, bulut yatirimlari ve kiymetli madenleri takip eden gunluk bulten ve portfoy yorumlama sistemine cevirmek.

Kod degisikligi yaparken mevcut tasarim dilini koru, gereksiz refactor yapma, finansal yorumlarda haber/fiyat/performans verisini ayir, manşet yoksa bunu acikca soyle.
