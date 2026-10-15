# Finance Imposter

Een klassenspel met persoonlijke telefoons, acht taakterminals, een digibord en een emergency-iPad. De server controleert rollen, opdrachten, geld en spelregels. De bestaande vormgeving gebruikt vooral symbolen; er is geen geluid.

## Lokaal draaien

Gebruik Node.js 24 LTS en npm. Vanuit deze map:

```powershell
npm ci
npm run setup
npm test
npm run build
npm start
```

De gebouwde game draait op http://localhost:3000. Setup maakt alleen een ontbrekende `.env` en vraagt om een eigen beheerderswachtwoord. Voor ontwikkeling: `npm run dev`; open http://localhost:5173. Vite proxy't `/api` en `/ws` met behoud van de oorspronkelijke host.

## Met telefoons en laptops testen

1. Zet in `.env` `HOST=0.0.0.0`, `PORT=3000` en voor lokaal HTTP `COOKIE_SECURE=false`. Herstart de server na wijzigingen aan `.env` of servercode.
2. Zoek het lokale IPv4-adres met `ipconfig`. Alle apparaten moeten op hetzelfde bereikbare wifi-/LAN-netwerk zitten. Gastnetwerken kunnen apparaten van elkaar isoleren.
3. Vul bij **Apparaten & QR → Netwerkadres** bijvoorbeeld `http://192.168.1.20:3000` in, met jouw werkelijke adres. Gebruik op andere apparaten dit adres, niet localhost.
4. Maak een nieuwe sessie. Laat spelers hun eigen naam registreren op hun telefoon, of voeg namen vooraf toe. Registraties komen in de wachtrij.
5. Klik bij **Spelers & rollen → Iedereen toelaten**. Verdeel de rollen; taken worden meteen automatisch verdeeld: Manager 2, Beveiliger 1, anderen 3. Handmatig aanpassen en opnieuw automatisch verdelen blijven mogelijk vóór de start.
6. Genereer acht aparte laptopkoppellinks, een digibordlink en een emergency-link. Open de volledige gegenereerde links op de apparaten. De apparaatsleutel wordt lokaal bewaard en uit de adresbalk gehaald.
7. Start het spel. Zonder video start het direct; met video begint de gezamenlijke briefing op het digibord.
8. Laat zo nodig TCP-poort 3000 door op het particuliere Windows-netwerk. Laat de serverlaptop wakker en verbonden.

Telefoons openen `/play/SESSIECODE`. Een kale laptop-, bord- of emergency-route geeft geen toegang: gebruik de gegenereerde koppellink. Een telefoon- of apparaatsleutel verleent nooit beheerrechten.

Een geclaimde naam kan niet opnieuw worden gekozen. Bij verloren telefoonopslag maakt de beheerder een persoonlijke herstellink; deze trekt de vorige koppeling in. Nieuwe namen kunnen alleen in de lobby registreren. Het eerste kiezen van een nog vrije vooraf toegevoegde naam is gebaseerd op vertrouwen, niet op extra identiteitscontrole. Gebruik `demo=1` in demonstratielinks om verschillende spelers in aparte tabs te houden.

## Telefoon en financiële taken

Elke laptop heeft één permanente code van vier vormen. Die blijft gelijk bij een nieuw spel, reset en serverherstart, zolang dezelfde opslag behouden blijft. Er staat geen naamkeuzelijst op terminals.

De speler opent een toegewezen taak op de telefoon en voert de laptopcode in. Daarna verschijnt de financiële opdracht op de juiste terminal. De extra taakcode is vervallen. Alleen die gekoppelde terminal kan het antwoord insturen. De server controleert het antwoord en beloont precies eenmaal. Een bezette terminal kan niet door een ander worden overgenomen. Annuleren, meeting, ontslag en reset geven de terminal vrij; een ongebruikte koppeling verloopt na vijf minuten. Pauzeren bevriest die termijn.

| Terminal | Financieel onderwerp |
|---|---|
| 1 | Begroting: inkomsten en uitgaven sluitend maken |
| 2 | Factuurcontrole: aantallen, prijs en bijkomende kosten |
| 3 | Valuta wisselen met een weergegeven koers |
| 4 | Spaarsaldo na rente berekenen |
| 5 | Verzekeringsuitkering na eigen risico |
| 6 | Kascontrole met aantallen bankbiljetten |
| 7 | Winst uit omzet en kosten |
| 8 | Portefeuille verdelen over aandelen en obligaties |

Elke poging krijgt nieuwe bedragen en vier antwoordopties. De server bewaart het antwoord; de telefoon krijgt het antwoord of de puzzel niet. Het terminalscherm toont geen geheime rol of steelmodus.

## Gokkers

De kas wordt standaard vanaf 25 bedrijfspunten blijvend toegankelijk voor diefstal. De beheerder kiest maximaal twee kaslaptops. Een gokker voert dezelfde permanente laptopcode in op de eigen telefoon en kiest daarna:

- **Lockpick:** draai vier sloten per ronde naar het weergegeven symbool.
- **Omleiding:** draai drie leidingen per ronde naar de weergegeven uitgang.

Bevestig iedere stap. Een fout verliest de opgebouwde buit van de poging. Er zijn vier rondes met respectievelijk 1×, 2×, 3× en 4× de ingestelde basisbuit. Innen kan pas na een voltooide ronde, ook halverwege de volgende ronde. Niet voltooide stappen tellen niet mee. Na ronde vier kan niet worden doorgestapeld. Refresh behoudt de poging; een meeting beëindigt haar zonder uitbetaling. Bij een lege kas is innen onmogelijk; bij te weinig vrije kas wordt maximaal het nog beschikbare bedrag geïnd.

De server boekt geïnde buit direct op de gezamenlijke gokkersrekening. Het bedrag blijft vijf seconden rood en gereserveerd in de bedrijfskas, wordt daarna afgeschreven en leidt tien seconden na innen tot een Beveiliger-melding. Gelijktijdige diefstallen kunnen hetzelfde geld niet dubbel innen.

Het **gokrad** gebruikt een door de server bepaalde winkans van 55%. Een gewonnen draai betaalt 2× de inzet terug; verlies betaalt 0. Netto = totale uitbetaling − inzet. Inzet 5 geeft dus +5 of −5. De browser bepaalt nooit de uitslag. Alleen een actieve Gokker met voldoende saldo kan draaien; een draai heeft een wachttijd van 1,5 seconde.

## Meetings, Beveiliger en ontslag

Automatische meetings starten standaard na drie minuten vrij spel. De gekoppelde iPad kan een emergency-meeting starten; na een meeting geldt standaard een minuut cooldown.

De Manager beheert op de eigen telefoon achtereenvolgens **verzamelen → overleg → ontslag → meeting sluiten**. De timers van 30 en 90 seconden zijn richtlijnen: fasen gaan niet vanzelf verder. Er kan maximaal één speler worden ontslagen, of de Manager sluit zonder ontslag. De organisator kan bij uitval overnemen. Andere telefoons, inclusief ontslagen spelers, en terminals zijn gedurende alle meetingfasen geblokkeerd. De server weigert taken, diefstal, gokken en onderzoek tijdens een meeting.

De Beveiliger blijft werken zoals in de oorspronkelijke game: twee controles per ronde, reset na meeting, laptopmeldingen pas na tien seconden en transactietijden via analoge klokjes. Geen identiteit of bedrag van de dader wordt doorgestuurd.

Ontslagen spelers hebben geen spelrechten meer. Buiten meetings kunnen ze een doorlopende fictieve vacaturefeed bekijken en solliciteren; sollicitaties leveren een afwijzing op en hebben geen effect op het spel. Er wordt geen externe sollicitatie verstuurd.

## Eindregels en verslag

- Gokkers winnen bij hun ingestelde gezamenlijke financiële doel; ontslagen Gokkers delen mee.
- Werknemers winnen wanneer de beschikbare bedrijfskas 100 bereikt of alle Gokkers zijn ontslagen.
- Zonder winnaar en zonder resterende taken van actieve spelers eindigt het spel in gelijkspel.
- Een lege kas op zichzelf beëindigt het spel niet.
- Het eindverslag toont alle rollen, ontslagen spelers, taakvoortgang en persoonlijke winst. Reeds gereserveerde buit telt niet mee voor het bedrijfsdoel. De kas in het verslag houdt rekening met nog af te schrijven buit.

Taken en beloningen zijn instelbaar. Meer dan 100 potentiële inkomsten is toegestaan: het bereiken van 100 is een eindconditie. Demonstratiegegevens zijn testmateriaal: 13 of 14 fictieve spelers, automatische taken, beloning 3, gokkersdoel 30, basisbuit 3, kaslaptops 2 en 6. Een nieuwe normale sessie gebruikt beloning 8, gokkersdoel 45 en basisbuit 5.

## Eigen briefingvideo toevoegen

Plaats `briefing.mp4` in `public/` en vul bij **Spelinstellingen → Introductievideo** `/briefing.mp4` in. Een directe HTTPS-videolink kan ook. Het digibord toont de afspeelknoppen. Na de video start het spel; bij een kapotte link kan de organisator of het digibord met de pijl doorgaan. Gebruik een direct afspeelbaar bestand, geen gewone YouTube-paginalink. Zonder ingestelde video volgt geen gezamenlijke briefing. Voor grote video's online verdient een externe videohost de voorkeur.

## Gratis Vercel + Neon

Vercel Hobby en Neon Free kunnen dit kleine persoonlijke prototype binnen hun gratis gebruikslimieten hosten. Vercel Hobby is voor persoonlijk, niet-commercieel gebruik; gratis plannen hebben quota. Controleer de actuele voorwaarden bij Vercel en Neon.

1. Importeer deze repository in je eigen Vercel-account, of gebruik de Vercel CLI. Bouwcommando: `npm run build`; uitvoermap: `dist`. `vercel.json` regelt de API-routes en de spelroutes.
2. Koppel via **Vercel → Storage → Create Database → Neon** een database op het **Free**-plan. Laat `DATABASE_URL` toevoegen aan de juiste omgeving. Kies geen betaalde upgrade.
3. Stel een eigen `ADMIN_PASSWORD` van minstens twaalf tekens in als servervariabele. Zet nooit een `VITE_`-prefix voor een geheim.
4. Om bestaande laptopcodes te behouden: exporteer uitsluitend de tabel `laptop_codes` naar een object met sleutels 1 t/m 8 en zet dat object als servervariabele `LAPTOP_CODES_JSON`. Deze wordt alleen gebruikt bij eerste initialisatie van een lege clouddatabase. Zonder deze variabele maakt de nieuwe cloudopslag eigen permanente codes.
5. Deploy opnieuw nadat de variabelen zijn ingesteld. Controleer `/api/health`, login, nieuwe sessie, telefoonregistratie en een gekoppelde terminal vanaf een tweede apparaat.

Online gebruikt de app korte HTTP-verzoeken met updates ongeveer iedere twee seconden (minder vaak in verborgen tabs). Lokaal gebruikt zij WebSockets. Speldeadlines blijven op de server opgeslagen; online worden verstreken deadlines bij de volgende aanvraag verwerkt. Een onbezette online game behoeft geen doorlopend serverproces. Neon bewaart de gedeelde status, inclusief identiteit en verwerkte verzoeken; gelijktijdige wijzigingen worden atomair met versiecontrole opgeslagen. Dezelfde engine en autorisatie worden lokaal en online gebruikt. Dit is bedoeld voor een kleine klas, niet voor grootschalige hosting.

De huidige site is handmatig gepubliceerd op https://finance-imposter.vercel.app. Automatische GitHub-deployments zijn nog niet gekoppeld. Vercel Hobby controleert bij Git-deployments of de commit-auteur bij het account hoort. De repositorygeschiedenis is daarom niet gewijzigd; de handmatige release bevat uitsluitend de huidige bronbestanden.

Voor een volgende handmatige publicatie vanaf jouw gekoppelde, ingelogde account:

```powershell
npm test
npm run build
npm run deploy:prepare
```

Voer daarna het door het script getoonde `npx vercel deploy --cwd ... --prod --yes`-commando uit. De export bevat geen `.env`, databases, toegangssleutels of Git-geschiedenis. Vercel gebruikt de al ingestelde servervariabelen en dezelfde Neon-database; laptopcodes blijven dus behouden.

Lokale SQLite blijft de eenvoudigste optie zonder cloudaccounts. Bewaar `.env`, `data/`, databases, sleutels en `.vercel/` buiten Git. Een lege nieuwe database neemt bestaande codes of sessies niet automatisch over.

## Testen en structuur

```powershell
npm test
npm run build
```

De tests gebruiken tijdelijke opslag, echte HTTP/WebSocket-verbindingen, gecontroleerde tijd en afzonderlijke gesimuleerde cloudinstanties. Ze controleren onder meer 14 spelers plus 10 apparaten, koppelen en hervatten, financiële antwoorden, dubbele verzoeken, alle steelrondes, geldreserveringen, gokken, autorisatie, wachtrij, briefing, meetings, Beveiliger, eindregels en herstart. De cloudtests simuleren het opslagprotocol; echte Vercel-/Neon-controle vereist een gekoppeld account en database.

Belangrijke bestanden: `server/engine.ts` (regels), `server/puzzles.ts` (financiële opdrachten), `server/views.ts` (gegevens per rol), `server/store.ts` (SQLite), `server/cloud.ts` en `api/index.ts` (cloudopslag), `src/GameWidgets.tsx` (spelinteracties). De vormgeving staat in `src/styles.css`.
