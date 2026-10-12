# Finance Imposter — v0.1

Werkend lokaal multiplayerprototype voor een educatief klassikaal spel. React + TypeScript, een Node/Express-server, WebSockets en persistente SQLite-opslag. Alle interfaces gebruiken dezelfde server. Geldpunten zijn uitsluitend spelgegevens; de app verricht geen echte financiële transacties.

## Snel starten

Vereist: Node.js 22.13 of hoger en npm. Getest met Node 22.22.1. Node 22 meldt dat zijn ingebouwde SQLite-module experimenteel is; dat is een runtimewaarschuwing, geen testfout.

```bash
cd finance-imposter
npm ci
npm run setup
npm run build
npm start
```

`npm run setup` vraagt om een eigen beheerderswachtwoord van minimaal 12 tekens en maakt `.env`. Als `.env` al bestaat, wijzig `ADMIN_PASSWORD` in dat bestand. Het wachtwoord zit nooit in de frontend. Open **http://localhost:3000** en log in.

Tijdens ontwikkeling:

```bash
npm run dev
```

Dit start de server op 3000 en Vite op **http://localhost:5173**. De Vite-proxy stuurt API- en WebSocketverkeer door. Gebruik voor een klassentest bij voorkeur de gebouwde app op poort 3000, zodat slechts één poort toegankelijk hoeft te zijn.

Tests en productiebuild:

```bash
npm test
npm run build
```

Stop met Ctrl+C. De bestaande sessies worden uit `data/finance.sqlite` hervat bij de volgende start. Verwijder dit bestand niet tijdens een actieve sessie. Draai één serverproces per database; clustering en meerdere serverreplica's zijn buiten v0.1.

## Eerste sessie

1. Maak een **Nieuwe sessie** aan in het beheer.
2. Stel het aantal spelers en de rolaantallen in bij **Spelinstellingen**. Standaard: 14 spelers, 1 Manager, 1 Beveiliger, 2 Gokkers en 10 Werknemers. Voor 13 spelers: 9 Werknemers.
3. Voeg spelersnamen toe of laat spelers zich registreren via de QR-code.
4. Verdeel de rollen bij **Spelers & rollen**. Alleen de eigen rol wordt naar een telefoon gestuurd; andere spelers kennen alleen de Manager. Beide actieve Gokkers kennen elkaar.
5. Kies taakbeloningen en wijs taken per speler toe bij **Opdrachten**. Hier stel je ook de kleinere takenlijst van de Beveiliger in. De start is geblokkeerd als startkapitaal + alle toegewezen beloningen boven 100 uitkomen.
6. Stel het gezamenlijke Gokkersdoel in. Een nieuwe sessie heeft bewust geen verzonnen geldgrens of taakbeloningen.
7. Kies maximaal twee kaslocaties bij **Apparaten & QR**. Na meetings kun je ze handmatig wisselen.
8. Verbind alle apparaten en klik op **Start het spel**. Pauzeren, hervatten en beëindigen kan in het overzicht.

De drie besproken eindkeuzes staan standaard als volgt ingesteld:

- Alle Gokkers ontslagen: **direct werknemerswinst**. Bij de standaardverdeling moeten beide Gokkers weg.
- Een lege bedrijfskas: **doorgaan zolang er beschikbare taken zijn**.
- Een ontslagen Gokker: **deelt niet in teamwinst en zoekt nieuw werk**.

Als alle beschikbare toegewezen taken van actieve spelers klaar zijn en niemand heeft gewonnen, wordt het een gelijkspel. Ontslagen spelers kunnen hun resterende taken niet meer uitvoeren. Het bedrijf bereiken van 100 punten levert op zichzelf geen extra, ongevraagde winstregel op.

## Telefoons, acht laptops, iPad en digibord aansluiten

Alle apparaten moeten de algemene laptop via het netwerk kunnen bereiken. Gebruik hetzelfde wifi- of LAN-netwerk; een gastnetwerk met apparaat-isolatie werkt doorgaans niet. De server luistert standaard op `0.0.0.0:3000`.

1. Zoek het lokale IPv4-adres van de algemene laptop op. Linux: `hostname -I`; Windows: `ipconfig`; macOS: netwerkinstellingen.
2. Vul in **Apparaten & QR → Netwerkadres** bijvoorbeeld `http://192.168.1.20:3000` in, met je werkelijke LAN-IP.
3. Laat telefoons de gegenereerde QR-code scannen. De deelname-URL is `/play/SESSIECODE`.
4. Maak acht afzonderlijke koppellinks: `/laptop/SESSIECODE/1` t/m `/laptop/SESSIECODE/8`. Elke laptop heeft één vaste placeholdermodule en kiest vervolgens een spelersnaam.
5. Maak de digibordkoppeling voor `/board/SESSIECODE` en de iPad-koppeling voor `/emergency/SESSIECODE`.
6. Open de gegenereerde, volledige koppellink op het juiste apparaat. De link bevat een apparaatsleutel. Deze wordt meteen uit de adresbalk gehaald en lokaal bewaard, zodat een refresh opnieuw koppelt.
7. Als de OS-firewall dit blokkeert, laat dan TCP-poort 3000 op je eigen klasnetwerk toe.

Een directe laptop-, digibord- of iPad-route zonder sleutel geeft geen speltoegang. Een apparaatsleutel kan alleen zijn eigen interface gebruiken. De digibordsleutel kan geen meetings starten. Een telefoonsleutel kan geen beheeracties uitvoeren.

Deelnemen met een bestaande naam is alleen mogelijk als die naam nog niet geclaimd is; dit kan ook na de start. Nieuwe namen registreren kan alleen in de lobby. Tijdens een actieve sessie verstrekt de organisator een **Herstellink** als een telefoon zijn opslag kwijt is. Dit trekt de vorige toegang van die speler in, inclusief een open WebSocket. Deel persoonlijke herstellinks alleen met de betreffende speler. Het kiezen van een nog vrije naam is voor deze klassikale prototype-onboarding gebaseerd op vertrouwen; er is geen extra identiteitscontrole.

Voor gebruik buiten een vertrouwd lokaal klasnetwerk is HTTPS nodig. Zet achter een HTTPS-proxy `COOKIE_SECURE=true`, proxy ook WebSockets en stel een eigen sterk wachtwoord in. De lokale HTTP-opstelling is geen openbare hostingconfiguratie.

## Meerdere spelers in browsertabs demonstreren

**Vul met demonstratiegegevens** vult een lege lobby met 13 of 14 voorbeeldspelers, verdeelt rollen en wijst voorbeeldtaken toe. De knop is alleen in het beheer beschikbaar. De proefbalans is duidelijk testmateriaal: start 10, beloning 3 per toegewezen taak, Gokkersdoel 30, kaslaptops 2 en 6. Het is geen definitief balansvoorstel. De Beveiliger krijgt één taak, de andere voorbeeldspelers twee. Bij 14 spelers is maximaal 91 punten aan inkomsten mogelijk.

Open voor verschillende spelers bij **Spelers & rollen → Herstellink → Open apart demonstratietabblad**. `?demo=1` gebruikt `sessionStorage` per tab, terwijl een echte telefoon `localStorage` gebruikt. Meerdere demo-identiteiten blijven daardoor bij refresh gescheiden. Het uitgeven van een nieuwe herstellink vervangt steeds de vorige toegang van diezelfde speler.

Na het verdelen toont de telefoon een eigen rolsymbool en een introplaceholder. Met de pijl gaat de speler door. De organisator start de sessie pas wanneer de fysieke klas klaarstaat. Niet alle demonstratiespelers hoeven hun telefoon gekoppeld te hebben om te kunnen testen.

## Testbare spelstructuur

Zet **Testomgeving → Testmodus activeren** aan. Alleen een aangemelde beheerder mag deze endpoints gebruiken; de server controleert de instelling opnieuw. Buiten testmodus weigert ook een handmatig verstuurd adminverzoek een simulatie.

- **Opdracht voltooien**: kies speler en een toegewezen laptop. Het succes levert eenmaal de ingestelde beloning op. Een tweede poging faalt.
- **Diefstal innen**: kies een actieve Gokker, kaslaptop en buit. Diefstal moet eerder ontgrendeld zijn bij minimaal 25 bedrijfspunten. Test dit door echte taakbeloningen te simuleren of de bedrijfskas aan te passen.
- **Gokresultaat**: geef inzet en totale uitbetaling op. Netto wijziging is uitbetaling minus inzet. De gedeelde rekening mag niet negatief worden.
- **Rekeningen aanpassen**: test drempels en doelen. Reeds gereserveerd diefstalgeld kan niet uit de kas worden weggecorrigeerd.
- **Meeting oproepen**, **ontslag simuleren**, **eindcondities controleren** en **testsessie resetten** zijn apart afgeschermd. De ontslagtest kan bewust buiten overleg werken; normale Managerbediening kan dat niet.

Tijdens diefstal boekt de server buit onmiddellijk naar de gedeelde rekening. Vijf seconden lang blijft dit gedeelte rood in de bedrijfsbalk en gereserveerd in de kas. Vervolgens wordt het afgeschreven. De Beveiliger ontvangt de laptopmelding tien seconden na innen en kan het tijdstip controleren via analoge klokjes. Identiteit en bedrag van de dader worden niet naar de Beveiliger gestuurd. Per ronde zijn er maximaal twee controles; na een meeting reset het aantal.

Meerdere diefstallen reserveren nooit meer dan de niet-gereserveerde kas. Het bereiken van het Gokkersdoel beëindigt het spel meteen, ook terwijl de laatste buit nog op afschrijving wacht. Die reeds aangegane afschrijving wordt daarna afgerond.

## Meetings en tijd

De centrale toestandsmachine doorloopt:

```text
spelen → verzamelen → overleg → spelen
             ↑          ↓
     iPad / 3-minuten    eindconditie
```

Standaard duurt vrije gameplay 180 seconden, verzamelen 30 seconden en overleg 90 seconden. De admin kan deze waarden vóór de start instellen. De 30 seconden starten het overleg niet automatisch: de Manager bevestigt fysiek dat iedereen er is. Bij einde van de overlegtimer sluit de meeting zonder extra ontslag. De volgende vrije ronde begint, het automatische overleg telt opnieuw drie minuten en de emergency-knop heeft één minuut cooldown.

De Manager mag tijdens overleg maximaal één actieve speler ontslaan en kan een meeting sluiten zonder ontslag. Geheimrollen van ontslagen spelers worden openbaar. De organisator kan de meetingbediening overnemen als de Manager of diens telefoon uitvalt; dit is bestaande beheerbediening, geen nieuwe spelrol.

Een emergency meeting onderbreekt de automatische timer. Dubbele meetingaanvragen worden geweigerd. Tijdens een meeting weigert de server taken, diefstal, gokken en controles. De laptopplaceholder exposeert bovendien een gepauzeerde toestand voor toekomstige modules.

Adminpauze bevriest alle deadlines, inclusief open diefstallen en cooldowns; hervatten verschuift deadlines met de pauzeduur. Een serverherstart zonder expliciete pauze telt verstreken echte tijd mee en verwerkt achterstallige afschrijvingen en meetings. Timertekens gebruiken gesynchroniseerde servertijd, nooit een zelfstandige gezaghebbende clienttimer.

## Ontslagen spelers: nieuw werk zoeken

De aanvullende wens uit dit gesprek is gebouwd als een apart telefoontabblad:

- Een sobere, gedempte banenfeed met vier **fictieve** vacatures.
- Een korte opdracht om cv, diploma en motivatie te verzamelen.
- Een korte keuze van een bijpassend vaardigheidssymbool.
- Een sollicitatie gevolgd door een afwijzing; er volgt geen nieuwe baan.
- Reacties worden lokaal voor die speler bewaard.

Deze opdrachten staan volledig los van de spelkas, de toegewezen bedrijfstaken en de centrale winstcondities. Er zijn geen echte sollicitaties of externe diensten. De spectator kan blijven scrollen en kijken maar niet meer actief deelnemen. Ook een ontslagen Gokker krijgt dit tabblad. Hier staat bewust korte tekst, zoals later door jou gevraagd voor de vacatures en afwijzingen; de gewone gameplay gebruikt pictogrammen en spelersnamen.

## Wat werkt, wat nog placeholders zijn

| Onderdeel | Status |
|---|---|
| Centrale spelstatus en SQLite-herstel | Werkend |
| Roltoewijzing en server-side autorisatie | Werkend |
| Realtime updates naar 14 spelers en extra apparaten | Geautomatiseerd getest |
| Adminconfiguratie, sessieherstel, QR, koppellinks | Werkend |
| Alle vier mobiele rolinterfaces | Werkend |
| Acht laptoproutes en spelersselectie | Werkend |
| Diefstalboekingen, reservering, rood, melding | Werkend via admin-testmodus |
| Beveiligercontroles, max. twee per ronde | Werkend |
| iPad, automatische meetings, Managerontslag | Werkend |
| Digibord en drie eindschermen | Werkend |
| Spectator met fictieve sollicitatieopdrachten | Werkend, lokaal en zonder spelrechten |
| Acht financiële laptopminigames | Placeholders |
| Lockpick en Omleiding | Placeholders met modulemetadata |
| Gokrad en kansverdeling | Placeholder; serverresultaatadapter voorbereid |
| Introductievideo | Placeholder; optionele video-URL in beheer |
| Eigen plattegrond | Vervangbare `FloorMap`-component; huidige kaart is schematisch |
| Fysieke locatie en aanwezigheid | Eerlijkheidsregel, geen technische detectie |

Er is geen gewone spelersknop om zomaar geld te verdienen. Het sturen van `{success:true}` geldt niet als minigamebewijs.

## Projectstructuur en uitbreiden

```text
server/
  types.ts       Centrale modellen: sessie, speler, kas, diefstal, meetings
  store.ts       SQLite, credentials, transactiegrens, request-idempotentie
  engine.ts      Spelregels, eindcondities en deadlineverwerking
  views.ts       Expliciete gegevensprojectie per rol/apparaat
  minigames.ts   Register voor server-verifiërende speladapters
  app.ts         HTTP-authenticatie, API en WebSocketserver
  index.ts       Startpunt, .env en server lifecycle
src/
  Admin.tsx      Configuratie, spelers, taken, apparaten en tests
  Player.tsx     Onboarding, rolinterfaces en spectatorwerkzoeken
  Device.tsx     Laptop, digibord en emergency-iPad
  ui.tsx         Consistente iconen, balk, kaart en visuele timers
  api.ts         API-client, reconnect, klokcorrectie, LAN-veilige UUID's
  styles.css    Responsive crème/beige/brown/groen/rood ontwerp
scripts/setup.mjs
public/          Plaats voor toekomstige eigen media
tests/
  engine.test.ts      Spelregels met gecontroleerde tijd
  integration.test.ts Echte HTTP/WebSockets, herstart en autorisatie
```

De acht taakmodules hebben eigen ID's (`task-1-placeholder` t/m `task-8-placeholder`). Vervang hun weergave in `Device.tsx` door afzonderlijke componenten en registreer per minigame een `TaskAdapter` in `server/minigames.ts`. De `verify`-functie moet werkelijk succes controleren op de server, bijvoorbeeld via een serveruitgegeven poging met speler-/laptopbinding. Vertrouw nooit een clientflag. De centrale `complete()`-functie bewaakt toewijzing, spectatorstatus, spel/meetingfase en dubbele voltooiing.

Het huidige laptopselectiescherm is bewust geen bewijs van speleridentiteit en bevat geen beloningsendpoint. Voor de definitieve laptopminigames moet een poging aan de echte telefoontoegang of aan een door de server geverifieerde koppeling worden gebonden; het kiezen van een naam alleen is onvoldoende om succesbewijzen te autoriseren.

`theftModules` bevat de vastgelegde aantallen kliks/omleidingen, multipliers 1×–4× en `baseLoot:null`. De echte slagings- en verlieslogica van een poging wacht op de definitieve minigame. Spelers kunnen deze placeholder niet inzetten om te stelen. Een toekomstige implementatie moet eerst server-side de poging valideren en pas dan `steal()` aanroepen. Gokken gebruikt analoog een serverresultaatadapter en de bestaande `gamble()`-transactie.

De tijdverwerking loopt iedere 100 ms en schrijft alleen bij echte veranderingen. Elk command is synchroon en atomair: `BEGIN IMMEDIATE`, toestand lezen, autoriseren, muteren, requestresultaat + toestand opslaan, commit; pas daarna realtime publiceren. De idempotentiesleutel is uniek per sessie en actor. Geheime informatie wordt uitsluitend door `views.ts` geselecteerd; de frontend krijgt nooit een verborgen volledig sessieobject.

SQLite bevat `sessions`, `credentials` en `requests`. Spelers, opdrachten, toewijzingen, voltooiingen, kas/pot, transacties, meldingen, onderzoeken, cooldowns, ontslag en eindcondities zijn als getypeerde centrale sessiesnapshot opgeslagen. Toegangscontrole bewaart SHA-256-hashes van tokens. Een adminherstelantwoord wordt ook als idempotent requestresultaat bewaard; behandel de gehele database daarom als vertrouwelijk. Het datamapje en databasebestand krijgen beperkte lokale bestandsrechten. Adminsessies gebruiken een HttpOnly/SameSite-cookie met acht uur looptijd. Verwijderen of vervangen van een spelercredential verbreekt ook de realtimeverbinding. WebSockets sturen eerst authenticatie; vóór die stap gaat geen spelstatus naar de client.

## Verificatie

`npm test`: **31 tests geslaagd**, waaronder:

- 13 en 14 spelers, correcte rolverdeling, alleen Manager openbaar en Gokkerspartners.
- Eenmalige taakbeloning, idempotente replay, ongeldig succesbewijs en serveradapter.
- Diefstal ontgrendeling en blijvende beschikbaarheid, vijf/tien seconden timing.
- Concurrerende geldreserveringen en maximaal twee geldlocaties.
- Beveiligerlimiet, onderzoekstijdstippen en reset.
- Automatische/emergency meetings, cooldown en volgende ronde.
- Eén ontslag per overleg en geblokkeerde spectatoracties.
- Alle gekozen eindregels, gedeeld gokken en inkomstenplafond.
- Verkeerde rollen, apparaten en sessietokens geweigerd.
- **14 speler-WebSockets + 8 laptop-WebSockets + digibord + iPad** gesynchroniseerd met echte HTTP-verzoeken.
- Herstel na serverherstart inclusief credentials, idempotentie en open diefstal.
- Refresh/reconnect met dezelfde speleridentiteit, intrekken van oude toegang.

Daarnaast is de app gestart en in de browser gecontroleerd op desktop- en telefoonformaat: login, demo, configuratie, rolintro, Gokkerstabbladen, spectatorwerkzoeken, QR/apparaatkoppelingen en meetings. Details staan in `TESTVERSLAG.md`.

Niet fysiek getest: echte klas-wifi, een echte iPad en 24 verschillende fysieke apparaten. De meerapparatencontrole gebruikt 24 echte verbindingen vanaf één testhost.

## Openstaande ontwerpbeslissingen

De drie oorspronkelijke eindregels zijn in dit gesprek beslist en configureerbaar verwerkt. Nog te bepalen:

- De definitieve acht financiële minigames en hun server-side succesbewijzen.
- Taakverdeling en beloningen voor de echte klas; demo is slechts proefdata.
- De gewenste gezamenlijke Gokkersgeldgrens voor de echte sessie.
- Standaardbuit, moeilijkheid en volledige poginglogica voor Lockpick/Omleiding.
- Kansverdeling, inzetten en definitieve presentatie van het gokrad.
- Exacte wisselregel voor kaslocaties na één/twee meetings; v0.1 gebruikt handmatige wisseling.
- Eigen plattegrond, instructievideo en eventuele audiovormgeving.

Er zijn geen bezuinigingen, nieuwe rollen, automatische locatieverdeling of realtime spelertracking toegevoegd.

Technische referenties: [Node SQLite](https://nodejs.org/api/sqlite.html), [ws-documentatie](https://github.com/websockets/ws/blob/master/README.md), [Vite](https://vite.dev/guide/).
