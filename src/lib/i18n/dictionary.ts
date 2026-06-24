import type { Locale } from "./config";

export type Dictionary = {
  meta: { title: string; description: string };
  nav: {
    gallery: string;
    concepts: string;
    chat: string;
    account: string;
    chatShort: string;
  };
  footer: { tagline: string; gallery: string; concepts: string; chat: string };
  home: {
    badge: string;
    title: string;
    subtitle: string;
    ctaGallery: string;
    ctaChat: string;
    featuredTitle: string;
    featuredSubtitle: string;
    seeAll: string;
    cards: {
      gallery: { title: string; desc: string };
      concepts: { title: string; desc: string };
      chat: { title: string; desc: string };
    };
  };
  gallery: {
    badge: string;
    title: string;
    subtitle: string;
    back: string;
    essayTitle: string;
    related: string;
    askAi: string;
    source: string;
  };
  concepts: {
    badge: string;
    title: string;
    subtitle: string;
    back: string;
    related: string;
    artworks: string;
    exploreAi: string;
    noArtworks: string;
    worksCount: string;
  };
  chat: {
    badge: string;
    title: string;
    subtitleLoggedIn: string;
    subtitleGuest: string;
    loginLink: string;
    placeholderLoggedIn: string;
    placeholderGuest: string;
    welcome: string;
    thinking: string;
    send: string;
    error: string;
    principles: string;
    suggestedLabel: string;
    micStart: string;
    micStop: string;
    micUnsupported: string;
    speakerOn: string;
    speakerOff: string;
    speakerUnsupported: string;
    listening: string;
  };
  access: {
    badge: string;
    title: string;
    subtitle: string;
    label: string;
    placeholder: string;
    submit: string;
    waiting: string;
    wrongCode: string;
    error: string;
    note: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    name: string;
    email: string;
    password: string;
    passwordHint: string;
    createAccount: string;
    signIn: string;
    waiting: string;
    noAccount: string;
    hasAccount: string;
    continueGallery: string;
    signOut: string;
    accountCreated: string;
    entering: string;
    checkEmail: string;
    invalidCredentials: string;
    alreadyRegistered: string;
  };
  account: {
    title: string;
    adminLink: string;
    flavorProfile: string;
    recentChats: string;
    newChat: string;
    noChats: string;
    startChat: string;
    notConfigured: string;
    goGallery: string;
  };
  notFound: { title: string; subtitle: string; back: string };
  common: { artist: string; medium: string };
};

const en: Dictionary = {
  meta: {
    title: "Flavor User — Gallery & AI",
    description:
      "Art gallery with readable texts and an AI that remembers your taste.",
  },
  nav: {
    gallery: "Gallery",
    concepts: "Concepts",
    chat: "Chat",
    account: "Account",
    chatShort: "Chat",
  },
  footer: {
    tagline: "Flavor User — your artistic taste, with memory.",
    gallery: "Gallery",
    concepts: "Concepts",
    chat: "Talk to the AI",
  },
  home: {
    badge: "Gallery · Texts · Memory",
    title: "Discover art with an AI that remembers your taste",
    subtitle:
      "Flavor User combines a gallery of images and texts to read, an artwork archive, and an assistant that connects concepts and remembers what it learns about you.",
    ctaGallery: "Explore gallery",
    ctaChat: "Talk to your curator",
    featuredTitle: "Featured",
    featuredSubtitle: "Images and texts ready to enjoy, like in a museum room.",
    seeAll: "See all →",
    cards: {
      gallery: {
        title: "Gallery",
        desc: "Works with image, details, and an essay to read.",
      },
      concepts: {
        title: "Concepts",
        desc: "A network of ideas linking movements, techniques, and emotions.",
      },
      chat: {
        title: "Curator chat",
        desc: "A curator who knows your archive and speaks from your own texts.",
      },
    },
  },
  gallery: {
    badge: "Collection",
    title: "Gallery",
    subtitle:
      "Each work includes an image, details, and a wall text to read at your own pace.",
    back: "Back to gallery",
    essayTitle: "Wall text",
    related: "Related works",
    askAi: "Talk to the curator about this work",
    source: "View source",
  },
  concepts: {
    badge: "Semantic network",
    title: "Concepts",
    subtitle:
      "Ideas that connect works, movements, and techniques. Flavor User uses this network to personalize conversations.",
    back: "← All concepts",
    related: "Related concepts",
    artworks: "Works in the gallery",
    exploreAi: "Explore with Flavor User",
    noArtworks: "No works tagged with this concept yet.",
    worksCount: "work(s) in gallery",
  },
  chat: {
    badge: "Curator",
    title: "Your curator",
    subtitleLoggedIn:
      "Speaks from your archive texts — not generic art history.",
    subtitleGuest: "",
    loginLink: "Sign in",
    placeholderLoggedIn: "Ask about a work, a series, materials, intent…",
    placeholderGuest: "Sign in to save history, or ask anyway…",
    welcome:
      "I'm the curator of this gallery. I know the works in the archive and speak from their texts. Ask me about a specific piece, connections between works, or the artist's line of practice.",
    thinking: "The curator is reflecting…",
    send: "Send",
    error:
      "Could not connect to the server. If OpenAI and Supabase are not configured yet, check the README. Meanwhile, explore the gallery — artworks and texts are already available.",
    principles:
      "The curator speaks only from archive texts. It does not replace the artist or invent meaning.",
    suggestedLabel: "Suggested questions",
    micStart: "Speak your question",
    micStop: "Stop listening",
    micUnsupported: "Microphone not available in this browser",
    speakerOn: "Read curator replies aloud",
    speakerOff: "Turn off curator voice",
    speakerUnsupported: "Voice playback not available",
    listening: "Listening…",
  },
  access: {
    badge: "Private archive",
    title: "Access code",
    subtitle:
      "This site is private. Enter the code shared by the artist to view the gallery and speak with the curator.",
    label: "Access code",
    placeholder: "Your code",
    submit: "Enter",
    waiting: "Checking…",
    wrongCode: "Incorrect code. Try again or contact the artist.",
    error: "Could not verify access. Try again.",
    note: "The code is personal. Please use the curator only if you have genuine interest in the work.",
  },
  auth: {
    loginTitle: "Sign in",
    loginSubtitle: "Access your saved conversations and personal memory.",
    registerTitle: "Create account",
    registerSubtitle: "Register to enable history, memory, and personal notes.",
    name: "Name",
    email: "Email",
    password: "Password",
    passwordHint: "Minimum 6 characters",
    createAccount: "Create account",
    signIn: "Sign in",
    waiting: "Please wait…",
    noAccount: "First time?",
    hasAccount: "Already have an account?",
    continueGallery: "Continue without account → Gallery",
    signOut: "Sign out",
    accountCreated:
      "Account created. Check your email (and spam) to confirm, then sign in.",
    entering: "Account created! Signing in…",
    checkEmail: "Account created. Check your email to confirm.",
    invalidCredentials:
      "Wrong email or password. If you just registered, confirm your email first.",
    alreadyRegistered: "This email already has an account. Use Sign in.",
  },
  account: {
    title: "My account",
    adminLink: "→ Admin panel (manage gallery)",
    flavorProfile: "Your taste profile",
    recentChats: "Recent conversations",
    newChat: "New conversation",
    noChats: "No conversations yet.",
    startChat: "Start one",
    notConfigured:
      "Configure Supabase in .env.local to enable accounts. The gallery works without an account.",
    goGallery: "Go to gallery",
  },
  notFound: {
    title: "Not found",
    subtitle: "This page or work does not exist.",
    back: "Back to gallery",
  },
  common: { artist: "Artist", medium: "Medium" },
};

const es: Dictionary = {
  meta: {
    title: "Flavor User — Galería & IA",
    description:
      "Galería de arte con textos para leer y una IA que recuerda tu gusto.",
  },
  nav: {
    gallery: "Galería",
    concepts: "Conceptos",
    chat: "Curador",
    account: "Cuenta",
    chatShort: "Curador",
  },
  footer: {
    tagline: "Flavor User — tu archivo, con curador.",
    gallery: "Galería",
    concepts: "Conceptos",
    chat: "Hablar con el curador",
  },
  home: {
    badge: "Galería · Textos · Memoria",
    title: "Descubre arte con una IA que recuerda tu gusto",
    subtitle:
      "Flavor User combina una galería con imágenes y textos para leer, un archivo de obras y un asistente que conecta conceptos y guarda lo que aprende de ti.",
    ctaGallery: "Explorar galería",
    ctaChat: "Hablar con tu curador",
    featuredTitle: "Destacadas",
    featuredSubtitle:
      "Imágenes y textos listos para consumir, como en una sala de museo.",
    seeAll: "Ver todas →",
    cards: {
      gallery: {
        title: "Galería",
        desc: "Obras con ficha, imagen a tamaño completo y ensayo para leer.",
      },
      concepts: {
        title: "Conceptos",
        desc: "Red de ideas que conecta movimientos, técnicas y emociones.",
      },
      chat: {
        title: "Chat con el curador",
        desc: "Un curador que conoce tu archivo y habla desde tus propios textos.",
      },
    },
  },
  gallery: {
    badge: "Colección",
    title: "Galería",
    subtitle:
      "Cada obra incluye imagen, ficha informativa y un texto de sala para leer con calma.",
    back: "Volver a la galería",
    essayTitle: "Texto de sala",
    related: "Obras relacionadas",
    askAi: "Hablar con el curador sobre esta obra",
    source: "Ver fuente",
  },
  concepts: {
    badge: "Red semántica",
    title: "Conceptos",
    subtitle:
      "Ideas que conectan obras, movimientos y técnicas. Flavor User usa esta red para personalizar conversaciones.",
    back: "← Todos los conceptos",
    related: "Conceptos relacionados",
    artworks: "Obras en la galería",
    exploreAi: "Explorar con Flavor User",
    noArtworks: "Aún no hay obras etiquetadas con este concepto.",
    worksCount: "obra(s) en galería",
  },
  chat: {
    badge: "Curador",
    title: "Tu curador",
    subtitleLoggedIn:
      "Habla desde los textos de tu archivo — no desde generalidades.",
    subtitleGuest: "",
    loginLink: "Inicia sesión",
    placeholderLoggedIn:
      "Pregunta sobre una obra, una serie, materiales, intención…",
    placeholderGuest:
      "Inicia sesión para guardar el historial, o pregunta igualmente…",
    welcome:
      "Soy el curador de esta galería. Conozco las obras del archivo y hablo desde sus textos. Pregúntame sobre una pieza concreta, conexiones entre obras, o la línea de tu trabajo.",
    thinking: "El curador reflexiona…",
    send: "Enviar",
    error:
      "No pude conectar con el servidor. Si aún no configuraste OpenAI y Supabase, revisa el README. Mientras tanto, explora la galería — las obras y textos ya están disponibles.",
    principles:
      "El curador habla solo desde los textos del archivo. No sustituye al artista ni inventa significados.",
    suggestedLabel: "Preguntas sugeridas",
    micStart: "Hablar tu pregunta",
    micStop: "Dejar de escuchar",
    micUnsupported: "Micrófono no disponible en este navegador",
    speakerOn: "Leer respuestas del curador en voz alta",
    speakerOff: "Desactivar voz del curador",
    speakerUnsupported: "Voz no disponible en este navegador",
    listening: "Escuchando…",
  },
  access: {
    badge: "Archivo privado",
    title: "Código de acceso",
    subtitle:
      "Este sitio es privado. Introduce el código que te haya dado la artista para ver la galería y hablar con el curador.",
    label: "Código de acceso",
    placeholder: "Tu código",
    submit: "Entrar",
    waiting: "Comprobando…",
    wrongCode:
      "Código incorrecto. Inténtalo de nuevo o contacta con la artista.",
    error: "No pude verificar el acceso. Inténtalo otra vez.",
    note: "El código es personal. Usa el curador solo si tienes interés real en la obra.",
  },
  auth: {
    loginTitle: "Iniciar sesión",
    loginSubtitle: "Accede para guardar conversaciones y memoria personal.",
    registerTitle: "Crear cuenta",
    registerSubtitle:
      "Regístrate para activar historial, memoria y notas personales.",
    name: "Nombre",
    email: "Email",
    password: "Contraseña",
    passwordHint: "Mínimo 6 caracteres",
    createAccount: "Crear cuenta",
    signIn: "Iniciar sesión",
    waiting: "Espera…",
    noAccount: "¿Primera vez?",
    hasAccount: "¿Ya tienes cuenta?",
    continueGallery: "Continuar sin cuenta → Galería",
    signOut: "Cerrar sesión",
    accountCreated:
      "Cuenta creada. Revisa tu email (y spam) para confirmar, luego inicia sesión.",
    entering: "¡Cuenta creada! Entrando…",
    checkEmail: "Cuenta creada. Revisa tu email para confirmar.",
    invalidCredentials:
      "Email o contraseña incorrectos. Si acabas de registrarte, confirma el email primero.",
    alreadyRegistered: "Este email ya tiene cuenta. Usa Iniciar sesión.",
  },
  account: {
    title: "Mi cuenta",
    adminLink: "→ Panel admin (gestionar galería)",
    flavorProfile: "Tu perfil de gusto",
    recentChats: "Conversaciones recientes",
    newChat: "Nueva conversación",
    noChats: "Aún no tienes conversaciones.",
    startChat: "Empieza una",
    notConfigured:
      "Configura Supabase en .env.local para activar cuentas. La galería funciona sin cuenta.",
    goGallery: "Ir a la galería",
  },
  notFound: {
    title: "No encontrado",
    subtitle: "Esta página u obra no existe.",
    back: "Volver a la galería",
  },
  common: { artist: "Artista", medium: "Técnica" },
};

const ja: Dictionary = {
  meta: {
    title: "Flavor User — ギャラリー & AI",
    description:
      "読めるテキスト付きのアートギャラリーと、あなたの好みを覚えるAI。",
  },
  nav: {
    gallery: "ギャラリー",
    concepts: "コンセプト",
    chat: "チャット",
    account: "アカウント",
    chatShort: "チャット",
  },
  footer: {
    tagline: "Flavor User — 記憶する、あなたの美の嗜好。",
    gallery: "ギャラリー",
    concepts: "コンセプト",
    chat: "AIと話す",
  },
  home: {
    badge: "ギャラリー · テキスト · 記憶",
    title: "あなたの好みを覚えるAIと芸術を発見する",
    subtitle:
      "Flavor Userは、読める画像とテキストのギャラリー、作品アーカイブ、コンセプトを結びつけて学んだことを覚えるアシスタントを組み合わせています。",
    ctaGallery: "ギャラリーを見る",
    ctaChat: "キュレーターと話す",
    featuredTitle: "注目作品",
    featuredSubtitle: "美術館の展示室のように、読める画像とテキスト。",
    seeAll: "すべて見る →",
    cards: {
      gallery: {
        title: "ギャラリー",
        desc: "画像、詳細、読めるエッセイ付きの作品。",
      },
      concepts: {
        title: "コンセプト",
        desc: "運動、技法、感情をつなぐアイデアのネットワーク。",
      },
      chat: {
        title: "キュレーターとの対話",
        desc: "アーカイブを知り、あなた自身のテキストから語るキュレーター。",
      },
    },
  },
  gallery: {
    badge: "コレクション",
    title: "ギャラリー",
    subtitle:
      "各作品には画像、詳細情報、ゆっくり読めるウォールテキストがあります。",
    back: "ギャラリーに戻る",
    essayTitle: "ウォールテキスト",
    related: "関連作品",
    askAi: "この作品についてキュレーターに聞く",
    source: "ソースを見る",
  },
  concepts: {
    badge: "意味ネットワーク",
    title: "コンセプト",
    subtitle:
      "作品、運動、技法をつなぐアイデア。Flavor Userはこのネットワークで会話をパーソナライズします。",
    back: "← すべてのコンセプト",
    related: "関連コンセプト",
    artworks: "ギャラリーの作品",
    exploreAi: "Flavor Userで探索する",
    noArtworks: "このコンセプトの作品はまだありません。",
    worksCount: "件の作品",
  },
  chat: {
    badge: "キュレーター",
    title: "あなたのキュレーター",
    subtitleLoggedIn:
      "アーカイブのテキストに基づいて語ります — 一般論ではなく。",
    subtitleGuest: "",
    loginLink: "ログイン",
    placeholderLoggedIn: "作品、シリーズ、素材、意図について質問…",
    placeholderGuest:
      "履歴を保存するにはログイン、またはそのまま質問もできます…",
    welcome:
      "私はこのギャラリーのキュレーターです。アーカイブの作品を知り、そのテキストから語ります。特定の作品、作品間のつながり、作家の実践について聞いてください。",
    thinking: "キュレーターが考えています…",
    send: "送信",
    error:
      "サーバーに接続できませんでした。OpenAIとSupabaseが未設定の場合はREADMEを確認してください。それまでの間、ギャラリーの作品とテキストはご利用いただけます。",
    principles:
      "キュレーターはアーカイブのテキストだけから語ります。作家の代わりにはならず、意味を捏造しません。",
    suggestedLabel: "おすすめの質問",
    micStart: "質問を話す",
    micStop: "聞き取りを停止",
    micUnsupported: "このブラウザではマイクが使えません",
    speakerOn: "キュレーターの返答を音声で読む",
    speakerOff: "音声読み上げをオフ",
    speakerUnsupported: "音声読み上げは利用できません",
    listening: "聞いています…",
  },
  access: {
    badge: "非公開アーカイブ",
    title: "アクセスコード",
    subtitle:
      "このサイトは非公開です。アーティストから共有されたコードを入力して、ギャラリーとキュレーターにアクセスしてください。",
    label: "アクセスコード",
    placeholder: "コード",
    submit: "入る",
    waiting: "確認中…",
    wrongCode: "コードが正しくありません。もう一度お試しください。",
    error: "アクセスを確認できませんでした。",
    note: "コードは個人用です。作品への真の関心がある場合のみキュレーターをご利用ください。",
  },
  auth: {
    loginTitle: "ログイン",
    loginSubtitle: "保存された会話と個人の記憶にアクセス。",
    registerTitle: "アカウント作成",
    registerSubtitle: "履歴、記憶、個人メモを有効にするには登録してください。",
    name: "名前",
    email: "メール",
    password: "パスワード",
    passwordHint: "6文字以上",
    createAccount: "アカウント作成",
    signIn: "ログイン",
    waiting: "お待ちください…",
    noAccount: "初めてですか？",
    hasAccount: "すでにアカウントをお持ちですか？",
    continueGallery: "アカウントなしで続ける → ギャラリー",
    signOut: "ログアウト",
    accountCreated:
      "アカウントを作成しました。確認メール（迷惑メールも）を確認してからログインしてください。",
    entering: "アカウント作成完了！ログイン中…",
    checkEmail: "アカウントを作成しました。確認メールをご確認ください。",
    invalidCredentials:
      "メールまたはパスワードが正しくありません。登録直後の場合は、先にメールを確認してください。",
    alreadyRegistered:
      "このメールは既に登録されています。ログインしてください。",
  },
  account: {
    title: "マイアカウント",
    adminLink: "→ 管理パネル（ギャラリー管理）",
    flavorProfile: "あなたの嗜好プロフィール",
    recentChats: "最近の会話",
    newChat: "新しい会話",
    noChats: "まだ会話がありません。",
    startChat: "始める",
    notConfigured:
      ".env.localでSupabaseを設定するとアカウントが有効になります。ギャラリーはアカウントなしでも利用できます。",
    goGallery: "ギャラリーへ",
  },
  notFound: {
    title: "見つかりません",
    subtitle: "このページまたは作品は存在しません。",
    back: "ギャラリーに戻る",
  },
  common: { artist: "アーティスト", medium: "技法" },
};

export const dictionaries: Record<Locale, Dictionary> = { en, es, ja };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
