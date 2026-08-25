# VK Video AntiBlur

![VK Video AntiBlur — убрать блюр с превью VK Видео, userscript и расширение](docs/social-preview.png)

[![Версия](https://img.shields.io/github/v/tag/WhiteBite/vk-video-antiblur)](https://github.com/WhiteBite/vk-video-antiblur/releases)
[![CI](https://github.com/WhiteBite/vk-video-antiblur/actions/workflows/ci.yml/badge.svg)](https://github.com/WhiteBite/vk-video-antiblur/actions/workflows/ci.yml)
[![Лицензия: MIT](https://img.shields.io/github/license/WhiteBite/vk-video-antiblur)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/WhiteBite/vk-video-antiblur)](https://github.com/WhiteBite/vk-video-antiblur/commits/main)

Юзерскрипт и браузерное расширение, которое убирает блюр вк видео — снимает размытие превью 18+ и скрывает оверлей «Видео с возрастным ограничением» на vkvideo.ru и vk.com. Если вас раздражает размытие превью, этот инструмент решает проблему без настроек и галочек.

## Быстрая установка

1. Установите менеджер юзерскриптов: [Tampermonkey](https://www.tampermonkey.net/) или [Violentmonkey](https://violentmonkey.github.io/).
2. Нажмите **[Установить скрипт](https://raw.githubusercontent.com/WhiteBite/vk-video-antiblur/main/vk-video-antiblur.user.js)**.
3. Подтвердите установку в окне менеджера скриптов. Готово.

Обновления приходят автоматически через `@updateURL` при выходе новой версии.

## Расширение для браузера

Репозиторий также содержит готовое расширение Manifest V3 (`extension/`), протестированное на Chrome for Testing.

**Сборка из исходников:** откройте `chrome://extensions`, включите режим разработчика, нажмите «Загрузить распакованное» и выберите папку `extension/`.

**Готовый файл:** скачайте `vk-video-antiblur-extension-v1.0.0.zip` со страницы Releases, распакуйте и установите тем же способом.

Версия расширения и юзерскрипта совпадает — это одна кодовая база.

## Что делает

- Снимает `filter: blur()` с миниатюр видео на страницах видео, в рекомендациях и поиске.
- Скрывает оверлей возрастного ограничения, закрывающий превью в плеере.
- Работает с бесконечным скроллом и SPA-навигацией без перезагрузки страницы.

## Чего НЕ делает

- Не обходит серверную проверку возраста при воспроизведении. Если VK требует вход в аккаунт 18+ для просмотра, скрипт этого не меняет. Он убирает только визуальное размытие превью.
- Не скачивает видео.
- Не блокирует рекламу.

## FAQ

### Как убрать блюр в превью ВК Видео?

Установите юзерскрипт через Tampermonkey по ссылке выше или добавьте расширение из Releases. Скрипт работает сразу после установки, никаких дополнительных настроек не требуется.

### Почему размыты превью всех видео 18+ в ВК?

VK убрал из настроек галочку «Не размывать превью». Теперь миниатюры всех видео с пометкой 18+ размыты всегда, включая обычные фильмы. Скрипт возвращает превью к прежнему виду, снимая CSS-фильтр размытия.

### ВК убрали галочку в настройках — что делать?

Ничего. Скрипт не зависит от настроек пользователя. Он перехватывает размытие на уровне DOM, поэтому исчезновение опции в интерфейсе VK не влияет на его работу.

### Работает ли на мобильных устройствах?

Firefox Android поддерживает Tampermonkey, поэтому юзерскрипт будет работать там. Chrome на мобильных устройствах не поддерживает юзерскрипты, и нативного мобильного расширения пока нет.

### Это безопасно?

Да. Скрипт распространяется под лицензией MIT, объём кода около 150 строк, всё можно проверить. Он не собирает данные, не отправляет сетевых запросов и не использует привилегий браузера. Единственное, что он делает, — читает и модифицирует стили элементов на странице, где вы уже находитесь.

### Чем этот скрипт отличается от аналогов?

См. таблицу ниже. Коротко: большинство конкурентов полагаются на CSS-селекторы с хэш-классами VK, которые ломаются при каждом обновлении платформы. Наш скрипт детектирует блюр по computed-стилю, поэтому ему всё равно, как называются классы.

## Сравнение с аналогами

| Параметр | VK Video AntiBlur (этот проект) | VK Blur Remover (ULTIMATE v2) | блюру.нет |
|---|---|---|---|
| Метод обнаружения блюра | Computed-style детекция (`getComputedStyle`) | CSS-селекторы (`img[class*="blur"]`) | `filter: none` на ВСЕХ `<img>` |
| Механизм реактивности | MutationObserver + interval sweep | Только CSS-впрыскивание | Только CSS-впрыскивание |
| Устойчивость к пересборкам VK | Да, не зависит от имён классов | Нет, селекторы ломаются | Нет, ломается при смене структуры |
| Скрытие оверлея 18+ | По стабильному `data-testid` + fallback по тексту | Опечатка в селекторе (`video_card_resctriction_overlay`) | Нет |
| Последнее обновление | 2026 | Сломан (опечатка в селекторе) | Февраль 2025 |
| Лицензия | MIT | Не указана | Не указана |

Все конкуренты используют CSS-селекторы, привязанные к хэш-классам вида `vkit-*`, которые меняются между сборками VK. Это фундаментальная проблема подхода: имена классов генерируются динамически, а правила лежат в кросс-доменных стилях CDN, недоступных для сканирования.

## Как это работает

Скрипт не угадывает имена CSS-классов VK. Вместо этого применяется трёхуровневая архитектура:

**Слой 1 — статичный CSS.** Оверлей возрастного ограничения прячется по стабильному атрибуту `data-testid="video_card_restriction_overlay"`. Второй селектор с опечаткой оставлен для совместимости со старыми сборками VK.

**Слой 2 — computed-style детекция через MutationObserver.** При каждом изменении DOM скрипт проверяет каждое добавленное изображение: если вычисленный `filter` содержит `blur()`, ставится инлайн-переопределение `filter: none !important`. Этот подход побеждает любой класс, потому что `!important` имеет высший приоритет среди стилей.

**Слой 3 — периодический sweep.** Раз в 3 секунды скрипт проходит по всей странице и догоняет случаи, когда React переиспользует существующий узел и меняет ему класс без добавления новых узлов. Sweep работает дёшево: функция `isAlreadyDeblurred` проверяет наличие инлайн-оверрайда за O(1) без вызова `getComputedStyle`, поэтому на статичной странице полный проход сводится к чтению свойств элемента.

Дополнительная страховка: если VK переименует `data-testid` оверлея, элемент всё равно скроется по комбинации `backdrop-filter: blur` + текст про возрастное ограничение.

## Совместимость

**Домены:**
- `vkvideo.ru` (включая `live.vkvideo.ru`) — проверено
- `vk.com`, `vk.ru` — матчи заложены на случай встроенных плееров; сам раздел `vk.com/video` сейчас редиректит на `vkvideo.ru`

**Браузеры:**
- Chrome, Firefox, Edge, Opera, Safari — через Tampermonkey или Violentmonkey
- Chrome, Firefox — как нативное расширение Manifest V3

## Для разработчиков

- `extension/content.js` автоматически генерируется из тела юзерскрипта (`vk-video-antiblur.user.js`). CI проверяет, что файлы синхронизированы.
- CI-пайплайн валидирует синтаксис JavaScript, версию в манифете и соответствие тегу релиза.
- Релизы собираются GitHub Actions по тегам формата `v*`: создаётся ZIP-архив расширения и прикрепляется к GitHub Release.

## Лицензия

[MIT License](LICENSE) — можете использовать, модифицировать и распространять свободно.

## English

**VK Video AntiBlur** removes the 18+ preview blur on VK Video and hides the age-restriction overlay. It works as a userscript (Tampermonkey / Violentmonkey) or as a native browser extension (Manifest V3).

**Install:** [Click to install the userscript](https://raw.githubusercontent.com/WhiteBite/vk-video-antiblur/main/vk-video-antiblur.user.js)

**Extension:** A pre-packaged Manifest V3 extension is available in the `extension/` folder and as a ZIP download from [Releases](https://github.com/WhiteBite/vk-video-antiblur/releases). Install via `chrome://extensions` → Developer mode → Load unpacked.

**Why it's different:** Unlike most alternatives that rely on CSS selectors targeting VK's hashed class names (`vkit-*`), this script detects blur through `getComputedStyle`. That makes it immune to VK's per-build class name changes and cross-origin stylesheet obfuscation. It also includes a MutationObserver for live content and an O(1) sweep for edge cases.

No data collection. No network requests. ~150 lines of auditable code. Licensed under [MIT](LICENSE).
