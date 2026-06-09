"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_QUEST_CONFIG,
  generateVerificationToken,
  QUEST_TIMEZONES,
  type AdminQuestExecutionType,
  type QuestConfigDraft,
} from "@/lib/quest/questAdminTypes";
import { Dices, Plus, Trash2 } from "lucide-react";

type QuestTypeConfigFormProps = {
  executionType: AdminQuestExecutionType;
  config: QuestConfigDraft;
  onChange: (config: QuestConfigDraft) => void;
};

const fieldClass =
  "bg-[#1A1D26] border-[#322F36] text-white mt-1 focus-visible:ring-emerald-500/40";
const labelClass = "text-sm text-[#A0A0B0]";
const sectionClass =
  "rounded-xl border border-emerald-500/20 bg-[#252830]/60 p-4 space-y-3";

export default function QuestTypeConfigForm({
  executionType,
  config,
  onChange,
}: QuestTypeConfigFormProps) {
  const patch = (partial: Partial<QuestConfigDraft>) =>
    onChange({ ...config, ...partial });

  switch (executionType) {
    case "PHOTO":
      return (
        <div className={sectionClass}>
          <p className="text-xs uppercase tracking-wider text-emerald-400/80 font-medium">
            Photo geofence (EXIF GPS validation)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Target latitude</label>
              <Input
                type="number"
                step="any"
                value={config.photo.targetLatitude}
                onChange={(e) =>
                  patch({ photo: { ...config.photo, targetLatitude: e.target.value } })
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Target longitude</label>
              <Input
                type="number"
                step="any"
                value={config.photo.targetLongitude}
                onChange={(e) =>
                  patch({ photo: { ...config.photo, targetLongitude: e.target.value } })
                }
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Radius (meters)</label>
            <Input
              type="number"
              min={1}
              value={config.photo.radiusMeters}
              onChange={(e) =>
                patch({ photo: { ...config.photo, radiusMeters: e.target.value } })
              }
              className={fieldClass}
            />
          </div>
        </div>
      );

    case "QUIZ":
    case "CHOICE":
      return (
        <div className={sectionClass}>
          <p className="text-xs uppercase tracking-wider text-emerald-400/80 font-medium">
            {executionType === "CHOICE" ? "Choice" : "Quiz"} knowledge check
          </p>
          <div>
            <label className={labelClass}>Question</label>
            <textarea
              value={config.quiz.question}
              onChange={(e) =>
                patch({ quiz: { ...config.quiz, question: e.target.value } })
              }
              className={`w-full rounded-md border border-[#322F36] bg-[#1A1D26] text-white p-2 mt-1 min-h-[72px] focus:outline-none focus:border-emerald-500/50`}
              placeholder="What is the traditional Mongolian dwelling called?"
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Answer options (select correct)</label>
            {config.quiz.options.map((opt, index) => (
              <div key={`${opt.id}-${index}`} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={config.quiz.correctOptionId === opt.id}
                  onChange={() =>
                    patch({ quiz: { ...config.quiz, correctOptionId: opt.id } })
                  }
                  className="accent-emerald-500"
                  title="Mark as correct"
                />
                <Input
                  value={opt.id}
                  onChange={(e) => {
                    const options = [...config.quiz.options];
                    options[index] = { ...opt, id: e.target.value };
                    patch({ quiz: { ...config.quiz, options } });
                  }}
                  placeholder="id"
                  className={`${fieldClass} w-20 font-mono text-xs`}
                />
                <Input
                  value={opt.label}
                  onChange={(e) => {
                    const options = [...config.quiz.options];
                    options[index] = { ...opt, label: e.target.value };
                    patch({ quiz: { ...config.quiz, options } });
                  }}
                  placeholder={`Option ${index + 1} label`}
                  className={`${fieldClass} flex-1`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={config.quiz.options.length <= 2}
                  onClick={() => {
                    const options = config.quiz.options.filter((_, i) => i !== index);
                    const correctOptionId =
                      config.quiz.correctOptionId === opt.id ? "" : config.quiz.correctOptionId;
                    patch({ quiz: { ...config.quiz, options, correctOptionId } });
                  }}
                  className="text-[#A0A0B0] hover:text-red-400 h-9 w-9 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const nextIndex = config.quiz.options.length;
                const nextId = String.fromCharCode(97 + nextIndex);
                patch({
                  quiz: {
                    ...config.quiz,
                    options: [...config.quiz.options, { id: nextId, label: "" }],
                  },
                });
              }}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Plus className="w-4 h-4 mr-1" /> Add option
            </Button>
          </div>
          <p className="text-[11px] text-[#6b7280]">
            Correct option ID is hashed (SHA-256) before save — never stored in plain text.
          </p>
        </div>
      );

    case "QR_SCAN":
      return (
        <div className={sectionClass}>
          <p className="text-xs uppercase tracking-wider text-emerald-400/80 font-medium">
            QR verification token
          </p>
          <div>
            <label className={labelClass}>Verification token</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={config.qr.verificationToken}
                onChange={(e) =>
                  patch({ qr: { ...config.qr, verificationToken: e.target.value } })
                }
                className={fieldClass}
                placeholder="ng-secure-token"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  patch({ qr: { verificationToken: generateVerificationToken() } })
                }
                className="shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Dices className="w-4 h-4 mr-1" /> Generate
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-[#6b7280]">
            Encode this token in the guide/merchant QR code for instant local validation.
          </p>
        </div>
      );

    case "AUDIO":
      return (
        <div className={sectionClass}>
          <p className="text-xs uppercase tracking-wider text-emerald-400/80 font-medium">
            Voice capture (Whisper sync on reconnect)
          </p>
          <div>
            <label className={labelClass}>Prompt for traveler</label>
            <Input
              value={config.audio.prompt}
              onChange={(e) =>
                patch({ audio: { ...config.audio, prompt: e.target.value } })
              }
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max duration (seconds)</label>
            <Input
              type="number"
              min={5}
              max={120}
              value={config.audio.maxDurationSeconds}
              onChange={(e) =>
                patch({ audio: { ...config.audio, maxDurationSeconds: e.target.value } })
              }
              className={fieldClass}
            />
          </div>
        </div>
      );

    case "TIME_BOUND":
      return (
        <div className={sectionClass}>
          <p className="text-xs uppercase tracking-wider text-emerald-400/80 font-medium">
            Execution time window
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Window start (HH:MM)</label>
              <Input
                type="time"
                value={config.timeBound.windowStart}
                onChange={(e) =>
                  patch({
                    timeBound: { ...config.timeBound, windowStart: e.target.value },
                  })
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Window end (HH:MM)</label>
              <Input
                type="time"
                value={config.timeBound.windowEnd}
                onChange={(e) =>
                  patch({
                    timeBound: { ...config.timeBound, windowEnd: e.target.value },
                  })
                }
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select
              value={config.timeBound.timezone}
              onChange={(e) =>
                patch({
                  timeBound: { ...config.timeBound, timezone: e.target.value },
                })
              }
              className="w-full h-10 mt-1 bg-[#1A1D26] text-white rounded-md border border-[#322F36] px-3 focus:outline-none focus:border-emerald-500/50"
            >
              {QUEST_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function createInitialQuestConfig(): QuestConfigDraft {
  return structuredClone(DEFAULT_QUEST_CONFIG);
}
