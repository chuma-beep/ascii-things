import { useEffect, useState } from "react";

export interface AnimatedAsciiProps {
  frames: readonly string[];
  interval?: number;
  start?: number;
  label: string;
  className?: string;
}

/** Cycle through preformatted ASCII frames without layout shift. */
export default function AnimatedAscii({
  frames,
  interval = 900,
  start = 0,
  label,
  className,
}: AnimatedAsciiProps) {
  const [index, setIndex] = useState(start % Math.max(frames.length, 1));

  useEffect(() => {
    if (frames.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % frames.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [frames.length, interval]);

  return (
    <pre className={className} role="img" aria-label={label}>
      {frames[index]}
    </pre>
  );
}
