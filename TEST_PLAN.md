# Finansman Asistani Test Plani

Bu dosya uygulamayi her buyuk degisiklikten sonra elle ve otomatik kontrollerle test etmek icin ana referanstir.

## Test Oncesi Hazirlik

1. Bagimliliklar kurulu olmali:

```text
npm install
```

2. Uygulama yerelde calismali:

```text
npm run dev -- --hostname 127.0.0.1 --port 3000
```

3. Tarayicida acilacak adres:

```text
http://127.0.0.1:3000
```

4. Ortam degiskenleri opsiyoneldir:

```text
FMP_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
LOCAL_APP_PASSWORD=
```

`LOCAL_APP_PASSWORD` doluysa testten once `/login` sayfasindan giris yapilmalidir.

## Standart Kontrol Komutlari

Her test turunda once bu komutlar calistirilir:

```text
npm run lint
npm run build
```

Tum otomatik kontrolleri tek komutla calistirmak icin:

```text
npm run test:all
```

Kisa calistirma rehberi icin:

```text
TEST_RUNBOOK.md
```

Beklenen sonuc:

- ESLint hata vermemeli.
- Next.js production build basariyla tamamlanmali.
- Build ciktisinda `/api/snapshots`, `/api/analyze`, `/api/market`, `/api/portfolio`, `/api/trades`, `/api/alerts`, `/api/usage-notes`, `/api/usage-summary`, `/api/export`, `/api/import` ve `/api/health` route'lari gorunmeli.

API endpoint'leri icin yerel sunucu acikken su komut calistirilir:

```text
npm run test:api
```

Beklenen sonuc:

- Script `[OK]` satirlariyla health, market, analyze, snapshots, trades, portfolio, alerts, usage-notes, usage-summary, export ve import kontrollerini tamamlamali.
- Export/import kontrolleri analiz gecmisi snapshot kayitlarini da kapsamalidir.
- Script'in olusturdugu gecici kayitlar test sonunda silinmeli.
- `LOCAL_APP_PASSWORD` aktifse bu smoke test oturum cookie'si tasimadigi icin once kilit kapali ortamda calistirilmalidir.

Sayfa ve dashboard baglantilari icin yerel sunucu acikken su komut calistirilir:

```text
npm run test:page
```

Beklenen sonuc:

- Dashboard ve login sayfalari HTTP 200 donmeli.
- Dashboard HTML'i ana baslik ve aciklama metinlerini icermeli.
- Dashboard'un kullandigi health, market, analyze ve snapshots endpoint'leri cevap vermeli.
- Bu test hafif smoke testtir; gercek tiklama/DOM etkilesimi yerine sayfa ve veri baglantilarinin ayakta oldugunu dogrular.

## Manuel Test Senaryolari

### Mobil / Kucuk Ekran Kontrolu

Adimlar:

1. Tarayiciyi yaklasik telefon genisligine getir.
2. Yenile butonunun tam genislikte ve kolay tiklanabilir oldugunu kontrol et.
3. Izleme listesinin sayfayi gereksiz uzatmadan kendi icinde kaydigini kontrol et.
4. Sekmelerin yatay kaydirilabilir oldugunu kontrol et.
5. Mum grafiginin ekran disina tasmadigini kontrol et.
6. Portfoy, trade, uyarilar, gecmis ve sistem sekmelerinde yatay tasma olmadigini kontrol et.

Beklenen sonuc:

- Sayfada yatay body scroll olusmamali.
- Sekmeler mobilde tek tek okunabilir ve tiklanabilir olmali.
- Grafik paneli kucuk ekranda da okunabilir kalmali.
- Geniş tablolar kendi kapsayicisi icinde kaymali, sayfanın tamamını taşırmamalı.

### 1. Dashboard Acilis Testi

Adimlar:

1. `http://127.0.0.1:3000` adresini ac.
2. Dashboard basliginin gorundugunu kontrol et.
3. Izleme listesi ve grafik alaninin gorundugunu kontrol et.
4. Sekmelerin gorundugunu kontrol et:
   - Analiz
   - Portfoy
   - Uyarilar
   - Gecmis
   - Sistem
5. Her sekmeye tiklayarak ilgili panel grubunun acildigini kontrol et.

Beklenen sonuc:

- Sayfa bos veya kirik gelmemeli.
- Varsayilan kripto listesi gorunmeli.
- Veri yuklenemese bile kullaniciya anlasilir hata veya eski veri uyarisi gosterilmeli.
- Dashboard tek uzun sayfa gibi davranmamali; ana islevler sekmelerde gruplanmali.
- Hata veya eski veri durumunda mesaj ne oldugunu ve hangi adimin denenebilecegini aciklamali.

### 2. Kripto Piyasa Akisi

Adimlar:

1. Piyasa secimini `Kripto` yap.
2. `BTCUSDT` sembolunu sec.
3. `15m`, `1h`, `4h`, `1d` zaman dilimlerini tek tek sec.
4. Izleme listesine `AVAXUSDT` ekle.
5. Eklenen sembolu sec ve sonra listeden kaldir.

Beklenen sonuc:

- Fiyat, mum grafik, teknik indikatorler, karar raporu ve trade plani yenilenmeli.
- Gecerli Binance USDT sembolu eklenebilmeli.
- Liste en az bir sembol kalacak sekilde sembol silmeye izin vermeli.

### 3. ABD Hisse Akisi

Adimlar:

1. Piyasa secimini `ABD Hisse` yap.
2. `AAPL` veya `MSFT` sembolunu sec.
3. `1d` zaman diliminde analiz uretildigini kontrol et.
4. Yeni sembol olarak `NVDA` eklemeyi dene.
5. Temel analiz panelini kontrol et.

Beklenen sonuc:

- Yahoo Finance verisiyle fiyat ve mumlar yuklenmeli.
- FMP anahtari yoksa temel analiz paneli bunu ve `.env.local` icin `FMP_API_KEY` gerektigini acikca soylemeli.
- FMP anahtari varsa temel metrikler ve birlesik skor gorunmeli.

### 4. BIST Akisi

Adimlar:

1. Piyasa secimini `BIST` yap.
2. `THYAO.IS` veya `GARAN.IS` sembolunu sec.
3. Yeni sembol olarak `ASELS` gir.
4. Sistemin sembolu `ASELS.IS` formatina cevirdigini kontrol et.
5. Temel analiz panelini kontrol et.

Beklenen sonuc:

- BIST fiyatlari TRY birimiyle gorunmeli.
- Yahoo Finance verisi eksikse panel bozulmadan uyari veya sinirli snapshot gostermeli.
- Teknik analiz ve trade plani BIST icin de calismali.

### 5. Snapshot / Analiz Gecmisi Testi

Adimlar:

1. `Gecmis` sekmesine gec.
2. Herhangi bir sembolde analiz yuklendikten sonra `Raporu kaydet` butonuna bas.
3. Yeni kaydin analiz gecmisi listesine eklendigini kontrol et.
4. Kayit detayinin otomatik acildigini kontrol et.
5. Detayda karar raporu, trade plani, RSI, trend gucu, risk/odul ve stop bilgisini oku.
6. Ayni sembol seciliyken snapshot performans ozetini kontrol et.
7. Detayda guncel fiyat, fiyat getirisi, gecen sure ve okuma alanlarini kontrol et.
8. Ayni sembol seciliyken karsilastirma metriklerini kontrol et.
9. Farkli sembole gec ve eski kaydi ac.
10. Karsilastirma uyarisinin gorundugunu kontrol et.
11. Kaydi sil.

Beklenen sonuc:

- Snapshot SQLite'a kaydedilmeli.
- Detay paneli eski raporu okunur sekilde gostermeli.
- Secili sembol icin kayit fiyatlari guncel fiyatla karsilastirilmali.
- Ortalama, en iyi, en kotu ve durus bazli snapshot getirileri gorunmeli.
- Ayni sembolde fiyat, skor, guven ve durus farki hesaplanmali.
- Silinen kayit listeden kalkmali.

### 6. Trade Gunlugu Testi

Adimlar:

1. `Portfoy` sekmesine gec.
2. Bir sembolde analiz yuklendikten sonra trade gunlugunde `Analizden doldur` butonuna bas.
3. Giris, stop, hedef ve not alanlarinin doldugunu kontrol et.
4. Miktar gir ve kaydi olustur.
5. Kaydin durumunu `Acik`, sonra `Kar` veya `Zarar` olarak degistir.
6. Kaydi sil.

Beklenen sonuc:

- Trade kaydi SQLite'a yazilmali.
- Durum degisikligi kalici olmali.
- Performans paneli kayda gore guncellenmeli.

### 7. Portfoy Testi

Adimlar:

1. `Portfoy` sekmesine gec.
2. Secili sembol icin portfoy paneline pozisyon ekle.
3. Ortalama maliyet, miktar ve stop gir.
4. Kaydin kar/zarar ve risk hesaplarini kontrol et.
5. Kaydi sil.

Beklenen sonuc:

- Pozisyon SQLite'a yazilmali.
- Canli fiyat varsa piyasa degeri ve kar/zarar hesaplanmali.
- Stop riski sifirdan buyukse risk ozeti gorunmeli.

### 8. Uyari Testi

Adimlar:

1. `Uyarilar` sekmesine gec.
2. Secili sembol icin fiyat, skor veya RSI uyarisi ekle.
3. Guncel deger butonuyla esik alanini doldur.
4. Kosulu tetiklenecek sekilde uzerine/altina ayarla.
5. Yenileme sonrasi tetiklenen uyarilar bolumunu kontrol et.
6. Uyariyi sifirla ve sil.

Beklenen sonuc:

- Uyari SQLite'a yazilmali.
- Tetiklenen uyari panelde vurgulanmali.
- Tarayici bildirimi aciksa ve izin verildiyse bildirim gonderilmeli.

### 9. Export / Import Testi

Adimlar:

1. `Gecmis` sekmesine gec.
2. Trade, portfoy, uyari ve analiz gecmisi icin JSON export al.
3. CSV export linklerini kontrol et.
4. JSON dosyasini import et.
5. Ayni dosyayi tekrar import ederek kayitlarin cogalmadigini kontrol et.

Beklenen sonuc:

- Export dosyalari indirilebilir olmali.
- JSON import kayitlari `id` alanina gore eklemeli veya guncellemeli.
- Bozuk JSON dosyasi reddedilmeli.
- Analiz gecmisi import edilirken `reportJson` gecerli JSON metni degilse reddedilmeli.

### 10. Sistem Durumu Testi

Adimlar:

1. `Sistem` sekmesine gec.
2. Gunluk kullanim testi listesinden en az bir maddeyi isaretle.
3. Sayfayi yenile ve isaretin korundugunu kontrol et.
4. Bugunu sifirla butonunu dene.
5. Gun sonu notu formuna incelenen sembolleri, snapshot sayisini ve kisa notu girip kaydet.
6. Kaydedilen notun Son gunluk notlar listesinde gorundugunu kontrol et.
7. Kullanim ozeti panelinde not, aktif gun, snapshot ve sembol/panel ozetlerinin guncellendigini kontrol et.
8. Notu sil ve listeden kalktigini kontrol et.
9. Sistem durumu panelinde `Kontrol et` butonuna bas.
10. Portfoy, trade, uyari, rapor, kullanim notu ve tetiklenen uyari sayilarini kontrol et.
11. `/api/health` cevabini tarayicida veya terminalde ac.

Beklenen sonuc:

- Panel sayisal ozetleri gostermeli.
- Gunluk kullanim testi ayni gun icin tarayicida saklanmali.
- Gun sonu notu SQLite'a kaydedilmeli, listelenmeli ve silinebilmelidir.
- Kullanim ozeti son 7 gunluk notlardan sembol, panel, veri sorunu ve aksiyon ozetleri uretmelidir.
- API anahtari durumlari ve eksikse ne yapilacagi dogru gorunmeli.
- Lokal kilit aktifse cikis butonu gorunmeli.

## Hafif Uctan Uca Test

Terminal testi:

```text
npm run test:page
```

Kapsam:

- `/` dashboard sayfasi acilir.
- `/login` sayfasi acilir.
- Dashboard ana metinleri HTML cevabinda aranir.
- Dashboard'un ihtiyac duydugu temel API baglantilari kontrol edilir.

Beklenen sonuc:

- Tum kontroller `[OK]` satirlariyla tamamlanir.
- Veri kaynagi gecici sorun yasarsa test, hatayi endpoint adiyla gorunur hale getirir.
- Tam tarayici tiklama testi gerektiginde Playwright gibi ayri bir arac ileride eklenebilir.

## Bilinen Limitler

- Ucretsiz veri kaynaklari gecikmeli, eksik veya limitli cevap verebilir.
- Yahoo Finance BIST temel veri alanlari her sembolde dolu gelmeyebilir.
- AI yorum icin `OPENAI_API_KEY` gerekir; anahtar yoksa uygulama calismaya devam eder.
- Lokal parola kilidi kisisel kullanim icin basit koruma saglar; halka acik yayina uygun tam auth sistemi degildir.
- Uygulama emir gondermez ve yatirim tavsiyesi vermez; sadece karar destek araci olarak test edilir.

## Test Sonrasi Kayit

Her test turunda su bilgiler not edilir:

```text
Tarih:
Commit:
Test eden:
Calistirilan komutlar:
Basarili senaryolar:
Hata bulunan senaryolar:
Notlar:
```
