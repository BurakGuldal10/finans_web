# Analiz ve Altyapi Yol Haritasi

Bu dosya, uzun vadeli yatirim analizi ve Vercel + Supabase gecisi icin sirali calisma listesidir. Kullanici "yol haritasini getir" veya "siradaki adim ne" dediginde bu liste esas alinir.

## Kisa Vadeli Analiz Motoru

1. [ ] Mevcut 15 dk, 1 saat, 4 saat ve 1 gunluk teknik sinyalleri tek skorda degil, ayri guven puanlariyla sun.
2. [ ] Trend, momentum, hacim, volatilite ve destek/direnc verileri icin varliga ozel agirliklar tanimla.
3. [x] ATR tabanli stop mesafesi ve referans risk butcesine gore pozisyon boyutu hesapla.
4. [ ] Islem maliyeti, spread ve kayma varsayimlarini trade planina kat.
5. [ ] Endeks ve sektor goreceli gucunu ekle; hisseyi sadece kendi grafigiyle degerlendirme.
6. [ ] Haber sonrasi fiyat/hacim teyidi olmadan kuvvetli islem sinyali verme kuralini ekle.
7. [ ] Her kisa vadeli sinyali giris, stop, hedef, gecersizlik ve sonucuyla kaydet.

## Uzun Vadeli Analiz Motoru

8. [x] Teknik ve temel analizi zaman ufkuna gore ayir: teknik veri giris zamanini, temel veri yatirim tezini belirlesin.
9. [ ] Finansal kalite skorunu gelistir: gelir buyumesi, marjlar, serbest nakit akisi, borc, ROE/ROIC ve sermaye tahsisi.
10. [x] Baslangic degerleme katmanini ekle: F/K ve serbest nakit akisiyla degerleme sinifi olustur.
11. [ ] Bilanco ve sirket rehberligi degisimlerini takip et; beklenti asimi/altinda kalma etkisini ayri puanla.
12. [ ] Makro rejim motorunu ekle: faiz, enflasyon, tahvil faizi, dolar endeksi, likidite ve para politikasi.
13. [ ] Tema motorunu ekle: AI harcamalari, veri merkezi kapasitesi, enerji fiyatlari, GPU/HBM arz-talebi, sogutma ve PPA/SMR haberleri.
14. [ ] Sektor ve ulke maruziyetini portfoy duzeyinde goster; ayni riske tekrar tekrar yuklenmeyi tespit et.
15. [ ] Varlik bazli yatirim tezi, katalizorler, riskler, degerleme araligi ve tezin gecersizlik kosullarini kaydet.

## Olcum, Test ve Guven

16. [ ] Bulten/oneriyi verildigi andaki fiyat, kaynaklar, guven puani ve zaman ufkuyla kaydet.
17. [ ] 1 ay, 3 ay, 6 ay ve 1 yillik gerceklesen getirileri otomatik hesapla.
18. [ ] Sonuclari uygun kiyasla karsilastir: SPY, QQQ, BIST 100, sektor ETF'i, altin veya gumus.
19. [ ] Basari oraninin yaninda maksimum dusus, kazanma/kaybetme orani ve risk duzeltilmis getiriyi olc.
20. [ ] Gecmise bakma yanliligi ve gelecek veri sizintisini engelleyen geriye donuk test kurallari ekle.
21. [ ] Onerileri "bilgilendirme" olarak tut; kesin getiri vaadi veya otomatik alim-satim karari verme.

## Oncelik

## Altyapi ve Kullanici Hesaplari (Son Asama)

22. [ ] Supabase projesini olustur ve ortam degiskenlerini tanimla.
23. [ ] Supabase veri semasini kur: profil, takip listesi, portfoy, bulten, oneriler ve sonuc olcumleri.
24. [ ] Row Level Security kurallariyla kullanici verilerini birbirinden ayir.
25. [ ] E-posta/sifre ile giris, kayit ve sifre yenileme ekranlarini ekle.
26. [ ] Google ile girisi ekle.
27. [ ] Mevcut tarayici takip listesini kullanicinin Supabase hesabina tasi.
28. [ ] Uygulamayi Vercel'e yayinla; gizli anahtarlari sadece Vercel ortam degiskenlerinde tut.
29. [ ] Her sabah bulten ureten ve sonucu veritabanina kaydeden zamanlanmis gorevi ekle.

## Oncelik

Ilk uygulanacak blok: 1-21. Once analiz motoru gelistirilir ve yerel karar gunlugu ile denenir. Vercel ve Supabase, analiz yapisi yeterince olgunlastiktan sonra son asamada eklenir.
