<div align="center">

# 🏋️‍♂️ Gym Ranker | Hardcore Edition

**Das gnadenloseste Fitness-Ranking-System das du je gesehen hast.**

[![Android](https://img.shields.io/badge/Android-APK%20Download-3DDC84?style=for-the-badge&logo=android)](https://github.com/Emre1001/Gym-Ranker/releases)
[![PWA](https://img.shields.io/badge/iOS%20%2F%20Web-PWA%20Ready-000000?style=for-the-badge&logo=safari)](https://emre1001.github.io/Gym-Ranker/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> *„Der einzige schlechte Workout ist der, den du nicht gemacht hast."*

Gym Ranker ist kein normaler Fitness-Tracker.  
Es ist ein **gnadenloses, gamifiziertes Ranglisten-System**.  
Logge deine Sätze, sammle XP und steige auf.  
**Wer skippt, verliert.**

</div>

---

## ⚡ Kernmechaniken

### 🏆 33 Ränge — Von Holz bis Champion

Ein exponentielles Level-System bei dem jeder Rang **40% mehr XP** als der vorherige kostet.

<details>
<summary><b>🏆 Alle 33 Ränge anzeigen</b></summary>

| Tier | Ränge | Schwierigkeit |
|:---|:---|:---|
| 🪵 **Holz** | 1 – 2 – 3 | Einstieg |
| 🥉 **Bronze** | 1 – 2 – 3 | Anfänger |
| ⚙️ **Stahl** | 1 – 2 – 3 | Regelmäßig |
| 🥈 **Silber** | 1 – 2 – 3 | Konsistent |
| 🥇 **Gold** | 1 – 2 – 3 | Fortgeschritten |
| 💎 **Diamant** | 1 – 2 – 3 | Ernsthaft |
| ❇️ **Emerald** | 1 – 2 – 3 | Dediziert |
| 🩸 **Ruby** | 1 – 2 – 3 | Elite |
| 🌌 **Obsidian** | 1 – 2 – 3 | Top 1% |
| 🧬 **Gymrat** | 1 – 2 – 3 | Lifestyle |
| 👑 **Champion** | 1 – 2 – 3 | Jahrelanges hartes Training |

> Das System skaliert exponentiell. Champion 3 zu erreichen ist eine echte Lebensleistung.

</details>

---

### ⚖️ Smartes Multiplikator-System

100 kg Beinpresse sind **nicht** gleich 100 kg Bankdrücken. Unsichtbare Multiplikatoren im Code sorgen für absolute Fairness zwischen allen Übungen.

<details>
<summary><b>⚙️ XP-Formel & Beispiele</b></summary>

**Die Formel:**
```
Gewicht (kg) × Wiederholungen × Übungs-Multiplikator = XP
```

**Beispiele:**

| Übung | Multiplikator | Beispiel-Set | Erzielte XP |
|:---|:---:|:---|:---:|
| Bankdrücken (Flach) | × 1.0 | 80 kg × 10 Reps | **800 XP** |
| Beinpresse | × 0.3 | 200 kg × 10 Reps | **600 XP** |
| Seitheben (Kurzhantel) | × 8.0 | 15 kg × 10 Reps | **1.200 XP** |
| Klimmzüge (Zusatzgew.) | × 2.5 | 20 kg × 8 Reps | **400 XP** |

> Die App unterstützt über **30 echte Gym-Maschinen** mit Suchfunktion — Hackenschmidt, Cable Cross, Dips, Facepulls und viele mehr.

</details>

---

### 🩸 XP Bluten — Das Decay System

Nach **3 Tagen Pause** verlierst du täglich **2% deiner gesamten XP**.  
Machst du zu lange Pause, steigst du im Rang ab (**Derank**).

```
Tag 0–3:   Keine Strafe. Erholung ist Teil des Trainings.
Tag 4+:    −2% gesamt-XP pro Tag
Zu lange:  Derank — der Rang sinkt
```

> Das System belohnt **Konsistenz** — nicht Einzelleistungen.

---

### 💾 Backup-System

Sichere deinen gesamten Spielstand als **verschlüsselten Base64-Code** lokal auf deinem Gerät.  
Kein Cloud-Zwang, kein Account, volle Kontrolle.

---

## 📲 Installation

### 🤖 Android (.apk)

1. Gehe auf den **[Releases-Tab](https://github.com/Emre1001/Gym-Ranker/releases)** dieser Seite
2. Lade die neueste `Gym-Ranker-x.x.apk` herunter
3. Öffne die Datei auf deinem Handy und installiere sie

> ⚠️ **Hinweis:** „Installation aus unbekannten Quellen" muss in den Einstellungen erlaubt sein.

---

### 🍏 iOS (iPhone) & Web — PWA

Da Apple keine externen APKs erlaubt, nutze die **Progressive Web App**:

| Schritt | Aktion |
|:---:|:---|
| **1** | Öffne **[emre1001.github.io/Gym-Ranker](https://emre1001.github.io/Gym-Ranker/)** im **Safari** |
| **2** | Tippe auf den **Teilen-Button** (Viereck mit Pfeil nach oben) |
| **3** | Wähle **„Zum Home-Bildschirm"** |
| **4** | App installiert sich nativ — mit Fullscreen & Offline-Support |

---

## 🗺️ Roadmap

- [x] 33-Rang-System mit exponentiellem XP
- [x] Decay-System (XP Bluten)
- [x] Multiplikator-System für 30+ Übungen
- [x] Base64-Backup
- [x] Android APK
- [x] iOS PWA
- [ ] Statistik-Verlauf (Graphen)
- [ ] Freundes-Rangliste (Lokal)
- [ ] Streak-Bonus für tägliches Training

---

## 🤝 Mitmachen

Pull Requests willkommen! Besonders gesucht:
- Neue Übungen mit Multiplikatoren
- UI-Verbesserungen
- Übersetzungen (EN / TR)

---

<div align="center">

*Stay consistent. Don't skip leg day.*

**Become a Champion. 👑**

</div>
