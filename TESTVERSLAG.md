# Testverslag v0.1

Uitgevoerd op 12 oktober 2026 in de lokale ontwikkelomgeving, Node 22.22.1.

## Automatische controles

- `npm test`: **31/31 geslaagd** in twee suites.
- `npm run build`: TypeScriptcontrole en Vite-productiebuild geslaagd.
- `npm audit`: **0 bekende kwetsbaarheden** in de geïnstalleerde dependencyset.

De integratietest opent tegelijkertijd **14 spelerverbindingen, 8 laptopverbindingen, 1 digibordverbinding en 1 emergencyverbinding** naar de echte HTTP-/WebSocketserver. Alle 24 verbindingen zien taakbeloningen en meetingovergangen. Ze ontvangen elk een projectie met alleen hun toegestane gegevens.

Een tweede integratieflow stopt de server, opent hetzelfde SQLite-bestand opnieuw en controleert de spelercredential, een al gereserveerde diefstal, achterstallige afschrijving, latere Beveiligeralert en een idempotent dubbel verzoek. Oude credentials worden na herstel geweigerd, ook op een reeds open WebSocket.

De overige scenario's omvatten verkeerde rollen/sessies/apparaten, ontbrekend minigamebewijs, dubbele taakbeloningen, gelijktijdige geldreserveringen, twee controles per ronde, automatische meetings, emergency-cooldown, één ontslag per overleg, spectatorblokkade, pauze/hervatten en de drie gekozen eindregels. Ook hergebruik van een request-ID voor een andere actie wordt geweigerd. Een nog vrije vooraf geregistreerde naam kan na start aansluiten; nieuwe registratie is dan geblokkeerd.

## Browsercontrole

Gecontroleerd in de Codex-browser op desktopformaat (1360 × 900) en telefoonformaat (390 × 844):

1. Beheerderslogin, sessie aanmaken en expliciete demonstratiegegevens laden.
2. Configuratiepagina met alle drie gekozen eindregels; instellingen opslaan.
3. QR-code, netwerkadres, acht laptopkoppelingen en maximaal twee kaslocaties.
4. Telefoononboarding voor een Gokker: geheime eigen rol, introplaceholder, taken en kaart, partnernaam, Lockpick-/Omleiding- en gokradplaceholders.
5. Een aparte Managerdemo en Beveiligerdemo gebruiken eigen tabopslag. Na refresh blijft de Manager Daan; de andere telefoon blijft Amir.
6. Laptop 1 kiest Noor en toont alleen een minigameplaceholder, zonder onbeveiligde beloningsknop.
7. Een taakbeloning wordt via de afgeschermde testomgeving geregistreerd. Een diefstal bij 25 punten boekt buit, waarna de kas naar 20 punten daalt.
8. De iPad start een emergency meeting; laptop, digibord en Manager tonen direct de verzamelfase.
9. De Manager start overleg, selecteert Amir en ontslaat hem. De telefoon wordt spectator en de rol is openbaar.
10. Na het sluiten van de meeting toont de iPad een cooldownring. De Beveiliger controleert laptop 2 en ontvangt een analoog tijdstip zonder daderidentiteit.
11. De ontslagen Gokker opent de fictieve banenfeed, verzamelt cv/diploma/motivatie, kiest de passende vaardigheid en verstuurt de fictieve sollicitatie. De reactie is een afwijzing. Deze lokale activiteit wijzigt geen bedrijfspunten.
12. Browserconsole tijdens de controle: geen appfouten. De demo is na controle via de admin-testactie teruggezet naar de lobby.

Een eerste compileercontrole vond een TypeScript-narrowingfout; die is verholpen. De eerste spelregeltest vond een te kleine validatiebovengrens voor de drie-minutentimer; die is gecorrigeerd en de betreffende tests slagen. De dependencyset is bijgewerkt na auditmeldingen. Geen bekende onopgeloste fouten uit deze controles.

## Verificatielimiet

Er is geen echte klasopstelling met 24 afzonderlijke fysieke apparaten getest. De verbindings-, autorisatie- en herstarttests zijn uitgevoerd vanaf één host. Controleer vooraf de bereikbaarheid via het lokale wifi-/LAN-netwerk, firewall en echte apparaatbrowsers. De acht financiële minigames, twee steelminigames en het gokrad zijn bewust nog placeholders.
