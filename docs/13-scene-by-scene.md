# 13 · Scene by scene

For each block: **what the reference does → what was measured → how it was
built → what still differs.** Sheets: `analysis/sheets/reference/<block>.jpg`
(reference, frame-stamped) and `analysis/sheets/compare/<block>.jpg` (REF over NEW).
Scores: mean abs difference (0–255) from `analysis/score_report.txt`.

---

## 01 · Intro — frames 0–55 · `composition/scenes/01-intro.js` · score 5.8

**Reference.** Camera flies slowly over defocused flowered hills. The line "We've
all pressed this" appears word by word (9, 18, 27, 35), each word fading in
blurred and sliding left with a long settle. A thin white rounded frame grows in
from the edges (19–28). A © line types in at the bottom (5–17). A hand cursor
enters bottom-left on 20 and travels under the text to the right. On 49–55 a blue
"Button" pill fades in and the camera accelerates toward it.

**Measured.** Word columns per frame (`analysis/measurements/01-intro-words.txt`), easing
fit r = 0.901 (`01-intro-word-fit.txt`), cursor centre per frame
(`01-intro-cursor.txt`), ring inset per frame, pill colour ramp, push scale from
word widths, letterbox (0 until 50).

**Built.** Plates `assets/plates/landscape/000–055`. Words: `x = final + off·0.9ⁿ`, opacity
`0.25 + n/3.2`, blur 6→0 in 6 frames, horizontal push blur from the camera
velocity. Ring = bordered div inset per frame. Footer = per-character opacity
sweep. Cursor `center()` along `CUR`. Camera group scaled about (750, 378) with an
ease-in `CAM` table.

**Differences.** Inter vs SF letter shapes; cursor shadow slightly different.

## 02 · Close-up — 56–98 · `composition/scenes/02-closeup.js` · score 9.6

**Reference.** Hard cut into a huge close-up "…ressed this [Button] befo" that
whips left and settles (56–72); the letterbox grows to 34 px; the cursor rises to
the button's bottom-right corner (61–92); a light-blue glow blooms under the
fingertip (70–96); click squash 94–98; caption `[ Simple Button ]`.

**Measured.** Pill edges per frame (`02-closeup-pill.txt`), text columns
(`02-closeup-text.txt`), cursor (`02-closeup-cursor.txt`), glow colours
(`02-hover-glow.txt`), "before" left edge per frame (settles later than the camera).

**Built.** Plates `assets/plates/closeup/56–98` (text band painted out). Camera group:
`translateX(CAM_TX) scale(CAM_S)` with horizontal blur 0.15–0.3 × velocity. Pill =
dark lip + body gradient + clipped radial glow + Bold 133 px label. "before" has
its own decay (0.89 from 62). Cursor 170 px with press scale `CUR_S`.

**Differences.** The reference pill is slightly perspective-tilted during the whip
(56–58); plate inpainting under the text is smooth where the reference has faint
hill detail; glow shape.

## 03 · Button montage — 99–226 · `composition/scenes/03-montage.js` · score 5.0

**Reference.** 19 hard-cut shots, 4–15 frames each, each a "subscription button"
in its brand style: Apple Pay receipt, Buy GPT 5, Try Grok (particles), Buy Claude
(pricing page), Upgrade This (Mojave), Upgrade That (grey photo), Get Gemini
(stars), Try Perplexity (bands), Buy Copilot (ribbon), Try Runway (grid), Buy
Kling 3.0 (glass + blob), Luma AI (rings), Get Sora, GPT 5.5, Buy Claude (cream),
Upgrade This (brown grid), Upgrade That (red grid), Banana (characters), Buy
Claude (mauve page). Caption under each.

**Measured.** Hero rect for all shots (`03-hero-buttons.txt`), label ink boxes
(`03-labels.txt`), Apple Pay pop/click (`03-applepay-button.txt`), cursor
(`03-applepay-cursor.txt`), grid rows (`03-grid-cells.txt`), ribbon path
(`03-copilot-ribbon.txt`), icon boxes and scales, blob radius, ring rects, band
heights, banana button rect per frame, all fills.

**Built.** Shot registry + helpers (`docs/06-recipes.md` §7). Plates only for
Mojave, grey photo, Kling, Banana. Everything else drawn.

**Differences.** Particle/star positions (APPROXIMATE), simplified brand icons,
Copilot ribbon tail shape, GPT-5 sheen.

## 04 · "But…" — 227–249 · `composition/scenes/04-but.js` · score 15.8 (worst block)

**Reference.** Hills again; giant white "But" letters fly up from below with a 1-frame
stagger, overshoot and settle; three dots pop 232/234/236; the word drifts right;
236–244 the picture desaturates; 238–249 the frame shrinks into a card with rounded
corners while its content blurs; the new scene (cream/lime) shows around it.

**Measured.** Letter columns per frame (`04-but-letters.txt`) → rise curve with
74 px overshoot, drift curve; card rect per frame; content scale/shift.

**Built.** Plates = intro footage offset 232 frames (R14). Letters placed at rest
boxes, `RISE` curve per letter start, vertical motion blur. Card = crop window +
inner scale/shift/blur + darkening (recipe §14).

**Differences.** Frames 227–232 need footage from before the intro's first frame
(not available) → plate 0 is reused; the reference's push transition at 245–249
reveals more of the next scene's colour than ours.

## 05 · Typing — 250–295 · `composition/scenes/04-but.js` · score 6.5

**Reference.** "But, what if one Button" typed in huge black letters (Medium, then
Bold for "Button") on a cream/lime gradient; the caret is the shrunken card; the
line scrolls left irregularly so the newest letter stays at the caret; scroll
motion blur; letterbox 139 px.

**Measured.** Typing events (frame → characters), caret x per frame, scroll
(`05-typing-pan.txt`), glyph boxes (`05-typing-glyphs.txt` → `REF_GLYPHS`).

**Built.** Plates `assets/plates/typing/243–295` (text and card painted out). Characters in
document space at measured boxes, screen x = doc x − pan(f), scroll blur 0.12 × v.

**Differences.** Glyph shapes (Inter vs SF); slight blur differences on fast scroll frames.

## 06–07 · Life saver + style flashes — 296–351 · `composition/scenes/06-lifesaver.js` · score 3.9

**Reference.** Creation of Adam (sepia, clouds), slow zoom-out; blue "Life saver"
button between the fingers with a light sweep (296–304). 341–351: one-to-two-frame
flashes of the same composition in other styles (stained glass, photo, comic,
coloured pencil, oil, LEGO) with the button restyled each time; the label morphs
into "Higgsfield" on 342–345.

**Measured.** Button rect per frame (`06-lifesaver-rects.txt` → `composition/data/lifesaver.json`),
button colours per style frame.

**Built.** Plates `assets/plates/creation/296–381` with the button painted out; one 670×212 button
design scaled per frame from the rect; `look(f)` table for colours/borders; two
fitted labels cross-faded; sweep gradient.

**Differences.** Style-specific button rendering (comic outline, pencil texture) is
only approximated by colour + border.

## 08 · Higgsfield — 352–381 · same file · score 1.7

**Reference.** Photoreal hands with "Higgsfield" button; 355–358 grade to b/w;
364–388 dissolve to flat `#E5E5E5`.

**Measured.** `08-higgsfield-fade.txt` (saturation collapse 352→358, texture std → 0 by 388).

**Built.** Plates carry the grade; white overlay keys 381–388; button opacity fade 364–386.

## 09 · No more endless ai subscriptions — 382–452 · `composition/scenes/09-nomore.js` · score 3.6

**Reference.** On grey paper, words reveal fast (382–391) with blur and settle,
"endless" Bold blue; a slow camera push; 402–413 a blue blob grows above
"subscriptions", wobbles and becomes a 🔥 bubble with a tail dot; 421 a cursor
flies in from bottom-left.

**Measured.** `09-nomore-words.txt`, `09-bubble.txt`, `09-cursor.txt`.

**Built.** Per-word decay (0.72–0.80), zoom 1 + 0.00145·(f−395), `BUB` track with
blob radius, emoji with overshoot scale, cursor track.

## 10 · No more unnecessary costs — 453–509 · `composition/scenes/10-costs.js` · score 4.9

**Reference.** Dark table of tilted subscription cards (blurred, chromatic
aberration). Text on an arch: "No more" white, "unnecessary" red letters of
different sizes, "costs" white; the arch tightens 453–491; a grabbing cursor at the
top; 493–509 everything whips left.

**Measured.** Components of red/white letters on 453 and 497
(`10-costs-*.txt`) → `composition/data/costs.json` poses; exit offsets.

**Built.** Plates `assets/plates/costs/453–509` (letters + cursor painted out by circles).
Each glyph a 200×200 box centred on its ink centre, pose a→b with cubic
progress, white letters with red/cyan text-shadow; group exit with blur.

**Differences.** Letter rotations were estimated by eye; red letter weight.

## 11 · Pay once, And done (: — 510–559 · `composition/scenes/11-payonce.js` · score 4.0

**Reference.** Grey paper; cursor flies in (510); "Pay" (512) "once," (514); the
cursor paints a blue brush swoosh under "Pay once," (513–531); "And done (:" pops
in Bold blue (536–538); camera dives in with zoom blur (540–559).

**Measured.** `11-payonce-dark.txt`, `11-payonce-blue.txt` → word boxes, swoosh
end per frame, zoom per frame from text width, drop.

**Built.** Words with small slide + blur-in, swoosh = filled SVG brush revealed by
`clip-path`, cursor track, `ZOOM`/`DROP` camera, zoom blur 556–559.

## 12–13 · Video / Voice — 560–600 · `composition/scenes/12-features.js` · score 2.1

**Reference.** "Video" Bold inside a rotating ring of thumbnails (lifted), the ring
squashes into a player; "Voice" letters drop in one by one; the player pill
(Adam / Brooding, Dark / Select voice) stretches and squashes; zoom blur out.

**Measured.** Title geometry per frame, pill rect per frame (`12-voice-pill.txt`),
title cap-top per frame (`12-voice-title.txt`).

**Built.** Plates for the ring; title track in `composition/data/titles.js`; player drawn
(pill, play circle, texts, blue button) inside a group scaled by `SQ`; letters as
spans of one fitted word, each dropping with a damped cosine.

## 14–15 · Image / Motion — 601–645 · score 3.2

**Reference.** Photos fly in (3D) around "Image" (601–616); a green flash whip
(616–619); "Motion" white on a black card with a keyhole photo, collage around it,
slow parallax.

**Built.** Plates carry Image and the whip (title kept in plate, D20); "Motion"
drawn from 622 on from the title track over plates with the title painted out.

## 16 · Pure Creation — 646–690 · score 1.9

**Built.** "Motion" fades out while "Creation" (Bold) and "Pure" (italic) fade in on
the same card; title track; everything dissolves to grey by 690.

## 17 · Logo build — 691–759 · `composition/scenes/17-logo.js` · score 1.7

**Reference.** A 1-px vertical line grows (692–700), widens into a dark rounded
plaque (700–730) that reveals the lime Higgsfield squiggle; "All · in · one · place."
appear word by word under it and slide together; "place." lime.

**Measured.** `17-logo-mark.txt`, `17-logo-words.txt`, colours (`#161616`, `#AAD71C`).

**Built.** `MARK` rect keys, `overflow:hidden` plaque, squiggle stroke-dashoffset
700–716, per-word `[left, right]` keys.

## 18 · Lockup + fade — 760–869 · score 1.9

**Reference.** Background to black (754–780); the mark inverts (lime plaque, dark
squiggle) while shrinking to the left and blurring; "Higgsfield" wordmark blurs in;
the tagline moves under it; hold; fade to black 822–869.

**Built.** `mix` colour cross-fade + blur on the mark, wordmark blur-in, `TAG`
transform, root opacity from max luma (`18-fade.txt`).
