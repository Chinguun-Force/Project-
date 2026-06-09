"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Mic,
  MicOff,
  QrCode,
  Clock,
  HelpCircle,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  QuestExecutionConfig,
  OfflineSubmissionStatus,
  QuestEngineResult,
} from "@/types/questExecution";
import {
  executeAudioQuest,
  executePhotoQuest,
  executeQrScanQuest,
  executeQuizQuest,
  executeTimeBoundQuest,
  isQuestEngineSuccess,
} from "@/lib/quest/questEngine";
import { startAudioCapture } from "@/lib/quest/mediaUtils";
import { triggerQuestHaptic } from "@/lib/quest/haptics";

/** BarcodeDetector is not in all TS DOM libs yet. */
type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

type QuestExecutionCardProps = {
  questId: string;
  roomId: string;
  userId: string;
  title: string;
  config: QuestExecutionConfig;
  onSuccess: (status: OfflineSubmissionStatus) => void;
  onError?: (message: string) => void;
  className?: string;
};

const TYPE_ICONS = {
  PHOTO: Camera,
  AUDIO: Mic,
  QR_SCAN: QrCode,
  QUIZ: HelpCircle,
  TIME_BOUND: Clock,
} as const;

export default function QuestExecutionCard({
  questId,
  roomId,
  userId,
  title,
  config,
  onSuccess,
  onError,
  className = "",
}: QuestExecutionCardProps) {
  const [phase, setPhase] = useState<"idle" | "running" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<OfflineSubmissionStatus | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [recording, setRecording] = useState(false);
  const audioSessionRef = useRef<Awaited<ReturnType<typeof startAudioCapture>> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanLoopRef = useRef<number | null>(null);

  const Icon = TYPE_ICONS[config.type];

  const handleSuccess = useCallback(
    (status: OfflineSubmissionStatus) => {
      triggerQuestHaptic();
      setSuccessStatus(status);
      setPhase("success");
      onSuccess(status);
    },
    [onSuccess]
  );

  const handleFailure = useCallback(
    (message: string) => {
      setErrorMessage(message);
      setPhase("error");
      onError?.(message);
    },
    [onError]
  );

  const runEngine = useCallback(
    async (runner: () => Promise<QuestEngineResult>) => {
      setPhase("running");
      setErrorMessage(null);
      try {
        const result = await runner();
        if (isQuestEngineSuccess(result)) {
          handleSuccess(result.submission.status);
        } else {
          handleFailure(result.error);
        }
      } catch (err) {
        handleFailure(err instanceof Error ? err.message : "Quest execution failed");
      }
    },
    [handleSuccess, handleFailure]
  );

  const handlePhotoSelect = (file: File | null) => {
    if (!file || config.type !== "PHOTO") return;
    void runEngine(() =>
      executePhotoQuest({
        questId,
        roomId,
        userId,
        file,
        config: config.photo,
      })
    );
  };

  const handleQuizSubmit = () => {
    if (config.type !== "QUIZ" || !selectedOption) return;
    void runEngine(() =>
      executeQuizQuest({
        questId,
        roomId,
        userId,
        selectedOptionId: selectedOption,
        config: config.quiz,
      })
    );
  };

  const handleQrSubmit = () => {
    if (config.type !== "QR_SCAN") return;
    void runEngine(() =>
      executeQrScanQuest({
        questId,
        roomId,
        userId,
        scannedContent: qrInput,
        config: config.qr,
      })
    );
  };

  const handleTimeBound = () => {
    if (config.type !== "TIME_BOUND") return;
    void runEngine(() =>
      executeTimeBoundQuest({
        questId,
        roomId,
        userId,
        config: config.timeBound,
      })
    );
  };

  const startRecording = async () => {
    if (config.type !== "AUDIO" || recording) return;
    try {
      setPhase("running");
      setErrorMessage(null);
      const session = await startAudioCapture(config.audio.maxDurationSeconds ?? 30);
      audioSessionRef.current = session;
      setRecording(true);
      setPhase("idle");
    } catch (err) {
      handleFailure(err instanceof Error ? err.message : "Microphone unavailable");
    }
  };

  const stopRecording = async () => {
    if (!audioSessionRef.current || config.type !== "AUDIO") return;
    setRecording(false);
    const session = audioSessionRef.current;
    audioSessionRef.current = null;
    try {
      const blob = await session.stop();
      void runEngine(() =>
        executeAudioQuest({
          questId,
          roomId,
          userId,
          audioBlob: blob,
          config: config.audio,
        })
      );
    } catch (err) {
      handleFailure(err instanceof Error ? err.message : "Failed to save recording");
    }
  };

  const stopQrCamera = useCallback(() => {
    if (scanLoopRef.current !== null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (video) video.srcObject = null;
  }, []);

  const startQrCamera = async () => {
    if (config.type !== "QR_SCAN") return;
    if (typeof window === "undefined") return;

    const BarcodeDetectorCtor = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!BarcodeDetectorCtor || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanLoopRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && codes[0].rawValue) {
            setQrInput(codes[0].rawValue);
            stopQrCamera();
            return;
          }
        } catch {
          // continue scanning
        }
        scanLoopRef.current = requestAnimationFrame(scan);
      };
      scanLoopRef.current = requestAnimationFrame(scan);
    } catch {
      // Camera optional — manual paste fallback remains
    }
  };

  useEffect(() => () => stopQrCamera(), [stopQrCamera]);

  const renderControls = () => {
    switch (config.type) {
      case "PHOTO":
        return (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={phase === "running"}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0f1419] font-semibold"
            >
              <Upload className="w-4 h-4 mr-2" />
              Capture / Upload Photo
            </Button>
            <p className="text-xs text-[#6b7280] text-center">
              GPS from photo EXIF is validated against the quest radius.
            </p>
          </div>
        );

      case "AUDIO":
        return (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={phase === "running" && !recording}
              className={`w-full font-semibold ${
                recording
                  ? "bg-red-500/90 hover:bg-red-500 text-white"
                  : "bg-emerald-500 hover:bg-emerald-400 text-[#0f1419]"
              }`}
            >
              {recording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Voice Capture
                </>
              )}
            </Button>
            <p className="text-xs text-[#6b7280] text-center">{config.audio.prompt}</p>
          </div>
        );

      case "QR_SCAN":
        return (
          <div className="space-y-3">
            <video
              ref={videoRef}
              className="w-full rounded-lg border border-emerald-500/20 bg-black/40 aspect-video object-cover"
              playsInline
              muted
            />
            <Button
              type="button"
              variant="outline"
              onClick={startQrCamera}
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan with Camera
            </Button>
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Or paste verification code"
              className="w-full rounded-lg bg-[#1A1D26] border border-[#3d4450] px-3 py-2 text-sm text-white placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50"
            />
            <Button
              type="button"
              onClick={handleQrSubmit}
              disabled={!qrInput.trim() || phase === "running"}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0f1419] font-semibold"
            >
              Verify QR
            </Button>
          </div>
        );

      case "QUIZ":
        return (
          <div className="space-y-3">
            <p className="text-sm text-[#A0A0B0]">{config.quiz.question}</p>
            <div className="space-y-2">
              {config.quiz.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm border transition-colors ${
                    selectedOption === opt.id
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-[#3d4450] bg-[#1A1D26] text-white hover:border-emerald-500/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleQuizSubmit}
              disabled={!selectedOption || phase === "running"}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0f1419] font-semibold"
            >
              Submit Answer
            </Button>
          </div>
        );

      case "TIME_BOUND":
        return (
          <div className="space-y-3">
            <p className="text-sm text-[#A0A0B0] text-center">
              Complete between{" "}
              <span className="text-emerald-400 font-mono">
                {config.timeBound.windowStart}
              </span>{" "}
              –{" "}
              <span className="text-emerald-400 font-mono">
                {config.timeBound.windowEnd}
              </span>
            </p>
            <Button
              type="button"
              onClick={handleTimeBound}
              disabled={phase === "running"}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0f1419] font-semibold"
            >
              <Clock className="w-4 h-4 mr-2" />
              Check In Now
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative rounded-2xl border border-[#2d323c] bg-[#252830] overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />

      <div className="relative p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <Icon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white leading-tight">{title}</h3>
            <p className="text-[10px] uppercase tracking-wider text-emerald-500/80 font-medium">
              {config.type.replace("_", " ")} Quest
            </p>
          </div>
        </div>

        {phase === "error" && errorMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{errorMessage}</p>
          </div>
        )}

        {phase === "running" && (
          <div className="flex items-center justify-center gap-2 py-6 text-emerald-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Validating quest…</span>
          </div>
        )}

        {phase !== "running" && phase !== "success" && renderControls()}

        {phase === "error" && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPhase("idle");
              setErrorMessage(null);
            }}
            className="w-full text-[#A0A0B0] hover:text-white"
          >
            Try Again
          </Button>
        )}
      </div>

      <AnimatePresence>
        {phase === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f1419]/85 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="relative max-w-sm w-full rounded-2xl border border-emerald-400/50 bg-[#1a2420] p-6 text-center shadow-[0_0_48px_rgba(16,185,129,0.35)]"
            >
              <motion.div
                animate={{ boxShadow: ["0 0 20px rgba(16,185,129,0.3)", "0 0 40px rgba(16,185,129,0.55)", "0 0 20px rgba(16,185,129,0.3)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
              />
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-emerald-300 mb-2">Quest Secured Locally!</h4>
              <p className="text-sm text-[#A0A0B0] leading-relaxed">
                Your XP and Points will sync automatically upon network connection. 🚀
              </p>
              {successStatus === "pending_sync" && (
                <p className="mt-3 text-xs text-emerald-500/80 font-medium">
                  Pending server validation
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
