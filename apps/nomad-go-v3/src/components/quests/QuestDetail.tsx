import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Quest } from '@/lib/data/quests';
import { difficultyColor, difficultyLabel } from '@/lib/utils/xp';
import { ArrowLeft, MapPin, Clock, Zap, Upload, CheckCircle2, Lock } from 'lucide-react';

interface QuestDetailProps {
  quest: Quest;
  isCompleted: boolean;
  isLocked: boolean;
  onComplete: () => void;
}

export default function QuestDetailView({ quest, isCompleted, isLocked, onComplete }: QuestDetailProps) {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/quests')}
          className="flex items-center gap-1 text-[13px] font-bold text-[var(--mu)] hover:text-ng transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="mx-4 mt-3 rounded-[var(--rx)] overflow-hidden relative bg-gradient-to-br from-[var(--bg2)] to-[var(--bg3)] border border-[var(--bdr)] p-6 text-center">
        <div className="text-5xl mb-3">{quest.icon}</div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`ng-pill border ${difficultyColor(quest.difficulty)}`}>
            {difficultyLabel(quest.difficulty)}
          </span>
          <span className="ng-pill bg-ng-dim text-ng border border-ng-border flex items-center gap-1">
            <Zap size={11} />
            +{quest.xpReward} XP
          </span>
        </div>
      </div>

      <div className="px-4 mt-4">
        <h1 className="font-display text-[22px] font-black text-ng-tx mb-2">{quest.title}</h1>
        <p className="text-[13px] text-[var(--tx2)] leading-relaxed">{quest.description}</p>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 gap-2">
        <div className="ng-card p-3 text-center">
          <MapPin size={16} className="mx-auto mb-1 text-ng" />
          <p className="text-[11px] font-bold text-[var(--mu)]">Distance</p>
          <p className="text-[13px] font-extrabold text-ng-tx">{quest.distance}</p>
        </div>
        <div className="ng-card p-3 text-center">
          <Clock size={16} className="mx-auto mb-1 text-ng" />
          <p className="text-[11px] font-bold text-[var(--mu)]">Duration</p>
          <p className="text-[13px] font-extrabold text-ng-tx">{quest.duration}</p>
        </div>
        <div className="ng-card p-3 text-center">
          <Zap size={16} className="mx-auto mb-1 text-ng" />
          <p className="text-[11px] font-bold text-[var(--mu)]">XP Reward</p>
          <p className="text-[13px] font-extrabold text-ng-tx">+{quest.xpReward}</p>
        </div>
      </div>

      {!isCompleted && !isLocked && (
        <div className="mx-4 mt-4">
          <div
            onClick={() => setUploaded(true)}
            className={`border-2 border-dashed rounded-[var(--r)] p-6 text-center cursor-pointer transition-colors ${
              uploaded ? 'border-ng bg-ng-dim' : 'border-[var(--bdr2)] hover:border-ng'
            }`}
          >
            {uploaded ? (
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 size={28} className="text-ng" />
                <p className="text-[13px] font-bold text-ng">Photo uploaded!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload size={28} className="text-[var(--mu)]" />
                <p className="text-[13px] font-bold text-[var(--tx2)]">Upload photo proof</p>
                <p className="text-[11px] text-[var(--ft)]">Tap to select image</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        {isCompleted ? (
          <button className="w-full ng-btn-primary bg-ng/80 cursor-default flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            Completed
          </button>
        ) : isLocked ? (
          <button className="w-full ng-btn-primary bg-[var(--ft)] cursor-default flex items-center justify-center gap-2">
            <Lock size={18} />
            Locked — Level {quest.unlockLevel} required
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="w-full ng-btn-secondary bg-no text-white border-none shadow-lg shadow-no/20 flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            {uploaded ? 'Complete Quest' : 'Start Quest'}
          </button>
        )}
      </div>
    </div>
  );
}
