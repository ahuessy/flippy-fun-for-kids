# 🕹️ Flippy Ball

Ein buntes, kindgerechtes Flipperspiel im Retro-Stil der 1970er – gebaut für Kinder **ab 7 Jahren** und deren Familien.

Der Ball rollt bewusst langsam (wie in zäher Flüssigkeit), die Flipper-Hebel sind extra gross, und es gibt 5 Bälle pro Spiel. Kein Frust, nur Spass.

## 🎮 Spielanleitung (für Kinder)

1. Auf **«Spiel starten»** tippen.
2. Der Ball kommt oben rechts ins Spielfeld und kullert nach links.
3. Mit den beiden grossen Buttons unten die Flipper schlagen, damit der Ball nicht ins Loch in der Mitte fällt.
4. Jedes bunte Symbol (Stern, Smiley, Herz, Rakete, Tier …) gibt Punkte und macht einen fröhlichen Ton.
5. Fällt ein Ball ins Loch, kommt automatisch der nächste – nach dem 5. Ball gibt es die Gesamtpunktzahl.

### Steuerung

| Eingabe | Aktion |
| --- | --- |
| Touch-Button links / rechts unten | Linker bzw. rechter Flipper |
| Pfeiltaste links oder `A` | Linker Flipper |
| Pfeiltaste rechts oder `D` | Rechter Flipper |
| Roter Knopf oben rechts | Spiel abbrechen zurück zum Startmenü |

## ✨ Merkmale

- 7 bunte Bumper mit Punkte-Animation und fröhlichen Soundeffekten (Ballstart, Treffer, Flipper-Schlag, Ball im Loch, Spielende)
- Grosse Flipper-Hebel mit Aussengelenken und einer nur knapp ballgrossen Mittelöffnung
- 5 Bälle pro Spiel, automatischer Ball-Nachschub inkl. «Neuer Ball starten»
- Ball bleibt nie stecken: liegt er unten, wird automatisch der nächste ausgeworfen
- Ball kann das Spielfeld nicht verlassen (Tempo- und Positions-Begrenzung)
- Startmenü mit kurzer Anleitung, gut sichtbare Punkte-Anzeige
- Läuft auf Tablet, Handy und Desktop (Touch + Tastatur)
- Keine Werbung, keine Konten, keine personenbezogenen Daten – alles läuft im Browser

## 🚀 Loslegen

Voraussetzung: [Bun](https://bun.sh) (Node funktioniert alternativ mit `npm`).

```bash
bun install     # Abhängigkeiten installieren
bun run dev     # Entwicklungsserver starten
```

Danach im Browser die angezeigte lokale Adresse öffnen.

Weitere Befehle:

```bash
bun run build     # Produktions-Build
bun run preview   # gebauten Stand lokal ansehen
bun run lint      # Lint
bun run format    # Code formatieren
```

## 🛠️ Technik

- React 19 + TanStack Start / Router (Vite als Build-Tool)
- `matter-js` für die Physik, Rendering über HTML Canvas
- Soundeffekte per Web Audio API (keine Audio-Dateien nötig)
- Tailwind CSS v4 für das Aussehen

## 📄 Rechtliches

- `/impressum` – Betreiberangaben
- `/datenschutz` – Datenschutzerklärung nach schweizerischem DSG inkl. erzieherischer Hinweise für verantwortungsvolles Spielen

Beide Links stehen im Startmenü.

## 📜 Lizenz

Für dieses Spiel gilt die MIT-Lizenz (siehe `LICENSE`).
