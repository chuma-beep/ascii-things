---
title: Accessibility
description: Decorative by default, labelled on request, and still under reduced motion.
---

A canvas full of glyphs is not readable by a screen reader. Treat every scene as ambient
decoration unless you have a text alternative beside it.

## Decorative by default

Without a label, the engine sets:

```html
<canvas aria-hidden="true"></canvas>
```

The canvas stays out of the accessibility tree. This is the right default for a hero
background, a card visual, or a texture.

## Label when the scene is content

Pass `label` to make the canvas an image with an accessible name:

```tsx
<AsciiDog
  palette="paper"
  seed={7}
  label="A live ASCII robot dog test yard"
/>
```

The engine then sets:

```html
<canvas role="img" aria-label="A live ASCII robot dog test yard"></canvas>
```

Use a short, factual description. Do not describe every frame or pretend the animation is
interactive content.

:::caution
The label does not make the canvas's visual content available to a screen reader. It names the
image. If the scene carries meaning — for example, "our demo is a robot dog fetching a ball"
— put that sentence in the host page as real text.
:::

## Reduced motion

The runtime observes `prefers-reduced-motion: reduce` and handles it without host code:

1. The world settles for up to four seconds of simulated time.
2. Queued events are delivered.
3. One still frame is rendered.
4. The animation loop stops.
5. Pointer-down actions are ignored.

If the preference changes while the page is open, the runtime settles or resumes accordingly.

This is deliberate: the scene still appears, still has a correct composition, and does not
animate. Users who prefer less motion get a postcard, not a blank box.

## Calm mode

`calm` removes flicker, sparkle, blinking beacons, and tail flicker. It does not stop the
simulation; creatures still move at a lower visual frequency.

```tsx
<AsciiRobots palette="paper" calm />
```

Use `calm` for text-heavy pages, reading surfaces, and any scene that sits behind content.
`calm` and reduced motion are separate: calm quiets the scene, reduced motion stops it.

## Pointer interaction is enhancement only

Clicking a scene can splash, dispatch, shock, or throw a ball. None of that is required to
understand the page. Interactive scenes are ambient art, not games.

Because pointer actions are disabled under reduced motion, do not put essential controls
inside the canvas. If you need buttons, put them in DOM around the scene:

```tsx
import { useEffect, useRef } from "react";
import { createDog, type DogEngine } from "ascii-things/dog";

function Yard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dogRef = useRef<DogEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const dog = createDog(canvasRef.current, { palette: "abyss", seed: 7 });
    dogRef.current = dog;
    return () => dog.destroy();
  }, []);

  return (
    <div>
      <div style={{ height: 360 }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%" }}
          role="img"
          aria-label="A robot dog in a test yard"
        />
      </div>
      <button type="button" onClick={() => dogRef.current?.throwBall(320, 180)}>
        Throw the ball
      </button>
    </div>
  );
}
```

The `DogEngine` exposes `throwBall(x, y)` for this. Every scene also exposes
`trigger(action, x, y)` plus the named `splash()`, `dispatch()`, and `shockwave()` actions.
Pointer clicks remain optional enhancements.

## Pause controls

For long-running pages, offer a pause control next to a scene. The engine supports it:

```ts
scene.pause();
scene.resume();
```

The React wrappers expose the handle through `onReady`. Call `scene.pause()` or
`scene.resume()` from a control, or use the vanilla engine if you need to own the canvas.

## The React DOM contract

The React wrappers accept `className`, `style`, `width`, `height`, `id`, and `aspectRatio`.
They do not yet forward arbitrary `aria-*` or `data-*` attributes. If you need those, use the
vanilla factory with your own canvas, or the custom element and a host wrapper with an
accessible name.

```tsx
<div role="group" aria-labelledby="yard-caption">
  <h2 id="yard-caption">Robot dog test yard</h2>
  <AsciiDog palette="paper" seed={7} label="A live ASCII robot dog test yard" />
</div>
```

## UI components

`ascii-things/ui` is built with accessibility in mind:

- `AsciiPrompt` has a real `<label>`, a submit button, and a polite live region for status.
- `AsciiSceneTabs` uses `role="tablist"`, roving `tabIndex`, and Arrow/Home/End keys.
- `AsciiStage` is a `<figure>` with an optional `ariaLabel`; its footer is a `<figcaption>`.
- `AsciiReadout` is a description list with an optional label.
- `AsciiDogHero` combines them and labels its canvas by default.

The visual chrome is dark by design, but the text uses the same ink variables as the rest of
the UI layer. Check contrast if you override `--ascii-ink`, `--ascii-muted`, or
`--ascii-faint`.

## The docs site

This site uses Astro + Starlight. It respects reduced motion in the landing page styles, gives
every interactive demo a real DOM control, and keeps scene canvases either labelled or
decorative. The scene demos add a reduced-motion notice and disable the dog command input when
motion is reduced.

## Checklist

- [ ] Decorative scene: no label, `aria-hidden="true"`.
- [ ] Meaningful scene: `label` plus a sentence of real text nearby.
- [ ] Reduced motion tested at the OS level.
- [ ] `calm` considered for text-heavy pages.
- [ ] No essential control inside the canvas.
- [ ] Pause/resume offered if the scene is large or persistent.
- [ ] UI text contrast checked after theme overrides.
