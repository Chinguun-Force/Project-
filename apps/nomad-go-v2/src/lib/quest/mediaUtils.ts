export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read blob as base64"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

export function fileToBase64(file: File): Promise<string> {
  return blobToBase64(file);
}

export type AudioRecorderSession = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function startAudioCapture(
  maxDurationSeconds = 30
): Promise<AudioRecorderSession> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not supported on this device.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      stream.getTracks().forEach((t) => t.stop());
    };

    const timeout = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, maxDurationSeconds * 1000);

    recorder.onerror = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timeout);
        cleanup();
        reject(new Error("Audio recording failed"));
      }
    };

    recorder.onstart = () => {
      settled = true;
      resolve({
        stop: () =>
          new Promise<Blob>((res, rej) => {
            recorder.onstop = () => {
              window.clearTimeout(timeout);
              cleanup();
              res(new Blob(chunks, { type: mimeType }));
            };
            recorder.onerror = () => {
              window.clearTimeout(timeout);
              cleanup();
              rej(new Error("Audio recording failed"));
            };
            if (recorder.state === "recording") recorder.stop();
          }),
        cancel: () => {
          window.clearTimeout(timeout);
          if (recorder.state === "recording") recorder.stop();
          cleanup();
        },
      });
    };

    recorder.start(250);
  });
}
