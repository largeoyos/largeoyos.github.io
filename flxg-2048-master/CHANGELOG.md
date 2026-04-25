# Changelog

## 2026-04-05
- Changed board size from 4x4 to 5x5.
- Updated game initialization in `js/application.js` from `GameManager(4, ...)` to `GameManager(5, ...)`.
- Updated grid markup in `index.html` to render 5 rows with 5 cells each.
- Updated tile placement logic in `js/html_actuator.js` to position tiles by grid cell pixel offsets, so all 5x5 positions render correctly.
- Updated board/tile dimensions in `style/main.css` (desktop and mobile) so 5 columns fit inside the game container.
