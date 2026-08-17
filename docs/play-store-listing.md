# Google Play Store listing — San Bernardino

Draft copy, ready to paste into Play Console. Character counts are Play's hard limits — re-check in Console before submitting, since exact rendering can shift by a character or two.

## Positioning (why the copy reads this way)

Google Maps, Waze, and TCS Trafic Info all give you **data** — travel times, road status — and leave you to interpret it. San Bernardino gives you a **verdict**, using decision logic specific to this one corridor (the col is only ever proposed when it's genuinely faster; the Gothard detour only when the time actually saved outweighs the extra distance). That's the differentiator the copy leans on: not "another traffic app," but the one that decides instead of just informing.

Three audiences, not one: the **transalpine commuter** (Chur↔Bellinzona/Chiasso, cares about reliability and vignette cost), the **occasional traveler** (ski season, summer holidays, doesn't know the corridor, wants reassurance), and the **professional driver** (cares about closures/chain requirements being accurate, not approximate). The feature list covers all three; the opening hook targets the shared pain point (having to interpret data yourself) rather than any one persona specifically.

## App name (30 char max)

```
San Bernardino : Trafic A13
```
(28 characters)

## Short description (80 char max)

```
Fini d'hésiter au col : l'app décide tunnel, col ou Gothard à ta place.
```
(76 characters — leads with the pain point (hesitating), not the feature)

## Full description (4000 char max)

```
Google Maps te donne des temps de trajet. San Bernardino te donne une réponse : tunnel, col, ou Gothard — en une phrase, avec la raison.

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
(~1,800 characters — well under the 4000 limit; room to expand with a "quoi de neuf" changelog per release)

## Category & content rating

- **Category**: Maps & Navigation (alternative: Travel & Local)
- **Content rating questionnaire**: no user-generated content, no violence/mature themes, no gambling → expect "Everyone" / PEGI 3.
- **Target audience**: general (not designed for or directed at children).

## Data safety form (Play Console → App content → Data safety)

Reflects what's *actually* collected today. Real AdMob is live (not test IDs) in the release build, so **Advertising ID** is required. The `remove_ads` one-time purchase now ships via RevenueCat (client-side entitlement check against the Play Store — see `app/src/iap/RevenueCat.ts`), so **Purchase history** is required too.

| Data type | Collected? | Purpose | Shared with |
|---|---|---|---|
| Device or other IDs (push token) | Yes | App functionality (push notifications) | Google (Firebase Cloud Messaging) |
| Advertising ID | Yes | Advertising, analytics | Google (AdMob) |
| App activity (notification preferences) | Yes | App functionality | Not shared |
| Purchase history | Yes | App functionality (unlocking the ad-free purchase) | RevenueCat |
| Approximate or precise location | No | — | — |
| Personal info (name, email, etc.) | No | — | — |
| Financial info (card numbers, bank details) | No | — | — |

- **Is data encrypted in transit?** Yes (HTTPS everywhere).
- **Can users request data deletion?** Yes — uninstalling clears future processing; the privacy policy's contact address handles manual requests for anything already stored.
- **Privacy policy URL**: see the published artifact (San Bernardino — Politique de confidentialité).

## Screenshots

Upload in this order — Play's carousel shows the first 2-3 without swiping, so the strongest value-prop images lead, plain UI screenshots follow as proof:

1. `store-assets/promo-screenshots/promo-1-verdict.png` — "Pas une carte. Une décision." — the differentiator, up front.
2. `store-assets/promo-screenshots/promo-2-alerts.png` — "Il surveille la route. Pas toi." — the emotional payoff (you stop having to check yourself). Illustrated notification stack, not a real capture — the actual Settings screen has too little visible content (no system permission UI in a static screenshot) to sell this feature on its own.
3. `store-assets/promo-screenshots/promo-3-map-webcam.png` — real map + live col webcam together — proof the data is genuinely live, not a static estimate.
4. `screenshots/home-italie.png` — plain app screenshot, "vers l'Italie" direction, no caption overlay.
5. `screenshots/home-suisse.png` — plain app screenshot, "vers la Suisse" direction.

All from the real production build (real Google Routes + real OFROU road status + real Windy webcam, not mock data), 1080×1920 for the promo set and 1082×3029 for the plain pair — both meet Play's phone screenshot requirements as-is. Re-captured/re-composed 2026-08-17; the original 2026-08-10 set predated the mustard palette pivot and the map/webcam/card redesign entirely.

Already on disk, current (regenerated 2026-08-12 for the mustard palette):
- Feature graphic: `docs/store-assets/feature-graphic-1024x500.png`
- App icon: `docs/store-assets/icon-512.png`
