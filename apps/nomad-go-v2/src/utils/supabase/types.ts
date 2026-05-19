export type UserRole = 'user' | 'admin' | 'tourist' | 'guide';

export interface DatabaseUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  level: number;
  current_xp: number;
  xp_threshold: number;
  total_xp: number;
  points: number;
  completed_quests: number;
  avatar_url?: string;
  country?: string;
  age?: number;
  character?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSession {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  guide_id: string;
  invite_code: string;
  is_active: boolean;
  journey_data?: {
    journeyTitle: string;
    days: Array<{
      day: number;
      title: string;
      location?: string;
      steps?: Array<{
        id: string;
        time: string;
        title: string;
        subtitle?: string;
        description?: string;
        type?: string;
        xp?: number;
      }>;
    }>;
  };
}

export interface DatabaseQuest {
  id: string;
  session_id: string;
  type: 'quiz' | 'photo' | 'action' | 'choice' | 'timer';
  title: string;
  description?: string;
  xp_reward: number;
  day_number: number;
  created_by: string;
  is_dynamic: boolean;
  available_from?: string;
}

export interface DatabaseQuestResponse {
  id: string;
  quest_id: string;
  user_id: string;
  status: 'active' | 'completed';
  response_data: any;
  created_at: string;
}
