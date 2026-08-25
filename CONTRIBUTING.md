# Участие в проекте

PR и issue приветствуются.

## Главное правило

Единый источник логики — `vk-video-antiblur.user.js`.
`extension/content.js` **генерируется** из тела юзерскрипта (всё после строки `// ==/UserScript==`) и не редактируется вручную — CI проверяет синхронизацию и упадёт при рассинхроне.

После изменения `.user.js` перегенерируйте контент-скрипт:

```powershell
$lines = Get-Content vk-video-antiblur.user.js
$marker = ($lines | Select-String -Pattern '^// ==/UserScript==$' | Select-Object -First 1).LineNumber
$body = $lines[$marker..($lines.Count - 1)] -join "`n"
[System.IO.File]::WriteAllText("$PWD\extension\content.js", $body + "`n", (New-Object System.Text.UTF8Encoding $false))
```

## Проверки перед PR

1. `node --check vk-video-antiblur.user.js` и `node --check extension/content.js` — без ошибок.
2. Версии совпадают: `@version` в юзерскрипте = `version` в `extension/manifest.json`.
3. Желательно: живая проверка на vkvideo.ru — превью размыты до и чисты после.

## Релизы

Релизит мейнтейнер: тег `vX.Y.Z` → GitHub Actions проверяет совпадение версий, собирает ZIP расширения и публикует GitHub Release.
