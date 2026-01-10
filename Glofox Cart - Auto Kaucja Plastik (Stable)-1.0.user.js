// ==UserScript==
// @name         Glofox Cart - Auto Kaucja Plastik (Stable)
// @namespace    ariel-glofox
// @version      1.0
// @description  Po dodaniu produktu z kaucją (np. woda) otwiera modal i dodaje Kaucja plastik.
// @match        https://app.glofox.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // === KONFIG ===
  const PRODUCTS_REQUIRING_DEPOSIT = [
    /woda/i,
    // możesz dopisać kolejne:
    // /izotonik/i,
    // /napój/i
  ];

  const DEPOSIT_PRODUCT_ID = "691f424189fc5b95160404b7"; // kaucja plastik
  const DEPOSIT_QUERY = "kaucja";
  const DEPOSIT_NAME_FALLBACK = /kaucja plastik/i;

  // Debounce / blokada
  let lastTriggeredAt = 0;
  let isAddingDeposit = false;

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// === UI: banner nad "Zapłać" z animacjami ===
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

// obserwuj SPA / renderowanie i wstrzykuj banner kiedy pojawi się footer
const reminderObserver = new MutationObserver(() => {
  if ((location.hash || "").includes("/cart")) {
    injectDepositReminder();
  }
});
reminderObserver.observe(document.body, { childList: true, subtree: true });

// odpal też raz na start
if ((location.hash || "").includes("/cart")) injectDepositReminder();

  function isCartPage() {
    return (location.hash || "").includes("/cart");
  }

  function getModal() {
    return document.querySelector('[data-testid="modal-content"]');
  }

  function isSelectItemModalOpen() {
    const modal = getModal();
    return modal && modal.innerText.includes("Wybierz artykuł");
  }

  function getSearchInput() {
    const modal = getModal();
    if (!modal) return null;
    return modal.querySelector('input[placeholder="Nazwa artykułu"]');
  }

  function getResults() {
    const modal = getModal();
    if (!modal) return [];
    return [...modal.querySelectorAll('.searchResult')];
  }

  function getItemName(resultEl) {
    return (resultEl.querySelector('.itemName')?.innerText || '').trim();
  }

  function matchesAny(str, regexList) {
    return regexList.some(rx => rx.test(str));
  }

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

  function openItemModal() {
    const btn = document.querySelector('[data-testid="select-item-button"]');
    if (!btn) {
      console.warn("[GLOFOX] Nie znalazłem przycisku 'Wybierz artykuł' (select-item-button).");
      return false;
    }
    btn.click();
    return true;
  }

  async function waitForModal(timeoutMs = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (isSelectItemModalOpen()) return true;
      await sleep(100);
    }
    return false;
  }

  async function addDeposit() {
    if (isAddingDeposit) return;
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
      await sleep(450); // troszkę więcej, bo renderuje listę

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

  // === Trigger: kliknięcie produktu w modalu (np. woda) ===
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
    if (matchesAny(name, PRODUCTS_REQUIRING_DEPOSIT)) {
      const now = Date.now();
      if (now - lastTriggeredAt < 1200) return; // debounce
      lastTriggeredAt = now;

      console.log("[GLOFOX] Wybrano produkt z kaucją:", name);
      console.log("[GLOFOX] Czekam aż produkt doda się do koszyka...");

      // Twoja propozycja - czas dla backendu/UI
      await sleep(700);

      await addDeposit();
    }
  }, true);

  console.log("[GLOFOX] Auto-Kaucja Plastik (Stable) aktywna ✅");
})();
