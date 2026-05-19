export interface Character {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  trait: string;
}

export const characters: Character[] = [
  {
    id: "mountain_warrior",
    name: "Mountain Warrior",
    description: "Conquer peaks and embrace challenges. Built for extreme adventures.",
    icon: "⛰️",
    color: "#ff6b35",
    trait: "+50% XP on mountain quests"
  },
  {
    id: "taste_seeker",
    name: "Taste Seeker",
    description: "Discover culinary delights from around the world.",
    icon: "🍜",
    color: "#00ff88",
    trait: "+50% XP on food quests"
  },
  {
    id: "culture_explorer",
    name: "Culture Explorer",
    description: "Immerse yourself in local traditions and heritage.",
    icon: "🎭",
    color: "#00d4ff",
    trait: "+50% XP on cultural quests"
  },
  {
    id: "nature_wanderer",
    name: "Nature Wanderer",
    description: "Connect with wildlife and pristine landscapes.",
    icon: "🌿",
    color: "#6b5d4f",
    trait: "+50% XP on nature quests"
  },
  {
    id: "urban_navigator",
    name: "Urban Navigator",
    description: "Master the concrete jungle and city secrets.",
    icon: "🏙️",
    color: "#ffb800",
    trait: "+50% XP on city quests"
  },
  {
    id: "thrill_chaser",
    name: "Thrill Chaser",
    description: "Adrenaline junkie seeking the next big rush.",
    icon: "🎢",
    color: "#ff4757",
    trait: "+50% XP on adventure quests"
  }
];

export const countries = [
  "Mongolia", "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Spain", "Italy", "Japan", "South Korea",
  "China", "India", "Brazil", "Mexico", "Argentina",
  "Netherlands", "Sweden", "Norway", "Denmark", "Finland",
  "Switzerland", "Austria", "Belgium", "Portugal", "Greece",
  "Thailand", "Singapore", "Malaysia", "Indonesia", "Philippines",
  "New Zealand", "Ireland", "Poland", "Czech Republic", "Turkey",
  "United Arab Emirates", "Saudi Arabia", "South Africa", "Egypt", "Morocco"
];
