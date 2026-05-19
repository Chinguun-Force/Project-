export interface AimagCamp {
  name: string;
  pricePerNight: number;
  isPremium: boolean;
  isBlurred: boolean;
  rating: number;
}

export interface Aimag {
  name: string;
  nameEn: string;
  sub: string;
  tags: string[];
  questCount: number;
  camps: AimagCamp[];
}

export const AIMAGS: Aimag[] = [
  {
    name: 'Улаанбаатар',
    nameEn: 'Ulaanbaatar',
    sub: 'Нийслэл хот · 1.6M хүн',
    tags: ['🏛️ Culture', '🌿 Nature', '🍖 Local Food', '🗺️ Routes'],
    questCount: 7,
    camps: [
      { name: 'Terelj Star Camp', pricePerNight: 95000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Bogd Khan Retreat', pricePerNight: 78000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Hidden Valley Ger', pricePerNight: 55000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Өмнөговь',
    nameEn: 'Ömnögovi (South Gobi)',
    sub: 'Говийн томоохон аймаг',
    tags: ['🏜️ Gobi Desert', '🐪 Camel Ride', '⛺ Yurt Stay'],
    questCount: 5,
    camps: [
      { name: 'Gobi Luxury Yurt', pricePerNight: 140000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Khongor Sand Camp', pricePerNight: 95000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Desert Secret Ger', pricePerNight: 70000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Баян-Өлгий',
    nameEn: 'Bayan-Ölgii',
    sub: 'Казах соёлын төв · Алтай уул',
    tags: ['🦅 Eagle Hunting', '🏔️ Altai Mtns', '🐎 Horse Trek'],
    questCount: 4,
    camps: [
      { name: 'Altai Eagle Camp', pricePerNight: 110000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Kazakh Heritage Ger', pricePerNight: 75000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Өвөрхангай',
    nameEn: 'Övörkhangai',
    sub: 'Хархорум — Монголын эртний нийслэл',
    tags: ['🏛️ Karakorum Ruins', '🌿 Orkhon Valley', '⛺ Ger Camps'],
    questCount: 5,
    camps: [
      { name: 'Orkhon Valley Camp', pricePerNight: 85000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Khamar Nomad Ger', pricePerNight: 62000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Хэнтий',
    nameEn: 'Khentii',
    sub: 'Чингис хааны нутаг',
    tags: ['👑 Chinggis Khan', '🌲 Forest Trek', '🏕️ Ger Camp'],
    questCount: 3,
    camps: [
      { name: 'Khentii Wild Camp', pricePerNight: 75000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Forest River Ger', pricePerNight: 50000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Архангай',
    nameEn: 'Arkhangai',
    sub: 'Галт уулын нутаг — Хоргын тогоо',
    tags: ['🌋 Khorgo Volcano', '🏞️ White Lake', '🌿 Nature'],
    questCount: 3,
    camps: [
      { name: 'Tariat Crater Camp', pricePerNight: 82000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Chuluut River Ger', pricePerNight: 60000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Ховд',
    nameEn: 'Khovd',
    sub: 'Баруун бүсийн төв аймаг',
    tags: ['🏔️ Mountains', '🐎 Horse Riding', '🦌 Wildlife'],
    questCount: 3,
    camps: [
      { name: 'Khovd River Camp', pricePerNight: 80000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Nomad Secret Ger', pricePerNight: 55000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  {
    name: 'Дорнод',
    nameEn: 'Dornod',
    sub: 'Зүүн тал нутаг · Монгол тал',
    tags: ['🦌 Wildlife', '🐎 Horse Trek', '🌅 Steppe'],
    questCount: 2,
    camps: [
      { name: 'Eastern Steppe Camp', pricePerNight: 70000, isPremium: true, isBlurred: false, rating: 5 },
      { name: 'Wild East Ger', pricePerNight: 45000, isPremium: false, isBlurred: true, rating: 4 },
    ]
  },
  { name: 'Завхан', nameEn: 'Zavkhan', sub: 'Нуур ихтэй аймаг', tags: ['🏔️ Mountains', '🏞️ Lakes', '🐟 Fishing'], questCount: 2, camps: [{ name: 'Zavkhan Lake Camp', pricePerNight: 72000, isPremium: false, isBlurred: true, rating: 4 }] },
  { name: 'Сэлэнгэ', nameEn: 'Selenge', sub: 'Сэлэнгэ мөрний хөвөөн', tags: ['🌊 River', '🏛️ History', '🌾 Farmland'], questCount: 2, camps: [{ name: 'Selenge River Ger', pricePerNight: 65000, isPremium: false, isBlurred: true, rating: 4 }] },
  { name: 'Булган', nameEn: 'Bulgan', sub: 'Ойт хээрийн аймаг', tags: ['🌲 Forest', '🐎 Horses'], questCount: 1, camps: [{ name: 'Bulgan Forest Ger', pricePerNight: 60000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Төв', nameEn: 'Töv', sub: 'Нийслэлийг хүрээлэх аймаг', tags: ['🏕️ Ger Stay', '🌿 Nature'], questCount: 2, camps: [{ name: 'Central Steppe Ger', pricePerNight: 68000, isPremium: false, isBlurred: true, rating: 4 }] },
  { name: 'Увс', nameEn: 'Uvs', sub: 'Увс нуурын аймаг', tags: ['🦅 Birds', '🏞️ Lake Uvs'], questCount: 1, camps: [{ name: 'Uvs Lake Camp', pricePerNight: 70000, isPremium: false, isBlurred: true, rating: 4 }] },
  { name: 'Говь-Алтай', nameEn: 'Govi-Altai', sub: 'Алтайн нуруу', tags: ['🏔️ Altai', '🦌 Wildlife'], questCount: 2, camps: [{ name: 'Altai Foothills Ger', pricePerNight: 65000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Баянхонгор', nameEn: 'Bayankhongor', sub: 'Говийн хил', tags: ['🏜️ Semi-Gobi', '🌄 Scenic'], questCount: 2, camps: [{ name: 'Bayankhongor Ger', pricePerNight: 62000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Дундговь', nameEn: 'Dundgovi', sub: 'Дундад говь', tags: ['🏜️ Gobi', '🌅 Steppe'], questCount: 1, camps: [{ name: 'Mid-Gobi Ger', pricePerNight: 55000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Говьсүмбэр', nameEn: 'Govisümber', sub: 'Хамгийн жижиг аймаг', tags: ['🗺️ Crossroads'], questCount: 1, camps: [{ name: 'Govisumber Camp', pricePerNight: 50000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Дорноговь', nameEn: 'Dornogovi', sub: 'Зүүн говь аймаг', tags: ['🏜️ East Gobi', '🦕 Dinosaur Fossils'], questCount: 2, camps: [{ name: 'East Gobi Explorer', pricePerNight: 65000, isPremium: false, isBlurred: true, rating: 4 }] },
  { name: 'Сүхбаатар', nameEn: 'Sükhbaatar', sub: 'Зүүн хилийн аймаг', tags: ['🌅 Steppe', '🐎 Horse'], questCount: 1, camps: [{ name: 'Border Steppe Ger', pricePerNight: 55000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Дархан-Уул', nameEn: 'Darkhan-Uul', sub: 'Хоёр дахь том хот', tags: ['🏙️ City', '🏛️ Industrial'], questCount: 1, camps: [{ name: 'Darkhan Camp', pricePerNight: 58000, isPremium: false, isBlurred: true, rating: 3 }] },
  { name: 'Орхон', nameEn: 'Orkhon', sub: 'Эрдэнэт хотын аймаг', tags: ['🏙️ Erdenet', '⛏️ Mining'], questCount: 1, camps: [{ name: 'Orkhon City Ger', pricePerNight: 55000, isPremium: false, isBlurred: true, rating: 3 }] },
];
