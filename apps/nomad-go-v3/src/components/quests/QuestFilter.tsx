const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'med' },
  { label: 'Hard', value: 'hard' },
  { label: 'Epic', value: 'epic' },
  { label: 'Done', value: 'done' },
];

interface QuestFilterProps {
  active: string;
  onChange: (value: string) => void;
}

export default function QuestFilter({ active, onChange }: QuestFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 ${
            active === f.value
              ? 'bg-ng text-white border-ng shadow-md shadow-ng/20'
              : 'bg-white text-[var(--tx2)] border-[var(--bdr)]'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
