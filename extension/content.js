
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
    /**
     * Дешёвая проверка «мы уже починили этот img»: инлайн-оверрайд с !important
     * имеет высший приоритет и не может быть перебит классом. Позволяет sweep'у
     * пропускать обработанные изображения без getComputedStyle (без style recalc).
     */
    function isAlreadyDeblurred(img) {
        return img.style.getPropertyValue('filter') === 'none' &&
               img.style.getPropertyPriority('filter') === 'important';
    }

    function deblurImage(img) {
        if (isAlreadyDeblurred(img)) return;
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
     * Слой 3 — периодический sweep. Страховка на случаи, которые observer мог
     * пропустить. Работает безусловно, но дёшево: isAlreadyDeblurred отсекает
     * обработанные изображения за O(1) без style recalculation, поэтому на
     * статичной странице полный проход — просто чтение инлайн-свойств.
     */
    function fullSweep() {
        if (!document.body) return;
        scanWithin(document.body);
    }

    /**
     * Observer следит и за childList (новые узлы), и за class/style на существующих —
     * это ловит реюз DOM-узлов React'ом (смена класса без добавления узлов),
     * устраняя окно до следующего sweep. attributeFilter ограничивает шум.
     */
    var observer = new MutationObserver(function (mutations) {
        try {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type === 'childList') {
                    var added = m.addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        if (added[j].nodeType === 1) scanWithin(added[j]);
                    }
                } else if (m.type === 'attributes' && m.target.tagName === 'IMG') {
                    deblurImage(m.target);
                }
            }
        } catch (e) {
            // observer не должен умирать из-за одной неудачной мутации
        }
    });

    function start() {
        injectStyle();
        fullSweep();
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        setInterval(fullSweep, SWEEP_INTERVAL_MS);
    }

    if (document.documentElement) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
