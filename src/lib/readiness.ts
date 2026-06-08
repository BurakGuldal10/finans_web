import type { UsageSummary } from "@/lib/usage-summary";

export type ReadinessStatus = "ready" | "attention" | "pending";

export type ReadinessItem = {
  id: string;
  label: string;
  detail: string;
  status: ReadinessStatus;
};

export type ReadinessReport = {
  generatedAt: string;
  score: number;
  status: ReadinessStatus;
  summary: string;
  items: ReadinessItem[];
  nextSteps: string[];
};

type LocalDataStats = {
  alerts: number;
  portfolio: number;
  snapshots: number;
  trades: number;
  triggeredAlerts: number;
  usageNotes: number;
};

type ReadinessInput = {
  fmpApiKey: boolean;
  localAuth: boolean;
  openAiApiKey: boolean;
  stats: LocalDataStats;
  usageSummary: UsageSummary;
};

export function buildReadinessReport(input: ReadinessInput): ReadinessReport {
  const items: ReadinessItem[] = [
    {
      detail: "Kripto, ABD hisse ve BIST akislari uygulama icinde bagli durumda.",
      id: "markets",
      label: "Piyasa veri akisi",
      status: "ready",
    },
    {
      detail: "Teknik skor, karar raporu, trade plani ve risk hesaplayici ana karar destek akisini olusturuyor.",
      id: "decision-support",
      label: "Karar destek motoru",
      status: "ready",
    },
    {
      detail:
        input.stats.snapshots > 0
          ? `${input.stats.snapshots} analiz raporu kaydedilmis.`
          : "En az bir analiz raporu kaydedilerek gecmis akisi gercek veriyle test edilmeli.",
      id: "snapshots",
      label: "Analiz gecmisi",
      status: input.stats.snapshots > 0 ? "ready" : "attention",
    },
    {
      detail:
        input.stats.trades + input.stats.portfolio > 0
          ? "Portfoy veya trade gunlugu yerel SQLite kayitlariyla denenmis."
          : "En az bir portfoy veya trade gunlugu kaydi eklenerek kalicilik akisi denenmeli.",
      id: "journals",
      label: "Portfoy ve gunluk",
      status: input.stats.trades + input.stats.portfolio > 0 ? "ready" : "attention",
    },
    {
      detail:
        input.stats.usageNotes > 0
          ? `${input.stats.usageNotes} gunluk kullanim notu kaydedilmis.`
          : "7 gunluk deneme icin gun sonu notlari henuz birikmemis.",
      id: "usage-trial",
      label: "Gercek kullanim denemesi",
      status: input.stats.usageNotes > 0 ? "attention" : "pending",
    },
    {
      detail: input.fmpApiKey
        ? "FMP anahtari aktif; ABD temel analizleri daha dolu calisabilir."
        : "FMP_API_KEY yok; ABD temel analizleri sinirli kalabilir.",
      id: "fundamentals",
      label: "Temel analiz verisi",
      status: input.fmpApiKey ? "ready" : "attention",
    },
    {
      detail: input.openAiApiKey
        ? "OpenAI anahtari aktif; AI yorum paneli kullanilabilir."
        : "OPENAI_API_KEY yok; AI yorum paneli yorum uretemez ama uygulama calismaya devam eder.",
      id: "ai",
      label: "AI yorum",
      status: input.openAiApiKey ? "ready" : "attention",
    },
    {
      detail: input.localAuth
        ? "Lokal parola kilidi aktif."
        : "LOCAL_APP_PASSWORD bos; kisisel cihaz disinda kullanilacaksa lokal kilit acilmali.",
      id: "local-auth",
      label: "Lokal erisim kilidi",
      status: input.localAuth ? "ready" : "attention",
    },
    {
      detail: "Export/import ve smoke test komutlari test paketine dahil.",
      id: "backup-tests",
      label: "Yedekleme ve test",
      status: "ready",
    },
  ];

  const readyCount = items.filter((item) => item.status === "ready").length;
  const score = Math.round((readyCount / items.length) * 100);
  const status: ReadinessStatus =
    score >= 80 ? "ready" : score >= 55 ? "attention" : "pending";

  return {
    generatedAt: new Date().toISOString(),
    items,
    nextSteps: buildNextSteps(input, items),
    score,
    status,
    summary:
      status === "ready"
        ? "Uygulama kisisel MVP kullanimi icin hazir gorunuyor; asil eksik gercek kullanim denemesi."
        : "Uygulama calisir durumda, ancak MVP kabulunden once bazi kullanim ve ortam kontrolleri tamamlanmali.",
  };
}

function buildNextSteps(input: ReadinessInput, items: ReadinessItem[]) {
  const steps: string[] = [];

  if (input.usageSummary.totals.activeDays < 7) {
    steps.push("7 gunluk kullanim denemesini tamamla ve her gun gun sonu notu kaydet.");
  }

  if (input.stats.snapshots === 0) {
    steps.push("En az bir sembolde karar raporu kaydet ve Gecmis sekmesinde geri oku.");
  }

  if (input.stats.trades + input.stats.portfolio === 0) {
    steps.push("Bir test portfoy veya trade gunlugu kaydi olusturup silme/guncelleme akisini dene.");
  }

  if (!input.fmpApiKey) {
    steps.push("ABD temel analizleri icin `.env.local` icine FMP_API_KEY eklemeyi degerlendir.");
  }

  if (!input.openAiApiKey) {
    steps.push("AI yorum panelini kullanacaksan OPENAI_API_KEY ekle ve bir karar raporunda dene.");
  }

  if (!input.localAuth) {
    steps.push("Uygulamayi baskasinin erisebilecegi bir cihazda acacaksan LOCAL_APP_PASSWORD tanimla.");
  }

  if (steps.length === 0 && items.some((item) => item.status === "attention")) {
    steps.push("Dikkat isteyen maddeleri gercek verilerle tekrar kontrol et.");
  }

  return steps.slice(0, 6);
}
