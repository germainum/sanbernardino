# Google Play Store listing — San Bernardino

Draft copy, ready to paste into Play Console. Character counts are Play's hard limits — re-check in Console before submitting, since exact rendering can shift by a character or two.

## App name (30 char max)

```
San Bernardino : Trafic A13
```
(28 characters)

## Short description (80 char max)

```
Tunnel, col ou Gothard ? La meilleure décision pour l'A13, en un coup d'œil.
```
(77 characters)

## Full description (4000 char max)

```
San Bernardino ne se contente pas d'afficher des chiffres de trafic : elle décide. Tunnel, col, ou déviation par le Gothard — l'app vous dit en une phrase quel itinéraire prendre sur l'axe A13, dans les deux sens (Suisse ↔ Italie).

POURQUOI SAN BERNARDINO

Sur cet axe alpin, la question n'est jamais "combien de minutes de retard ?" mais "par où je passe ?". San Bernardino combine :
• L'état en temps réel du tunnel et du col (ouvert, bouchon, fermé), publié par l'Office fédéral des routes (OFROU)
• Les temps de trajet réels, trafic inclus, calculés par Google Routes
• Une logique de décision claire : le col ne vous est proposé que s'il est vraiment plus rapide ; le Gothard n'est recommandé que si l'A13 est saturé ET que la déviation fait réellement gagner du temps

L'app affiche sa recommandation en un coup d'œil — tunnel, col, Gothard, ou "patiente" — avec la raison, en clair.

FONCTIONNALITÉS

• Verdict instantané pour les deux sens de circulation
• Carte interactive de l'axe A13 avec les tracés du tunnel et du col
• Webcam en direct du col, pour voir les conditions réelles sur place
• Comparatif tunnel/col en un coup d'œil : coût (vignette ou gratuit), distance, altitude, tendance de retard
• Plan B Gothard : affiché seulement quand il est réellement utile
• Notifications : ouverture du col, fermeture du tunnel, bouchon en formation, itinéraire qui change — configurables (directions suivies, types d'alerte, seuil de bouchon, heures silencieuses)
• Rappel de trajet planifié (T-30 minutes avant un départ programmé)
• Fonctionne hors-ligne avec la dernière donnée connue en cas de coupure réseau

GRATUIT, AVEC UNE PUBLICITÉ RAISONNÉE

L'application reste gratuite grâce à une publicité discrète, jamais affichée près des éléments de décision (verdict, cartes d'itinéraire, changement de sens). Un achat unique permettra de la retirer entièrement.

San Bernardino est un outil d'aide à la décision indépendant — toujours vérifier la signalisation routière officielle avant de s'engager sur l'axe.
```
(~1,900 characters — well under the 4000 limit; room to expand with a "quoi de neuf" changelog per release)

## Category & content rating

- **Category**: Maps & Navigation (alternative: Travel & Local)
- **Content rating questionnaire**: no user-generated content, no violence/mature themes, no gambling → expect "Everyone" / PEGI 3.
- **Target audience**: general (not designed for or directed at children).

## Data safety form (Play Console → App content → Data safety)

Reflects what's *actually* collected today. Real AdMob is live (not test IDs) in the release build, so **Advertising ID** is now required — update this section again once Play Billing ships (adds "Purchase history").

| Data type | Collected? | Purpose | Shared with |
|---|---|---|---|
| Device or other IDs (push token) | Yes | App functionality (push notifications) | Google (Firebase Cloud Messaging) |
| Advertising ID | Yes | Advertising, analytics | Google (AdMob) |
| App activity (notification preferences) | Yes | App functionality | Not shared |
| Approximate or precise location | No | — | — |
| Personal info (name, email, etc.) | No | — | — |
| Financial info | No (not yet — add once Play Billing is live) | — | — |

- **Is data encrypted in transit?** Yes (HTTPS everywhere).
- **Can users request data deletion?** Yes — uninstalling clears future processing; the privacy policy's contact address handles manual requests for anything already stored.
- **Privacy policy URL**: see the published artifact (San Bernardino — Politique de confidentialité).

## Screenshots

Re-captured 2026-08-17 against the real production build (real Google Routes + real OFROU road status, real Windy webcam, not mock data) at 1082×3029 — meets Play's phone screenshot requirements as-is. The previous set (2026-08-10) predated the mustard palette pivot and the map/webcam/card redesign and would have shown a completely different-looking app, so it's been fully replaced rather than kept alongside:

- `screenshots/home-italie.png` — home screen, "vers l'Italie" direction: hero, comparison cards, map, live webcam
- `screenshots/home-suisse.png` — home screen, "vers la Suisse" direction

Still optional (not blocking submission — Play's minimum is 2 screenshots):
- A Settings screenshot — the notifications permission flow can't be exercised headlessly (no real Capacitor push bridge in a browser), so capture this one directly on a device instead.

Already on disk, current (regenerated 2026-08-12 for the mustard palette):
- Feature graphic: `docs/store-assets/feature-graphic-1024x500.png`
- App icon: `docs/store-assets/icon-512.png`
