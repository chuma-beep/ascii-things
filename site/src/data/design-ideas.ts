export interface DesignIngredient {
  name: string;
  href: string;
}

export interface DesignIdea {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  ingredients: DesignIngredient[];
  note: string;
  code: string;
  prompt: string;
}

export const UNIVERSAL_PROMPT = `You are working with ascii-things, a library of live ASCII scenes for the web (https://ascii-things-docs.pages.dev/).

Design a single page or section that uses one ASCII scene as the focal point and, at most, one supporting scene. Follow these rules:

- Pick the scene for the feeling, not the subject: dog for character, koi for calm, servers for systems, city for momentum, starlings for atmosphere.
- Keep the scene interactive unless it is purely decorative. Give every canvas a useful aria-label.
- Use the abyss palette on dark surfaces and paper on cream surfaces. Keep one orange accent.
- Use monospace type, a small type scale, hairline borders, and generous negative space.
- Let type overlap the scene, but keep a clear reading path. Never put text over a busy part of the scene without a scrim.
- Add a reduced-motion fallback and make the layout work at 390px and 1440px.
- Use ascii-things components (React or custom elements) rather than recreating the scene renderer.
- Return production-ready code with CSS, and explain any scene options you chose.`;

export const DESIGN_IDEAS: DesignIdea[] = [
  {
    id: "command-deck",
    number: "01",
    title: "Command deck",
    category: "Product",
    description:
      "A live dog as the product hero, with a terminal that actually talks back. The scene is the character; the command bar is the interface.",
    ingredients: [
      { name: "Robot dog", href: "/scenes/dog/" },
      { name: "City", href: "/scenes/city/" },
    ],
    note: "Best when the product has a personality. Keep the copy short enough to let the dog move.",
    code: `<!-- Requires: npm install ascii-things + a bundler -->
<script type="module">
  import "ascii-things/element";
</script>
<section class="command-deck">
  <ascii-dog palette="abyss" seed="7" spread="0.7,0.7" count="1"></ascii-dog>
  <div class="command-deck__copy">
    <p class="command-deck__kicker">YARD 04 / UNIT 01</p>
    <h1>Good boy.<br><em>Good interface.</em></h1>
    <form class="command-deck__prompt">
      <span aria-hidden="true">›</span>
      <input aria-label="Tell the dog what to fetch" placeholder="Tell the dog what to fetch">
      <button type="submit">THROW ↵</button>
    </form>
  </div>
  <div class="command-deck__telemetry" aria-hidden="true">
    <span>CELLS 12,480</span><span>STATE FETCH</span><span>60 FPS</span>
  </div>
</section>
<style>
  .command-deck { position: relative; min-height: 100svh; overflow: hidden; background: #070809; color: #ece8df; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .command-deck ascii-dog { position: absolute; inset: 0; }
  .command-deck::after { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(7,8,9,.92), transparent 62%), linear-gradient(0deg, rgba(7,8,9,.85), transparent 55%); content: ""; pointer-events: none; }
  .command-deck__copy { position: relative; z-index: 1; display: grid; align-content: end; min-height: 100svh; max-width: 760px; padding: clamp(24px, 6vw, 80px); }
  .command-deck__kicker { margin: 0 0 18px; color: #ff7a1a; font-size: 10px; letter-spacing: .18em; }
  .command-deck h1 { margin: 0; font-size: clamp(3rem, 8vw, 7rem); font-weight: 500; letter-spacing: -.08em; line-height: .82; }
  .command-deck h1 em { color: #ff7a1a; font-style: normal; }
  .command-deck__prompt { display: flex; align-items: center; gap: 10px; max-width: 560px; margin-top: 28px; padding: 10px 12px; border: 1px solid rgba(236,232,223,.2); background: rgba(7,8,9,.55); }
  .command-deck__prompt input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; font-size: 12px; }
  .command-deck__prompt button { border: 0; background: #ff7a1a; color: #070809; padding: 8px 10px; font: inherit; font-size: 10px; letter-spacing: .08em; }
  .command-deck__telemetry { position: absolute; right: 24px; bottom: 24px; z-index: 1; display: grid; gap: 5px; padding-left: 12px; border-left: 1px solid rgba(255,122,26,.55); color: rgba(236,232,223,.45); font-size: 8px; letter-spacing: .12em; text-align: right; }
</style>`,
    prompt: `Using ascii-things, build a full-viewport product hero called "Command deck".

Use the robot dog scene as the background, with the dog positioned toward the right so the headline can sit in the lower-left. Add a small city scene as a live inset in the upper-right, framed with a hairline border and labeled "CITY / NIGHT FEED".

The page uses the abyss palette, cream type, one orange accent, and monospace labels. The headline is "Good boy. Good interface." with the second line in orange. Beneath it, build a working command bar: pressing Enter throws the ball into the scene and updates a small reply line. Put a telemetry column in the lower-right with cells, state, and FPS.

Keep the scene interactive and aria-labelled. Add a dark scrim behind the type, respect prefers-reduced-motion, and make it responsive at 390px. Return a single React component plus CSS.`,
  },
  {
    id: "signal-room",
    number: "02",
    title: "Signal room",
    category: "Dashboard",
    description:
      "A wall of servers reduced to status lights, packet counts, and one calm readout. The ants become a second kind of traffic.",
    ingredients: [
      { name: "Servers", href: "/scenes/servers/" },
      { name: "Ants", href: "/scenes/ants/" },
    ],
    note: "Use this when the data is the atmosphere. Keep the numbers fake but believable.",
    code: `<!-- Requires: npm install ascii-things + a bundler -->
<script type="module">
  import "ascii-things/element";
</script>
<section class="signal-room">
  <ascii-servers palette="abyss" seed="12" count="8"></ascii-servers>
  <header class="signal-room__top">
    <span>OPS / SECTOR 04</span><span class="live">● LIVE</span>
  </header>
  <div class="signal-room__copy">
    <p>UPTIME 99.98%</p>
    <h1>All systems.<br><em>All quiet.</em></h1>
  </div>
  <aside class="signal-room__rail" aria-label="System metrics">
    <div><span>PACKETS</span><strong>18.4k</strong><i style="width:72%"></i></div>
    <div><span>LATENCY</span><strong>12ms</strong><i style="width:18%"></i></div>
    <div><span>QUEUE</span><strong>004</strong><i style="width:38%"></i></div>
  </aside>
  <div class="signal-room__inset">
    <ascii-ants palette="abyss" seed="4" count="60"></ascii-ants>
    <span>ANTS / TRAFFIC</span>
  </div>
</section>
<style>
  .signal-room { position: relative; min-height: 100svh; overflow: hidden; background: #070809; color: #ece8df; font-family: ui-monospace, monospace; }
  .signal-room ascii-servers { position: absolute; inset: 0; opacity: .85; }
  .signal-room__top { position: absolute; top: 24px; left: 24px; right: 24px; display: flex; justify-content: space-between; color: rgba(236,232,223,.5); font-size: 9px; letter-spacing: .14em; }
  .signal-room .live { color: #ff7a1a; }
  .signal-room__copy { position: absolute; left: clamp(24px, 6vw, 80px); bottom: clamp(24px, 8vh, 80px); z-index: 1; }
  .signal-room__copy p { margin: 0 0 16px; color: #ff7a1a; font-size: 9px; letter-spacing: .16em; }
  .signal-room h1 { margin: 0; font-size: clamp(2.6rem, 6vw, 5.8rem); font-weight: 500; letter-spacing: -.08em; line-height: .86; }
  .signal-room h1 em { color: #ff7a1a; font-style: normal; }
  .signal-room__rail { position: absolute; top: 20%; right: clamp(24px, 5vw, 64px); display: grid; gap: 14px; width: min(260px, 30vw); padding: 16px; border: 1px solid rgba(236,232,223,.16); background: rgba(7,8,9,.55); }
  .signal-room__rail div { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; }
  .signal-room__rail span { color: rgba(236,232,223,.45); font-size: 8px; letter-spacing: .14em; }
  .signal-room__rail strong { color: #ece8df; font-size: 12px; font-weight: 500; }
  .signal-room__rail i { grid-column: 1 / -1; height: 1px; background: linear-gradient(90deg, #ff7a1a, rgba(255,122,26,.12)); }
  .signal-room__inset { position: absolute; right: 24px; bottom: 24px; width: 22%; border: 1px solid rgba(236,232,223,.16); background: #070809; }
  .signal-room__inset ascii-ants { height: 90px; }
  .signal-room__inset span { display: block; padding: 7px 8px; border-top: 1px solid rgba(236,232,223,.1); color: rgba(236,232,223,.45); font-size: 7px; letter-spacing: .12em; }
</style>`,
    prompt: `Using ascii-things, build a full-viewport operations dashboard called "Signal room".

Use the servers scene as a quiet background layer. Add a small ants scene in the lower-right as a second traffic feed, inside a thin-bordered inset with the label "ANTS / TRAFFIC". The layout should feel like an instrument panel, not a SaaS dashboard: one big statement, three small metrics, no cards with rounded corners.

Use the abyss palette, cream type, one orange accent, 1px borders, and 8-10px labels with wide tracking. The statement is "All systems. All quiet." with the second line in orange. The metric rail contains PACKETS 18.4k, LATENCY 12ms, and QUEUE 004, each with a thin orange bar. Add a small live dot and a sector label.

Keep the scene calm and accessible. Add reduced-motion behavior and a 390px layout that hides the inset rather than squeezing it. Return a single React component plus CSS.`,
  },
  {
    id: "quiet-pond",
    number: "03",
    title: "Quiet pond",
    category: "Editorial",
    description:
      "A slow koi pond behind a text column. The motion is the ornament, and the jellyfish inset keeps the page from feeling like a single screenshot.",
    ingredients: [
      { name: "Koi", href: "/scenes/koi/" },
      { name: "Jellyfish", href: "/scenes/jellyfish/" },
    ],
    note: "The cream card is the trick: put the reading surface on top of the scene instead of beside it.",
    code: `<!-- Requires: npm install ascii-things + a bundler -->
<script type="module">
  import "ascii-things/element";
</script>
<section class="quiet-pond">
  <ascii-koi palette="abyss" seed="4" count="4"></ascii-koi>
  <article class="quiet-pond__card">
    <p class="quiet-pond__kicker">ISSUE 03 / WATER</p>
    <h1>A slower<br><em>interface.</em></h1>
    <p>Let the pond do the moving. The page only needs one idea and enough silence to hear it.</p>
    <a href="/guide/design-systems/">Read the field notes <span>↗</span></a>
  </article>
  <div class="quiet-pond__inset">
    <ascii-jellyfish palette="abyss" seed="2" count="2"></ascii-jellyfish>
    <span>BLOOM / AMBIENT</span>
  </div>
</section>
<style>
  .quiet-pond { position: relative; min-height: 100svh; overflow: hidden; background: #070809; color: #ece8df; font-family: ui-monospace, monospace; }
  .quiet-pond ascii-koi { position: absolute; inset: 0; }
  .quiet-pond__card { position: absolute; top: clamp(24px, 7vh, 72px); left: clamp(24px, 7vw, 96px); z-index: 1; width: min(420px, 46vw); padding: clamp(22px, 3vw, 36px); border: 1px solid #181512; background: #f3eee4; color: #181512; box-shadow: 8px 8px 0 rgba(24,21,18,.18); }
  .quiet-pond__kicker { margin: 0 0 18px; color: #b84a12; font-size: 9px; letter-spacing: .16em; }
  .quiet-pond h1 { margin: 0; font-size: clamp(2.4rem, 4.8vw, 4.8rem); font-weight: 500; letter-spacing: -.08em; line-height: .86; }
  .quiet-pond h1 em { color: #b84a12; font-style: normal; }
  .quiet-pond p { max-width: 34ch; margin: 22px 0 26px; color: #5d554b; font-size: 12px; line-height: 1.7; }
  .quiet-pond a { display: inline-flex; gap: 12px; border-bottom: 1px solid #181512; padding-bottom: 4px; color: #181512; font-size: 9px; letter-spacing: .1em; text-decoration: none; text-transform: uppercase; }
  .quiet-pond__inset { position: absolute; right: 24px; bottom: 24px; width: 24%; border: 1px solid rgba(236,232,223,.16); background: #070809; }
  .quiet-pond__inset ascii-jellyfish { height: 120px; }
  .quiet-pond__inset span { display: block; padding: 8px; border-top: 1px solid rgba(236,232,223,.1); color: rgba(236,232,223,.45); font-size: 7px; letter-spacing: .12em; }
</style>`,
    prompt: `Using ascii-things, build an editorial landing section called "Quiet pond".

Use the koi scene as a full-bleed background. Place a cream paper card over the upper-left of the scene, offset with a hard 8px shadow and a 1px ink border. The card contains a small orange issue label, the headline "A slower interface.", one short paragraph, and a text link with an arrow. Add a small jellyfish scene in the lower-right inside a thin-bordered dark inset labeled "BLOOM / AMBIENT".

Use an abyss scene palette against paper #f3eee4 and ink #181512, with a single burnt-orange accent #b84a12. Keep the type monospace, the card narrow, and the rest of the scene empty. The result should feel like a printed field note that happens to be alive.

Make the card stack above the scene on mobile, hide the inset at 390px, and respect prefers-reduced-motion. Return a single React component plus CSS.`,
  },
  {
    id: "night-commute",
    number: "04",
    title: "Night commute",
    category: "Hero",
    description:
      "A city at rush hour, one line of copy, and a live route readout. Starlings turn the skyline into weather.",
    ingredients: [
      { name: "City", href: "/scenes/city/" },
      { name: "Starlings", href: "/scenes/starlings/" },
      { name: "Fireflies", href: "/scenes/fireflies/" },
    ],
    note: "The route line is a cheap way to make a scene feel like a product without adding a dashboard.",
    code: `<!-- Requires: npm install ascii-things + a bundler -->
<script type="module">
  import "ascii-things/element";
</script>
<section class="night-commute">
  <ascii-city palette="abyss" seed="9" count="42"></ascii-city>
  <div class="night-commute__copy">
    <p class="night-commute__kicker">ROUTE 04 / AFTER HOURS</p>
    <h1>The city<br><em>keeps moving.</em></h1>
    <div class="night-commute__route" aria-label="Route 04 stops">
      <span></span><span></span><span></span><span></span>
      <b>18:42</b>
    </div>
  </div>
  <div class="night-commute__inset">
    <ascii-starlings palette="abyss" seed="3" count="180"></ascii-starlings>
    <span>MURMURATION / WEATHER</span>
  </div>
</section>
<style>
  .night-commute { position: relative; min-height: 100svh; overflow: hidden; background: #070809; color: #ece8df; font-family: ui-monospace, monospace; }
  .night-commute ascii-city { position: absolute; inset: 0; }
  .night-commute::after { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(7,8,9,.9), transparent 62%); content: ""; pointer-events: none; }
  .night-commute__copy { position: absolute; left: clamp(24px, 6vw, 80px); bottom: clamp(24px, 8vh, 76px); z-index: 1; }
  .night-commute__kicker { margin: 0 0 18px; color: #ff7a1a; font-size: 9px; letter-spacing: .16em; }
  .night-commute h1 { margin: 0; font-size: clamp(2.8rem, 7vw, 6.8rem); font-weight: 500; letter-spacing: -.08em; line-height: .84; }
  .night-commute h1 em { color: #ff7a1a; font-style: normal; }
  .night-commute__route { display: flex; align-items: center; gap: 0; margin-top: 28px; width: min(340px, 70vw); }
  .night-commute__route span { width: 7px; height: 7px; flex: 1; border: 1px solid #ff7a1a; background: #070809; }
  .night-commute__route span + span { margin-left: 3px; }
  .night-commute__route b { margin-left: 14px; color: rgba(236,232,223,.55); font-size: 9px; font-weight: 400; letter-spacing: .12em; }
  .night-commute__inset { position: absolute; right: 24px; bottom: 24px; width: 27%; border: 1px solid rgba(236,232,223,.16); background: #070809; }
  .night-commute__inset ascii-starlings { height: 110px; }
  .night-commute__inset span { display: block; padding: 7px 8px; border-top: 1px solid rgba(236,232,223,.1); color: rgba(236,232,223,.45); font-size: 7px; letter-spacing: .12em; }
</style>`,
    prompt: `Using ascii-things, build a nocturnal hero called "Night commute".

Use the city scene as the full-bleed background. Add a starlings scene in the lower-right as a small "weather" inset, inside a hairline frame labeled "MURMURATION / WEATHER". Optionally add fireflies to the inset if the starlings feel too sparse.

The copy is "The city keeps moving." with the second line in orange, a small route label "ROUTE 04 / AFTER HOURS", and a horizontal four-stop route line with the time 18:42. Put the copy in the lower-left over a dark gradient scrim. Keep the scene interactive and the composition otherwise empty.

Use abyss, cream, and one orange. Add a reduced-motion fallback, hide the inset at 390px, and return a single React component plus CSS.`,
  },
  {
    id: "specimen-sheet",
    number: "05",
    title: "Glyph specimen",
    category: "Editorial",
    description:
      "Treat a live kanji field like a field specimen: cream paper, clipped labels, a dark viewing window, and fifteen drifting studies.",
    ingredients: [
      { name: "Kanji field", href: "/kanji/field/" },
      { name: "Kanji marks", href: "/kanji/" },
      { name: "ASCII symbols", href: "/symbols/" },
    ],
    note: "This is the most useful pattern for an about page, changelog, or case study: the scene becomes evidence.",
    code: `<!-- Requires: npm install ascii-things + a bundler -->
<script type="module">
  import "ascii-things/webgl/element";
</script>
<section class="glyph-specimen">
  <div class="glyph-specimen__sheet">
    <div class="glyph-specimen__art">
      <ascii-surface
        variant="field"
        text="漢字"
        glyphs="永龍風水火土空海月花鳥"
        density="0.24"
        cell="10"
        background="#050607"
        foreground="#f4ead6"
        accent="#ff7a1a"
        font-family="'Noto Serif CJK JP', 'Yu Mincho', serif"
        label="A drifting field of kanji glyphs">
      </ascii-surface>
    </div>
    <div class="glyph-specimen__notes">
      <p>FIELD NOTE / 05</p>
      <h1>Glyph<br><em>specimen.</em></h1>
      <dl>
        <div><dt>FAMILY</dt><dd>Type field</dd></div>
        <div><dt>GLYPHS</dt><dd>永龍風水火</dd></div>
        <div><dt>STATUS</dt><dd>Drifting</dd></div>
      </dl>
      <span class="glyph-specimen__stamp">漢</span>
    </div>
  </div>
</section>
<style>
  .glyph-specimen { display: grid; place-items: center; min-height: 100svh; padding: clamp(18px, 4vw, 56px); background: #e8dfd0; color: #181512; font-family: ui-monospace, monospace; }
  .glyph-specimen__sheet { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(220px, .8fr); width: min(1080px, 100%); border: 1px solid #181512; background: #f3eee4; box-shadow: 10px 10px 0 rgba(24,21,18,.14); }
  .glyph-specimen__art { position: relative; min-height: 420px; margin: clamp(14px, 2vw, 24px); border: 1px solid #181512; background: #050607; }
  .glyph-specimen__art ascii-surface { position: absolute; inset: 0; display: block; }
  .glyph-specimen__notes { display: flex; flex-direction: column; padding: clamp(18px, 3vw, 32px); border-left: 1px solid rgba(24,21,18,.2); }
  .glyph-specimen__notes > p { margin: 0 0 auto; color: #b84a12; font-size: 9px; letter-spacing: .16em; }
  .glyph-specimen h1 { margin: 24px 0; font-size: clamp(2rem, 4vw, 4rem); font-weight: 500; letter-spacing: -.08em; line-height: .84; }
  .glyph-specimen h1 em { color: #b84a12; font-style: normal; }
  .glyph-specimen dl { display: grid; gap: 8px; margin: 0; }
  .glyph-specimen dl div { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid rgba(24,21,18,.18); padding-top: 7px; }
  .glyph-specimen dt, .glyph-specimen dd { margin: 0; font-size: 8px; letter-spacing: .1em; }
  .glyph-specimen dt { color: #7a7063; }
  .glyph-specimen dd { text-align: right; }
  .glyph-specimen__stamp { align-self: flex-end; display: grid; place-items: center; width: 44px; height: 44px; margin-top: 28px; border: 1px solid #b84a12; color: #b84a12; font-size: 24px; }
  @media (max-width: 700px) { .glyph-specimen__sheet { grid-template-columns: 1fr; } .glyph-specimen__notes { border-top: 1px solid rgba(24,21,18,.2); border-left: 0; } .glyph-specimen__art { min-height: 260px; } }
</style>`,
    prompt: `Using ascii-things, build a cream specimen-sheet section for an about page or case study.

The composition is a paper sheet centered on a deeper cream grid. Inside the sheet, use a two-column layout: a dark framed viewing window on the left containing a live Kanji field, and a notes column on the right. The notes include a small "FIELD NOTE / 05" label, the headline "Glyph specimen.", a three-row definition list (FAMILY, GLYPHS, STATUS), and a small orange kanji stamp (漢).

Use the ascii-surface webgl element with variant "field", text "漢字", and the glyph set 永龍風水火土空海月花鳥. Set a serif CJK font, a paper-adjacent foreground, and one orange accent. Do not use a static stamp as the main artwork — the field must drift.

Use paper #f3eee4, deep cream #e8dfd0, ink #181512, and burnt orange #b84a12. Use hairline rules, monospace type, and a hard offset shadow. The scene should feel like evidence, not decoration.

Stack the art above the notes at 700px. Keep the surface aria-labelled and respect prefers-reduced-motion. Return a single React component plus CSS.`,
  },
  {
    id: "launch-sequence",
    number: "06",
    title: "Launch sequence",
    category: "Launch",
    description:
      "A murmuration as a loading screen. The type waits; the sky moves. Fireflies add a second, slower rhythm.",
    ingredients: [
      { name: "Starlings", href: "/scenes/starlings/" },
      { name: "Fireflies", href: "/scenes/fireflies/" },
      { name: "Jellyfish", href: "/scenes/jellyfish/" },
    ],
    note: "Use this for a launch page, a waitlist, or the pause before a product demo.",
    code: `<!-- Requires: npm install ascii-things + a bundler -->
<script type="module">
  import "ascii-things/element";
</script>
<section class="launch-sequence">
  <ascii-starlings palette="abyss" seed="5" count="220"></ascii-starlings>
  <div class="launch-sequence__center">
    <p>MURMURATION / LOADING</p>
    <h1>Ready<br><em>when you are.</em></h1>
    <div class="launch-sequence__loader" aria-hidden="true"><i></i></div>
    <span>LAUNCHING IN 03</span>
  </div>
  <div class="launch-sequence__inset">
    <ascii-fireflies palette="abyss" seed="2" count="40"></ascii-fireflies>
    <span>MEADOW / SIGNAL</span>
  </div>
</section>
<style>
  .launch-sequence { position: relative; display: grid; place-items: center; min-height: 100svh; overflow: hidden; background: #070809; color: #ece8df; font-family: ui-monospace, monospace; text-align: center; }
  .launch-sequence ascii-starlings { position: absolute; inset: 0; opacity: .72; }
  .launch-sequence::after { position: absolute; inset: 0; background: radial-gradient(circle, transparent 10%, rgba(7,8,9,.7) 74%); content: ""; pointer-events: none; }
  .launch-sequence__center { position: relative; z-index: 1; display: grid; justify-items: center; padding: 24px; }
  .launch-sequence__center p { margin: 0 0 18px; color: #ff7a1a; font-size: 9px; letter-spacing: .18em; }
  .launch-sequence h1 { margin: 0; font-size: clamp(2.8rem, 7vw, 6.4rem); font-weight: 500; letter-spacing: -.08em; line-height: .84; }
  .launch-sequence h1 em { color: #ff7a1a; font-style: normal; }
  .launch-sequence__loader { width: min(280px, 60vw); height: 1px; margin: 32px 0 14px; background: rgba(236,232,223,.18); }
  .launch-sequence__loader i { display: block; width: 38%; height: 1px; background: #ff7a1a; animation: load 2.4s ease-in-out infinite alternate; }
  .launch-sequence__center > span { color: rgba(236,232,223,.45); font-size: 8px; letter-spacing: .16em; }
  .launch-sequence__inset { position: absolute; right: 24px; bottom: 24px; width: 24%; border: 1px solid rgba(236,232,223,.16); background: #070809; text-align: left; }
  .launch-sequence__inset ascii-fireflies { height: 100px; }
  .launch-sequence__inset span { display: block; padding: 7px 8px; border-top: 1px solid rgba(236,232,223,.1); color: rgba(236,232,223,.45); font-size: 7px; letter-spacing: .12em; }
  @keyframes load { from { transform: translateX(0); } to { transform: translateX(164%); } }
  @media (prefers-reduced-motion: reduce) { .launch-sequence__loader i { animation: none; width: 100%; } }
</style>`,
    prompt: `Using ascii-things, build a launch/waitlist page called "Launch sequence".

Use the starlings scene as a full-bleed background, dimmed behind a soft radial scrim. Add a small fireflies scene in the lower-right inside a hairline inset labeled "MEADOW / SIGNAL". Center a short statement: "Ready when you are." with the second line in orange, a loading rule with an orange moving segment, and the small label "LAUNCHING IN 03".

Use the abyss palette, cream type, and a single orange accent. Keep the page quiet: no cards, no buttons except a small "Enter" link if needed. The loader should animate slowly and stop completely under prefers-reduced-motion.

Make the inset disappear at 390px while keeping the centered type. Return a single React component plus CSS.`,
  },
];
