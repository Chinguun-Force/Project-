export interface DestinationHighlight {
  id: string;
  name: string;
  region: string;
  tag: string;
  image: string;
  blurb: string;
}

export const DESTINATION_HIGHLIGHTS: DestinationHighlight[] = [
  {
    id: "ub",
    name: "Улаанбаатарын хэмнэл",
    region: "Нийслэл",
    tag: "Шөнийн зах · Кафе · Музей",
    image:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80",
    blurb: "Орчин үеийн хот ба уламжлал огтлолцох газраас аяллаа эхлүүл.",
  },
  {
    id: "gobi",
    name: "Говийн зах",
    region: "Өмнөд",
    tag: "Элсэн манхан · Олдвор · Одод",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    blurb: "Нар мандах мөч, манханы гэрэл — зурагчин аялагчдын дуртай маршрут.",
  },
  {
    id: "khuvsgul",
    name: "Хөвсгөл цэнхэр",
    region: "Хойд",
    tag: "Нуурын жим · Цаа бугын зам",
    image:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
    blurb: "Цэнгэг ус, нарс үнэртсэн аяллын алхмууд — тайвшралын бүс.",
  },
];

export interface FeaturedBusiness {
  id: string;
  name: string;
  type: string;
  perk: string;
}

export const FEATURED_BUSINESSES: FeaturedBusiness[] = [
  {
    id: "b1",
    name: "Талын кофе лаборатори",
    type: "Кофе",
    perk: "Анхны check-in дээр +15 XP (демо)",
  },
  {
    id: "b2",
    name: "Гэр урлалын хоршоо",
    type: "Урлал",
    perk: "Ховор тэмдгийн материал нээгдэнэ (демо)",
  },
  {
    id: "b3",
    name: "Нүүдэлчний шөнө буудал",
    type: "Буудал · Түүх",
    perk: "Галын дэргэдэх даалгаврын уулзвар (демо)",
  },
];
