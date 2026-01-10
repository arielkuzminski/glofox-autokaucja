# Glofox Auto Kaucja Plastik

Skrypt Tampermonkey dla Glofox, który automatycznie dodaje kaucję plastikową po wybraniu produktów wymagających kaucji (np. woda) w koszyku.

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
3. Dodaj produkt wymagający kaucji (np. woda) z listy artykułów.
4. Skrypt automatycznie otworzy modal, wyszuka "kaucja" i doda kaucję plastikową.

## Konfiguracja

W pliku skryptu możesz dostosować:

- `PRODUCTS_REQUIRING_DEPOSIT` – lista wyrażeń regularnych dla produktów z kaucją.
- `DEPOSIT_PRODUCT_ID` – ID produktu kaucji.
- `DEPOSIT_QUERY` – fraza wyszukiwania kaucji.
- `DEPOSIT_NAME_FALLBACK` – fallback po nazwie, gdy ID się zmieni.

## Rozwiązywanie problemów

- Jeśli kaucja się nie dodaje, upewnij się, że:
  - Skrypt jest włączony w Tampermonkey.
  - Jesteś na stronie koszyka w Glofox.
  - Nazwy produktów pasują do `PRODUCTS_REQUIRING_DEPOSIT`.
- W przypadku zmian w interfejsie Glofox może być potrzebna aktualizacja selektorów w skrypcie.
