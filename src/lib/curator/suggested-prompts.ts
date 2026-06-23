import type { Locale } from "@/lib/i18n/config";

function t(locale: Locale, es: string, en: string, ja: string): string {
  if (locale === "ja") return ja;
  if (locale === "es") return es;
  return en;
}

export function getSuggestedPrompts(
  locale: Locale,
  artworkTitle?: string,
): string[] {
  if (artworkTitle) {
    return [
      t(
        locale,
        `Según el archivo, ¿de qué trata «${artworkTitle}»?`,
        `According to the archive, what is «${artworkTitle}» about?`,
        `アーカイブによると、「${artworkTitle}」は何についてですか？`,
      ),
      t(
        locale,
        `¿Qué conecta «${artworkTitle}» con otras obras de este archivo?`,
        `What connects «${artworkTitle}» to other works in this archive?`,
        `「${artworkTitle}」はこのアーカイブの他の作品とどうつながりますか？`,
      ),
      t(
        locale,
        `¿Qué falta documentar sobre «${artworkTitle}»?`,
        `What is not yet documented about «${artworkTitle}»?`,
        `「${artworkTitle}」についてまだ何が記録されていませんか？`,
      ),
    ];
  }

  return [
    t(
      locale,
      "¿Qué obras hay en el archivo y qué las conecta?",
      "What works are in the archive and what connects them?",
      "アーカイブにはどんな作品があり、何がそれらをつなげていますか？",
    ),
    t(
      locale,
      "¿Cuál es la línea de trabajo del artista según los textos?",
      "What is the artist's line of practice according to the texts?",
      "テキストによると、この作家の実践の方向性は何ですか？",
    ),
    t(
      locale,
      "¿Qué materiales o procesos se repiten en la colección?",
      "What materials or processes recur across the collection?",
      "コレクション全体で繰り返される素材やプロセスは何ですか？",
    ),
    t(
      locale,
      "¿Hay una serie o hilo conductor entre las piezas?",
      "Is there a series or through-line across the pieces?",
      "作品間にシリーズや一貫した糸はありますか？",
    ),
  ];
}

export function buildCuratorWelcome(
  locale: Locale,
  params: {
    artworkTitle?: string;
    artworkCount: number;
    artistName?: string | null;
  },
): string {
  const who = params.artistName
    ? t(
        locale,
        ` de ${params.artistName}`,
        `'s archive`,
        ` — ${params.artistName}`,
      )
    : "";

  if (params.artworkTitle) {
    return t(
      locale,
      `Soy el curador del archivo${who}. Estás mirando «${params.artworkTitle}». Pregúntame desde sus textos — no inventaré lo que no esté documentado.`,
      `I'm the curator of this archive${who}. You're viewing «${params.artworkTitle}». Ask me from its texts — I won't invent what isn't documented.`,
      `私はこのアーカイブ${who}のキュレーターです。「${params.artworkTitle}」をご覧中ですね。記録されたテキストに基づいてお答えします — 未記載のことは推測しません。`,
    );
  }

  if (params.artworkCount === 0) {
    return t(
      locale,
      `Soy el curador de este archivo${who}. Aún no hay obras publicadas; cuando se añadan, hablaré solo desde sus textos.`,
      `I'm the curator of this archive${who}. No works are published yet; when they are, I'll speak only from their texts.`,
      `私はこのアーカイブ${who}のキュレーターです。まだ公開作品がありません。追加されたら、そのテキストだけから語ります。`,
    );
  }

  return t(
    locale,
    `Soy el curador del archivo${who} — ${params.artworkCount} obra${params.artworkCount === 1 ? "" : "s"} publicada${params.artworkCount === 1 ? "" : "s"}. Interpreto tu trabajo abstracto desde los textos de sala, no desde generalidades.`,
    `I'm the curator of this archive${who} — ${params.artworkCount} published work${params.artworkCount === 1 ? "" : "s"}. I interpret abstract work from wall texts, not generalities.`,
    `私はこのアーカイブ${who}のキュレーターです — 公開作品${params.artworkCount}点。抽象作品をウォールテキストから解釈します。一般論ではありません。`,
  );
}
