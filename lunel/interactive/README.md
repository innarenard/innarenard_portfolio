# Lunel interactive replicas

Four interactive HTML replicas of screens from Lunel, the SwiftUI period tracker,
plus a guided scenario that chains them. They
replace the flat PNG screenshots in the Lunel case page — the PNGs are from
August–September 2026 and show screens the October redesign deleted.

No build step, no dependencies, no CDN. Copy the whole folder into a site and load it
with `<link>` and `<script>`.

```
lunel-tokens.css    every token from lunel-spec.md §1, on the .lunel class
lunel-core.css      scoped reset, phone frame, type scale, tab bar, utilities
lunel-core.js       window.Lunel — registry, i18n, motion, shared rAF, helpers
cycle-ring.css/js   component: Living Cycle Ring (Home)
calendar.css/js     component: Calendar month list
trends.css/js       component: Trends deck (3 of the 10 blocks)
insights.css/js     component: AI insight cards + "Your week" modal
scenario.css/js     driver that chains the four into one phone
home.css/js         component: the whole scrolling Home screen
checklist.css/js    component: the three rows, the sheet, the toast
```

The workbench that shows them all: `../gallery/index.html`, served at
<http://localhost:8016/>.

---

## 1. How a component is scoped

Everything lives under one root class, `.lunel`. Every selector in every file in this
folder starts with it. Nothing is declared on `:root`, on bare element selectors, or on
`*` outside `.lunel`, so five differently-styled host pages can embed these without the
tokens leaking out — and `lunel-core.css` neutralises the host's `font-family`, `color`,
`box-sizing`, margins and list styles on the way in.

```html
<div class="lunel-stage">
  <div class="lunel lunel-device" lang="en" data-lunel-component="calendar">
    <div class="lunel-screen">
      <div class="lunel-screen__statusbar" aria-hidden="true"><span class="lunel-island"></span></div>
      <div class="lunel-screen__content">…the component…</div>
      <div class="lunel-screen__home-indicator" aria-hidden="true"></div>
    </div>
  </div>
</div>
```

* `.lunel-stage` is the host's column. Any `.lunel-device` directly inside one is scaled
  to fit automatically (`Lunel.fitFrames`, run after every mount) — at 393 px the frame
  lands at about 0.82 and the page gets no horizontal scrollbar.
* `.lunel-device` is the 393 × 852 phone with 59/34 safe areas and a 55 px screen radius,
  per spec §12.13. Bezel colour, bezel width, shadow, safe areas and radius are all
  tokens, so a site can tint the frame without touching anything in here.
* `data-lunel-component="<name>"` is what mounts it. `Lunel.define(name, factory)`
  registers; mounting happens on `DOMContentLoaded` and again whenever a component file
  defines itself. The instance is stored on `el.__lunel`, and `data-lunel-ready` is set
  on the element. If the factory throws, `data-lunel-failed` is set and the static markup
  stays on screen.

A component does **not** have to own the device: the scenario mounts four of them inside
one phone. The factory only queries inside its own root.

### Degradation

The markup the host writes is the honest no-JS state, and JS enhances it in place:

* the ring ships a `<svg>` of the ring exactly as it rests (28 circles at their real idle
  positions and sizes), hidden by CSS once `data-lunel-ready` appears;
* the ring's centre label is readable in the markup and is only faded out *after* the
  component boots, so View Source and a JS failure both show real text;
* calendar, trends and insight cards are JS-built, and their containers are empty but
  correctly sized — a host that wants a picture there can put a `<noscript>` screenshot
  behind them.

---

## 2. Tokens

`lunel-tokens.css` is the whole of spec §1 on `.lunel`: the ten colour families plus the
four cycle phases and four flow levels (`--lunel-phase-menstrual`, `--lunel-flow-heavy`,
…), surfaces, text and icon greys, accents, the type scale, radii, spacing, shadows,
blurs, and motion.

Three rules carried over from the app that are easy to undo by accident:

1. **Alpha is baked in.** `--lunel-brand-medium` *is* `#E86C61` at 55 %. Never put an
   `opacity` on top of a `-medium` or `-light` token.
2. **There is no dark mode.** No colorset in the app has a dark variant. Nothing here
   reads `prefers-color-scheme`, and `.lunel` sets `color-scheme: light` so a host page in
   dark mode cannot have the UA invert anything inside the frame.
3. **Blur values are Figma stdDeviation, not SwiftUI radius.** The codebase converts
   `radius ≈ stdDeviation × 0.7`, so coming back to CSS you want the original: the
   insight-card glow is `--lunel-blur-insight-glow: 30px`, not 21, and the toast shadow is
   `0 0 20px`, not 10.

### Springs

Every SwiftUI `spring(response:dampingFraction:)` the app uses is baked in as a CSS
`linear()` easing plus its settle time. Pair them:

```css
transition: transform var(--lunel-spring-card-dur) var(--lunel-spring-card);
```

Available: `standard` (.35/.40, the bouncy brand press), `snappy`, `card`, `sheet`,
`toast`, `ring-displace`, `ring-drag-end`, `ring-select`, `ring-today`, `ring-highlight`,
`header-day`. For one that is not in the list, `Lunel.motion.springEasing(response,
damping)` returns `{duration, easing}` at runtime.

### Fonts

The components pull **nothing** off the network. The host page adds one link and the
token stack picks it up:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=Lora:wght@400..700&display=swap">
```

Without it the serif falls back to Georgia, which is honest but not the brand. Fraunces
carries `WONK 1`, `SOFT 0` and `opsz` = the point size (`--lunel-fraunces-axes` plus a
per-class `opsz`). Fraunces has no Cyrillic, so `.lunel-h1/h2/h3:lang(ru)` swap to Lora
SemiBold at the same size and line box — set `lang="ru"` anywhere above the component and
it happens, with no layout shift.

---

## 3. Bilingual

**English lives in the markup. Russian comes from a `data-i18n` key.** This is the
portfolio site's own mechanism: on the first `apply()` each `[data-i18n]` element's own
text is remembered as the English version, so switching back to English restores the
markup rather than a second dictionary.

```html
<button data-i18n="Today">Today</button>
```

```js
Lunel.i18n.setLang(root, 'ru');   // sets lang=, swaps, fires 'lunel:lang' on root
```

Text a component computes (plurals, dates, formatted strings) cannot live in the markup,
so it comes from `Lunel.i18n.t(key, lang, args)` in both languages. Components register
their own strings instead of growing core:

```js
Lunel.i18n.extend({ en: { … }, ru: { … } }, { my_plural_key: { en: {…}, ru: {…} } });
```

and re-render on the `lunel:lang` event:

```js
root.addEventListener('lunel:lang', function (e) { lang = e.detail.lang; render(); });
```

**Every Russian string in these files is harvested from the app's own
`Localizable.strings` / `.stringsdict` via `lunel-spec.md`. Nothing is translated here, and
nothing should be.** If a replica needs a string the spec does not have, mark it and ask
— that is a project rule (spec §12.20), along with: insights state facts and never give
advice, and the word "delay"/"задержка" is never used.

One place this bit: the ring's slider needs an accessible name and the app has no
`a11y_*` string for it. Rather than invent one in two languages, the slider takes its
name from the visible "Day 2 · Menstrual" line via `aria-labelledby`, and
`aria-valuetext` carries only the date and the tag. Every word a screen reader hears is
app copy.

### Plurals

Russian has four categories and the verb agrees — `Остался 1 день` / `Осталось 2 дня` /
`Осталось 5 дней`. `Lunel.i18n.t` routes any key present in `Lunel.i18n.plurals` through
`Intl.PluralRules`, using the ready objects from spec §13. Already defined:
`home_period_days_left`, `home_title_in_days`, `home_title_days_ago`,
`analytics_days_until_count`, `days_unit`, `trends_logs_count`, `cycles_count`,
`entries_count`, plus `weekly_days_until_single` and `weekly_no_repeats_basis_plural`
from the insights component. Do not hand-roll a suffix.

### Russian runs ~15 % longer

Check both languages at 393 px. Two things already fixed because of it, worth copying:

* the Trends segmented control sizes its options to their content instead of halves —
  "3 ПОСЛЕДНИХ ЦИКЛА" does not fit in half of 345 px, "LAST 3 CYCLES" does;
* the ring's centre column gets wider side padding in Russian, because
  "Менструальная фаза" is the longest line in the component.

Dates, month names, weekday letters and forecast ranges all go through `Intl` rather
than a table: `Lunel.dates.monthStandalone`, `Lunel.dates.shortRange` (which reproduces
`Date.appShortRange` — em dash → en dash, thin spaces normalised, tight inside one month
and spaced across two).

---

## 4. Motion

* **Composite-only.** Everything that moves per frame moves with `transform` and
  `opacity`. Two deliberate exceptions, both documented in place: the Trends ring draw-in
  animates `stroke-dashoffset` (an arc sweep has no composite-only equivalent, and the
  painted area is a 36–64 px square), and the orb phase re-tint cross-fades two stacked
  blurred layers with `opacity` rather than transitioning `background-color`, so the blur
  behind each layer is rasterised once and never re-rastered.
* **One rAF loop.** `Lunel.ticker.add(fn, el)` — the loop is shared by every component,
  pauses when the tab is hidden, and only calls back while `el` is in the viewport.
  Six mounted components cost one loop, and only the visible one does work.
* **Reduced motion genuinely stops.** `lunel-tokens.css` zeroes every duration token
  under `@media (prefers-reduced-motion: reduce)`, so a transition that still fires lands
  on its finished value instead of running fast. On top of that each component must stop
  its loop and **paint its finished state**: the ring skips the intro and shows all 28
  circles, the orb field at its t = 0 positions and the centre text visible — never a
  blank box. Check `Lunel.motion.reduced()` before starting anything, and register
  `Lunel.motion.onChange(cb)` so a mid-session change is handled.
* **A workbench override.** `Lunel.motion.override(true | false | null)` forces the
  reduced presentation on or off regardless of the system setting, by putting
  `data-reduce-motion` on every `.lunel` root (the tokens respond to it exactly as to the
  media query). The gallery's "Движение" switch uses it. Components must honour the
  `onChange` callback, not just the media query, or they will ignore it.

---

## 5. Accessibility

* Keyboard-operable, always with a real equivalent for a drag: the ring is a
  `role="slider"` (arrows ±1 day, PageUp/PageDown ±7, Home/End), the calendar is a grid
  with roving `tabindex` (arrows walk the grid, Home/End jump to the month's ends), the
  Trends window switch is a pair of `role="tab"` buttons.
* One tab stop per calendar, not ninety: only the selected cell has `tabindex="0"`.
* `:focus-visible` is styled centrally in `lunel-core.css`. A component that moves focus
  on `pointerdown` (the ring does, so the arrows work straight after a drag) must set a
  `data-pointer-focus` attribute and suppress the ring for it — see
  `.lunel-ring__input[data-pointer-focus]:focus-visible`.
* Canned data is announced sensibly: `aria-valuetext` on the ring, a full
  "date · cycle day · phase" label on each calendar cell, and a
  "name · status · caption" label on each insight card.
* Decoration is marked as such: the tab bar, the status bar, the orb field, the bridge
  canvas and the day circles are all `aria-hidden` and `pointer-events: none`.

---

## 6. The components

### Living Cycle Ring — `cycle-ring`

The Home ring with its 28 day circles, the drifting orb field, the noise overlay and the
centre date / "Day N · Phase" / countdown tag. Drag it (or arrow it) and the circles
spread and swell around the pointer, a liquid metaball bridge forms between the two
adjacent days, the date rolls, the phase line and tag change and the whole background
re-tints. First time it scrolls into view it plays the ~1 s fill-in.

Ported one-to-one from `Ring/CycleRing.swift`, `DayCircleSizing.swift`,
`CycleProgressView.swift`, `OrbBackgroundView.swift` and `MetaballBridge.metal`:
ring radius 0.43 × block, day 1 at 12 o'clock, the 48° sinusoidal displacement with its
0.55 idle strength, the cosine proximity scale (amplitude 0.85, falloff exponent 2), the
10 pt attraction pull, the bridge envelope (fade-in 0.01→0.18, plateau to 0.92) and the
Inigo Quilez polynomial smooth-min with the shader's own `k` formula.

Two traps worth repeating:

* **The noise must be masked before the `color-burn` blend.** The mask and the blend mode
  go on the *same element*. Put the mask on a wrapper and that wrapper gets its own
  stacking context, the blend resolves against transparency, and the whole thing degrades
  to a flat grey wash. `.lunel-ring` carries `isolation: isolate` so the blend cannot
  reach the host page either — and nothing between the orb layer and the noise layer may
  take a `transform`, `filter`, `opacity` or `will-change`.
* **The noise texture must be high-key.** A mid-grey noise under `color-burn` at 32 %
  does not read as grain, it reads as mud — it visibly desaturated the day circles. The
  generated tile is lifted into roughly 0.76–0.98 (`--lunel-noise-image`).

API: `replayIntro()`, `setDay(n)`, `day`, `debug`.

**Does not reproduce:** the ring's fade on page scroll (§3.3 — there is no scrolling Home
page here), the long-press quick log, haptics and the scroll click sound, and the
empty-state `AwaitingFirstPeriodView`. The day circles are re-rastered every frame rather
than promoted to layers, deliberately: a promoted 16 px texture scaled to 57 px for the
selected day is visibly soft.

### Calendar — `calendar`

The month list, with the thing naive replicas get wrong: the months sit **bare on the
cream page**. There is no white month card — the old screenshots have one, the current
code does not.

Exactly the four day states from §4.2 plus the logged-entry dot: past/today period day
(menstrual light, menstrual dark number), past ordinary day (white disc), today (white or
menstrual-light disc with a 1 pt Brand border and a Brand/Dark number), future predicted
period day (⌀38, white @20 % under the tint, grey number), future ordinary day (nothing).
Selected is a Brand disc with a white number and the `#C4605E` shadow.

**There is no ovulation or follicular colouring in the month grid, and none is invented
here.** If a later pass "improves" the calendar by tinting the fertile window, it is
wrong in the one place a designer looks closely.

Future days are not tappable. Tapping a past day fires
`lunel:day-select` (`detail: {date, cycleDay, isPeriod}`).

API: `select(date)`, `selectCycleDay(n)`, `scrollToToday()`, `selected`.

**Does not reproduce:** the day sheet that a tap opens (that is the checklist, see the
end), the month snap behaviour (`CalendarMonthSnapBehavior` — this scrolls normally), the
progressive-blur header, and the edit-period button is decoration. Six months are
rendered, not twenty-five.

### Trends deck — `trends`

Three of the ten paged blocks — Flow intensity, Mood and energy by phase, Activity by
phase — as vertical pages with the dot rail in the gutter. The
`Last 3 cycles / All time` switch re-counts **everything**: ring fractions, donut
fractions, log counts, peak-day text, bar segments, the legend and the leader share, plus
the data-window subtitle in the header.

The primitives are the app's: `TrendsRing` (⌀36, line width = diameter/2 × 0.3, arc from
12 o'clock), `MoodEnergyDonut` (outer ⌀64 mood / inner ⌀41 energy, ring fill = level
step ÷ 5 so the ring and the word always agree), `TrendsShareBar` (height 12, 1 pt gaps,
each segment the 21 %→70 % gradient of its colour). Peak days collapse runs the way the
app does: `[2,3]` → "2–3", `[1,4]` → "1, 4".

Colour encodes the scale — the flow level, the activity kind — never the phase. The phase
is named in words.

The segmented pill's two edges are meant to move on different springs 70 ms apart so it
stretches into a drop; here it is one keyframed `translateX` + `scaleX` overshoot, which
reads the same but is not the real two-spring rig.

API: `setWindow('last3'|'all')`, `toggleWindow()`, `goTo(pageIndex)`, `playIn()`,
`window`.

**Does not reproduce:** the other seven blocks, the Lunel Plus gate and its blurred
overlay, the export button, the collapsing header, and percentages are never printed for
flow — that is correct, the app prints "N logs" only.

### AI insights — `insights`

The 2-column card grid from Home — radius 40, the tint-light fill, the tint-medium glow
ellipse bleeding above the card edge at `blur(30px)`, the inset Background/Main shadow,
the status pill — and the "Your week" modal.

**Four of the six cards say "Collecting data / No data yet".** That is the point: the
product saying what it does not know yet instead of guessing. It is also the truthful
picture of an account two cycles in, and it carries the app's rule that "not enough data"
is always about one card, never about the app.

The weekly modal has both states. `setWeeklyState('rich')` shows
`weekly_lead_often` with its tags and `weekly_basis_each`; `setWeeklyState('thin')` shows
`weekly_not_enough_title` over `weekly_no_repeats_basis` — both verbatim app strings,
composed rather than invented, because the spec gives the `weekly_not_enough_body` plural
forms only in outline. The page behind the modal shrinks to 0.9 from its top edge and
fades to 0.25 onto its own colour (`.lunel-dimmable[data-dimmed]`) — the app never uses a
grey scrim, and neither does this.

Tapping a ready card opens the modal and fires `lunel:insight-open`.

API: `openWeekly()`, `closeWeekly()`, `setWeeklyState('rich'|'thin')`, `weeklyState`.

**Does not reproduce:** the pushed insight screen (§6.2) with its eight body states, the
"card is ready" modal, the Lunel Plus captions, and the card glyph artwork.

### Guided scenario — `scenario`

One phone, three scenes, a caption rail beside it. Beats come from the markup, so a host
re-cuts the story without touching the JS:

```html
<ol data-beats>
  <li data-beat="home" data-ms="9000" data-act="ring">caption…</li>
  …
</ol>
<p data-caption></p>
<button data-play data-label-play="…" data-label-stop="…" data-label-replay="…"></button>
<button data-next></button>
```

`data-beat` names the `[data-scene]` to show, `data-ms` how long the beat runs,
`data-act` which scripted action to run (`ring`, `calendar`, `insights`, `trends` — an
unknown name is a no-op, which turns the beat into a plain scene change). The driver
finds the components by `[data-lunel-component]` inside its own root, lazily, because
children mount after their ancestor.

**The captions are narration written for the host page, not app copy.** They are the one
piece of text in this folder that a site should rewrite.

Entering it: the scenario is the first card in the gallery, and its primary button says
"Проиграть сценарий". "Следующий шаг" steps by hand. The whole run is about 35 seconds.

---

### Home — `home`

The scrolling Home column: the sticky header under a four-layer progressive blur, the
ring, the checklist, the note card, the "learn about this phase" row, the AI-insight grid
and the tab bar. It is JS-built, like `calendar` and `trends`, and it **composes** the
other components rather than duplicating them: it writes a `cycle-ring` host, a
`checklist` host and an `insights` host and calls `Lunel.mount` on itself.

Attributes: `data-current-day` / `data-cycle-length` / `data-period-length` /
`data-anchor` / `data-notes` pass through to the ring; `data-fill`
(`empty` | `partial` | `full` | `none`), `data-period` (a period day — the checklist then
has three rows, not two), `data-past` (a past day — the questions go into the past
tense), `data-toast` + `data-toast-dwell`, `data-learn`, `data-insights`
(`ready:mood,phase,…`), and `data-state="awaiting"` for the screen before the first
period.

**Content scrolls under the status bar.** The screen gets `data-under-status`, the scroll
column spans the whole screen with a `padding-top` of the safe area, and the status-bar
strip is painted over it in solid `#FAF7F2` — that is how the app is built (§12.13), and
it is what makes the header's progressive blur have anything to blur.

### Checklist — `checklist`

The three 56 pt rows, the sheet that morphs Flow → Daily log → Mood without closing,
filled rows sinking below unfilled ones, the toast and the confetti. It builds its own
markup when the host hands it an empty root.

Three things in here are worth not undoing:

* **The sheet, the toast and the confetti are moved to the `.lunel-screen`.** They are
  screen-level layers. Left inside the scrolling column they position themselves against
  it and end up a thousand points above the frame.
* **The open transition does not wait for `requestAnimationFrame`.** A backgrounded tab
  never delivers one, and the sheet simply never opened. The starting state is applied
  with a synchronous reflow instead.
* **Every `focus()` passes `preventScroll: true`,** and a focus the component moved itself
  is marked `data-pointer-focus` so it draws no focus ring. Without the first, the browser
  scrolled the host page to reveal the focused control and the whole frame jumped.

## 7. Capture and compare

`../tools/` holds the loop that keeps these honest against the app:

```
tools/shoot.sh <id> <lang> [scroll]   headless Chrome → shots/<id>.<lang>.png, 786×1704
tools/diff.py  <shot> <ref> [--skip=a:b]   % of pixels that differ + a heat map
tools/cmp.py   <shot> <ref>           bounding boxes of single elements, in pt
tools/sweep.sh [id]                   every state × both languages, as a table
```

`../gallery/states.js` is the single list both pages read: `index.html` builds the
catalog from it and `state.html?id=…&lang=…` renders one state bare, for the camera.

**The ring background cannot be matched pixel for pixel, and that is not a defect.** Six
blurred blobs drift along Lissajous paths; a simulator frame catches them at an unknown
phase. `--skip=119:464` leaves that band out of the score, and the heat map greys it
rather than painting it red. The same caveat applies to anything translucent laid over
it — the tab bar glass shows the drift straight through.

---

## 8. What was checked, and how

Verified in Chrome at 393 px and at a wide width, in both languages:

* the ring fills in on first view, the drag scrubs the cycle, the metaball bridge closes
  (measured: alpha 255 along the whole line between the two circle centres at plateau
  progress), the phase re-tint happens, the date digit rolls and settles on the right
  value;
* a scripted 120-frame drag ran at 117 fps on a 120 Hz display with zero frames over
  20 ms;
* reduced motion (both the media query and the override) presents the finished ring, not
  a blank box;
* one tab stop per calendar, every control reachable, no focus ring on a mouse drag;
* the console is clean on load and through a full scenario run;
* the segmented control, the window subtitle, the insight card date and the weekly modal
  all localise, and the EN→RU→EN round trip restores the markup English.

Not checked: Safari and Firefox (Chrome only), VoiceOver or any real screen reader, touch
on a real device, and the checklist files.
