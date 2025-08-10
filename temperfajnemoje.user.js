// ==UserScript==
// @name         KeyDropBot - wersja połączona finalna + kliknięcia zamiast usuwania (optymalizacja CPU)
// @namespace    https://key-drop.com
// @version      0.1
// @description  Giveaway + UI cleanup + CPU optymalizacja + kliknięcia zamiast usuwania wybranych elementów
// @match        https://key-drop.com/pl/giveaways*
// @match        https://key-drop.com/pl/giveaways/list
// @match        https://key-drop.com/pl/giveaways/list/
// @updateURL    https://raw.githubusercontent.com/Hardelan/tamperfajnemoje/main/temperfajnemoje.user.js
// @downloadURL  https://raw.githubusercontent.com/Hardelan/tamperfajnemoje/main/temperfajnemoje.user.js
// @grant        none
// ==/UserScript==
(async function () {
    'use strict';

    const totalTimeLimit = 165000;
    const scriptStart = Date.now();

    const classSetsToRemove = [
        ['z-50', 'flex', '!overflow-x-hidden', 'bg-navy-900', 'backdrop-blur-[3px]', '!scrollbar-thin', '!scrollbar-track-[#23232d]', '!scrollbar-thumb-[#ffcb77]', 'scrollbar-w-[5px]', 'lg:bg-opacity-95'],
        ['flex', 'flex-wrap', 'gap-[var(--gap)]', 'md:ml-auto', 'md:items-center', 'lg:flex-nowrap', 'lg:gap-[calc(var(--gap)*2)]'],
        ['flex', 'h-[99px]', 'flex-row', 'items-center', 'gap-2.5', 'overflow-hidden', 'bg-navy-700', '3xl:h-[114px]'],
        ['container', 'flex', 'justify-evenly', 'gap-2', 'py-6', 'sm:gap-12', 'lg:justify-center', 'lg:py-9']
    ];

    function hasAllClasses(el, classes) {
        return classes.every(c => el.classList.contains(c));
    }

    async function tryRemoveElements() {
        const candidates = document.querySelectorAll('div, ul');
        for (const el of candidates) {
            for (const classSet of classSetsToRemove) {
                if (hasAllClasses(el, classSet)) {
                    el.remove();
                    break;
                }
            }

            // SPECJALNY PRZYPADEK 1: overlay modal z zielonym przyciskiem
            if (hasAllClasses(el, [
                'fixed', 'bottom-0', 'left-0', 'right-0', 'top-0', 'z-50', 'flex', 'items-center', 'overflow-auto', 'backdrop-filter-none'
            ])) {
                setTimeout(async () => {
                    const specialBtn = document.querySelector('button.bg-\\[\\#18331F\\].text-\\[\\#77FF9D\\]');
                    if (specialBtn) {
                        specialBtn.click();
                        await new Promise(r => setTimeout(r, 20000));
                        window.location.replace("https://key-drop.com/pl/giveaways/list/");
                    }
                }, 3000);
            }
        }

        const participantsSection = document.getElementById('giveaway-participants-section');
        if (participantsSection) participantsSection.remove();

        const dialog = document.getElementById('headlessui-dialog-:r1n1:');
        if (dialog) dialog.remove();

        // SPECJALNY PRZYPADEK 2: special_case_modal
        const specialCaseModal = document.querySelector('div[data-testid="special_case_modal"]');
        if (specialCaseModal) {
            setTimeout(async () => {
                const closeBtn = document.querySelector('button.absolute.right-4.top-4.bg-navy-500');
                if (closeBtn) {
                    closeBtn.click();
                    await new Promise(r => setTimeout(r, 5000));
                }
            }, 3000);
        }
    }

    // Harmonogram zamiast MutationObserver
    function scheduleChecks() {
        let startTime = Date.now();
        let interval = setInterval(() => {
            let elapsed = Date.now() - startTime;

            if (elapsed <= 20000) {
                tryRemoveElements();
            } else {
                clearInterval(interval);
                let extraRuns = 0;
                let extraInterval = setInterval(() => {
                    tryRemoveElements();
                    extraRuns++;
                    if (extraRuns >= 10) {
                        clearInterval(extraInterval);
                    }
                }, 5000);
            }
        }, 3000);
    }

    window.addEventListener('load', () => {
        tryRemoveElements();
        scheduleChecks();
    });

    try {
        const h1 = document.querySelector('h1');
        if (h1 && ["Error 429", "Internal Server Error"].includes(h1.textContent.trim())) {
            setTimeout(() => window.location.replace("https://key-drop.com/pl/giveaways/list/"), 3000);
            return;
        }

        const refreshButton = Array.from(document.querySelectorAll('button span'))
            .find(el => el.textContent.trim() === "Odśwież");
        if (refreshButton) {
            setTimeout(() => window.location.replace("https://key-drop.com/pl/giveaways/list/"), 3000);
            return;
        }

        const maxWaitTime = 140000;
        const offset = 1000 * (1 + Math.random());
        const start = Date.now();

        let joinButton = null;
        while (Date.now() - start < maxWaitTime) {
            const btns = document.getElementsByClassName("button px-2 xl:px-3.5 button-light-gold h-11 w-full rounded bg-navy-500 text-base font-semibold leading-tight text-white transition-all hover:bg-navy-400");
            if (btns.length > 0) {
                joinButton = btns[btns.length - 1];
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (joinButton) joinButton.click();

        let price = null;
        while (Date.now() - start < maxWaitTime) {
            const priceEl = document.querySelector('[data-testid="case-roll-won-item-price"]');
            if (priceEl) {
                price = parseFloat(priceEl.innerText.replace(/[^\d.,]/g, '').replace(',', '.'));
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!price || price >= 150) setTimeout(() => window.location.replace("https://key-drop.com/pl/giveaways/list/"), 3000);

        if (price >= 1) {
            const subStart = Date.now();
            while (Date.now() - subStart < 4000) {
                await new Promise(r => setTimeout(r, offset));
                const confirmBtn = document.getElementsByClassName("button h-13 w-full whitespace-nowrap rounded-md bg-[#D6FF6F] px-10 text-left text-xs font-bold uppercase leading-none text-navy-900 disabled:bg-dark-navy-300 disabled:text-navy-200")[0];
                if (confirmBtn) {
                    confirmBtn.click();
                    break;
                }
            }
        }

        await waitAndExit();

    } catch (err) {
        window.location.replace("https://key-drop.com/pl/giveaways/list/");
    }

    async function waitAndExit() {
        const remaining = 172000 - (Date.now() - scriptStart);
        if (remaining > 0) {
            await new Promise(r => setTimeout(r, remaining));
        }
        window.location.replace("https://key-drop.com/pl/giveaways/list/");
    }

})();
