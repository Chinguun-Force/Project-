import { AIMAGS, type Aimag } from '@/lib/data/aimags';

const CAMP_DOTS: Record<string, { cx: number; cy: number; premium: boolean }[]> = {
  'Улаанбаатар': [{ cx: 405, cy: 112, premium: true }, { cx: 395, cy: 118, premium: true }, { cx: 410, cy: 120, premium: false }],
  'Өмнөговь': [{ cx: 300, cy: 225, premium: true }, { cx: 320, cy: 235, premium: true }, { cx: 280, cy: 240, premium: false }],
  'Баян-Өлгий': [{ cx: 50, cy: 55, premium: true }, { cx: 70, cy: 65, premium: false }],
  'Өвөрхангай': [{ cx: 280, cy: 160, premium: true }, { cx: 270, cy: 175, premium: false }],
  'Хэнтий': [{ cx: 470, cy: 95, premium: true }, { cx: 460, cy: 110, premium: false }],
  'Архангай': [{ cx: 215, cy: 90, premium: true }, { cx: 205, cy: 100, premium: false }],
  'Ховд': [{ cx: 125, cy: 105, premium: true }, { cx: 115, cy: 115, premium: false }],
  'Дорнод': [{ cx: 565, cy: 85, premium: true }, { cx: 555, cy: 100, premium: false }],
  'Завхан': [{ cx: 175, cy: 100, premium: false }],
  'Сэлэнгэ': [{ cx: 340, cy: 65, premium: false }],
  'Булган': [{ cx: 280, cy: 70, premium: false }],
  'Төв': [{ cx: 380, cy: 105, premium: false }],
  'Увс': [{ cx: 85, cy: 105, premium: false }],
  'Говь-Алтай': [{ cx: 160, cy: 155, premium: false }],
  'Баянхонгор': [{ cx: 235, cy: 165, premium: false }],
  'Дундговь': [{ cx: 335, cy: 145, premium: false }],
  'Говьсүмбэр': [{ cx: 415, cy: 140, premium: false }],
  'Дорноговь': [{ cx: 410, cy: 185, premium: false }],
  'Сүхбаатар': [{ cx: 500, cy: 165, premium: false }],
  'Дархан-Уул': [{ cx: 380, cy: 55, premium: false }],
  'Орхон': [{ cx: 310, cy: 85, premium: false }],
};

interface MongoliaMapProps {
  selected: Aimag | null;
  onSelect: (aimag: Aimag | null) => void;
  viewMode: 'aimag' | 'camp';
}

export default function MongoliaMap({ selected, onSelect, viewMode }: MongoliaMapProps) {
  const aimagClass = (name: string) =>
    `cursor-pointer transition-all duration-200 ${
      selected?.name === name ? 'fill-[#A8C69F]/30 stroke-[#A8C69F] stroke-[2px]' : 'fill-[#322F36] stroke-[#322F36]/50'
    } hover:fill-[#A8C69F]/40 hover:stroke-[#A8C69F] hover:stroke-[1.5px]`;

  return (
    <svg viewBox="0 0 800 360" className="w-full block rounded-xl bg-[#1A1D26] border border-[#322F36]/50">
      <path d="M10 50 L70 30 L110 60 L80 80 L30 80 L10 60 Z" className={aimagClass('Баян-Өлгий')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Баян-Өлгий') || null)} />
      <path d="M30 80 L110 60 L130 90 L120 120 L80 130 L40 115 Z" className={aimagClass('Увс')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Увс') || null)} />
      <path d="M80 80 L130 60 L160 80 L165 120 L130 130 L80 130 L80 100 Z" className={aimagClass('Ховд')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Ховд') || null)} />
      <path d="M120 120 L165 120 L200 140 L210 180 L160 190 L120 170 L100 140 Z" className={aimagClass('Говь-Алтай')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Говь-Алтай') || null)} />
      <path d="M130 90 L175 70 L215 80 L220 115 L165 120 L130 120 Z" className={aimagClass('Завхан')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Завхан') || null)} />
      <path d="M175 70 L235 60 L255 85 L240 115 L215 120 L220 115 L175 80 Z" className={aimagClass('Архангай')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Архангай') || null)} />
      <path d="M255 60 L305 50 L305 80 L265 90 L255 80 Z" className={aimagClass('Булган')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Булган') || null)} />
      <path d="M305 50 L365 45 L375 80 L340 90 L305 80 Z" className={aimagClass('Сэлэнгэ')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Сэлэнгэ') || null)} />
      <path d="M355 45 L400 40 L410 65 L375 72 L365 50 Z" className={aimagClass('Дархан-Уул')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Дархан-Уул') || null)} />
      <path d="M295 78 L320 72 L325 92 L295 95 Z" className={aimagClass('Орхон')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Орхон') || null)} />
      <path d="M340 80 L410 75 L425 120 L390 135 L340 125 L330 100 Z" className={aimagClass('Төв')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Төв') || null)} />
      <path d="M390 100 L425 95 L430 125 L400 130 L385 118 Z" className={aimagClass('Улаанбаатар')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Улаанбаатар') || null)} />
      <path d="M255 130 L305 120 L320 155 L290 175 L265 195 L280 155 Z" className={aimagClass('Өвөрхангай')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Өвөрхангай') || null)} />
      <path d="M210 140 L255 130 L280 155 L265 195 L210 195 L160 190 L200 145 Z" className={aimagClass('Баянхонгор')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Баянхонгор') || null)} />
      <path d="M305 120 L360 115 L370 155 L335 175 L320 170 L305 145 Z" className={aimagClass('Дундговь')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Дундговь') || null)} />
      <path d="M390 130 L430 125 L440 150 L410 155 Z" className={aimagClass('Говьсүмбэр')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Говьсүмбэр') || null)} />
      <path d="M265 195 L320 185 L370 195 L380 250 L310 270 L235 250 L220 220 Z" className={aimagClass('Өмнөговь')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Өмнөговь') || null)} />
      <path d="M370 155 L435 148 L450 200 L400 220 L355 205 L345 175 Z" className={aimagClass('Дорноговь')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Дорноговь') || null)} />
      <path d="M430 70 L510 65 L520 120 L460 130 L430 120 Z" className={aimagClass('Хэнтий')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Хэнтий') || null)} />
      <path d="M510 55 L610 50 L630 120 L565 130 L510 120 Z" className={aimagClass('Дорнод')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Дорнод') || null)} />
      <path d="M455 130 L525 125 L545 185 L480 200 L445 175 Z" className={aimagClass('Сүхбаатар')} onClick={() => onSelect(AIMAGS.find((a) => a.name === 'Сүхбаатар') || null)} />

      <circle cx="393" cy="108" r="5.5" fill="#A8C69F" stroke="white" strokeWidth="2" />
      <text x="393" y="100" textAnchor="middle" fontSize="7" fill="#A8C69F" fontWeight="700">УБ</text>

      {viewMode === 'camp' && Object.entries(CAMP_DOTS).map(([province, dots]) =>
        dots.map((dot, i) => (
          <circle
            key={`${province}-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r={3.5}
            fill={dot.premium ? '#F4C64D' : '#A8C69F'}
            stroke="white"
            strokeWidth={1.5}
            className="cursor-pointer"
            onClick={() => onSelect(AIMAGS.find((a) => a.name === province) || null)}
          />
        ))
      )}
    </svg>
  );
}
