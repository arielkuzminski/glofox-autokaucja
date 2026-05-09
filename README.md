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

Kliknij link — Tampermonkey automatycznie zaproponuje instalację:

| Wersja | Link |
|--------|------|
| v1.5 (aktualna) | [Zainstaluj](https://raw.githubusercontent.com/arielkuzminski/glofox-autokaucja/master/Glofox%20Cart%20-%20Auto%20Kaucja%20Plastik%20(Stable)-1.5.user.js) |
| v1.4 | [Zainstaluj](https://raw.githubusercontent.com/arielkuzminski/glofox-autokaucja/master/Glofox%20Cart%20-%20Auto%20Kaucja%20Plastik%20(Stable)-1.4.user.js) |
| v1.3 | [Zainstaluj](https://raw.githubusercontent.com/arielkuzminski/glofox-autokaucja/master/Glofox%20Cart%20-%20Auto%20Kaucja%20Plastik%20(Stable)-1.3.user.js) |
| v1.2 | [Zainstaluj](https://raw.githubusercontent.com/arielkuzminski/glofox-autokaucja/master/Glofox%20Cart%20-%20Auto%20Kaucja%20Plastik%20(Stable)-1.2.user.js) |
| v1.1 | [Zainstaluj](https://raw.githubusercontent.com/arielkuzminski/glofox-autokaucja/master/Glofox%20Cart%20-%20Auto%20Kaucja%20Plastik%20(Stable)-1.1.user.js) |
| v1.0 | [Zainstaluj](https://raw.githubusercontent.com/arielkuzminski/glofox-autokaucja/master/Glofox%20Cart%20-%20Auto%20Kaucja%20Plastik%20(Stable)-1.0.user.js) |

## Automatyczne aktualizacje

Skrypt zawiera `@updateURL` i `@downloadURL` — Tampermonkey sprawdza aktualizacje automatycznie. Workflow:

```bash
# edytujesz plik, zmieniasz @version, a potem:
git add . && git commit -m "update" && git push
# Tampermonkey wykryje nową wersję i zaproponuje aktualizację
```

## Użycie

1. Zaloguj się do `https://app.glofox.com/`.
2. Przejdź do koszyka.
3. Dodaj produkt wymagający kaucji z listy artykułów.
   - Produkt musi mieć znacznik `[k]` lub `[K]` w nazwie lub opisie (np. `Woda mineralna 0.5L [k]` albo opis `Woda 0.75l [k]`).
4. Skrypt automatycznie otworzy modal, wyszuka "kaucja" i doda kaucję plastikową.

## Konfiguracja

W pliku skryptu możesz dostosować:

- `DEPOSIT_MARKER_REGEX` – regex wykrywający znacznik produktu z kaucją w nazwie lub opisie (domyślnie `[k]/[K]`).
- `DEPOSIT_PRODUCT_ID` – ID produktu kaucji.
- `DEPOSIT_QUERY` – fraza wyszukiwania kaucji.
- `DEPOSIT_NAME_FALLBACK` – fallback po nazwie, gdy ID się zmieni.

## Lista zmiennych konfigurowalnych

- `DEPOSIT_MARKER_REGEX` – regex znacznika w nazwie lub opisie produktu (domyślnie `/\\[k\\]/i`).
- `DEPOSIT_PRODUCT_ID` – stałe ID produktu kaucji.
- `DEPOSIT_QUERY` – tekst wpisywany w wyszukiwarkę modala.
- `DEPOSIT_NAME_FALLBACK` – regex nazwy kaucji używany, gdy ID się zmieni.

## Przykład konfiguracji

```js
const DEPOSIT_MARKER_REGEX = /\[k\]/i;
// Przykład: nazwa "Woda mineralna 0.5L [k]" lub opis "Woda 0.75l [k]"
```

## Rozwiązywanie problemów

- Jeśli kaucja się nie dodaje, upewnij się, że:
  - Skrypt jest włączony w Tampermonkey.
  - Jesteś na stronie koszyka w Glofox.
  - Nazwa lub opis produktu w Glofox zawiera znacznik `[k]` lub `[K]`.
- W przypadku zmian w interfejsie Glofox może być potrzebna aktualizacja selektorów w skrypcie.
