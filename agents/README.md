# Multi-Agent Runner / Evrensel Ajan Paketi

Bu paket; projede yer alan uzman ajanlarımızı (**Armut, Vanlı, Ali Oda, Jony, Atlas, Mimar Selim**) hem yerel komut satırında (CMD/PowerShell/Bash) hem de farklı platformlarda (Gemini, OpenAI, Anthropic Claude, Ollama/Yerel LLM veya Cursor/Windsurf/Cline sistem kuralları olarak) standart ve taşınabilir biçimde kullanmanızı sağlar.

---

## 🤖 Kayıtlı Ajanlar & Rolleri

1. **`armut` (Teknik Proje Lideri & Sistem Mimarı)**
   - Mimari kararlar, sprint yönetimi, görev delegasyonu ve nihai onay.
2. **`vanli` (Kıdemli Full-Stack Yazılımcı)**
   - Next.js, React, Node.js, Supabase, TypeScript ve temiz kod uygulaması.
3. **`ali-oda` (Siber Güvenlik & Penetrasyon Uzmanı)**
   - OWASP, RLS sızıntı denetimi, yetkilendirme, IDOR, token entropisi ve savunma mimarisi.
4. **`jony` (Kıdemli QA & Sınır Durum Test Mühendisi)**
   - UI/UX duyarlılığı, mobil sınır durumları, tipleme ve uçtan uca senaryo doğrulama.
5. **`atlas` (Yazılım Pazar & Dikey SaaS Analisti)**
   - Pazar trendleri, rekabet analizi, SaaS iş modelleri ve makro büyüme fırsatları.
6. **`mimar-selim` (MVP & Ürün Mimarı)**
   - Yalın ürün vizyonu, kullanıcı akışları, PRD tasarımı ve MVP özellik kapsamı.

---

## 🚀 CMD / Terminal Üzerinden Çalıştırma

`agents/` klasörü içerisindeki CLI aracı Node.js veya Python ile doğrudan çalıştırılabilir. Hiçbir harici bağımlılık kurmanıza gerek kalmadan yerel HTTP çağrılarıyla çalışacak şekilde tasarlanmıştır.

### 1. Gemini ile Çalıştırma
```cmd
set GEMINI_API_KEY=AIzaSy...
node agents/runner.mjs --agent ali-oda --provider gemini --prompt "Supabase RLS politikamı denetle"
```
veya etkileşimli sohbet (chat) modunda:
```cmd
node agents/runner.mjs --agent vanli --provider gemini --interactive
```

### 2. OpenAI / DeepSeek / Ollama ile Çalıştırma
Aynı ajanları OpenAI veya yerel modellerle çalıştırmak için:
```cmd
set OPENAI_API_KEY=sk-...
node agents/runner.mjs --agent armut --provider openai --prompt "ScopeLock için 6. aşama sprint planını çıkar"
```
Yerel modeller için (Ollama):
```cmd
node agents/runner.mjs --agent jony --provider ollama --model llama3 --prompt "Login ekranı için test senaryoları üret"
```

---

## 📁 Dosya Yapısı
- `agents/definitions.json`: Tüm ajanların kimlikleri, rolleri, sistem promptları ve yeteneklerinin tek bir JSON şemasında toplanmış hali.
- `agents/prompts/`: Cursor, Claude Desktop, ChatGPT Custom GPTs veya Windsurf için doğrudan kopyalanabilir markdown formatında sistem talimatları.
- `agents/runner.mjs`: Platform bağımsız (Node.js 18+) CLI motoru.
