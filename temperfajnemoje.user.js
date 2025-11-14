// ==UserScript==
// @name         KeyDropBot - wersja połączona finalna + kliknięcia zamiast usuwania (optymalizacja CPU)
// @namespace    https://key-drop.com
// @version      7.13
// @description  Giveaway + UI cleanup + CPU optymalizacja + kliknięcia zamiast usuwania wybranych elementów
// @match        https://key-drop.com/pl/giveaways/keydrop/*
// @match        https://key-drop.com/pl/giveaways/list/
// @updateURL    https://raw.githubusercontent.com/Hardelan/tamperfajnemoje/main/temperfajnemoje.user.js
// @downloadURL  https://raw.githubusercontent.com/Hardelan/tamperfajnemoje/main/temperfajnemoje.user.js
// @grant        none
// ==/UserScript==
(async function () {
    'use strict';
    const classSetsToRemove = [
        ['avatar-grid', 'relative', 'z-0', 'mx-auto', 'grid', 'max-w-screen-2xl', 'grid-flow-dense', 'content-center', 'items-center', 'justify-center', 'gap-1.5', 'css-x6g6rf'],
        ['z-50', 'flex', '!overflow-x-hidden', 'bg-navy-900', 'backdrop-blur-[3px]', '!scrollbar-thin', '!scrollbar-track-[#23232d]', '!scrollbar-thumb-[#ffcb77]', 'scrollbar-w-[5px]', 'lg:bg-opacity-95'],
        ['fixed', 'bottom-0', 'left-0', 'right-0', 'top-0', 'z-50', 'flex', 'items-center', 'overflow-auto', 'backdrop-filter-none'],
        ['flex', 'flex-wrap', 'gap-[var(--gap)]', 'md:ml-auto', 'md:items-center', 'lg:flex-nowrap', 'lg:gap-[calc(var(--gap)*2)]'],
        ['flex', 'h-[99px]', 'flex-row', 'items-center', 'gap-2.5', 'overflow-hidden', 'bg-navy-700', '3xl:h-[114px]'],
        ['container', 'flex', 'justify-evenly', 'gap-2', 'py-6', 'sm:gap-12', 'lg:justify-center', 'lg:py-9']
    ];

    function hasAllClasses(el, classes) {
        return classes.every(c => el.classList.contains(c));
    }

    function tryRemoveElements() {
        const candidates = document.querySelectorAll('div, ul');
        for (const el of candidates) {
            for (const classSet of classSetsToRemove) {
                if (hasAllClasses(el, classSet)) {
                    el.remove();
                    break;
                }
            }
        }

        const participantsSection = document.getElementById('giveaway-participants-section');
        if (participantsSection) participantsSection.remove();

        const dialog = document.getElementById('headlessui-dialog-:r1n1:');
        if (dialog) dialog.remove();

        const specialCaseModal = document.querySelector('div[data-testid="special_case_modal"]');
        if (specialCaseModal) specialCaseModal.remove();
    }

    let mutationTimeout = null;
    const observer = new MutationObserver(() => {
        if (mutationTimeout) return;
        mutationTimeout = setTimeout(() => {
            tryRemoveElements();
            mutationTimeout = null;
        }, 2000);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('load', () => {
        tryRemoveElements();
    });

    try {
        const h1 = document.querySelector('h1');
        if (h1 && ["Error 429", "Internal Server Error"].includes(h1.textContent.trim())) {
            setTimeout(() => location.reload(), 3000);
        }

        const refreshButton = Array.from(document.querySelectorAll('button span'))
            .find(el => el.textContent.trim() === "Odśwież");
        if (refreshButton) {
            setTimeout(() => location.reload(), 3000);
        }

        const maxWaitTime = 140000;
        const start = Date.now();

        let joinButton = null;
        while (Date.now() - start < maxWaitTime) {
            const btns = document.getElementsByClassName("button px-2 xl:px-3.5 button-light-gold h-11 w-full rounded bg-navy-500 text-base font-semibold leading-tight text-white transition-all hover:bg-navy-400");
            if (btns.length > 0) {
                joinButton = btns[btns.length - 1];
                break;
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        if (joinButton) joinButton.click();
        else { location.reload(); return; }

        const confirmClass = "button h-13 w-full whitespace-nowrap rounded-md bg-[#D6FF6F] px-10 text-left text-xs font-bold uppercase leading-none text-navy-900 disabled:bg-dark-navy-300 disabled:text-navy-200";
        const confirmWaitStart = Date.now();

        while (Date.now() - confirmWaitStart < 40000) {
            const candidates = document.getElementsByClassName(confirmClass);
            if (candidates.length > 0) {
                await new Promise(r => setTimeout(r, 1000));
                const inner = document.querySelector('span.text-navy-400');
                const containerText = inner && inner.parentElement ? inner.parentElement.textContent.toLowerCase() : '';

                const isAmateur = containerText.includes('amateur');

                if (isAmateur) {
                    const confirmBtn = candidates[0];

                    // --- DODANE: sprawdzanie ceny + losowa decyzja wg progów ---
                    const priceEl = document.querySelector('.mt-2.min-w-\\[200px\\].rounded.bg-gold-800.py-2\\.5.text-center.text-base.font-semibold.leading-none.text-gold-400');
                    if (!priceEl) {
                        location.replace("https://key-drop.com/pl/giveaways/list/");
                        break;
                    }

                    // Parsowanie wartości (np. "34,50 zł")
                    const rawPrice = priceEl.textContent || '';
                    const numMatch = rawPrice.match(/[\d,.]+/);
                    const price = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : NaN;

                    if (Number.isNaN(price)) {
                        location.replace("https://key-drop.com/pl/giveaways/list/");
                        break;
                    }

                    // Losowa liczba 1–100
                    const roll = Math.floor(Math.random() * 100) + 1;

                    // Wyznaczenie szansy wg widełek
                    let chance = 0;
                    if (price > 60) chance = 100;
                    else if (price >= 32 && price < 60) chance = 100;
                    else if (price >= 29 && price < 32) chance = 30;
                    // poza zakresem — domyślnie 0% (brak dołączenia)

                    if (chance === 100 || roll > (100 - chance)) {
                        if (confirmBtn) confirmBtn.click();
                    } else {
                        return;
                    }
                    // --- KONIEC DODANEGO KODU ---
                } else {
                    location.replace("https://key-drop.com/pl/giveaways/list/");
                }
                break; // tylko jeden check po znalezieniu confirm
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        return;

    } catch (err) {
        return;
    }

})();
