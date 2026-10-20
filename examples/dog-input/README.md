# Dog + input

A landing-page hero with the robot dog test yard behind a real prompt. Type a
command, press Enter, and the dog fetches the ball.

```bash
npm install
npm run dev
# http://localhost:5173/examples/dog-input/
```

## What it demonstrates

- A full-bleed `<canvas>` running `createDog()` behind normal DOM UI.
- A plain HTML form overlay — no UI framework required.
- `DogEngine.throwBall(x, y)` called from application code, so the scene can be
  driven by a search box, a chat prompt, or a button.
- `onEvent` wiring for `nudge`, `charge`, and `low`, used to update the reply.
- Responsive layout that keeps the dog visible on a phone.

The page uses plain CSS on purpose: it has no Tailwind, shadcn, or component
library dependency. The canine is the only dependency.

## Use it with shadcn

shadcn is copy-paste React components plus Tailwind, so it composes with the
scene without an adapter. Keep the scene imperative when the submit button needs
to throw a ball:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { createDog, type DogEngine } from "ascii-things/dog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DogHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DogEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = createDog(canvasRef.current, {
      palette: "abyss",
      seed: 7,
      count: 1,
      dogs: [{ size: 1.15 }],
      spread: [0.68, 0.68],
      label: "A live ASCII robot dog test yard",
    });
    sceneRef.current = scene;
    return () => scene.destroy();
  }, []);

  return (
    <section className="relative h-[560px] overflow-hidden rounded-2xl border">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <form
        className="absolute inset-x-4 bottom-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          sceneRef.current?.throwBall(window.innerWidth * 0.55, window.innerHeight * 0.6);
        }}
      >
        <Input placeholder="Tell the dog what to fetch…" />
        <Button type="submit">Throw</Button>
      </form>
    </section>
  );
}
```

If you only need the scene and no imperative control, use the declarative
wrapper instead:

```tsx
import { AsciiDog } from "ascii-things/react";

<AsciiDog className="h-[560px] w-full" palette="abyss" seed={7} count={1} />
```
