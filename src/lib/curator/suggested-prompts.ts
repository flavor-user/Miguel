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
        `Al mirar «${artworkTitle}», ¿qué me invita a notar primero?`,
        `Looking at «${artworkTitle}», what should I notice first?`,
        `「${artworkTitle}」を見るとき、最初に何に気づけばいいですか？`,
      ),
      t(
        locale,
        `¿Qué une «${artworkTitle}» con otras piezas del archivo?`,
        `What links «${artworkTitle}» to other pieces in the archive?`,
        `「${artworkTitle}」はアーカイブの他の作品とどうつながりますか？`,
      ),
      t(
        locale,
        `Si me acerco a «${artworkTitle}», ¿qué sensación deja el material?`,
        `If I move closer to «${artworkTitle}», what does the material feel like?`,
        `「${artworkTitle}」に近づくと、素材はどんな感覚を与えますか？`,
      ),
    ];
  }

  return [
    t(
      locale,
      "¿Por dónde empezar si es mi primera visita al archivo?",
      "Where should I begin if this is my first visit to the archive?",
      "アーカイブを初めて見るなら、どこから始めればいいですか？",
    ),
    t(
      locale,
      "¿Hay un hilo entre las obras — material, ritmo, escala?",
      "Is there a thread across the works — material, rhythm, scale?",
      "作品間に糸はありますか — 素材、リズム、スケール？",
    ),
    t(
      locale,
      "¿Qué pieza me recomiendas si me interesan las instalaciones?",
      "Which piece would you suggest if I'm drawn to installations?",
      "インスタレーションに興味があるなら、どの作品から見ればいいですか？",
    ),
    t(
      locale,
      "Quiero quedarme un rato con una obra. ¿Cuál tiene más texto de sala?",
      "I want to stay with one work for a while. Which has the richest wall text?",
      "一つの作品とじっくり向き合いたいです。ウォールテキストが最も充実しているのはどれですか？",
    ),
  ];
}

export function buildCuratorWelcome(
  locale: Locale,
  params: {
    artworkTitle?: string;
    artworkCount: number;
    artistName?: string | null;
    isReturning?: boolean;
    visitorName?: string | null;
    shortReturn?: boolean;
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

  const greeting = params.isReturning
    ? params.visitorName
      ? t(
          locale,
          `Hola de nuevo${params.visitorName ? `, ${params.visitorName}` : ""}. `,
          `Welcome back${params.visitorName ? `, ${params.visitorName}` : ""}. `,
          `またお会いできてうれしいです${params.visitorName ? `、${params.visitorName}さん` : ""}。`,
        )
      : t(
          locale,
          "Me alegra verte otra vez. ",
          "Good to see you again. ",
          "またお越しいただきありがとうございます。",
        )
    : t(
        locale,
        "Soy el curador del archivo",
        "I'm the curator of this archive",
        "私はこのアーカイブのキュレーターです",
      );

  if (params.isReturning && params.shortReturn) {
    return t(
      locale,
      `${greeting}¿Por dónde seguimos?`,
      `${greeting}Where shall we pick up?`,
      `${greeting}どこから続けましょうか？`,
    );
  }

  if (params.artworkTitle) {
    return params.isReturning
      ? t(
          locale,
          `${greeting}Sigues con «${params.artworkTitle}». Podemos profundizar desde sus textos — dime qué te resuena al mirarla.`,
          `${greeting}You're still with «${params.artworkTitle}». We can go deeper from its texts — tell me what resonates as you look.`,
          `${greeting}「${params.artworkTitle}」をご覧中ですね。テキストから深めましょう — 見ていて何が響きますか？`,
        )
      : t(
          locale,
          `${greeting}${who}. Estás con «${params.artworkTitle}». Pregúntame desde sus textos — quiero ayudarte a acercarte a la pieza, no alejarte.`,
          `${greeting}${who}. You're with «${params.artworkTitle}». Ask from its texts — I want to help you stay close to the work.`,
          `${greeting}${who}。「${params.artworkTitle}」をご覧中ですね。テキストから — 作品に近づくお手伝いをします。`,
        );
  }

  if (params.artworkCount === 0) {
    return t(
      locale,
      `${greeting}${who}. Aún no hay obras publicadas; cuando lleguen, caminaremos juntos por ellas.`,
      `${greeting}${who}. No works are published yet; when they arrive, we'll walk through them together.`,
      `${greeting}${who}。まだ公開作品がありません。追加されたら、一緒に歩きましょう。`,
    );
  }

  if (params.isReturning) {
    return t(
      locale,
      `${greeting}Retomemos donde lo dejamos — ${params.artworkCount} obra${params.artworkCount === 1 ? "" : "s"} en el archivo. ¿Quieres volver a una pieza o explorar algo nuevo?`,
      `${greeting}Let's pick up where we left off — ${params.artworkCount} work${params.artworkCount === 1 ? "" : "s"} in the archive. Return to a piece or explore something new?`,
      `${greeting}前回の続きから — 公開作品${params.artworkCount}点。以前の作品に戻りますか、それとも新しいものを探しますか？`,
    );
  }

  return t(
    locale,
    `${greeting}${who} — ${params.artworkCount} obra${params.artworkCount === 1 ? "" : "s"} publicada${params.artworkCount === 1 ? "" : "s"}. No hace falta saber de arte: mira, pregunta, y hablamos desde lo que está documentado.`,
    `${greeting}${who} — ${params.artworkCount} published work${params.artworkCount === 1 ? "" : "s"}. No art background needed: look, ask, and we'll talk from what's documented.`,
    `${greeting}${who} — 公開作品${params.artworkCount}点。専門知識は不要です：見て、聞いて、記録されたことから話しましょう。`,
  );
}
