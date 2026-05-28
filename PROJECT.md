# Finansal Piyasa Asistani Projesi

## Proje Amaci

Bu proje, yalnizca kisisel kullanim icin gelistirilecek bir web uygulamasidir. Amac; Turk borsasi, ABD borsalari ve kripto piyasalarindan canli veya canliya yakin veriler alarak trade kararlarini destekleyen analizler uretmektir.

Uygulama kullaniciya "kesin al/sat" garantisi vermeyecek; bunun yerine teknik analiz, temel analiz, risk yonetimi, portfoy takibi ve senaryo degerlendirmesi ile karar destek sistemi gibi calisacaktir.

## Kritik Uyari

Bu uygulama finansal danisman degildir. Urettigi sinyaller, analizler ve fiyat seviyeleri yatirim tavsiyesi sayilmamalidir. Nihai karar kullaniciya aittir. Sistem hatali veri, gecikmeli veri, yanlis model varsayimi veya piyasa kosullari nedeniyle yanlis sonuc uretebilir.

## Kapsam

Ilk hedefler:

- BIST, ABD hisseleri ve kripto paralar icin fiyat verisi cekmek.
- Izleme listeleri olusturmak.
- Mum grafik, hacim, trend ve temel teknik indikatorleri gostermek.
- Belirli varliklar icin "alinabilir bolge", "riskli bolge", "kar al", "zarar kes" gibi karar destek analizleri uretmek.
- ABD ve BIST hisseleri icin bilanco / temel veri analizi yapabilmek.
- Kripto icin fiyat, hacim, volatilite, trend ve piyasa duyarliligi benzeri verilerle analiz yapmak.
- Kisisel portfoy ve islem gunlugu tutmak.
- Sonraki asamalarda yapay zeka destekli ozet ve yorumlama eklemek.

Kapsam disi:

- Gercek emir gonderme.
- Broker entegrasyonu ile otomatik al/sat.
- Halka acik canli servis olarak yayina alma.
- Baskalarina yatirim tavsiyesi sunma.

## Onerilen Teknoloji Secimi

Kisisel kullanim, hizli gelistirme ve finansal analiz ihtiyaci icin en mantikli yigin:

- Frontend: Next.js + React + TypeScript
- UI: Tailwind CSS, shadcn/ui, Recharts veya TradingView Lightweight Charts
- Backend: Next.js API routes veya ayri Python FastAPI servisi
- Analiz motoru: Python
- Veritabani: SQLite ile baslangic, gerekirse PostgreSQL
- Arka plan isleri: Python scheduler veya Next.js cron benzeri lokal job
- Yerel calistirma: Docker Compose opsiyonel

Neden bu secim:

- TypeScript + Next.js web arayuzu icin guclu ve hizli.
- Python finansal veri isleme, indikatorler, bilanco analizi ve modelleme icin daha uygun.
- Uygulama canliya alinmayacagi icin baslangicta lokal calisan hibrit yapi yeterli.
- Ileride daha ciddi veri isleme gerekirse Python tarafi kolay genisler.

## Onerilen Mimari

Baslangicta iki katmanli bir yapi dusunulecek:

1. Web uygulamasi
   - Dashboard
   - Izleme listesi
   - Varlik detay sayfasi
   - Grafikler
   - Analiz sonuc kartlari
   - Portfoy / islem gunlugu

2. Analiz ve veri katmani
   - Fiyat verisi cekme
   - Teknik indikator hesaplama
   - Bilanco verisi cekme ve yorumlama
   - Sinyal puanlama
   - Risk / getiri senaryolari
   - Cache ve veri kaydi

## Veri Kaynaklari

Canli veya canliya yakin veri icin aday kaynaklar:

- Kripto:
  - Binance API
  - Coinbase API
  - CoinGecko API

- ABD hisseleri:
  - Yahoo Finance
  - Alpha Vantage
  - Financial Modeling Prep
  - Polygon.io veya benzeri ucretli servisler

- BIST:
  - Yahoo Finance uzerinden BIST sembolleri
  - Matriks, Foreks, Finnet gibi profesyonel servisler
  - Gecici baslangic icin halka acik kaynaklar

Not: Ucretsiz kaynaklarda gecikme, limit, veri eksigi ve lisans sorunlari olabilir. Kisisel kullanimda bile veri kaynaginin kullanim sartlari kontrol edilmelidir.

## Analiz Modulleri

### Teknik Analiz

Baslangic indikatorleri:

- SMA / EMA
- RSI
- MACD
- Bollinger Bands
- ATR
- Hacim ortalamalari
- Destek / direnc bolgeleri
- Trend yonu
- Volatilite

Ilk sinyal mantigi:

- Trend puani
- Momentum puani
- Hacim teyidi
- Risk / odul orani
- Stop loss mesafesi
- Kar al hedefleri

### Temel Analiz

Hisse senetleri icin:

- Gelir buyumesi
- Net kar marji
- FAVOK / EBITDA
- Borc durumu
- Nakit akisi
- F/K
- FD/FAVOK
- PD/DD
- Cari oran
- Ozsermaye karliligi

### Kripto Analizi

Kripto icin:

- Trend ve momentum
- Hacim degisimi
- Volatilite
- Likidite
- BTC dominansi ve piyasa geneli yonu
- Opsiyonel olarak haber / sosyal duyarlilik

## Karar Destek Ciktisi

Uygulama her varlik icin su formatta analiz uretmeye calisacak:

- Genel durum: olumlu / notr / riskli
- Zaman ufku: kisa / orta / uzun
- Alim bolgesi
- Stop loss seviyesi
- Ilk hedef
- Ikinci hedef
- Risk / odul orani
- Analizin dayanaklari
- Gecersiz kalma kosullari

Ornek:

```text
Varlik: AAPL
Genel gorunum: Notr-pozitif
Alim bolgesi: 180-184
Stop loss: 174
Hedef 1: 192
Hedef 2: 205
Risk / odul: 1:2.1
Dayanak: EMA trendi pozitif, RSI asiri alimda degil, hacim ortalamaya yakin.
Gecersiz kalma: 174 altinda gunluk kapanis.
```

## Ekranlar

Ilk surumde planlanan ekranlar:

- Dashboard
  - Piyasa ozeti
  - Izleme listesi
  - En guclu / en zayif varliklar
  - Uyari listesi

- Varlik Detayi
  - Canli fiyat
  - Grafik
  - Indikatorler
  - Analiz ozeti
  - Bilanco / temel veri sekmesi

- Portfoy
  - Pozisyonlar
  - Ortalama maliyet
  - Kar / zarar
  - Risk dagilimi

- Islem Gunlugu
  - Alim / satim kayitlari
  - Notlar
  - Strateji etiketi
  - Sonuc analizi

- Ayarlar
  - Veri kaynagi anahtarlari
  - Varsayilan para birimi
  - Risk yuzdesi
  - Izlenen piyasalar

## Gelistirme Yol Haritasi

### Asama 1: Proje Temeli

- Proje dokumantasyonunu olustur.
- Teknoloji yiginini kesinlestir.
- Next.js + TypeScript web uygulamasini baslat.
- Temel dashboard taslagini kur.
- Yerel veritabani secimini yap.

### Asama 2: Canli Veri

- Kripto icin Binance veya CoinGecko veri baglantisi ekle.
- ABD hisseleri icin Yahoo Finance veya alternatif kaynak ekle.
- BIST icin ilk veri kaynagini test et.
- Veri cache mekanizmasi kur.
- Izleme listesi olustur.

### Asama 3: Teknik Analiz Motoru

- Python analiz servisi veya TypeScript analiz modulu kur.
- Temel indikatorleri hesapla.
- Destek / direnc ve volatilite hesaplari ekle.
- Sinyal puanlama sisteminin ilk versiyonunu yaz.

### Asama 4: Arayuz ve Karar Destegi

- Varlik detay sayfasi yap.
- Grafik ve indikatorleri goster.
- Alim / satim bolgesi onerilerini goster.
- Stop loss ve hedef fiyat seviyelerini hesapla.

### Asama 5: Temel Analiz

- Hisseler icin bilanco verisi cek.
- Finansal oranlari hesapla.
- Sirket sagligi puani olustur.
- Teknik analiz ile temel analizi tek skorda birlestir.

### Asama 6: Portfoy ve Gunluk

- Pozisyon kaydi ekle.
- Islem gunlugu ekle.
- Performans ve hata analizi yap.
- Strateji bazli basari oranlari cikar.

### Asama 7: Yapay Zeka Yorumu

- Analiz verilerini LLM'e ozetlet.
- "Bu trade neden mantikli / neden riskli?" aciklamasi uret.
- Haber, bilanco ve teknik veriyi tek raporda birlestir.

## Ilk Teknik Karar

Varsayilan baslangic karari:

- Web uygulamasi: Next.js + TypeScript
- Analiz: Python
- Veritabani: SQLite
- Ilk veri kaynagi: Kripto icin Binance veya CoinGecko
- Ilk piyasa: Kripto ve ABD hisseleri
- BIST: ikinci veri entegrasyonu olarak ele alinacak

Bu kararlar proje ilerledikce degisebilir, ancak baslamak icin yeterince saglamdir.

## Sonraki Sohbette Devam Etmek Icin Not

Bu projeye devam ederken once bu dosya okunmali:

```text
PROJECT.md
```

Yeni sohbetlerde hedef:

1. Mevcut dosya ve klasor yapisini oku.
2. PROJECT.md icindeki yol haritasina gore hangi asamada olundugunu belirle.
3. Kullanici yeni bir oncelik vermediyse Asama 1'den devam et.

## Bir Sonraki Somut Adim

Bir sonraki adim olarak Next.js + TypeScript uygulama iskeleti kurulacak. Ardindan ilk dashboard ekrani, izleme listesi ve kripto fiyat verisi entegrasyonu yapilacak.

## Mevcut Durum - 2026-05-28

Ilk calisan web uygulamasi olusturuldu.

Eklenenler:

- Next.js + TypeScript + Tailwind CSS proje iskeleti.
- Koyu temali karar destek dashboard ekrani.
- Binance public API uzerinden canli kripto fiyat verisi.
- BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT ve XRPUSDT izleme listesi.
- Secili parite icin 1 saatlik mum verisi.
- SMA20, SMA50, EMA20, RSI14, MACD, ATR14 ve hacim orani hesaplari.
- Ilk sinyal puanlama sistemi.
- Alim bolgesi, stop loss, hedef 1, hedef 2 ve risk / odul ciktisi.
- `/api/market` endpoint'i.
- `/api/analyze?symbol=BTCUSDT` endpoint'i.

Calistirma:

```text
npm install --cache .\.npm-cache --prefer-online
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Kontrol:

```text
npm run lint
npm run build
```

Notlar:

- Uygulama su an yalnizca kripto tarafinda canli veri cekiyor.
- ABD hisseleri, BIST, portfoy ve bilanco analizi sonraki asamalarda eklenecek.
- Npm kurulumunda 2 adet moderate seviyede audit uyarisi goruldu; henuz `npm audit fix --force` uygulanmadi.

## Mevcut Durum - Izleme Listesi Guncellemesi

Eklenenler:

- Izleme listesi artik arayuzden yeni Binance USDT paritesi eklemeye izin veriyor.
- Eklenen semboller tarayicida `localStorage` ile saklaniyor.
- Izleme listesinden sembol kaldirma eklendi.
- `/api/market` endpoint'i `symbols` query parametresi alabiliyor.
- `/api/analyze` endpoint'i varsayilan listeyle sinirli degil; gecerli USDT paritesi geldigi surece analiz uretir.

Ornekler:

```text
/api/market?symbols=BTCUSDT,AVAXUSDT
/api/analyze?symbol=AVAXUSDT
```

Kontrol:

```text
npm run lint
npm run build
```
