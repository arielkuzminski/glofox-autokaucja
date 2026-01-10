# Glofox Auto Kaucja Plastik

Skrypt Tampermonkey dla Glofox, który automatycznie dodaje kaucję plastikową po wybraniu produktów wymagających kaucji w koszyku.

## Wymagania

- Przeglądarka: Chrome / Edge / Firefox.
- Rozszerzenie Tampermonkey.

## Instalacja Tampermonkey

1. Wejdź na stronę rozszerzenia Tampermonkey dla swojej przeglądarki.
2. Zainstaluj i włącz rozszerzenie.
3. Otwórz panel Tampermonkey (ikona w pasku narzędzi).

## Instalacja skryptu

1. W Tampermonkey kliknij "Create a new script".
2. Usuń domyślną zawartość edytora.
3. Wklej zawartość pliku:
   - `Glofox Cart - Auto Kaucja Plastik (Stable)-1.0.user.js`
4. Zapisz skrypt (Ctrl+S).
5. Upewnij się, że skrypt jest włączony na liście Tampermonkey.

## Użycie

1. Zaloguj się do `https://app.glofox.com/`.
2. Przejdź do koszyka.
3. Dodaj produkt wymagający kaucji z listy artykułów.
4. Skrypt automatycznie otworzy modal, wyszuka "kaucja" i doda kaucję plastikową.

## Konfiguracja

W pliku skryptu możesz dostosować:

- `PRODUCTS_REQUIRING_DEPOSIT_CODES` – lista kodów kreskowych produktów wymagających kaucji.
- `DEPOSIT_PRODUCT_ID` – ID produktu kaucji.
- `DEPOSIT_QUERY` – fraza wyszukiwania kaucji.
- `DEPOSIT_NAME_FALLBACK` – fallback po nazwie, gdy ID się zmieni.

## Lista zmiennych konfigurowalnych

- `PRODUCTS_REQUIRING_DEPOSIT_CODES` – tablica kodów kreskowych (np. `"5000112680195"`).
- `DEPOSIT_PRODUCT_ID` – stałe ID produktu kaucji.
- `DEPOSIT_QUERY` – tekst wpisywany w wyszukiwarkę modala.
- `DEPOSIT_NAME_FALLBACK` – regex nazwy kaucji używany, gdy ID się zmieni.

## Przykład konfiguracji

```js
const PRODUCTS_REQUIRING_DEPOSIT_CODES = [
  "5000112679519",
  "5000112680195",
  "5000112679540"
];
```

## Rozwiązywanie problemów

- Jeśli kaucja się nie dodaje, upewnij się, że:
  - Skrypt jest włączony w Tampermonkey.
  - Jesteś na stronie koszyka w Glofox.
  - Kody produktów znajdują się w `PRODUCTS_REQUIRING_DEPOSIT_CODES`.
- W przypadku zmian w interfejsie Glofox może być potrzebna aktualizacja selektorów w skrypcie.
