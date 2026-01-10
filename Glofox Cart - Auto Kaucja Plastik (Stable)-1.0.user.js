// ==UserScript==
// @name         Glofox Cart - Auto Kaucja Plastik (Stable)
// @namespace    glofox
// @version      1.0
// @description  Po dodaniu produktu z kaucją (np. woda) otwiera modal i dodaje Kaucja plastik.
// @match        https://app.glofox.com/*
// @run-at       document-idle
// @grant        none
// @author       Ariel Kuźmiński (ariel.kuzminski@gmail.com)
// @github       https://github.com/arielkuzminski/glofox-autokaucja
// ==/UserScript==

(function () {
  'use strict';

  /**
   * Konfiguracja:
   * - PRODUCTS_REQUIRING_DEPOSIT_CODES: lista kodów kreskowych produktów z kaucją.
   * - DEPOSIT_*: identyfikacja produktu kaucji w wyszukiwarce.
   */
  const PRODUCTS_REQUIRING_DEPOSIT_CODES = [
    "5000112679519",
    "5000112680195",
    "5000112679540"
  ];

  const DEPOSIT_PRODUCT_ID = "691f424189fc5b95160404b7"; // kaucja plastik
  const DEPOSIT_QUERY = "kaucja";
  const DEPOSIT_NAME_FALLBACK = /kaucja plastik/i;

  /** Debounce i blokada operacji. */
  let lastTriggeredAt = 0;
  let isAddingDeposit = false;
  let lastReminderAt = 0;

  /** @param {number} ms */
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  /** @returns {boolean} */
  function isCartPage() {
    return (location.hash || "").includes("/cart");
  }

  /** @returns {Element|null} */
  function getModal() {
    return document.querySelector('[data-testid="modal-content"]');
  }

  /** @returns {boolean} */
  function isSelectItemModalOpen() {
    const modal = getModal();
    return modal && modal.innerText.includes("Wybierz artykuł");
  }

  /** @returns {HTMLInputElement|null} */
  function getSearchInput() {
    const modal = getModal();
    if (!modal) return null;
    return modal.querySelector('input[placeholder="Nazwa artykułu"]');
  }

  /** @returns {Element[]} */
  function getResults() {
    const modal = getModal();
    if (!modal) return [];
    return [...modal.querySelectorAll('.searchResult')];
  }

  /** @param {Element} resultEl @returns {string} */
  function getItemName(resultEl) {
    return (resultEl.querySelector('.itemName')?.innerText || '').trim();
  }

  /** @returns {boolean} */
  function isDepositInCart() {
    const items = document.querySelectorAll('[data-testid^="cart_line_item_"] h4');
    for (const item of items) {
      const text = (item.innerText || "").trim();
      if (/kaucja/i.test(text)) return true;
    }
    return false;
  }

  /**
   * Sprawdza, czy nazwa zawiera któryś z kodów.
   * @param {string} str
   * @param {string[]} codes
   * @returns {boolean}
   */
  function matchesAnyCode(str, codes) {
    return codes.some(code => str.includes(code));
  }

  /**
   * Ustawia wartość inputa tak, by UI wykryło zmianę.
   * @param {HTMLInputElement} input
   * @param {string} value
   */
  function setInputValue(input, value) {
    input.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    nativeSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Czeka aż pozycja z nazwą pojawi się w koszyku.
   * @param {string} name
   * @param {number} timeoutMs
   * @returns {Promise<boolean>}
   */
  function waitForCartItemByName(name, timeoutMs = 5000) {
    const normalized = String(name || "").trim().toLowerCase();
    if (!normalized) return Promise.resolve(false);

    const matches = () => {
      const items = document.querySelectorAll('[data-testid^="cart_line_item_"] h4');
      for (const item of items) {
        const text = (item.innerText || "").trim().toLowerCase();
        if (text.includes(normalized)) return true;
      }
      return false;
    };

    if (matches()) return Promise.resolve(true);

    return new Promise((resolve) => {
      const target = document.querySelector('.MultipleItemsCartContainer_SelectedItemsWrapper__3GDkJ') || document.body;
      if (!target || !(target instanceof Node)) {
        resolve(false);
        return;
      }

      const observer = new MutationObserver(() => {
        if (matches()) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(true);
        }
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeoutMs);

      observer.observe(target, { childList: true, subtree: true });
    });
  }

  /**
   * Czeka aż w wynikach pojawi się element spełniający warunek.
   * @param {(el: Element) => boolean} matchFn
   * @param {number} timeoutMs
   * @returns {Promise<boolean>}
   */
  function waitForSearchResult(matchFn, timeoutMs = 5000) {
    if (typeof matchFn !== "function") return Promise.resolve(false);

    const matches = () => getResults().some(matchFn);

    if (matches()) return Promise.resolve(true);

    return new Promise((resolve) => {
      const modal = getModal();
      if (!modal || !(modal instanceof Node)) {
        resolve(false);
        return;
      }

      const observer = new MutationObserver(() => {
        if (matches()) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(true);
        }
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeoutMs);

      observer.observe(modal, { childList: true, subtree: true });
    });
  }

  /**
   * Czeka aż modal wyboru artykułu będzie gotowy (input wyszukiwania).
   * @param {number} timeoutMs
   * @returns {Promise<boolean>}
   */
  async function waitForModal(timeoutMs = 3000) {
    const modal = getModal();
    if (modal && modal.querySelector('input[placeholder="Nazwa artykułu"]')) {
      return true;
    }

    return new Promise((resolve) => {
      const target = modal || document.body;
      if (!target || !(target instanceof Node)) {
        resolve(false);
        return;
      }

      const observer = new MutationObserver(() => {
        const currentModal = getModal();
        if (currentModal && currentModal.querySelector('input[placeholder="Nazwa artykułu"]')) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(true);
        }
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeoutMs);

      observer.observe(target, { childList: true, subtree: true });
    });
  }

  /**
   * Wstrzykuje banner informacyjny nad przyciskami akcji w koszyku.
   * @returns {void}
   */
  function injectDepositReminder() {
    const actionsRow = document.querySelector(".CartActions_actions__20tTN");
    if (!actionsRow) return;

    // banner już istnieje?
    if (document.querySelector('[data-testid="deposit-reminder-banner"]')) return;

    // wstrzykujemy CSS tylko raz
    if (!document.querySelector("#glofox-deposit-banner-styles")) {
      const style = document.createElement("style");
      style.id = "glofox-deposit-banner-styles";
      style.textContent = `
      @keyframes gfRotate360 {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes gfPulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50%      { transform: scale(1.12); filter: brightness(1.25); }
      }

      .gf-emoji-rotate {
        display: inline-block;
        animation: gfRotate360 2.8s linear infinite;
        will-change: transform;
      }

      .gf-emoji-pulse {
        display: inline-block;
        animation: gfPulse 1.4s ease-in-out infinite;
        will-change: transform, filter;
      }

      [data-testid="deposit-reminder-banner"] {
        width: 100%;
        margin-bottom: 10px; /* klucz: oddech nad przyciskami */
      }
    `;
      document.head.appendChild(style);
    }

    const banner = document.createElement("div");
    banner.setAttribute("data-testid", "deposit-reminder-banner");

    banner.innerHTML = `
    <div style="
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 230, 0, 0.18);
      border: 1px solid rgba(255, 230, 0, 0.45);
      font-size: 14px;
      line-height: 1.2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      user-select: none;
      margin-top: -50px;
    ">
      <div>
        <strong>Ziomalko</strong>
        <span class="gf-emoji-rotate">😎</span>
        kaucja się zgadza?
        <span class="gf-emoji-pulse">✅</span>
        🧴
      </div>
      <div style="opacity: 0.65; font-size: 12px;">
        (szybki check)
      </div>
    </div>
  `;

    // 👉 wstawiamy banner PRZED kontenerem przycisków
    actionsRow.insertAdjacentElement("beforebegin", banner);
  }

  /** Obserwuj SPA / renderowanie i wstrzykuj banner kiedy pojawi się footer. */
  const reminderObserver = new MutationObserver(() => {
    if ((location.hash || "").includes("/cart")) {
      const now = Date.now();
      if (now - lastReminderAt < 1000) return;
      lastReminderAt = now;
      injectDepositReminder();
    }
  });
  reminderObserver.observe(document.body, { childList: true, subtree: true });

  /** Odpal też raz na start. */
  if ((location.hash || "").includes("/cart")) {
    injectDepositReminder();
  }

  /** @returns {boolean} */
  function openItemModal() {
    const btn = document.querySelector('[data-testid="select-item-button"]');
    if (!btn) {
      console.warn("[GLOFOX] Nie znalazłem przycisku 'Wybierz artykuł' (select-item-button).");
      return false;
    }
    btn.click();
    return true;
  }

  /**
   * Otwiera modal i dodaje kaucję, jeśli nie ma jej w koszyku.
   * @returns {Promise<void>}
   */
  async function addDeposit() {
    if (isAddingDeposit || isDepositInCart()) return;
    isAddingDeposit = true;

    try {
      console.log("[GLOFOX] Otwieram modal do dodania kaucji...");

      const openedClick = openItemModal();
      if (!openedClick) return;

      const opened = await waitForModal(3000);
      if (!opened) {
        console.warn("[GLOFOX] Modal nie otworzył się w czasie.");
        return;
      }

      const input = getSearchInput();
      if (!input) {
        console.warn("[GLOFOX] Modal otwarty, ale nie ma inputa wyszukiwarki.");
        return;
      }

      console.log("[GLOFOX] Szukam kaucji plastik...");

      setInputValue(input, DEPOSIT_QUERY);
      const hasResult = await waitForSearchResult((el) => {
        const testid = el.getAttribute("data-testid") || "";
        if (testid.includes(DEPOSIT_PRODUCT_ID)) return true;
        return DEPOSIT_NAME_FALLBACK.test(getItemName(el));
      }, 5000);
      if (!hasResult) {
        console.warn("[GLOFOX] Wyniki kaucji nie pojawily sie na czas, probuje z tym co jest.");
      }

      const results = getResults();
      if (!results.length) {
        console.warn("[GLOFOX] Brak wyników wyszukiwania po wpisaniu:", DEPOSIT_QUERY);
        return;
      }

      // 1) Szukamy po ID produktu
      let depositEl = results.find(el => {
        const testid = el.getAttribute("data-testid") || "";
        return testid.includes(DEPOSIT_PRODUCT_ID);
      });

      // 2) Fallback po nazwie (gdyby ID się zmieniło)
      if (!depositEl) {
        console.warn("[GLOFOX] Nie znalazłem kaucji po ID, próbuję po nazwie...");
        depositEl = results.find(el => DEPOSIT_NAME_FALLBACK.test(getItemName(el)));
      }

      if (!depositEl) {
        console.warn("[GLOFOX] Nie znalazłem kaucji plastik ani po ID ani po nazwie.");
        console.warn("[GLOFOX] Dostępne wyniki:", results.map(getItemName));
        return;
      }

      (depositEl.querySelector('.itemInfo') || depositEl).click();
      console.log("[GLOFOX] Kaucja plastik dodana ✅");

    } finally {
      isAddingDeposit = false;
    }
  }

  /** Trigger: kliknięcie produktu w modalu (np. woda). */
  document.addEventListener('click', async (e) => {
    if (!isCartPage()) return;

    const resultEl = e.target.closest('.searchResult');
    if (!resultEl) return;

    // klik w modalu wyboru artykułów — wtedy rozpoznajemy produkt
    const name = getItemName(resultEl);
    if (!name) return;

    // jeśli kliknięto kaucję, ignorujemy
    if (/kaucja/i.test(name)) return;

    // jeśli produkt wymaga kaucji
    if (matchesAnyCode(name, PRODUCTS_REQUIRING_DEPOSIT_CODES)) {
      if (isDepositInCart()) return;
      const now = Date.now();
      if (now - lastTriggeredAt < 1200) return; // debounce
      lastTriggeredAt = now;

      console.log("[GLOFOX] Wybrano produkt z kaucją:", name);
      console.log("[GLOFOX] Czekam aż produkt doda się do koszyka...");

      const added = await waitForCartItemByName(name, 7000);
      if (!added) {
        console.warn("[GLOFOX] Produkt nie pojawil sie w koszyku na czas, probuje dodac kaucje mimo to.");
      }

      await addDeposit();
    }
  }, true);

  console.log("[GLOFOX] Auto-Kaucja Plastik (Stable) aktywna ✅");
})();
