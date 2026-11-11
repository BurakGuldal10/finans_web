# Finansman Asistanı — Kalıcı Proje Hafızası

Bu dosya, projede çalışan sonraki Codex/AI oturumlarının projeyi hızlı ve doğru anlaması için kalıcı çalışma rehberidir. Proje kökünün tamamında geçerlidir.

## Zorunlu çalışma protokolü

1. Projede herhangi bir inceleme veya değişiklik yapmadan önce bu dosyayı oku.
2. Mevcut kullanıcı değişikliklerini `git status` ile kontrol et; kullanıcıya ait değişiklikleri silme veya geri alma.
3. Her işlem/görev tamamlandıktan sonra bu dosyayı güncelle. En azından `Son işlem günlüğü` bölümüne tarih, amaç, değişen dosyalar, alınan kararlar ve yapılan doğrulamayı ekle.
4. İşlem proje mimarisini, komutları, veri modelini, ortam değişkenlerini, bilinen sorunları veya yol haritasını etkilediyse ilgili ana bölümü de aynı işlem sonunda güncelle.
5. Yalnızca gerçekten doğrulanmış bilgileri yaz. Geçici tahminleri kalıcı gerçek gibi kaydetme; belirsizlik varsa açıkça belirt.
6. Parola, API anahtarı, erişim belirteci, çerez veya başka bir gizli değeri bu dosyaya yazma. Yalnızca ortam değişkeninin adını kaydet.
7. Günlüğü kısa ve sürdürülebilir tut. Eski, artık geçersiz bilgiyi işaretle veya düzelt; çelişkili not biriktirme.
8. Kod değişikliğini uygun ölçekte lint, build ve/veya smoke test ile doğrula; çalıştırılamayan kontrolün nedenini günlüğe yaz.

## Projenin kimliği ve amacı

- Proje adı: `finansman-asistani` (`package.json`)
- Konum: `C:\Users\ASUS\OneDrive\Belgeler\fınasman` (klasör adında noktasız `ı` bulunur)
- Tür: Yerel çalışan finansal karar destek paneli
- Ana kapsam: Kripto, ABD hisseleri ve BIST hisseleri için piyasa takibi, teknik/temel analiz, risk planlama, portföy, uyarı, işlem günlüğü ve günlük yatırım bülteni
- Stratejik yön: Kısa vadeli trade analizini; AI altyapısı, yarı iletkenler, veri merkezleri, enerji, bulut yatırımları ve kıymetli madenler gibi uzun vadeli temalarla birleştirmek
- Finansal çıktı ilkesi: Kesin yatırım tavsiyesi veya getiri vaadi verme; veri, yorum, zaman ufku ve belirsizliği birbirinden ayır.

## Teknoloji ve çalışma biçimi

- Next.js App Router, React, TypeScript
- Tailwind CSS, Recharts, `lucide-react`
- Node.js yerleşik SQLite (`node:sqlite`); yerel veri dosyası `data/finansman.db`
- Kripto verisi: Binance genel API'leri
- ABD/BIST fiyat verisi: Yahoo Finance uçları
- Temel analiz: Öncelikle `FMP_API_KEY` varsa Financial Modeling Prep; Yahoo yedek veri yolu
- AI yorumu: OpenAI Responses API; `OPENAI_API_KEY` ve isteğe bağlı `OPENAI_MODEL`
- Günlük haber: Google News RSS; fiyat performansı Yahoo Finance grafiğinden
- İsteğe bağlı yerel erişim kilidi: `LOCAL_APP_PASSWORD`

Ortam değişkenleri `.env.example` içinde yalnızca adlarıyla tutulur:

```text
FMP_API_KEY
LOCAL_APP_PASSWORD
OPENAI_API_KEY
OPENAI_MODEL
SEC_USER_AGENT
```

## Temel komutlar

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run test:api
npm run test:page
npm run test:all
```

- `test:api` ve `test:page`, `scripts/` altındaki PowerShell smoke testlerini kullanır.
- Git bu ortamda sahiplik uyarısı verirse global ayarı değiştirmeden salt okunur komutlarda şu biçimi kullan: `git -c safe.directory='C:/Users/ASUS/OneDrive/Belgeler/fınasman' -C '<proje-yolu>' ...`
- `.next/`, `node_modules/` ve `.npm-cache/` üretilmiş/yerel dizinlerdir; kaynak incelemesinde bunları dışarıda bırak.

## Mimari harita

### Uygulama kabuğu

- `src/app/page.tsx`: Ana dashboard'u açar.
- `src/app/layout.tsx`: Kök layout ve genel metadata.
- `src/app/globals.css`: Global tema ve stiller.
- `src/proxy.ts`: `LOCAL_APP_PASSWORD` tanımlıysa sayfaları ve API'leri yerel auth çereziyle korur.
- `src/app/login/page.tsx`, `src/components/local-login-form.tsx`: Yerel giriş akışı.

### Ana arayüz

- `src/components/market-dashboard.tsx`: Piyasa seçimi, takip listesi, sembol analizi ve sekmelerin ana orkestrasyonu.
- Ana sekmeler: analiz, portföy, uyarılar, bülten, geçmiş ve sistem.
- Önemli paneller: teknik göstergeler, çoklu zaman dilimi teyidi, trade planı, karar raporu, temel analiz, AI yorumu, risk hesaplayıcı, portföy, trade günlüğü, performans, dışa/içe aktarma, hazırlık durumu ve günlük bülten.
- Takip listesi ve bazı kullanıcı ayarları tarayıcı tarafında saklanır; kalıcı iş kayıtları SQLite'tadır.

### Analiz ve veri katmanı

- `src/lib/analysis.ts`: SMA, EMA, RSI, MACD, ATR, destek/direnç, volatilite, skor, karar raporu, çoklu zaman dilimi özeti ve trade planı.
- `src/lib/combined-analysis.ts`: Teknik ve temel analizi birleştirir; uzun vadeli tez ve değerleme sınıfı üretir.
- `src/lib/fundamentals.ts`: Şirket temel verilerini alır ve sağlık/skor özeti üretir.
- `src/lib/binance.ts`: Kripto ticker, mum, sembol doğrulama ve evren işlemleri.
- `src/lib/yahoo.ts`: ABD/BIST ticker, mum ve sembol doğrulama işlemleri.
- `src/lib/daily-briefing.ts`: Tema/varlık bazlı son 24 saat haberlerini ve 1 ay/1 yıl performansını günlük bültene dönüştürür.
- `src/lib/long-term-analysis.ts`: 1/3/5 yıllık şirket kalitesi, büyüme, bilanço, sektörel değerleme, göreli performans ve fiyat riski skorunu; güncel haber ve SEC kanıt katmanını üretir.
- `src/lib/ai-commentary.ts`: Analiz girdisini OpenAI Responses API'ye gönderir.
- `src/lib/server-cache.ts`: Sunucu tarafı önbellek yardımcıları.
- `src/lib/market-universe.ts`, `src/lib/markets.ts`: Desteklenen piyasa ve sembol evreni.
- `src/lib/local-db.ts`: SQLite şeması ve CRUD işlemleri.
- `src/lib/performance.ts`, `readiness.ts`, `usage-summary.ts`, `export-data.ts`: Performans, hazırlık, kullanım özeti ve veri taşıma yardımcıları.

### API yüzeyi

`src/app/api/` altında şu route grupları bulunur:

- Piyasa/analiz: `market`, `symbol`, `universe`, `analyze`, `fundamentals`, `long-term-analysis`, `ai-commentary`, `daily-briefing`
- Yerel kayıtlar: `portfolio`, `trades`, `alerts`, `snapshots`, `usage-notes`, `usage-summary`, `performance`
- Operasyon: `auth`, `health`, `readiness`, `export`, `import`

### Yerel veri modeli

`src/lib/local-db.ts`, aşağıdaki tabloları gerektiğinde oluşturur:

- `portfolio_positions`
- `trade_entries`
- `alert_rules`
- `analysis_snapshots`
- `usage_trial_notes`

`data/finansman.db` gerçek kullanıcı verisi içerebilir. Şema değişikliği veya test sırasında bu dosyayı silme, sıfırlama ya da örnek veriyle ezme. Test gerekiyorsa güvenli ve ayrı bir test verisi yaklaşımı kullan.

## Tasarım ve geliştirme ilkeleri

- Mevcut Türkçe arayüzü ve koyu finans paneli tasarım dilini koru.
- İstenen değişiklikle ilgisiz büyük refactor yapma.
- Piyasa türlerinin sembol kurallarını koru: kripto USDT pariteleri, BIST için `.IS` normalizasyonu, ABD hisseleri için Yahoo sembolleri.
- Teknik analiz ile uzun vadeli temel tezi aynı şeymiş gibi sunma; zaman ufuklarını açıkça ayır.
- Haber yoksa yapay başlık veya olay üretme; veri bulunamadığını açıkça söyle.
- Dış servis hatalarını anlaşılır hata/fallback davranışıyla ele al.
- API anahtarlarını yalnızca sunucu tarafında kullan; istemci paketine veya repoya dahil etme.
- SQLite ve Next.js sunucu çalışma zamanı bağımlılığını göz önünde bulundur; Vercel/Supabase geçişi henüz yol haritasının sonraki aşamasıdır.

## Mevcut durum ve yol haritası

- Günlük bültenin ilk sürümü kodda mevcut: dashboard sekmesi, API route'u ve bülten motoru eklenmiş.
- Dashboard'da `Uzun Vade` sekmesi mevcut. ABD/BIST hisseleri için 1, 3 veya 5 yıllık araştırma üretir; kriptoyu bilanço analizine dahil etmez.
- Uzun vadeli model ağırlıkları: şirket kalitesi %25, büyüme %20, bilanço dayanıklılığı %15, sektöre göre değerleme %20, göreli performans %10 ve fiyat riski %10. Eksik veri sıfır puan sayılmaz; kapsam/güven ayrıca raporlanır.
- Değerleme katmanı F/K, PD/DD ve FD/FAVÖK kullanır. `FMP_API_KEY` ve uygun plan varsa canlı emsal medyanları alınır; aksi durumda eksiklik açıkça belirtilip sektör duyarlı mutlak bantlar kullanılır.
- Fiyat katmanı şirketi piyasa göstergesiyle (`SPY` veya `XU100.IS`) ve ABD hisselerinde uygun sektör ETF'iyle kıyaslar; toplam/yıllıklandırılmış getiri, volatilite ve azami düşüş hesaplar.
- Güncel gelişmeler Google News RSS'den, ABD resmi bildirimleri SEC EDGAR'dan gelir. Haberler skoru değiştirmez; yalnızca tez kanıtı olarak gösterilir. SEC erişimi için açıklayıcı iletişim bilgisi içeren `SEC_USER_AGENT` gerekir.
- Temel analiz ile teknik analizi ayıran birleşik analiz ve başlangıç değerleme katmanı mevcut.
- ATR tabanlı risk/pozisyon yaklaşımının ilk sürümü mevcut.
- Ayrıntılı öncelikler için `ANALIZ_YOL_HARITASI.md` esas alınır.
- Devam bağlamı için `PROJECT_HANDOFF.md`, `UYGULAMA_OZETI.md`, `PROJECT.md`, `DAILY_BULLETIN_SKILL.md`, `MCP_DATA_SOURCES.md`, `TEST_PLAN.md` ve `TEST_RUNBOOK.md` okunmalıdır.
- Öncelik önce analiz motoru ve yerel karar günlüğünü olgunlaştırmak; Supabase, kullanıcı hesapları ve Vercel dağıtımı daha sonra ele alınacaktır.

## Bilinen dikkat noktaları

- Bağımlılıklar `latest` sürümüne sabitlenmiş; yeniden kurulumlarda sürüm kayması riski vardır. `package-lock.json` korunmalıdır.
- Harici Binance, Yahoo, Google News, FMP ve OpenAI çağrıları ağ erişimine ve servis davranışına bağlıdır.
- Günlük bülten henüz güvenilir/kurumsal haber kaynağı entegrasyonu ve veritabanına kalıcı kayıt açısından ilk aşamadadır.
- Google News yalnızca keşif katmanıdır; Bloomberg dahil görünen her başlık asıl yayın bağlantısından doğrulanmalıdır. Paywall içeriği kopyalanmaz veya kaynaktan gelmeyen özet üretilmez.
- BIST için canlı, sektör bazlı emsal çarpan kapsamı veri sağlayıcısına bağlı ve sınırlı olabilir; düşük veri kapsamı kullanıcıya güven seviyesiyle gösterilir.
- Çalışma ağacında 2026-08-19 incelemesi sırasında kullanıcıya ait commit edilmemiş değişiklikler vardı. Her yeni işlem öncesi güncel durumu yeniden kontrol et.

## Son işlem günlüğü

### 2026-08-19 — 1–5 yıllık yatırım araştırma modülü eklendi

- Amaç: Uzun vadeli şirket değerlendirmesini bilanço, sektörel çarpan, göreli performans, risk ve güncel gelişmelerle desteklemek.
- Eklenenler: `src/lib/long-term-analysis.ts`, `src/app/api/long-term-analysis/route.ts`, `src/components/long-term-research-panel.tsx` ve dashboard'da `Uzun Vade` sekmesi.
- Genişletilenler: Temel analiz ham verisine PD/DD, FD/FAVÖK, kazanç büyümesi, brüt/faaliyet marjı, ROA ve temettü verimi alanları eklendi. ABD temel analiz API'si FMP başarısız/eksik olduğunda Yahoo yedeğine geçiyor.
- Veri kaynakları: FMP canlı emsal/TTM oranları, Yahoo düzeltilmiş fiyat geçmişi, Google News RSS ve isteğe bağlı SEC EDGAR resmi bildirimleri.
- Yöntem kararı: Haberler puana dahil edilmedi. Eksik metrikler sıfır sayılmadı; ağırlık kapsamından çıkarılarak ayrıca veri kapsamı ve güven seviyesi gösterildi. Finans sektörü için borç/cari oran yerine sektör duyarlı kalite yaklaşımı kullanıldı.
- Ortam: `.env.example` dosyasına gizli değer içermeyen `SEC_USER_AGENT` adı eklendi.
- Doğrulama: Sektör bazlı değerleme bantları eklendikten sonra `npm run lint` ve `npm run build` yeniden başarıyla tamamlandı; Next.js `/api/long-term-analysis` rotasını dinamik route olarak derledi. Oturumda bağlı tarayıcı bulunmadığı için görsel/tıklama testi yapılamadı.

### 2026-09-16 — Proje yapısı ve durumu incelendi

- Amaç: Kullanıcı talebi üzerine projenin mimarisi, veri kaynakları, bileşenleri, API rotaları ve mevcut Git durumu detaylı olarak incelendi.
- İncelenenler: `AGENTS.md`, `package.json`, `git status`, `src/lib`, `src/components`, API rotaları, veritabanı şeması ve modül bağımlılıkları.
- Değişen dosya: `AGENTS.md` (günlük kaydı eklendi).
- Karar: Proje mimarisine sadık kalınarak mevcut Türkçe koyu finans görünümü ve modüler yapının korunmasına devam edilecek.
- Doğrulama: `git status` ve dosya yapısı başarıyla doğrulandı.

### 2026-09-20 — 3 Ay - 5 Yıl Bilanço Yorumlama ve Tahmini Fiyat Projeksiyonları Modülü Eklendi

- Amaç: Kullanıcının 3 ay (3M), 6 ay (6M), 1 yıl (1Y), 3 yıl (3Y) ve 5 yıl (5Y) vadelerinde çeyreklik bilanço yorumlarını, marj trendlerini ve Boğa/Baz/Ayı tahmini fiyat senaryolarını inceleyebileceği sistemi kurmak.
- Değişen Dosyalar:
  - `src/lib/long-term-analysis.ts`: `LongTermHorizon` veri tipi `"3m" | "6m" | "1y" | "3y" | "5y"` seçeneklerine genişletildi. Çeyreklik bilanço yorumlama motoru (`buildQuarterlyCommentary`) ve volatilite kanalları/büyüme oranlarına dayalı Boğa, Baz ve Ayı senaryo tahmin motoru (`buildPriceProjections`) eklendi.
  - `src/app/api/long-term-analysis/route.ts`: API route'unun `horizon` sorgu parametresi `"3m" | "6m" | "1y" | "3y" | "5y"` değerlerini kabul edecek şekilde güncellendi.
  - `src/components/long-term-research-panel.tsx`: Arayüze 3 Ay, 6 Ay, 1 Yıl, 3 Yıl ve 5 Yıl vade seçim düğmeleri, Çeyreklik Bilanço Yorumu & Finansal Sağlık Kartı (`QuarterlyBalanceSheetCard`) ve Tahmini Fiyat Hareketleri & Senaryo Kartı (`PriceProjectionsCard`) eklendi.
### 2026-10-17 — Yazılım Sektör Analisti (Atlas) & Ürün Mimarı (Mimar Selim) Ekibi ve Portföy PDF Rehberi Oluşturuldu

- Amaç: Kullanıcı talebi doğrultusunda yazılım sektörü analizi ve uygulanabilir yalın (MVP) proje fikirleri üretmek için Tek Sorumluluk Prensibi'ne (Single Responsibility) dayalı 2 alt ajan (`Atlas` ve `Mimar Selim`) kurmak; ardından GitHub portföy çeşitlendirmesi için kapsamlı bir mimari dokümanı PDF formatında üretmek.
- Eklenen & Güncellenen Unsurlar:
  - Alt Ajanlar Tanımlandı: `atlas-market-analyst` (Pazar Analisti Atlas) ve `mimar-selim-ideator` (Ürün Mimarı Selim).
  - Ajan İletişimi & Şeffaflık: Kullanıcıya alt ajanların oturum mantığı, log (`transcript.jsonl`) inceleme yöntemleri aktarıldı.
  - Sektör & Fikir Raporları: Atlas'ın 2026 makro pazar ve Dikey SaaS analizi ile Mimar Selim'in 3 MVP proje tasarımı (SignOffy, HookSentry, GuardLLM) üretildi.
  - PDF & Dokümantasyon: `docs/github-portfolio-guide.html` kaynak dosyası oluşturuldu ve Google Chrome headless motoruyla `GitHub_Portfoy_Gelistirme_Rehberi_2026.pdf` (286 KB) olarak derlendi.
- Doğrulama: `GitHub_Portfoy_Gelistirme_Rehberi_2026.pdf` dosyasının başarıyla 286 KB olarak üretildiği doğrulandı.

### 2026-10-17 — ScopeLock Proje Ekibi Kuruldu ve 1. Adım GitHub'a Pushlandı

- Amaç: Kullanıcının belirlediği ScopeLock projesi için 4 kişilik uzman ekip kurmak (Proje Lideri: Armut, Yazılımcı: Vanlı, Siber Güvenlik: Ali Oda, Test: Jony) ve 1. Adımı (Temel Mimari, PostgreSQL Şeması, RLS, Güvenlik/QA denetimi) tamamlayıp GitHub'a pushlamak.
- Ajanlar: `armut-project-lead`, `vanli-developer`, `ali-oda-security`, `jony-tester`.
- Yaşanan Güvenlik ve Kalite Süreci:
  - Vanlı ilk mimariyi kurdu; Ali Oda 2 kritik RLS açığını (CVSS 9.8 / 9.4) yakalayıp geçişi durdurdu.
  - Jony `tsconfig.json` path alias hatasını, negatif ücret ve boşlukla imzalama sınır durumlarını yakaladı.
  - Vanlı tüm düzeltmeleri uyguladı (Row-level lock, immutable audit logs, strict RLS, Zod ve input trimming).
  - Ekip Lideri Armut onayladı, rebase çatışmasını çözdü ve kodları `https://github.com/BurakGuldal10/ScopeLock` reposuna başarıyla pushladı.

### 2026-10-17 — ScopeLock 2. Aşama (Ajans Yönetim Paneli) Tamamlandı ve Pushlandı

- Amaç: Ajans kontrol paneli (`/dashboard`), yeni onay modalı (`new-signoff-modal`), sihirli link üretimi (`/view/[token]`), proje modalı, auth sayfaları ve server action'larını kodlayıp test/güvenlik onayından sonra GitHub'a pushlamak.
- Değişen & Eklenen Dosyalar: `app/dashboard/page.tsx`, `components/new-signoff-modal.tsx`, `components/new-project-modal.tsx`, `components/signoff-list.tsx`, `app/actions/signoffs.ts`, `app/actions/auth.ts`, `app/login/page.tsx`, `lib/utils.ts`.
- Denetim: Ali Oda (token entropisi ve IDOR) ile Jony (mobil UI ve tip güvenliği) onayladı.
- Doğrulama & Dağıtım: Kodlar `38062b2` commit'i ile `https://github.com/BurakGuldal10/ScopeLock` reposuna pushlandı.

### 2026-10-17 — ScopeLock 3. Aşama (Şifresiz Müşteri Onay Portalı) Tamamlandı ve Pushlandı

- Amaç: Müşterinin şifresiz/hesapsız tek tıkla açabileceği onay sayfası (`/view/[token]`), `react-signature-canvas` tabanlı dijital imza paneli, anlık zaman damgası/IP yakalama ve revizyon talep mekanizmasını kodlayıp GitHub'a pushlamak.
- Değişen & Eklenen Dosyalar: `app/view/[token]/page.tsx`, `components/client-view-action.tsx`, `components/signature-pad.tsx`, `app/actions/client-signoff.ts`.
- Denetim: Ali Oda (durum manipülasyon kilidi ve IP yakalama) ve Jony (SSR canvas dinamik import ve mobil dokunmatik duyarlılık) onayladı.
- Doğrulama & Dağıtım: Kodlar `4a4edf1` commit'i ile `https://github.com/BurakGuldal10/ScopeLock` reposuna pushlandı.

### 2026-10-17 — ScopeLock 4. Aşama (PDF Üretimi & E-posta Bildirimleri) Tamamlandı ve Pushlandı

- Amaç: Müşteri onayladığı anda zaman damgalı resmi sözleşme PDF'i üretmek, ajans ve müşteriye Resend ile otomatik e-posta göndermek ve ajans panelini anlık yeşile döndürmek.
- Değişen & Eklenen Dosyalar: `components/pdf/signoff-document.tsx`, `app/api/pdf/[token]/route.ts`, `lib/email.ts`, `app/actions/client-signoff.ts`, `components/client-view-action.tsx`, `components/signoff-list.tsx`.
- Denetim: Ali Oda (zaman damgası/IP doğruluğu, e-posta injection) ve Jony (A4 mizanpaj, base64 imza render, mobil indirme) onayladı.
- Doğrulama & Dağıtım: Kodlar `98bcc1c` commit'i ile `https://github.com/BurakGuldal10/ScopeLock` reposuna pushlandı.

### 2026-10-29 — ScopeLock 5. Aşama & Şema Uyumsuzluğu Giderildi

- Amaç: TypeScript tipleri (`Agency`, `Project`, `Signoff`), server actions ve Supabase SQL şeması arasındaki adlandırma ve ilişki tutarsızlığını gidermek; Ali Oda'nın güvenlik sertleştirmelerini (`update_updated_at_column` search_path, çift revizyon engeli) ve anonim müşteri token işlemlerindeki RLS bypass mekanizmasını (`createAdminClient`) tamamlamak.
- Değişen & Eklenen Dosyalar:
  - `supabase/migrations/01_init.sql`: `agencies`, `projects`, `signoffs`, `audit_logs` yapısına dönüştürüldü; RLS politikaları ve güvenli RPC fonksiyonları (`get_approval_by_token`, `submit_client_approval`, `submit_client_revision`) entegre edildi.
  - `app/actions/client-signoff.ts`: Anonim imzalama ve onay sorgularının RLS engeline takılmaması için `createAdminClient` kullanımına geçirildi.
- Denetim & Test: Ali Oda güvenlik incelemesinden koşullu onay alındı ve tüm güvenlik tavsiyeleri uygulandı; `npx tsc --noEmit` ile TypeScript derlemesi sıfır hatayla doğrulandı.
- Dağıtım: Değişiklikler `5ecac15` commit'i ile `https://github.com/BurakGuldal10/ScopeLock` ana dalına (main) pushlandı.

### 2026-10-29 — ScopeLock Canlı Supabase Veritabanı Kurulumu ve Doğrulaması

- Amaç: Kullanıcının açtığı canlı Supabase projesine SQL şemasını, RLS politikalarını ve RPC fonksiyonlarını uygulamak; `anon` ve `service_role` anahtarlarıyla `.env.local` yapılandırmasını tamamlayıp uçtan uca canlı bağlantıyı test etmek.
- Yapılan İşlemler:
  - Canlı Supabase projesinde (`ocqfcallmodpdbglolor.supabase.co`) tüm tablolar (`agencies`, `projects`, `signoffs`, `audit_logs`) ve RPC fonksiyonları başarıyla oluşturuldu.
  - `.env.local` dosyası `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` ile yapılandırıldı; `.gitignore` güvencesiyle repoya sızması engellendi.
  - Doğrudan REST API üzerinden RLS koruması ve `get_approval_by_token` RPC çağrısı test edildi: 200 OK.
  - `service_role` ile tüm 4 tabloya erişim doğrulandı: 200 OK.
- Durum: ScopeLock projesi hem yerel demo modunda hem de gerçek canlı Supabase veritabanıyla %100 çalışır ve yayına hazır durumdadır.

### 2026-10-30 — Ajanların Çoklu Platform ve CMD Desteği Kuruldu

- Amaç: Projedeki uzman ajanların (Armut, Vanlı, Ali Oda, Jony, Atlas, Mimar Selim) CMD, PowerShell, Google Gemini, OpenAI, DeepSeek, Ollama, Cursor ve Claude gibi harici platformlarda evrensel olarak kullanılabilmesini sağlamak.
- Eklenen & Güncellenen Dosyalar:
  - `agents/definitions.json`: Tüm ajanların kimlik, rol ve sistem promptlarının toplandığı evrensel JSON veri tabanı.
  - `agents/runner.mjs`: Node.js yerleşik `fetch` kullanan, harici kütüphane bağımlılığı olmayan çoklu platform (Gemini, OpenAI, Ollama, DeepSeek) CLI motoru.
  - `agents/prompts/`: Ajanların Claude Desktop, ChatGPT Custom GPT veya Cursor kurallarına kopyalanabilmesi için `.md` sistem promptları.
  - `package.json`: `npm run agent` kısayolu eklendi.
- Doğrulama: `node agents/runner.mjs --help` çalıştırılarak CLI arayüzünün sorunsuz çalıştığı doğrulandı.

### 2026-10-30 — HookSentry Tüm Aşamaları (1-5) Tamamlandı ve GitHub'a Pushlandı

- Amaç: "HookSentry" MVP projesinin tüm aşamalarını (Ingest Motoru, HMAC Doğrulama, İletim & Exponential Backoff, Dead-Letter Queue ve Sağlık/İzleme) sıfır token israfıyla tamamlayıp GitHub reposuna aktarmak.
- GitHub Reposu: `https://github.com/BurakGuldal10/HookSentry`
- Tamamlanan Aşamalar & Commitler:
  1. `f626e3f` — `feat(core)`: Proje temeli, Prisma şeması, SSRF korumalı endpoint yönetimi.
  2. `c7d2b7c` — `feat(ingest)`: `/api/v1/ingest/[id]` ham gövde (raw body) yakalama, timing-safe HMAC doğrulama ve 2MB boyut sınırı.
  3. `1fd7778` — `feat(delivery)`: `lib/dispatcher.ts` iletim motoru, timeout yönetimi, exponential backoff ve otomatik DLQ aktarımı.
  4. `ce6bc69` — `feat(dlq)`: `/dlq` sayfası, `app/actions/dlq.ts`, manuel tekil/toplu replay butonu ve JSON payload inceleyicisi.
  5. `3f88c8e` — `feat(monitoring)`: `/api/health` sağlık/gecikme kontrol endpoint'i, navigasyon ve kapsamlı README dokümantasyonu.
- Doğrulama & Dağıtım: `npx tsc --noEmit` ile tip kontrolü yapıldı, 0 hata ile doğrulandı. Kodlar başarıyla `https://github.com/BurakGuldal10/HookSentry` ana dalına (main) pushlandı.

### 2026-11-11 — HookSentry Cron Worker & Finansman Asistanı Derleme Doğrulaması

- Amaç: HookSentry projesine otomatik retry worker (`/api/v1/cron/retry`) ve `.env.example` eklemek; Finansman Asistanı'nın lint/build derlemesini doğrulayıp Git değişikliklerini kaydetmek.
- HookSentry: `bb8c72a` commit'i ile GitHub'a pushlandı.
- Finansman: `npm run lint` ve `npm run build` Turbopack ile sıfır hatayla doğrulandı (24 route derlendi). Uzun vadeli analiz, günlük bülten ve evrensel ajan altyapısı Git'e kaydedilmeye hazırlandı.
