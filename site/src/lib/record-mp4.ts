export interface Mp4Options {
  /** Capture length in milliseconds. Default 4000. */
  duration?: number;
  /** Frames per second. Default 30. */
  fps?: number;
  /** Longest edge of the MP4. Default 1280. */
  maxWidth?: number;
  /** Target bitrate in bits per second. Derived from the frame size by default. */
  bitrate?: number;
}

const CODECS = ["avc1.4d002a", "avc1.42001f", "avc1.42E01E"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function even(value: number) {
  return Math.max(2, Math.round(value / 2) * 2);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pickCodec(width: number, height: number, fps: number, bitrate: number) {
  if (typeof VideoEncoder === "undefined") return null;
  for (const codec of CODECS) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
        avc: { format: "avc" },
      });
      if (support.supported) return codec;
    } catch {
      // Try the next profile; browsers expose different H.264 levels.
    }
  }
  return null;
}

/** True when the browser can encode H.264 through WebCodecs. */
export async function canRecordMp4(
  canvas: HTMLCanvasElement,
  options: Pick<Mp4Options, "maxWidth" | "fps" | "bitrate"> = {},
): Promise<boolean> {
  const sourceWidth = Math.max(1, canvas.width || 1);
  const sourceHeight = Math.max(1, canvas.height || 1);
  const width = even(Math.min(options.maxWidth ?? 1280, sourceWidth));
  const height = even((width * sourceHeight) / sourceWidth);
  const fps = Math.round(clamp(options.fps ?? 30, 10, 60));
  const bitrate =
    options.bitrate ?? clamp(Math.round(width * height * fps * 0.1), 1_000_000, 8_000_000);
  return (await pickCodec(width, height, fps, bitrate)) !== null;
}

/**
 * Records the canvas to an H.264 MP4 using WebCodecs and an in-memory MP4
 * muxer. Throws when the browser has no H.264 encoder; callers can fall back to
 * MediaRecorder or a GIF.
 */
export async function recordMp4(
  canvas: HTMLCanvasElement,
  options: Mp4Options = {},
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("MP4 capture needs a browser document.");
  }
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    throw new Error("This browser does not support WebCodecs video encoding.");
  }

  const duration = clamp(options.duration ?? 4000, 500, 20_000);
  const fps = Math.round(clamp(options.fps ?? 30, 10, 60));
  const sourceWidth = Math.max(1, canvas.width || 1);
  const sourceHeight = Math.max(1, canvas.height || 1);
  const width = even(Math.min(options.maxWidth ?? 1280, sourceWidth));
  const height = even((width * sourceHeight) / sourceWidth);
  const bitrate =
    options.bitrate ?? clamp(Math.round(width * height * fps * 0.1), 1_000_000, 8_000_000);
  const codec = await pickCodec(width, height, fps, bitrate);
  if (!codec) {
    throw new Error("This browser cannot encode H.264 video.");
  }

  const frame = document.createElement("canvas");
  frame.width = width;
  frame.height = height;
  const context = frame.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("This browser cannot create a capture canvas.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const { ArrayBufferTarget, Muxer } = await import("mp4-muxer");
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width, height, frameRate: fps },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  let encoderError: unknown;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      encoderError = error;
    },
  });

  const frameCount = Math.max(1, Math.round((duration / 1000) * fps));
  const frameDuration = Math.round(1_000_000 / fps);
  const frameDelay = 1000 / fps;

  try {
    encoder.configure({
      codec,
      width,
      height,
      bitrate,
      framerate: fps,
      latencyMode: "quality",
      avc: { format: "avc" },
    });

    for (let index = 0; index < frameCount; index++) {
      if (encoderError) throw encoderError;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);
      context.drawImage(canvas, 0, 0, width, height);

      const videoFrame = new VideoFrame(frame, {
        timestamp: Math.round((index * 1_000_000) / fps),
        duration: frameDuration,
      });
      encoder.encode(videoFrame, { keyFrame: index % (fps * 2) === 0 });
      videoFrame.close();

      while (encoder.encodeQueueSize > 8) {
        await sleep(4);
      }
      if (index < frameCount - 1) await sleep(frameDelay);
    }

    if (encoderError) throw encoderError;
    await encoder.flush();
    if (encoderError) throw encoderError;
    muxer.finalize();
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength === 0) {
      throw new Error("The MP4 capture was empty.");
    }
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    encoder.close();
  }
}
