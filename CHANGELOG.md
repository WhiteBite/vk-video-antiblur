# Changelog

Все заметные изменения проекта документируются здесь.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [SemVer](https://semver.org/lang/ru/).

## [1.0.0] - 2026-08-25

### Добавлено

- Юзерскрипт `vk-video-antiblur.user.js`: снятие `filter: blur()` с превью и скрытие оверлея возрастного ограничения на vkvideo.ru и vk.com.
- Трёхслойная архитектура: статичный CSS по `data-testid`, детект блюра по computed-стилю через MutationObserver (не зависит от хэш-классов `vkit-*`), периодический sweep с O(1)-пропуском обработанных изображений.
- Страховка от переименования testid: скрытие оверлея по `backdrop-filter: blur` + тексту возрастного ограничения.
- Расширение Manifest V3 (`extension/`): единая кодовая база с юзерскриптом, `content.js` генерируется автоматически.
- CI: проверка синтаксиса, валидация манифеста, контроль синхронизации версий и `content.js`.
- CD: релизы по тегам `v*` — ZIP расширения и юзерскрипт прикрепляются к GitHub Release.

### Исправлено

- Слепая зона sweep'а при реюзе DOM-узлов React'ом: убрано гейтирование по флагу dirty, observer теперь следит и за атрибутами `class`/`style`.

[1.0.0]: https://github.com/WhiteBite/vk-video-antiblur/releases/tag/v1.0.0
