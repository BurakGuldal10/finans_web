# Finansman Asistani 7 Gunluk Kullanim Denemesi

Bu plan uygulamanin gercek kullanimda ise yarayip yaramadigini anlamak icin hazirlandi. Amac para kazanma iddiasi degil; karar destek akisini, veri guvenilirligini ve kullanisli panelleri test etmektir.

## Gunluk Ritim

Her gun ayni sirayla ilerle:

1. Uygulamayi ac ve Sistem sekmesinde durum kontrolu yap.
2. Kripto, ABD hisse veya BIST tarafinda en az 3 sembol incele.
3. Her sembolde teknik skor, karar raporu, trade plani ve risk hesaplayiciyi oku.
4. Mantikli buldugun en az 1 raporu analiz gecmisine kaydet.
5. Islem yapmayacaksan bile trade gunlugune plan veya gozlem notu ekle.
6. Gerekli gorursen fiyat, skor veya RSI uyarisi kur.
7. Gun sonunda Geçmiş sekmesinde snapshot performansini kontrol et.
8. Sistem sekmesindeki Gunluk kullanim testi listesini isaretle.

## 7 Gunluk Hedefler

- En az 15 analiz snapshot'i kaydet.
- En az 5 trade planini gunluge ekle.
- En az 3 uyari kur.
- En az 2 JSON yedek indir.
- En az 1 kez mobil/kucuk ekran kontrolu yap.
- En az 1 kez `npm run test:all` calistir.

## Gun Sonu Not Sablonu

```text
Tarih:
Incelenen semboller:
Kaydedilen snapshot sayisi:
Trade gunlugu kaydi:
Kurulan uyarilar:
En faydali panel:
Kafa karistiran panel:
Veri hatasi veya gecikme:
Yarin duzeltilecek/kontrol edilecek not:
```

## Degerlendirme Sorulari

7 gun sonunda sunlara bak:

- En cok hangi piyasa tarafini kullandin?
- Karar raporu gercekten karar vermeyi kolaylastirdi mi?
- Trade plani uygulanabilir ve net miydi?
- Snapshot performansi yaniltici mi, yoksa faydali bir sinyal veriyor mu?
- Hangi panel gereksiz kalabalik yapiyor?
- Hangi bilgi eksik kaldi?
- Uygulama gunluk kullanima yeterince hizli mi?

## Basari Kriteri

Bu deneme sonunda uygulama su sorulara olumlu cevap vermelidir:

- Piyasa verisini yeterince hizli gorebiliyor muyum?
- Analiz sonucunu kaydedip sonra geri okuyabiliyor muyum?
- Riskimi sayisal olarak kontrol edebiliyor muyum?
- Uyarilar ve trade gunlugu gunluk takipte ise yariyor mu?
- Yedek alip geri yukleme fikri guven veriyor mu?

Eksik kalan maddeler yeni gelistirme adimi olarak `PROJECT.md` dosyasina eklenmelidir.
