# Testverslag v0.1

## Aanvulling 15 oktober 2026 — terminalcodes

- TypeScriptcontrole, 45 automatische tests en productiebuild geslaagd op Node 24.19.0.
- Acht permanente, unieke laptopcodes blijven gelijk na spelreset, nieuwe sessie en serverherstart. Bestaande sessies zonder codevelden worden gemigreerd bij het inlezen.
- Persoonlijke telefoon koppelt via de juiste laptopcode; alleen de gekoppelde terminal toont de taakcode. Andere spelers/apparaten ontvangen die code niet.
- Verkeerde codes, verkeerde taaktoewijzing, bezette terminals, onbevoegde rollen, ontslag, verlopen pogingen en meetings zijn gecontroleerd. Pauze bevriest de poging.
- Taakbeloning en diefstal consumeren een serveruitgegeven poging atomair. Zowel idempotente HTTP-replays als een nieuw verzoek met dezelfde verbruikte poging leveren geen tweede betaling op. De client bepaalt het buitbedrag niet.
- Echte HTTP-/WebSocketflow met telefoon en terminal getest, inclusief herstart tijdens een lopende poging en herstel van beide credentials.
- Inloggen via de echte Vite-proxy getest. De proxy bewaart Host voor de herkomstcontrole; vreemde Origins blijven geblokkeerd.

Browsercontrole in een aparte sessie: twee toegewezen taken via de popup gekoppeld en afgerond; de terminal toont de juiste naam en taakcode, de telefoon toont het succesvinkje en de taken worden uitgeschakeld na voltooiing. De browserconsole bevatte geen appfouten. Schermafbeeldingen van popup en terminal zijn vastgelegd. De echte klasopstelling met fysieke telefoons is niet getest.

De onderstaande controle is het historische verslag van 12 oktober, vóór de codeflow.


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


## Uitbreiding gamelogica en Vercel — 15 oktober 2026

De huidige vormgeving blijft behouden. Telefoonkoppeling gebruikt één permanente laptopcode; financiële taken worden op de terminal opgelost. Acht opdrachten controleren financiële antwoorden op de server. Automatische taakverdeling is 3/2/1, met een afzonderlijke toelatingswachtrij en Iedereen toelaten. Lockpick en Omleiding tellen stappen en vier oplopende buitrondes op de server. Het gokrad gebruikt serverkans 55% en totale uitbetaling 2× inzet bij winst. Alle drie meetingfasen worden door Manager/admin bediend; de overige schermen en serveracties blijven geblokkeerd. Beveiligerregels zijn behouden. Eindregels en gezamenlijke winst van ontslagen Gokkers volgen de gekozen ZIP-regels. Eindrapport en een doorlopende fictieve vacaturefeed zijn toegevoegd, zonder geluid. Een eigen video kan later als bestand in public/ of met een directe HTTPS-link worden toegevoegd.

Geautomatiseerd: 65 tests slagen in vijf testbestanden. TypeScript en productiebuild slagen. De cloudopslagtests controleren onafhankelijke function-instanties, gelijktijdige mutaties, idempotentie en gedeelde rate limits met een gesimuleerde repository.

Browsercontrole lokaal: telefoon met vaste code gekoppeld; fout financieel antwoord geeft geen beloning; juist antwoord geeft precies één beloning en realtime update. Manager doorloopt verzamelen, overleg en ontslag; andere telefoon en terminal zijn gelocked. Ontslag en sluiten van meeting werken. Lockpick: vier sloten voltooid en rondebuit geïnd. Omleiding: drie gedraaide leidingen geven één rondebuit. Gokrad: geldige inzet en resultaat verwerkt zonder browserfouten. Er zijn uitsluitend fictieve spelers in een eigen controlesessie gebruikt.

Vercel: serverless API met Neon Free en polling voorbereid. Laptopcodes en beheerderswachtwoord zijn uitsluitend na expliciete gebruikerstoestemming als afgeschermde Vercel-variabelen opgeslagen. Neon-voorwaarden zijn door de gebruiker zelf geaccepteerd. Automatische koppeling met de private GitHub-repository is nog niet ingesteld; de deployment wordt handmatig gepubliceerd. Lokale data, .env, tokens en databases zijn van bronuploads uitgesloten.

Online verificatie geslaagd op https://finance-imposter.vercel.app: beheerlogin, permanente codes gelijk aan lokale SQLite, 14 afzonderlijke spelers plus acht terminals/digibord/emergency-iPad, juiste rolprojecties, telefoon-terminalkoppeling, fout antwoord geweigerd, twee gelijktijdige identieke afrondingen met één beloning, en de drie meetingfasen. Twee gelijktijdige diefstallen van 16 bij een kas van 25 leveren één succes en één weigering; na vijf seconden is de kas 9, na tien seconden is de melding voor de Beveiliger beschikbaar zonder daderidentiteit. Eindrapport gecontroleerd. In echte online browsertabs is Factuurcontrole voltooid: 3 × 40 + 30 = 150, gevolgd door Geslaagd op de telefoon. Geen browserfouten op die terminal.

De online controlesessie 972137 is afgesloten; lege startsessie 972072 is klaargezet. Bij latere publicaties blijft dezelfde Neon-database in gebruik. Extra eindregeltest: reeds gereserveerd diefstalgeld telt niet mee voor de 100-puntenoverwinning. Video-URL-controle accepteert /briefing.mp4 en weigert javascript: en protocolrelatieve URLs.

Laatste productiepublicatie: dpl_Ho48co6pyhD3Sbycnsw8rSQ3nEsi, gekoppeld aan https://finance-imposter.vercel.app. API-health antwoordt 200 met cloudtransport poll. Het statische pad /VIDEO.txt antwoordt correct als text/plain; de SPA-router onderschept eigen bestanden in public/ niet. Lokale server is herstart met dezelfde definitieve code.
