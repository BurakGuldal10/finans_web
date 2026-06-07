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

## Mevcut Durum - Kripto Temelini Saglamlastirma

Eklenenler:

- Binance `exchangeInfo` uzerinden gercek sembol dogrulama eklendi.
- `/api/symbol?symbol=AVAXUSDT` endpoint'i eklendi.
- Gecerli olmayan veya aktif spot USDT paritesi olmayan semboller listeye eklenmeden reddedilir.
- Analiz endpoint'i zaman dilimi alir: `15m`, `1h`, `4h`, `1d`.
- Dashboard'a zaman dilimi secimi eklendi.
- Secilen zaman dilimi tarayicida `localStorage` ile saklanir.
- Grafik etiketleri secilen zaman dilimine gore saat veya tarih formatina uyarlanir.
- Izleme listesi artik fiyat API'sinden donmeyen sembolleri kaybetmeden gostermeye devam eder.

Ornekler:

```text
/api/symbol?symbol=AVAXUSDT
/api/analyze?symbol=BTCUSDT&interval=4h
```

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Trade Gunlugu

Eklenenler:

- Dashboard altina trade gunlugu bolumu eklendi.
- Kayit alanlari: sembol, zaman dilimi, yon, giris, stop, hedef, miktar, strateji, durum ve not.
- "Analizden doldur" butonu secili varligin analiz seviyelerini forma aktarir.
- Kayitlar tarayicida `localStorage` ile saklanir.
- Kayit durumu sonradan Plan, Acik, Kar, Zarar veya Basabas olarak degistirilebilir.
- Kayit silme eklendi.
- Ozet metrikler eklendi: toplam kayit, acik islem, win rate ve planlanan risk.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Portfoy Ekrani

Eklenenler:

- Dashboard altina portfoy bolumu eklendi.
- Secili sembol icin pozisyon ekleme formu eklendi.
- Kayit alanlari: sembol, miktar, ortalama maliyet, stop ve not.
- "Fiyati kullan" butonu secili sembolun canli fiyatini ortalama maliyet alanina aktarir.
- Portfoy kayitlari tarayicida `localStorage` ile saklanir.
- Canli fiyat gelen semboller icin piyasa degeri, maliyet, kar/zarar ve yuzdesel kar/zarar hesaplanir.
- Stop seviyesi girildiyse pozisyon bazli risk ve toplam stop riski hesaplanir.
- Pozisyon silme eklendi.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Analiz Motoru Gelistirmesi

Eklenenler:

- Son mumlardan destek ve direnc bolgesi hesaplama eklendi.
- Son aralik dusuk/yuksek seviyeleri analiz sonucuna eklendi.
- Trend gucu skoru eklendi.
- ATR / fiyat oranina gore volatilite yuzdesi ve volatilite rejimi eklendi.
- Analiz skoru destek/direnc, trend gucu ve volatilite ile daha kapsamli hale getirildi.
- Analiz sonucu artik olumlu gerekceler ile riskleri ayri listeler.
- Kisa aksiyon ozeti eklendi: takip edilebilir, notr veya riskli gibi yorum uretir.
- Dashboard karar destek bolumunde destek, direnc, trend gucu ve volatilite gosterilir.
- Gerekceler bolumunde aksiyon ozeti ve risk maddeleri ayrica gosterilir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - ABD Hisseleri

Eklenenler:

- Dashboard'a piyasa secimi eklendi: Kripto ve ABD Hisse.
- Kripto izleme listesi ile ABD hisse izleme listesi ayri `localStorage` alanlarinda saklanir.
- ABD hisseleri icin varsayilan izleme listesi: AAPL, MSFT, NVDA, TSLA, SPY.
- `/api/market` endpoint'i `market=stocks` parametresi ile ABD hisseleri icin fiyat verisi dondurur.
- `/api/analyze` endpoint'i `market=stocks` parametresi ile hisse mum verisini analiz eder.
- `/api/symbol` endpoint'i `market=stocks` parametresi ile ABD hisse sembolu dogrular.
- Yahoo Finance chart verisi kullanilarak fiyat, gunluk degisim ve mum verisi alinir.
- Kripto akisi korunur; Binance tarafinda mevcut davranis devam eder.

Ornekler:

```text
/api/market?market=stocks&symbols=AAPL,MSFT,NVDA
/api/symbol?market=stocks&symbol=AAPL
/api/analyze?market=stocks&symbol=AAPL&interval=1d
```

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Temel Analiz Iskeleti

Eklenenler:

- ABD hisseleri icin temel analiz endpoint'i eklendi: `/api/fundamentals?market=stocks&symbol=AAPL`.
- Financial Modeling Prep veri saglayicisi icin `FMP_API_KEY` desteklendi.
- `.env.example` dosyasina `FMP_API_KEY=` eklendi.
- API key yoksa endpoint kontrollu sekilde 501 dondurur ve kullaniciya anahtar gerektigini bildirir.
- Temel analiz modeli eklendi:
  - Piyasa degeri
  - F/K
  - Gelir buyumesi
  - Net kar marji
  - Borc / ozsermaye
  - Cari oran
  - Serbest nakit akisi
  - ROE
- Bu metriklerden temel analiz skoru ve sirket sagligi yorumu uretilir.
- Dashboard'da ABD Hisse seciliyken temel analiz karti gosterilir.
- Kripto seciliyken temel analiz karti gizlenir.

Canli temel analiz icin yerel `.env.local` dosyasina su eklenmeli:

```text
FMP_API_KEY=...
```

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Teknik + Temel Birlesik Skor

Eklenenler:

- ABD hisseleri icin teknik skor ile temel analiz skorunu birlestiren yardimci modul eklendi.
- Birlesik skor hesaplama agirliklari:
  - Teknik skor: %55
  - Temel skor: %45
- Birlesik skor sonucu olumlu, notr veya riskli olarak yorumlanir.
- Temel analiz kartinda "Genel hisse skoru" bandi eklendi.
- FMP API key yoksa mevcut uyari davranisi korunur; key eklendiginde birlesik skor otomatik gorunur.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Uyari Sistemi

Eklenenler:

- Dashboard'a uyari listesi bolumu eklendi.
- Uyarilar tarayicida `localStorage` ile saklanir.
- Secili sembol icin fiyat, teknik skor veya RSI esigi tanimlanabilir.
- Kosullar: uzerine cikarsa veya altina inerse.
- "Guncel deger" butonu secili metrik icin mevcut degeri forma aktarir.
- Canli veri yenilendikce secili sembolun uyarilari kontrol edilir.
- Tetiklenen uyarilar panelde vurgulanir.
- Tetiklenen uyari sifirlanabilir veya silinebilir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Yerel SQLite Kalicilik

Eklenenler:

- Portfoy, trade gunlugu ve uyari listesi kayitlari artik tarayici `localStorage` yerine yerel SQLite veritabaninda saklanir.
- SQLite dosyasi varsayilan olarak `data/finansman.db` yolunda olusturulur.
- `data/` klasoru `.gitignore` icine alindi; kisisel finansal kayitlar repoya push edilmez.
- Eski `localStorage` kayitlari ilk acilista SQLite veritabanina tasinmaya calisilir.
- Yeni API endpoint'leri eklendi:
  - `/api/portfolio`
  - `/api/trades`
  - `/api/alerts`
- Bu endpoint'ler listeleme, ekleme, silme ve gerekli guncelleme islemlerini destekler.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Trade Performans Ozeti

Eklenenler:

- Trade gunlugu kayitlarindan performans ozeti cikaran modul eklendi.
- Yeni endpoint eklendi: `/api/performance`.
- Dashboard altina performans ozeti paneli eklendi.
- Panel su metrikleri gosterir:
  - Toplam trade kaydi
  - Kapali islemlerde win rate
  - Plan ve acik islemler icin toplam risk
  - Win/loss durumlarina gore tahmini sonuc
  - Strateji ve sembol bazli kirilim
- Tahmini sonuc, trade gunlugundeki hedef/stop ve islem durumuna gore hesaplanir; gercek emir veya broker verisi degildir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - BIST Piyasasi

Eklenenler:

- Dashboard piyasa secimine BIST eklendi.
- BIST izleme listesi ABD hisseleri ve kriptodan ayri saklanir.
- Varsayilan BIST sembolleri:
  - THYAO.IS
  - GARAN.IS
  - ASELS.IS
  - BIMAS.IS
  - KCHOL.IS
- Kullanici `THYAO` gibi sembol girdiginde sistem bunu Yahoo Finance formatina (`THYAO.IS`) cevirir.
- `/api/market`, `/api/analyze` ve `/api/symbol` endpoint'leri `market=bist` parametresini destekler.
- BIST fiyat ve mum verisi su an Yahoo Finance uzerinden gelir.
- BIST tarafinda fiyat birimi arayuzde TRY olarak gosterilir.
- Uyari sistemi BIST sembolleri icin de fiyat, teknik skor ve RSI esiklerini takip edebilir.

Ornekler:

```text
/api/market?market=bist&symbols=THYAO.IS,GARAN.IS
/api/symbol?market=bist&symbol=THYAO
/api/analyze?market=bist&symbol=THYAO.IS&interval=1d
```

Notlar:

- BIST icin temel analiz/bilanco henuz eklenmedi.
- Yahoo Finance ucretsiz kaynak oldugu icin veri gecikmesi, eksik veri veya limit sorunlari olabilir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Risk Hesaplayici

Eklenenler:

- Dashboard'a risk hesaplayici paneli eklendi.
- Secili varligin analizinden giris, stop ve hedef seviyeleri forma aktarilabilir.
- Hesap buyuklugu ve risk yuzdesine gore pozisyon boyutu hesaplanir.
- Panel su metrikleri gosterir:
  - Risk tutari
  - Alinabilecek adet
  - Pozisyon degeri
  - Portfoy agirligi
  - Birim risk
  - Potansiyel kar
  - Risk / odul orani
- Hesap buyuklugu ve risk yuzdesi tarayicida saklanir; sembol degistiginde fiyat seviyeleri yeniden analizden doldurulabilir.
- Kripto icin USDT, ABD hisseleri icin USD, BIST icin TRY para birimi etiketi kullanilir.

Notlar:

- Bu panel emir gondermez; sadece pozisyon boyutu ve risk varsayimi hesaplar.
- Vergi, komisyon, kaldirac, slipaj ve kur farki henuz hesaba katilmaz.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Piyasa Ozeti

Eklenenler:

- Dashboard'a izleme listesi bazli piyasa ozeti paneli eklendi.
- Panel mevcut piyasa verisini tekrar API cagirmadan kullanir.
- Gosterilen ozetler:
  - Ortalama degisim
  - Yukselen / dusen sembol sayisi
  - En guclu sembol
  - En zayif sembol
  - Hacim lideri
  - Sembol bazli gun ici dusuk/yuksek araligi
- Ozet panelindeki sembollere tiklaninca secili sembol degisir ve mevcut analiz akisi o sembole gecer.
- Kripto, ABD hisse ve BIST piyasalarinin hepsinde calisir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Teknik Indikator Detay Paneli

Eklenenler:

- Dashboard'a teknik indikator detay paneli eklendi.
- Panel analiz skorunun arkasindaki ham teknik verileri gosterir:
  - SMA20
  - SMA50
  - EMA20
  - RSI14
  - MACD
  - MACD sinyal
  - ATR14
  - Hacim orani
- Ayrica trend gucu, volatilite rejimi, destek ve direnc seviyeleri kisa notlarla gosterilir.
- Kripto, ABD hisse ve BIST piyasalarinin hepsinde secili varligin analiz verisini kullanir.
- Bu panel karar destek sonucu uretmez; mevcut teknik veriyi daha seffaf okumak icin eklenmistir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Kullanici Ayarlari

Eklenenler:

- Dashboard'a ayarlar paneli eklendi.
- Otomatik veri yenileme acilip kapatilabilir.
- Yenileme araligi ekrandan secilebilir:
  - 15 saniye
  - 30 saniye
  - 60 saniye
  - 120 saniye
- Risk hesaplayici icin varsayilan risk yuzdesi ayarlanabilir.
- Ayarlar tarayicida `localStorage` ile saklanir.
- Varsayilan ayarlar:
  - Otomatik yenileme: acik
  - Yenileme araligi: 30 saniye
  - Risk yuzdesi: 1%

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Server Cache

Eklenenler:

- Canli veri endpoint'leri icin bellek tabanli kisa sureli server cache eklendi.
- Yeni yardimci modul: `src/lib/server-cache.ts`.
- Cache kullanan endpoint'ler:
  - `/api/market`
  - `/api/analyze`
  - `/api/symbol`
- Varsayilan cache sureleri:
  - Piyasa fiyat listesi: 20 saniye
  - Teknik analiz sonucu: 45 saniye
  - Sembol dogrulama: 1 saat
- API cevaplarina `cached` ve `cacheTtlSeconds` alanlari eklendi.
- Amac:
  - Binance/Yahoo Finance gibi kaynaklara gereksiz tekrar istekleri azaltmak
  - Ucretsiz veri kaynaklarinda limit riskini dusurmek
  - Dashboard yenilemelerini daha stabil hale getirmek

Notlar:

- Cache bellek tabanlidir; uygulama yeniden baslatildiginda temizlenir.
- Kisisel lokal kullanim icin yeterlidir. Ileride kalici veya dagitik cache gerekirse ayrica ele alinabilir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Veri Disa Aktarma

Eklenenler:

- Yerel kayitlar icin disa aktarma endpoint'i eklendi: `/api/export`.
- Dashboard'a "Yedek / disa aktar" paneli eklendi.
- Disa aktarilabilen kayitlar:
  - Trade gunlugu
  - Portfoy
  - Uyari kurallari
- Desteklenen formatlar:
  - CSV
  - JSON
- Ornekler:

```text
/api/export?type=trades&format=csv
/api/export?type=portfolio&format=json
/api/export?type=alerts&format=csv
```

Notlar:

- CSV formati Excel veya benzeri tablolu analiz araclari icin uygundur.
- JSON formati tam yedek ve geri yukleme akisi icin daha uygundur.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - JSON Geri Yukleme

Eklenenler:

- Yerel kayitlar icin JSON ice aktarma endpoint'i eklendi: `/api/import`.
- Dashboard'daki "Yedek / disa aktar" panelinden JSON yedekleri geri yuklenebilir.
- Geri yuklenebilen kayitlar:
  - Trade gunlugu
  - Portfoy
  - Uyari kurallari
- Import islemi kayitlari `id` alanina gore ekler veya mevcut kaydi gunceller; ayni yedek tekrar yuklenirse kayitlar cogalmaz.
- JSON dosyalari icin temel alan dogrulamasi yapilir; bozuk veya beklenen alanlari tasimayan dosyalar reddedilir.

Ornekler:

```text
POST /api/import?type=trades
POST /api/import?type=portfolio
POST /api/import?type=alerts
```

Notlar:

- Su an yalnizca JSON geri yukleme desteklenir.
- CSV import henuz eklenmedi; CSV daha cok harici tablo analizleri icin disa aktarma formatidir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - BIST Temel Analiz

Eklenenler:

- BIST hisseleri icin temel analiz endpoint destegi eklendi: `/api/fundamentals?market=bist&symbol=THYAO.IS`.
- BIST temel verileri Yahoo Finance `quoteSummary` kaynagindan cekilir.
- Yahoo temel oran endpoint'i erisilemezse sistem Yahoo chart verisinden sinirli bir BIST snapshot uretir.
- Dashboard'da BIST seciliyken temel analiz paneli artik sirket sagligi, degerleme ve bilanco metriklerini gosterir.
- BIST icin teknik skor ile temel skor birlestirilerek genel hisse skoru uretilir.
- Kullanilan metrikler:
  - Piyasa degeri
  - F/K
  - Gelir buyumesi
  - Net marj
  - Borc / ozsermaye
  - Cari oran
  - Serbest nakit akisi
  - ROE

Ornek:

```text
/api/fundamentals?market=bist&symbol=THYAO.IS
```

Notlar:

- Yahoo Finance ucretsiz kaynak oldugu icin BIST temel verilerinde eksik alan veya gecikme olabilir.
- Eksik metrikler `N/A` olarak gosterilir ve skor hesabi mevcut metriklerle yapilir.
- Yahoo temel oran endpoint'i 401 dondurdugunde panel canli fiyat/hacim snapshot'i ile calismaya devam eder; bu durumda bilanco metrikleri `N/A` kalir.
- BIST icin profesyonel bilanco kaynagi entegrasyonu ileride ayri bir adim olarak ele alinabilir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Mum Grafik Gelistirmesi

Eklenenler:

- Ana fiyat grafigi kapanis cizgisi yerine mum grafigine cevrildi.
- Yeni bilesen eklendi: `src/components/candlestick-chart.tsx`.
- Grafik acilis, yuksek, dusuk, kapanis ve hacim bilgisini birlikte gosterir.
- Son 80 mum gosterilir; zaman dilimi degistikce grafik ayni mum verisiyle yeniden hesaplanir.
- Hover durumunda secili mumun tarih/saat, kapanis, acilis, yuksek ve dusuk degerleri okunabilir.
- Grafik kripto, ABD hisse ve BIST piyasalarinin hepsinde calisir.
- BIST temel analiz panelinin ekranda gorunme kosulu da duzeltildi; kripto disinda ABD ve BIST icin panel gosterilir.

Notlar:

- Bu adimda yeni grafik kutuphanesi eklenmedi; mevcut veri yapisi uzerinden ozel SVG mum grafigi olusturuldu.
- Ileride TradingView Lightweight Charts gibi daha profesyonel grafik kutuphanesi eklenebilir.

Kontrol:

```text
npm run lint
npm run build
```

## Mevcut Durum - Coklu Zaman Dilimi Teyidi

Eklenenler:

- `/api/analyze` cevabina coklu zaman dilimi teyidi eklendi.
- Sistem ayni sembol icin su periyotlari birlikte analiz eder:
  - 15 dakika
  - 1 saat
  - 4 saat
  - 1 gun
- Her periyot icin skor, trend gucu, RSI ve fiyat/EMA20 konumu hesaplanir.
- Dashboard'a "Zaman dilimi teyidi" paneli eklendi.
- Panel genel uyumu bullish, mixed veya bearish olarak yorumlar.
- Genel teyit skoru trade kararinda tek zaman dilimine fazla guvenme riskini azaltmak icin kullanilir.

Notlar:

- Bu teyit paneli emir sinyali degildir; teknik karar destek katmanidir.
- Ucretsiz veri kaynaklarinda coklu periyot istekleri daha fazla API cagrisi demektir; mevcut server cache bu yukleri azaltmak icin kullanilir.

Kontrol:

```text
npm run lint
npm run build
```
