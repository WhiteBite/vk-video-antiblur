// ==UserScript==
// @name         VK Video AntiBlur — превью 18+ без размытия
// @namespace    https://github.com/WhiteBite/vk-video-antiblur
// @version      1.0.0
// @description  Убирает размытие превью и скрывает оверлей возрастного ограничения на VK Видео и vk.com. Детектирует блюр по computed-стилю, поэтому не ломается при смене хэш-классов VK.
// @author       WhiteBite
// @license      MIT
// @homepageURL  https://github.com/WhiteBite/vk-video-antiblur
// @supportURL   https://github.com/WhiteBite/vk-video-antiblur/issues
// @downloadURL  https://raw.githubusercontent.com/WhiteBite/vk-video-antiblur/main/vk-video-antiblur.user.js
// @updateURL    https://raw.githubusercontent.com/WhiteBite/vk-video-antiblur/main/vk-video-antiblur.user.js
// @match        *://vkvideo.ru/*
// @match        *://*.vkvideo.ru/*
// @match        *://vk.com/*
// @match        *://*.vk.com/*
// @match        *://vk.ru/*
// @match        *://*.vk.ru/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    var STYLE_ID = 'vk-video-antiblur-style';
    var SWEEP_INTERVAL_MS = 3000;

    /**
     * Слой 1 — статичный CSS.
     * Оверлей возрастного ограничения имеет стабильный data-testid
     * (второй селектор — вариант с опечаткой из старых сборок VK, оставлен для совместимости).
     */
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent =
            '[data-testid="video_card_restriction_overlay"],' +
            '[data-testid="video_card_resctriction_overlay"]{' +
                'display:none!important;' +
            '}';
        (document.head || document.documentElement).appendChild(style);
    }

    /**
     * Слой 2 — снятие блюра с превью.
     * VK применяет filter: blur(8px) через хэш-классы (vkit-*), имена которых меняются
     * от сборки к сборке, а сами правила лежат в кросс-доменных стилях и недоступны
     * для сканирования. Поэтому блюр детектируется по вычисленному стилю элемента —
     * это не зависит от имён классов.
     */
    function deblurImage(img) {
        var filter;
        try {
            filter = getComputedStyle(img).filter;
        } catch (e) {
            return;
        }
        if (filter && filter !== 'none' && filter.indexOf('blur') !== -1) {
            img.style.setProperty('filter', 'none', 'important');
            img.style.setProperty('-webkit-filter', 'none', 'important');
        }
    }

    /**
     * Страховка на случай, если VK переименует data-testid оверлея:
     * прячем любой элемент с backdrop-filter: blur, содержащий текст возрастного ограничения.
     */
    function hideRestrictionOverlay(el) {
        var cs, backdrop;
        try {
            cs = getComputedStyle(el);
            backdrop = cs.backdropFilter || cs.webkitBackdropFilter || '';
        } catch (e) {
            return;
        }
        if (
            backdrop.indexOf('blur') !== -1 &&
            /возрастн|для взрослых|18\+/i.test(el.textContent || '')
        ) {
            el.style.setProperty('display', 'none', 'important');
        }
    }

    function scanWithin(root) {
        var i, nodes;
        if (!root || root.nodeType !== 1) return;

        if (root.tagName === 'IMG') deblurImage(root);

        if (root.querySelectorAll) {
            nodes = root.querySelectorAll('img');
            for (i = 0; i < nodes.length; i++) deblurImage(nodes[i]);

            nodes = root.querySelectorAll('[data-testid]');
            for (i = 0; i < nodes.length; i++) hideRestrictionOverlay(nodes[i]);
        }
    }

    /**
     * Слой 3 — периодический sweep. Покрывает случаи, когда React переиспользует
     * DOM-узел и меняет ему класс без добавления новых узлов (MutationObserver
     * такое не ловит). Флаг dirty не даёт гонять скан впустую на статичной странице.
     */
    var dirty = true;

    function fullSweep() {
        if (!document.body) return;
        scanWithin(document.body);
    }

    var observer = new MutationObserver(function (mutations) {
        dirty = true;
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                if (added[j].nodeType === 1) scanWithin(added[j]);
            }
        }
    });

    function start() {
        injectStyle();
        fullSweep();
        observer.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(function () {
            if (!dirty) return;
            dirty = false;
            fullSweep();
        }, SWEEP_INTERVAL_MS);
    }

    if (document.documentElement) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
