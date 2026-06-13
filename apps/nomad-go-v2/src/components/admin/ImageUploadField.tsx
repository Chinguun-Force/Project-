"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link2, Loader2, ImageOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  uploadQuestImage,
  type QuestMediaFolder,
} from "@/lib/media/uploadQuestImage";

type Mode = "upload" | "url";

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  folder: QuestMediaFolder;
  label?: string;
};

const tabClass = (active: boolean) =>
  `flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium transition-colors ${
    active
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
      : "text-[#A0A0B0] border border-transparent hover:text-white"
  }`;

export default function ImageUploadField({
  value,
  onChange,
  folder,
  label = "Image",
}: ImageUploadFieldProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setPreviewError(false);
    try {
      const { publicUrl, bytes } = await uploadQuestImage(file, folder);
      onChange(publicUrl);
      toast.success(`Image uploaded (${Math.round(bytes / 1024)}KB, compressed)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      console.error("ImageUploadField upload error:", err);
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-[#A0A0B0]">{label}</label>

      <div className="flex gap-1.5 rounded-lg bg-[#1A1D26] border border-[#322F36] p-1">
        <button type="button" className={tabClass(mode === "upload")} onClick={() => setMode("upload")}>
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
        <button type="button" className={tabClass(mode === "url")} onClick={() => setMode("url")}>
          <Link2 className="w-3.5 h-3.5" /> URL
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compressing & uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" /> Choose JPEG / PNG
              </>
            )}
          </Button>
          <p className="text-[11px] text-[#6b7280] mt-1">
            Auto-compressed to ~200–300KB and stored on Supabase.
          </p>
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => {
            setPreviewError(false);
            onChange(e.target.value);
          }}
          placeholder="https://…"
          className="bg-[#1A1D26] border-[#322F36] text-white focus-visible:ring-emerald-500/40"
        />
      )}

      {value && !previewError && (
        <div className="relative mt-1">
          <img
            src={value}
            alt="Preview"
            onError={() => setPreviewError(true)}
            className="h-28 w-full object-cover rounded-lg border border-[#322F36]"
          />
          <button
            type="button"
            onClick={() => {
              onChange("");
              setPreviewError(false);
            }}
            className="absolute top-2 right-2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#0f1419]/80 text-white hover:bg-red-500/80 transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {value && previewError && (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#322F36] bg-[#1A1D26] px-3 py-2 text-xs text-[#A0A0B0]">
          <ImageOff className="w-4 h-4 text-[#6b7280]" />
          Preview unavailable — the URL may be invalid.
        </div>
      )}
    </div>
  );
}
