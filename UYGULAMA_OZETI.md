# Finansman Asistani

Finansman Asistani; kripto paralar, ABD hisseleri ve BIST hisseleri icin canli piyasa verilerini izleyen, teknik analiz ureten ve kullaniciya karar destek paneli sunan bir web uygulamasidir. Uygulama yatirim tavsiyesi vermek yerine fiyat, trend, momentum, risk/odul ve coklu zaman dilimi sinyallerini tek ekranda toplar.

## Ne ise yarar?

- Kripto, ABD hisse ve BIST sembollerini izleme listesine ekler.
- Binance ve Yahoo Finance kaynaklarindan fiyat, hacim ve mum verisi alir.
- EMA, SMA, RSI, MACD, ATR, destek/direnc ve volatilite gibi teknik gostergeleri hesaplar.
- Secili sembol icin skor, alim bolgesi, stop loss, hedef seviyeleri ve risk/odul bilgisi uretir.
- 15m, 1h, 4h ve 1d zaman dilimlerinde teyit analizi yapar.
- Trade plani, karar raporu, risk hesaplayici, portfoy takibi, trade gunlugu ve fiyat/skor/RSI uyarilari sunar.
- Analiz anlik goruntulerini, portfoy kayitlarini, trade notlarini ve kullanim notlarini yerel veritabaninda saklar.

## Kullanilan teknolojiler

- **Next.js**: Uygulamanin web arayuzu ve API route yapisi icin kullanilir.
- **React**: Dashboard, paneller, formlar ve etkilesimli arayuz bilesenlerini olusturur.
- **TypeScript**: Kodun tip guvenligini ve daha okunabilir veri modellerini saglar.
- **Tailwind CSS**: Arayuz stilleri ve responsive tasarim icin kullanilir.
- **Recharts**: Grafik ve piyasa gorsellestirmeleri icin kullanilir.
- **lucide-react**: Arayuz ikonlarini saglar.
- **Node.js SQLite**: Portfoy, trade gunlugu, uyarilar, analiz kayitlari ve kullanim notlarini `data/finansman.db` dosyasinda saklar.
- **Binance API**: Kripto USDT pariteleri icin fiyat, hacim ve mum verisi alir.
- **Yahoo Finance API**: ABD hisseleri ve BIST hisseleri icin fiyat ve grafik verisi alir.

## Ana moduller

- `src/app/page.tsx`: Ana sayfada dashboard'u baslatir.
- `src/components/market-dashboard.tsx`: Uygulamanin ana kontrol panelidir.
- `src/lib/analysis.ts`: Teknik indikatorleri, skorlamayi, karar raporunu ve trade planini hesaplar.
- `src/lib/binance.ts`: Binance piyasa verisi islemlerini yapar.
- `src/lib/yahoo.ts`: Yahoo Finance hisse ve BIST verilerini alir.
- `src/lib/local-db.ts`: Yerel SQLite veritabanini ve kayit islemlerini yonetir.
- `src/app/api/*`: Piyasa, analiz, portfoy, uyarilar, export/import ve sistem sagligi API endpoint'lerini icerir.

## Calistirma

```bash
npm install
npm run dev
```

Test ve kontrol komutlari:

```bash
npm run lint
npm run build
npm run test:all
```

## Not

Bu uygulama karar destek amaciyla tasarlanmistir. Urettigi skorlar ve planlar otomatik hesaplamalara dayanir; finansal kararlar icin tek basina kesin sinyal olarak kullanilmamalidir.
