# Finansman Asistani Test Runbook

Bu dosya testleri hangi sirayla calistiracagini kisa ve pratik sekilde anlatir.

## Hizli Test

Yerel dev server acikken tum otomatik kontroller:

```text
npm run test:all
```

Bu komut sirayla sunlari calistirir:

1. `npm run lint`
2. `npm run build`
3. `npm run test:api`
4. `npm run test:page`

## Dev Server

Smoke testler calismadan once uygulama ayakta olmalidir:

```text
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Alternatif olarak production build test edilecekse:

```text
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

## Ne Zaman Hangi Test?

Sadece kod kalitesi kontrolu:

```text
npm run lint
```

Next.js build ve TypeScript kontrolu:

```text
npm run build
```

API endpoint regresyon kontrolu:

```text
npm run test:api
```

Dashboard ve sayfa baglanti kontrolu:

```text
npm run test:page
```

Tum temel test paketi:

```text
npm run test:all
```

## Test Basarisiz Olursa

1. Hatanin hangi komutta oldugunu belirle.
2. API veya sayfa testleri hata verdiyse dev server'in `127.0.0.1:3000` adresinde calistigini kontrol et.
3. Canli veri kaynaklari hata verdiyse testi tekrar dene ve `/api/health` cevabini kontrol et.
4. `LOCAL_APP_PASSWORD` aktifse smoke testleri kilitsiz ortamda veya test cookie akisi eklenene kadar kapali kilitle calistir.
5. Hata duzeltildikten sonra `npm run test:all` komutunu tekrar calistir.

## Test Kaydi Sablonu

```text
Tarih:
Commit:
Calistirilan komut:
Sonuc:
Hata:
Not:
```
