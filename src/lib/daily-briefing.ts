export type BriefingThemeId =
  | "ai"
  | "datacenter"
  | "energy"
  | "chips"
  | "cooling"
  | "nuclear-renewables"
  | "cloud-capex"
  | "public-companies"
  | "precious-metals";

export type BriefingTargetKind = "stock" | "commodity" | "crypto" | "index";

export type BriefingTarget = {
  symbol: string;
  name: string;
  kind: BriefingTargetKind;
  speculative?: boolean;
};

export type NewsItem = {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
};

export type PricePerformance = {
  symbol: string;
  oneMonthPercent: number | null;
  oneYearPercent: number | null;
  latestPrice: number | null;
};

export type BriefingBullet = {
  summary: string;
  importance: string;
  investmentView: string;
  badge: "positive" | "neutral" | "negative" | "speculative" | "no-news";
  news?: NewsItem;
  performance?: PricePerformance;
};

export type BriefingSection = {
  id: string;
  title: string;
  badge: string;
  bullets: BriefingBullet[];
};

export type DailyBriefing = {
  generatedAt: string;
  lookbackHours: number;
  sections: BriefingSection[];
  generalAssessment: string;
};

export const briefingThemes: Array<{
  id: BriefingThemeId;
  title: string;
  query: string;
}> = [
  {
    id: "ai",
    title: "Yapay zeka",
    query: "artificial intelligence AI model launch regulation",
  },
  {
    id: "datacenter",
    title: "Veri merkezi insaati ve kapasitesi",
    query: "AI data center construction capacity expansion",
  },
  {
    id: "energy",
    title: "Enerji tuketimi ve guc altyapisi",
    query: "AI power grid energy demand turbine behind the meter",
  },
  {
    id: "chips",
    title: "GPU ve ozel AI cipleri",
    query: "Nvidia AMD ASIC HBM AI chip GPU",
  },
  {
    id: "cooling",
    title: "Sogutma teknolojileri",
    query: "data center liquid cooling immersion cooling AI",
  },
  {
    id: "nuclear-renewables",
    title: "Nukleer ve yenilenebilir enerji ile AI",
    query: "AI data center nuclear SMR renewable PPA",
  },
  {
    id: "cloud-capex",
    title: "Buyuk bulut altyapi yatirimlari",
    query: "AWS Azure Google Cloud AI infrastructure capex data centers",
  },
  {
    id: "public-companies",
    title: "Halka acik sirketler ve yatirimci sunumlari",
    query: "AI infrastructure public companies investor presentation earnings",
  },
  {
    id: "precious-metals",
    title: "Kiymetli madenler",
    query: "gold silver precious metals Fed inflation real yields",
  },
];

const defaultTargets: BriefingTarget[] = [
  { symbol: "NVDA", name: "Nvidia", kind: "stock" },
  { symbol: "AMD", name: "AMD", kind: "stock" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock" },
  { symbol: "GOOGL", name: "Alphabet", kind: "stock" },
  { symbol: "AMZN", name: "Amazon", kind: "stock" },
  { symbol: "GC=F", name: "Altin", kind: "commodity" },
  { symbol: "SI=F", name: "Gumus", kind: "commodity" },
];

export function getDefaultBriefingTargets() {
  return defaultTargets;
}

export async function buildDailyBriefing(targets: BriefingTarget[]): Promise<DailyBriefing> {
  const normalizedTargets = normalizeTargets(targets);
  const themeSections = await Promise.all(briefingThemes.map(buildThemeSection));
  const targetSections = await Promise.all(normalizedTargets.map(buildTargetSection));
  const sections = [...themeSections, ...targetSections];

  return {
    generatedAt: new Date().toISOString(),
    lookbackHours: 24,
    sections,
    generalAssessment: buildGeneralAssessment(sections),
  };
}

async function buildThemeSection(theme: (typeof briefingThemes)[number]): Promise<BriefingSection> {
  const news = await fetchRecentNews(theme.query, 4);
  const bullets =
    news.length > 0
      ? news.slice(0, 4).map((item) => buildNewsBullet(item))
      : [buildNoNewsBullet(theme.title)];

  return {
    id: theme.id,
    title: theme.title,
    badge: news.length > 0 ? "Tema" : "Onemli haber yok",
    bullets,
  };
}

async function buildTargetSection(target: BriefingTarget): Promise<BriefingSection> {
  const [news, performance] = await Promise.all([
    fetchRecentNews(`${target.name} ${target.symbol} AI infrastructure earnings investment`, 3),
    fetchPricePerformance(target.symbol),
  ]);
  const bullets =
    news.length > 0
      ? news.slice(0, 3).map((item) => buildTargetBullet(item, target, performance))
      : [buildTargetNoNewsBullet(target, performance)];

  return {
    id: `target-${target.symbol}`,
    title: `${target.name} (${target.symbol})`,
    badge: target.speculative ? "Spekulatif" : getTargetKindLabel(target.kind),
    bullets,
  };
}

async function fetchRecentNews(query: string, limit: number): Promise<NewsItem[]> {
  try {
    const params = new URLSearchParams({
      ceid: "TR:tr",
      gl: "TR",
      hl: "tr",
      q: `${query} when:1d`,
    });
    const response = await fetch(`https://news.google.com/rss/search?${params}`, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseNewsRss(xml).slice(0, limit);
  } catch {
    return [];
  }
}

function parseNewsRss(xml: string): NewsItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.map((match) => {
    const item = match[1];
    return {
      title: decodeXml(readXmlTag(item, "title")),
      source: decodeXml(readXmlTag(item, "source")) || "Haber kaynagi",
      publishedAt: new Date(readXmlTag(item, "pubDate") || Date.now()).toISOString(),
      url: decodeXml(readXmlTag(item, "link")),
    };
  });
}

function readXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim() ?? "";
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchPricePerformance(symbol: string): Promise<PricePerformance> {
  try {
    const params = new URLSearchParams({
      interval: "1d",
      range: "1y",
    });
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`,
      { next: { revalidate: 1800 } },
    );

    if (!response.ok) {
      throw new Error("Price request failed");
    }

    const data = (await response.json()) as {
      chart?: {
        result?: Array<{
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    };
    const closes =
      data.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      ) ?? [];
    const latestPrice = closes.at(-1) ?? null;

    return {
      symbol,
      latestPrice,
      oneMonthPercent: percentChange(closes.at(-22) ?? null, latestPrice),
      oneYearPercent: percentChange(closes[0] ?? null, latestPrice),
    };
  } catch {
    return {
      symbol,
      latestPrice: null,
      oneMonthPercent: null,
      oneYearPercent: null,
    };
  }
}

function buildNewsBullet(item: NewsItem): BriefingBullet {
  return {
    summary: `${formatDate(item.publishedAt)} tarihinde ${item.source} kaynakli haber: ${item.title}`,
    importance:
      "Bu baslik AI altyapisi, kapasite, enerji veya regülasyon tezini etkileyebilecek yeni bilgi akisi sagliyor.",
    investmentView:
      "Haber tek basina islem nedeni degil; tema gucleniyorsa kaliteli ve nakit akisi guclu sirketlerde pozisyon koru, sert yukselis sonrasi yeni alim icin geri cekilme bekle.",
    badge: "neutral",
    news: item,
  };
}

function buildTargetBullet(
  item: NewsItem,
  target: BriefingTarget,
  performance: PricePerformance,
): BriefingBullet {
  const badge = target.speculative ? "speculative" : scorePerformanceBadge(performance);

  return {
    summary: `${formatDate(item.publishedAt)} tarihinde ${target.name} icin haber akisi: ${item.title}`,
    importance: buildPerformanceQuestion(performance),
    investmentView: buildInvestmentView(performance, target.speculative),
    badge,
    news: item,
    performance,
  };
}

function buildNoNewsBullet(title: string): BriefingBullet {
  return {
    summary: `Son 24 saatte ${title} basligi icin manşet niteliginde haber bulunamadi veya haber kaynagi erisilemedi.`,
    importance:
      "Bos gunde zorlama sinyal uretmemek daha saglikli; onceki yatirim tezi korunur, yeni aksiyon icin fiyat ve veri teyidi beklenir.",
    investmentView:
      "Yeni alim icin acele etme; mevcut pozisyonu koru ve sonraki bultende yeni haber/fiyat teyidi ara.",
    badge: "no-news",
  };
}

function buildTargetNoNewsBullet(
  target: BriefingTarget,
  performance: PricePerformance,
): BriefingBullet {
  return {
    summary: `Son 24 saatte ${target.name} icin manşet niteliginde haber bulunamadi veya haber kaynagi erisilemedi.`,
    importance: buildPerformanceQuestion(performance),
    investmentView: buildInvestmentView(performance, target.speculative),
    badge: target.speculative ? "speculative" : scorePerformanceBadge(performance),
    performance,
  };
}

function buildInvestmentView(performance: PricePerformance, speculative?: boolean) {
  if (speculative) {
    return "Spekulatif varlik: uzun vadeli tez kanitlanana kadar kucuk agirlikla takip et; sert yukseliste kar al, dususte agresif ekleme yapma.";
  }

  const oneMonth = performance.oneMonthPercent;
  const oneYear = performance.oneYearPercent;

  if (oneYear !== null && oneYear > 20 && oneMonth !== null && oneMonth < -8) {
    return "1 yillik trend yukari ama son 1 ayda sert duzeltme var; tez bozulmadiysa kademeli dipten alimla pozisyon artir, tek seferde yuklenme.";
  }

  if (oneYear !== null && oneYear > 15 && oneMonth !== null && oneMonth > 5) {
    return "Trend hem 1 ayda hem 1 yilda guclu; pozisyonu koru, yeni alim icin geri cekilme veya konsolidasyon bekle.";
  }

  if (oneYear !== null && oneYear < -10 && oneMonth !== null && oneMonth < 0) {
    return "Hem kisa hem uzun vadeli momentum zayif; sat ya da pozisyonu azalt, toparlanma teyidi gelmeden ekleme yapma.";
  }

  if (oneMonth !== null && oneMonth > 8 && (oneYear === null || oneYear <= 5)) {
    return "Son 1 ayda tepki guclu ama 1 yillik trend henuz net degil; pozisyonu koru, direncte kar realizasyonu dusun.";
  }

  return "Net trend teyidi sinirli; mevcut pozisyonu koru, yeni alim icin haber ve endeks ustu performans teyidi bekle.";
}

function buildPerformanceQuestion(performance: PricePerformance) {
  const oneMonth = formatPercent(performance.oneMonthPercent);
  const oneYear = formatPercent(performance.oneYearPercent);
  return `1 aylik performans ${oneMonth}, 1 yillik performans ${oneYear}. Bu fark, kisa vadeli kar realizasyonu mu yoksa uzun vadeli tezin zayiflamasi mi diye kontrol edilmeli.`;
}

function buildGeneralAssessment(sections: BriefingSection[]) {
  const hasNews = sections.some((section) =>
    section.bullets.some((bullet) => bullet.badge !== "no-news"),
  );
  const speculativeCount = sections.filter((section) => section.badge === "Spekulatif").length;

  if (!hasNews) {
    return "Bugun son 24 saatlik akista manşet niteliginde haber yakalanmadi. Portfoyde yeni risk almak yerine mevcut pozisyonlari korumak ve fiyat teyidi beklemek daha mantikli.";
  }

  if (speculativeCount > 0) {
    return "AI altyapisi temasi izlenmeye devam ediyor; ancak spekulatif sirketler buyuk ve kâr ureten sirketlerle ayni guven seviyesinde degerlendirilmemeli. Kaliteli bilanco, endeks ustu performans ve makro destek birlikte aranmalı.";
  }

  return "Gunluk akis AI altyapisi, enerji ve cip ekosisteminin uzun vadeli yatirim temasini destekleyebilir. Yine de yeni alimlarda son 1 ay/1 yil performans farki, degerleme ve haberin kaliciligi birlikte kontrol edilmeli.";
}

function scorePerformanceBadge(performance: PricePerformance): BriefingBullet["badge"] {
  const oneMonth = performance.oneMonthPercent;
  const oneYear = performance.oneYearPercent;

  if (oneYear !== null && oneYear > 15 && oneMonth !== null && oneMonth > -10) {
    return "positive";
  }

  if (oneYear !== null && oneYear < -10 && oneMonth !== null && oneMonth < 3) {
    return "negative";
  }

  return "neutral";
}

function percentChange(start: number | null, end: number | null) {
  if (start === null || end === null || start <= 0) {
    return null;
  }

  return ((end - start) / start) * 100;
}

function normalizeTargets(targets: BriefingTarget[]) {
  const source = targets.length > 0 ? targets : defaultTargets;
  const seen = new Set<string>();

  return source
    .map((target) => ({
      ...target,
      name: target.name.trim() || target.symbol.trim().toUpperCase(),
      symbol: target.symbol.trim().toUpperCase(),
    }))
    .filter((target) => {
      if (!target.symbol || seen.has(target.symbol)) {
        return false;
      }
      seen.add(target.symbol);
      return true;
    })
    .slice(0, 40);
}

function getTargetKindLabel(kind: BriefingTargetKind) {
  if (kind === "commodity") {
    return "Kiymetli maden";
  }

  if (kind === "crypto") {
    return "Kripto";
  }

  if (kind === "index") {
    return "Endeks";
  }

  return "Sirket";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}
