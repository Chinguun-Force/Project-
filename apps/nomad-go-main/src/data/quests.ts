import type { QuestCategory, QuestDifficulty, QuestStatus } from "@/types";

export interface QuestStep {
  id: string;
  title: string;
  detail: string;
  xp?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  loreText: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  rewardXp: number;
  location: string;
  duration: string;
  image: string;
  steps: QuestStep[];
  /** Base template status; merged with user progress in UI */
  status: QuestStatus;
}

export function sumStepXp(steps: QuestStep[]): number {
  return steps.reduce((acc, s) => acc + (s.xp ?? 0), 0);
}

export function getQuestRewardXp(quest: Pick<Quest, "rewardXp" | "steps">): number {
  const sum = sumStepXp(quest.steps);
  return sum > 0 ? sum : quest.rewardXp;
}

export const MOCK_QUESTS: Quest[] = [
  {
    id: "ulan-bator-cafe-run",
    title: "Нийслэлийн кофе аялал",
    description: "Улаанбаатарт 3 бие даасан кафегаар орж, нутгийн кофе соёлыг мэдэр.",
    loreText:
      "Хотын гудамж бүрт өөр үнэр, өөр түүх бий. Шарж буй кофены үнэрийг дагаад өөрийн маршрутаа бүтээ.",
    category: "food",
    difficulty: "easy",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    duration: "2–3 цаг",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Маршрутаа сонго",
        detail: "3 кафегаа сонго. (Демо жагсаалт)",
        xp: 15,
      },
      {
        id: "2",
        title: "Амталж зураг ав",
        detail: "Кафе бүрээс нэг зүйл захиалж, аяганыхаа зургийг хадгал.",
        xp: 15,
      },
      {
        id: "3",
        title: "Check-in хийгээд дуусга",
        detail: "Сүүлийн кафен дээр check-in хийгээд даалгаврыг хаа.",
        xp: 15,
      },
    ],
    rewardXp: 45,
  },
  {
    id: "erdene-zuu-pilgrimage",
    title: "Эрдэнэ Зуугийн домогт алхалт",
    description: "Эрдэнэ Зуу хийдийн хана даган алхаж, Хархорумын түүхийг мэдэр.",
    loreText:
      "Эндхийн чулуу хүртэл түүх өгүүлнэ. Цагаан суваргын дундуур салхийг даган алхах тусам домог ойртдог.",
    category: "culture",
    difficulty: "medium",
    location: "Хархорум, Өвөрхангай",
    duration: "Хагас өдөр",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Гол хаалгаар ор",
        detail: "Гол хаалган дээрх мэдээллийг унш. (Демо текст)",
        xp: 25,
      },
      {
        id: "2",
        title: "Суваргын тойрог",
        detail: "Гадна хана даган алхаж, 3 онцлогийг тэмдэглэ.",
        xp: 30,
      },
      {
        id: "3",
        title: "Тайван мөч",
        detail: "10 минут нам гүм сууж, дараа нь check-in хий.",
        xp: 25,
      },
    ],
    rewardXp: 80,
  },
  {
    id: "narantuul-market-hunt",
    title: "Нарантуулын захын сорилт",
    description:
      "Нарантуулын лангуунуудын дундуур явж, ₮40,000-аас доош гар хийцийн дурсгал ол. (Демо төсөв)",
    loreText:
      "Сайн лангууг олох нь тоглоом шиг. Хүндэтгэлтэй харьцаж, ухаалаг сонголт хийгээрэй.",
    category: "challenge",
    difficulty: "medium",
    location: "Нарантуул зах, Улаанбаатар",
    duration: "3 цаг",
    image:
      "https://images.unsplash.com/photo-1555529907-8652a56e1e48?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Төсвөө тогтоо",
        detail: "Төсвийн чипээ сонго. (Демо)",
        xp: 20,
      },
      {
        id: "2",
        title: "3 лангуу үз",
        detail: "3 өөр лангуугаар орж, 2 сонголтоо харьцуул.",
        xp: 25,
      },
      {
        id: "3",
        title: "Сонголтоо батал",
        detail: "Нэг гар хийцийн зүйл сонгоод зураг авч нотол. (Демо)",
        xp: 25,
      },
    ],
    rewardXp: 70,
  },
  {
    id: "terelj-viewpoint-ascent",
    title: "Тэрэлжийн үзэмжийн цэг рүү өгсөх",
    description: "Горхийн Тэрэлжид хадат үзэмжийн цэг рүү өгсөж, хөндийн голыг дээрээс хар.",
    loreText:
      "Жим нь тэвчээртэй хүнийг шагнана. Оргил дээрээс тал нутаг газрын зураг шиг дэлгэнэ.",
    category: "nature",
    difficulty: "hard",
    location: "Горхи–Тэрэлжийн байгалийн цогцолборт газар",
    duration: "4–5 цаг",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Эхлэл дээр check-in",
        detail: "Жимийн эхлэл дээр check-in хийгээд аюулгүй байдлаа шалга. (Демо)",
        xp: 30,
      },
      {
        id: "2",
        title: "Дунд хэсэгт амсхий",
        detail: "Амсхийх цэг дээр нэг цэцэг эсвэл шувуу ажиглаад тэмдэглэ.",
        xp: 30,
      },
      {
        id: "3",
        title: "Оргилын нотолгоо",
        detail: "Оргил дээр панорам зураг авч GPS-ийг асаа. (Демо)",
        xp: 35,
      },
    ],
    rewardXp: 95,
  },
  {
    id: "choijin-museum-night",
    title: "Чойжин ламын музейн аялал",
    description: "Алтан цагийн дараа Чойжин ламын сүм музейгээр орж, урлаг ба түүхийг мэдэр.",
    loreText:
      "Дэнлүүний гэрэлд баг, дүрүүд амьтай мэт. Энэ бол яарах даалгавар биш — удаан мэдрэх аялал.",
    category: "culture",
    difficulty: "easy",
    location: "Чойжин ламын сүм музей, Улаанбаатар",
    duration: "90 минут",
    image:
      "https://images.unsplash.com/photo-1566127444979-b3d2b34e7f4b?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Орчны дүрэм",
        detail: "Чимээгүй горим, хүндэтгэлтэй оролт. (Демо)",
        xp: 15,
      },
      {
        id: "2",
        title: "Багны үзэсгэлэн",
        detail: "Нэг баг сонгоод түүхийг нь товч тэмдэглэ.",
        xp: 20,
      },
      {
        id: "3",
        title: "Товч дүгнэлт",
        detail: "Нэг өгүүлбэрээр “найздаа юу гэж хэлэх вэ?” гэж бич.",
        xp: 20,
      },
    ],
    rewardXp: 55,
  },
  {
    id: "orkhon-campfire-chronicle",
    title: "Орхоны галын дэргэдэх түүх",
    description:
      "Жуулчны баазын галын тойрогт сууж, түүх хуваалцаж, тэнгэрийн зураг аваарай.",
    loreText:
      "Галын гэрэл танихгүй хүмүүсийг найз болгодог. Өнөө орой аяллын тэмдэглэл чинь очноос бичигдэнэ.",
    category: "nature",
    difficulty: "medium",
    location: "Орхоны хөндий",
    duration: "Орой",
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Гэрийн ёс",
        detail: "3 эелдэг үйлдлийг уншиж сураарай. (Демо карт)",
        xp: 25,
      },
      {
        id: "2",
        title: "Түүх хуваалцах",
        detail: "60 секундийн аяллын түүх ярьж, 2 хүний түүхийг сонс.",
        xp: 25,
      },
      {
        id: "3",
        title: "Шөнийн зураг",
        detail: "Тэнгэрийн зураг авч “зураг оруулах”-ыг асаа. (Демо)",
        xp: 25,
      },
    ],
    rewardXp: 75,
  },
  {
    id: "hustai-horse-heritage",
    title: "Хустайн тахийн мөрөөр",
    description:
      "Хустайн нуруунд очиж, тахийг ажиглан, нутгийн малчин айлтай морь унаж үзээрэй.",
    loreText:
      "Зэрлэг адуу нэгэн цагт эндээс алга болсон. Харин одоо туурайн төвөргөөн эргэн иржээ.",
    category: "culture",
    difficulty: "hard",
    location: "Хустайн нуруу, Төв аймаг",
    duration: "Өдөржин",
    image:
      "https://images.unsplash.com/photo-1553284968-4e7c8c2a0b8e?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Танилцуулга",
        detail: "Тахийн тухай товч танилцуулгыг үз. (Демо)",
        xp: 35,
      },
      {
        id: "2",
        title: "Тахи ажиглах",
        detail: "Аюулгүй зайнаас нэг зан үйлийг нь ажиглаад тэмдэглэ.",
        xp: 35,
      },
      {
        id: "3",
        title: "Морины аялал",
        detail: "Хөтөчтэй богино аялал хийж, айлдаа талархлаа илэрхийл. (Үг хэллэгийн карт)",
        xp: 40,
      },
    ],
    rewardXp: 110,
  },
  {
    id: "hidden-buuz-alley",
    title: "Нууц буузны гудамж",
    description:
      "Тааврын дагуу нэгэн гэрийн буузны газрыг олж, нууц амтыг мэдэр. (Демо)",
    loreText:
      "Хөх хаалганы цаанаас уур савсана. Амт хайгчид л энэ “buff”-ийг авна.",
    category: "food",
    difficulty: "hard",
    location: "Нууц гудамж — Баянгол, Улаанбаатар (демо)",
    duration: "2 цаг",
    image:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=1200&q=80",
    status: "available",
    steps: [
      {
        id: "1",
        title: "Таавар 1",
        detail: "“Хөх хаалганд халуун амт тэврэгдэнэ, хоёр тогшвол аз ирнэ.”",
        xp: 30,
      },
      {
        id: "2",
        title: "Захиалга",
        detail: "Бууз + нэг аяга сүүтэй цай захиал.",
        xp: 30,
      },
      {
        id: "3",
        title: "Тамга авах",
        detail: "“Нууц эрдэнэ” тэмдгээ ав. (Демо)",
        xp: 30,
      },
    ],
    rewardXp: 90,
  },
];

// Safety net: ensure rewardXp matches step sum in dev builds.
if (process.env.NODE_ENV !== "production") {
  for (const q of MOCK_QUESTS) {
    const sum = sumStepXp(q.steps);
    if (sum !== q.rewardXp) {
      console.warn(`[Project α] rewardXp mismatch for "${q.id}": steps=${sum}, rewardXp=${q.rewardXp}`);
    }
  }
}

export function getQuestById(id: string): Quest | undefined {
  return MOCK_QUESTS.find((q) => q.id === id);
}
