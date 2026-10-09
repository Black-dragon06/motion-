# Higgsfield — «One Button» · motion-video recreation

Покадровое пересоздание референсного промо-ролика кодом (HTML/CSS/SVG/JS-таймлайн → Playwright → ffmpeg).

* **Бриф motion-дизайнера:** [`BRIEF.md`](BRIEF.md) — тайм-карта, шот-лист, палитра, типографика, easing, покадровый разбор каждой сцены.
* **Результат:** `out/higgsfield_one_button.mp4` — 1920×1080, 30 fps, 870 кадров (29.0 с), со звуком.
* **Сверка:** `out/compare_side_by_side.mp4` — референс сверху, пересоздание снизу, с номером кадра.
* **Референс:** `reference/reference.mp4`.

## Быстрый старт

```bash
npm install            # playwright (Chromium уже должен быть установлен: npx playwright install chromium)
npm run preview        # интерактивный превью-плеер: http://localhost:8080/composition/index.html  (← → — по кадру, пробел — play)
npm run render         # out/higgsfield_one_button.mp4 (1080p + звук)
npm run render:720     # 720p
node scripts/render.mjs --from 99 --to 226 --frames out/frames   # JPG-кадры диапазона для QA
```

Требуется: Node 18+, ffmpeg, Python 3 + numpy + Pillow (только для пересборки плейтов: `npm run plates`).

## Как устроено

* `composition/scenes/*.js` — по файлу на блок ролика; каждая сцена — функция `update(frame)`, поэтому любой кадр рендерится независимо и детерминированно.
* Вся графика (текст, кнопки, UI, курсор, иконки, логотип, частицы, переходы) нарисована кодом.
* Фото/AI-футаж референса (пейзаж, пустыня, «Сотворение Адама», коллажи и т. п.) кодом не сгенерировать — он вырезан из референса в `assets/plates/` с закрашенной поверх графикой (`scripts/extract_plates.py`) и может быть заменён исходниками в высоком разрешении.
* Тайминги и траектории сняты с референса покадрово (`composition/data/`).
