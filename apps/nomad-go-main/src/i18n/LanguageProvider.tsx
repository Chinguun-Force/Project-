"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "mn" | "en";

type LanguageContextValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: string) => string;
};

const STRINGS: Record<AppLanguage, Record<string, string>> = {
  mn: {
    "nav.explore": "Судлах",
    "nav.quests": "Даалгавар",
    "nav.profile": "Профайл",
    "nav.achievements": "Амжилт",
    "nav.platform": "Аяллын платформ",
    "top.level": "Түвшин",
    "top.active": "Идэвхтэй",
    "top.location": "Байршил",
    "top.location.empty": "Байршил сонгоогүй",
    "top.shop": "Дэлгүүр",
    "top.bag": "Цүнх",
    "hero.eyebrow": "Аяллын платформ",
    "hero.title": "Монголын зураг дээр өөрийн аяллыг төлөвлөж, аажмаар нээгээрэй",
    "hero.subtitle":
      "Даалгавар, XP, түвшин — зөөлөн, ойлгомжтой интерфейс. Газрын зураг дээрх тэмдгүүдээс эхлээд аяллаа нэг дор удирдаарай.",
    "hero.cta.start": "Аяллаа эхлэх",
    "hero.cta.map": "Газрын зураг нээх",
    "hero.note": "Демо: өгөгдөл таны төхөөрөмж болон серверт хадгалагдана.",
    "home.feature.1.title": "Даалгавар биелүүл",
    "home.feature.1.desc": "Бодит газарт очиж алхам алхмаар биелүүлээд шагналаа ав.",
    "home.feature.2.title": "XP цуглуул",
    "home.feature.2.desc": "XP нэмэгдэж, түвшин ахиж, амжилтууд нээгдэнэ.",
    "home.feature.3.title": "Шинэ газрууд нээ",
    "home.feature.3.desc": "Кафе, үзэмжийн цэг, зах, музей зэрэг газруудыг нээж судлаарай.",
    "home.highlight.eyebrow": "Онцлох",
    "home.highlight.title": "Монгол дахь жишиг цэгүүд",
    "home.highlight.subtitle":
      "Демонд зориулсан жишээ картууд — даалгавартай холбоотой бодит байршлууд.",
    "home.partner.eyebrow": "Орон нутгийн бизнес",
    "home.partner.title": "Демоны түнш газрууд",
    "home.partner.subtitle": "Даалгавраар дамжуулж бизнесүүдийг соёлтойгоор онцлох боломжтой.",
    "home.how.eyebrow": "Яаж ажиллах вэ",
    "home.how.title": "3 алхмаар эхний түвшинд",
    "home.how.1.title": "Даалгавар сонго",
    "home.how.1.desc": "Өөрийн аялах хэв маягт таарсан даалгавраа сонго.",
    "home.how.2.title": "Бодитоор очиж биелүүл",
    "home.how.2.desc": "Алхам, XP, түвшин, байршил бүгд тодорхой.",
    "home.how.3.title": "XP авч түвшин ахиул",
    "home.how.3.desc": "Фото + GPS баталгаажуулалт (демо) ашиглан дуусгана.",
    "quest.search.placeholder": "Хайх...",
    "quest.filter.all": "Бүгд",
    "quest.filter.new": "Шинэ",
    "quest.filter.active": "Идэвхтэй",
    "quest.filter.done": "Дууссан",
    "quest.category.food": "Хоол",
    "quest.category.culture": "Соёл",
    "quest.category.nature": "Байгаль",
    "quest.category.challenge": "Сорилт",
    "quest.empty.title": "Илэрц олдсонгүй",
    "quest.empty.desc": "Шүүлтээ өөрчилж эсвэл хайлтаа цэвэрлээд дахин үзээрэй.",
    "quest.empty.clear": "Цэвэрлэх",
    "quest.map.title": "Аяллын газрын зураг",
    "quest.map.demo": "демо",
    "quest.map.tip":
      "Цэг дээр дарж товч мэдээлэл харна. Бүтэн дэлгэрэнгүй болон шүүлтүүртэй харахад доорх товчийг дарна уу.",
    "quest.map.filtered": "Даалгаврын шүүлтүүртэй харах →",
    "quest.panel.close": "Хаах",
    "quest.panel.details": "Дэлгэрэнгүй ба үйлдэл",
    "quest.panel.hint": "Эхлүүлэх, дуусгах зэргийг дэлгэц дээрээс хийнэ.",
    "quest.stats.totalXp": "Нийт XP",
    "quest.stats.next": "Дараагийн босго",
  },
  en: {
    "nav.explore": "Explore",
    "nav.quests": "Quests",
    "nav.profile": "Profile",
    "nav.achievements": "Achievements",
    "nav.platform": "Travel Platform",
    "top.level": "Level",
    "top.active": "Active",
    "top.location": "Location",
    "top.location.empty": "No location selected",
    "top.shop": "Shop",
    "top.bag": "Bag",
    "hero.eyebrow": "Travel Platform",
    "hero.title": "Plan your Mongolia journey and unlock experiences gradually",
    "hero.subtitle":
      "Quests, XP, and progression in a clean, calm interface. Start from map markers and manage your trip in one place.",
    "hero.cta.start": "Start Journey",
    "hero.cta.map": "Open Map",
    "hero.note": "Demo: data is stored on your device and server.",
    "home.feature.1.title": "Complete quests",
    "home.feature.1.desc": "Visit real places, finish steps, and earn rewards.",
    "home.feature.2.title": "Collect XP",
    "home.feature.2.desc": "Gain XP, level up, and unlock achievements.",
    "home.feature.3.title": "Discover places",
    "home.feature.3.desc": "Discover cafes, viewpoints, markets, and museums.",
    "home.highlight.eyebrow": "Highlights",
    "home.highlight.title": "Featured spots in Mongolia",
    "home.highlight.subtitle": "Sample cards linked to real destinations and quest routes.",
    "home.partner.eyebrow": "Local partners",
    "home.partner.title": "Featured partner places",
    "home.partner.subtitle": "Showcase local businesses through travel experiences.",
    "home.how.eyebrow": "How it works",
    "home.how.title": "Start in 3 steps",
    "home.how.1.title": "Choose a quest",
    "home.how.1.desc": "Pick a route that matches your travel style.",
    "home.how.2.title": "Complete it on-site",
    "home.how.2.desc": "Clear steps with XP, progression, and location guidance.",
    "home.how.3.title": "Earn XP and level up",
    "home.how.3.desc": "Use photo + GPS verification to complete the route.",
    "quest.search.placeholder": "Search...",
    "quest.filter.all": "All",
    "quest.filter.new": "New",
    "quest.filter.active": "Active",
    "quest.filter.done": "Completed",
    "quest.category.food": "Food",
    "quest.category.culture": "Culture",
    "quest.category.nature": "Nature",
    "quest.category.challenge": "Challenge",
    "quest.empty.title": "No results found",
    "quest.empty.desc": "Change your filters or clear search and try again.",
    "quest.empty.clear": "Clear",
    "quest.map.title": "Travel map",
    "quest.map.demo": "demo",
    "quest.map.tip":
      "Tap a marker for quick info. For full details and filters, use the button below.",
    "quest.map.filtered": "Open filtered quests →",
    "quest.panel.close": "Close",
    "quest.panel.details": "Details and actions",
    "quest.panel.hint": "Start or complete actions are available on the details screen.",
    "quest.stats.totalXp": "Total XP",
    "quest.stats.next": "Next threshold",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "mn";
    const saved = window.localStorage.getItem("app-language");
    return saved === "en" || saved === "mn" ? saved : "mn";
  });

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    window.localStorage.setItem("app-language", next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => STRINGS[lang][key] ?? key,
    }),
    [lang],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return ctx;
}

