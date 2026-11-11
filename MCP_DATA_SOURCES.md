# MCP ve Veri Kaynagi Plani

Bu dosya gunluk bulten ve uzun vadeli portfoy yorumlama sistemi icin baglanmasi gereken veri kaynaklarini tarif eder.

## Mevcut kaynaklar

- Binance API: kripto fiyat, hacim ve mum verisi
- Yahoo Finance chart/quote endpointleri: ABD hisseleri, BIST hisseleri, endeksler, altin/gumus vadeli sembolleri
- Google News RSS benzeri haber aramasi: son 24 saat haber basliklari icin ilk surum
- Financial Modeling Prep: `FMP_API_KEY` varsa temel analiz verisi
- Yerel SQLite: portfoy, trade gunlugu, uyarilar ve analiz kayitlari

## Tavsiye edilen MCP/API kaynaklari

### Haber ve arastirma

- Tavsiye: haber arama veya web search MCP
- Amac: son 24 saatte AI, veri merkezi, enerji, chip, bulut capex, nükleer ve kiymetli maden haberlerini guvenilir kaynaklardan toplamak
- Gerekli alanlar:
  - baslik
  - kaynak
  - yayin tarihi
  - URL
  - kisa ozet
  - ilgili sirket/sektor etiketi

### Finansal piyasa verisi

- Tavsiye: Yahoo Finance, Polygon, Twelve Data, Alpha Vantage veya Financial Modeling Prep
- Amac:
  - son fiyat
  - 1 aylik performans
  - 1 yillik performans
  - endekse gore relatif performans
  - piyasa degeri ve temel oranlar

### Makroekonomi

- Tavsiye: FRED, Trading Economics, OECD, resmi merkez bankasi kaynaklari
- Takip edilecek veriler:
  - FED, ECB, TCMB faiz kararlari
  - enflasyon
  - issizlik
  - tahvil faizleri
  - DXY
  - reel faiz
  - merkez bankasi karar metinleri

### Sirket sunumlari ve bilanço

- Tavsiye: SEC EDGAR, sirket investor relations sayfalari, FMP
- Takip edilecek dokumanlar:
  - earnings release
  - investor presentation
  - 10-Q / 10-K
  - guidance guncellemeleri
  - capex aciklamalari

## Uygulama icin hedef akış

1. Kullanici takip listesini uygulamada secer.
2. Gunluk bulten endpoint'i son 24 saat haberlerini toplar.
3. Her sirket icin 1 ay ve 1 yil fiyat performansi hesaplanir.
4. Haberler tema/sirket bazinda gruplanir.
5. Spekulatif sirketler ayri rozetlenir.
6. Rapor kartlari su formatta uretilir:
   - Gelisme
   - Neden onemli
   - Yatirim anlami
7. Bulten veritabanina kaydedilir ve gecmis bultenler listelenir.

## Ortam degiskenleri

`.env.example` icin ileride eklenebilecek degiskenler:

```bash
FMP_API_KEY=
NEWS_API_KEY=
MACRO_API_KEY=
```

## Onemli kural

Haber kaynagi bos donerse veya erisilemezse uygulama bunu kullaniciya acikca soylemeli. "Manşet niteliginde haber yok" ile "kaynak erisilemedi" mumkunse ayri ayri belirtilmelidir.
