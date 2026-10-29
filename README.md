# Gamblers Addiction

Een klassenspel met persoonlijke telefoons, acht taakterminals, een digibord en een emergency-iPad. De server controleert rollen, opdrachten, geld en spelregels. De vormgeving combineert symbolen, diagrammen en korte uitleg. Optionele geluiden ondersteunen de feedback.

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

De server boekt geïnde buit direct op de gezamenlijke gokkersrekening. Het bedrag blijft dertig seconden gereserveerd. Daarna volgen de afschrijving, een rode verliesstrook gedurende acht seconden en een neutrale melding voor de Beveiliger. Gelijktijdige diefstallen kunnen hetzelfde geld niet dubbel innen.

Het **gokrad** heeft acht even waarschijnlijke vakken met vermenigvuldigers, bonussen en inzetverlies. Een draai duurt vijf seconden; pas daarna boekt de server het resultaat. Zie de actuele regels en teststappen hieronder.

## Meetings, Beveiliger en ontslag

Automatische meetings starten standaard na vier minuten vrij spel. De gekoppelde iPad kan een emergency-meeting starten; na een meeting geldt standaard een minuut cooldown.

De Manager beheert op de eigen telefoon achtereenvolgens **verzamelen → overleg → ontslag → meeting sluiten**. De timers van 30 en 90 seconden zijn richtlijnen: fasen gaan niet vanzelf verder. Er kan maximaal één speler worden ontslagen, of de Manager sluit zonder ontslag. De organisator kan bij uitval overnemen. Andere telefoons, inclusief ontslagen spelers, en terminals zijn gedurende alle meetingfasen geblokkeerd. De server weigert taken, diefstal, gokken en onderzoek tijdens een meeting.

De Beveiliger blijft werken zoals in de oorspronkelijke game: twee controles per ronde, reset na meeting, directe taakfoutmeldingen, diefstalmeldingen na dertig seconden en transactietijden als digitale tijdstippen met seconden. Geen identiteit of bedrag van de dader wordt doorgestuurd.

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

## Nieuwe spelbediening en zelf testen

De acht terminalopdrachten gebruiken een balans, factuurdocumenten, wisselroute, spaargrafiek, schadedossier, biljettenkas, winststroom en portefeuillecirkel. Koppel de telefoon met de vier permanente laptopsymbolen en voer daarna de opdracht op de laptop uit. Elk financieel onderdeel duurt 45 seconden. Een fout of verlopen tijd trekt de koppeling in en kost maximaal €2 uit de vrije bedrijfskas. Koppel opnieuw voor een nieuwe poging; er wordt nooit gereserveerde buit uitgegeven. Zie ONDERZOEK.md voor bronnen en ontwerpkeuzes.

Het buitrad heeft zestien even waarschijnlijke vakken: acht keer inzetverlies, twee keer halve inzet terug, twee keer €1 nettowinst, drie keer ×2 en één ×4-jackpot. Vermenigvuldigers zijn uitbetaling inclusief inzet; halve uitbetaling rondt naar beneden af. De gemiddelde uitbetaling is lager dan de inzet, ook bij €1. Eén gedeelde draai tegelijk, maximaal €12.500 inzet, duur vijf seconden. De server reserveert de inzet en bepaalt de uitkomst bij de klik; de browser krijgt meteen de draaitijden en het doelvak, zonder op de volgende poll te wachten. Het saldo wordt pas aan het einde geboekt. De beweging loopt met de Web Animations API op de compositor, zonder React-updates per frame. Pauzeren bevriest het rad. Een meeting, ontslag van de draaiende speler of speleinde annuleert een onafgeronde draai zonder afschrijving.

Een foute terminalboeking geeft geen beloning, kost maximaal €2 en meldt eenmaal per gekoppelde poging een taakfout aan de Beveiliger. Een mislukte steelstap geeft ook een taakfout. Na innen wordt de kas na dertig seconden afgeschreven en ontvangt de Beveiliger de diefstalmelding. Scans tonen fout- en transactietijden, geen namen. Een fout bewijst geen geheime rol. Er blijven twee scans per ronde. De Manager kan vanaf het overleg expliciet **Niemand ontslaan · hervatten** kiezen.

Geluid staat standaard aan en wordt na een tik in de browser geactiveerd, met een luidsprekerknop om te dempen. Meetingmeldingen blijven actief tijdens scrollen, rolintroductie en meetingoverlays. Houd de spelpagina open; een geblokkeerde telefoon of achtergrondtab kan geluid door browser- of apparaatbeleid onderdrukken. De voorkeur blijft op het apparaat bewaard. Feedback gebruikt ook tekst en beweging; minder beweging volgt de apparaatinstelling.

1. Lokaal: `npm ci`, `npm run setup`, `npm run dev`. Gebruik voor andere apparaten op hetzelfde wifi-netwerk `HOST=0.0.0.0` in je lokale `.env`, herstart en open `http://JOUW-LAN-IP:5173`. Laat Node alleen op het privénetwerk toe in Windows Firewall. Een 127.0.0.1-link werkt alleen op het apparaat zelf. Genereer QR-links vanaf het LAN-adres. Zie ook de LAN-instructies hierboven.
2. Maak een aparte testsessie met demonstratiegegevens en open gekoppelde telefoons/laptops via **Apparaten & QR**. Gebruik aparte apparaten of privévensters voor verschillende telefoons.
3. Koppel een taak via de telefoonsymbolen. Geef eerst een fout bedrag: geen beloning, wel een Beveiliger-melding. Scan die laptop, koppel opnieuw en bevestig het juiste bedrag: eenmaal belonen.
4. Zet in testmodus de kas op 40 en buit op 10. Draai het rad: vijf seconden blijft de buit 10; pas bij stoppen verandert ze. De andere Gokker kan niet tegelijk inzetten. Controleer pauzeren en een meeting tijdens een draai.
5. Voltooi een steelronde en kies **Buit innen**. De kas blijft dertig seconden gelijk, daarna volgen afschrijving, een rode verliesstrook gedurende acht seconden en de Beveiliger-melding. Roep een meeting op, doorloop verzamelen en overleg, kies niemand ontslaan en controleer of alle apparaten hervatten.
6. Online werkt dezelfde test op de Vercel-URL. Door polling komen updates ongeveer iedere twee seconden; de server bewaakt de vijfseconden-deadline. Gebruik een eigen testsessie om een bestaand spel niet te beïnvloeden.

### GitHub en publicatie

Op 15 oktober 2026 is gecontroleerd dat Vercel-project `finance-imposter` geen Git-repositorykoppeling heeft. De toen actieve release kwam handmatig uit `codex/permanente-laptopcodes`. Deze verbeteringen zijn voorbereid op `codex/financiele-minigames-feedback`. Een lokale branch is niet automatisch een Vercel-productiebranch.

Voor automatische publicatie: verbind in **Vercel → Project → Settings → Git** de repository `GamblersRehabilitation/finance-imposter` en kies bij **Production Branch** de gewenste branch, bijvoorbeeld `main`. Daarna start een push op die branch een productiebuild; andere branches krijgen normaal een preview. GitHub App-toestemming en commit-auteurrechten moeten op het eigen account kloppen. Deze wijziging schakelt die koppeling nog niet in. Handmatig publiceren kan via `npm run deploy:prepare`.

De telefoonpagina gebruikt voor alle rollen dezelfde bovenkant: profiel, uitleg, taken en werkvloer. De Gokker scrolt daarna naar partner/buit, Stelen en het Rad; er zijn geen Gokker-tabbladen meer. De standaard vrije ronde is vier minuten. Bestaande sessies met de vorige standaard van drie minuten en nog openstaande oude diefstaldeadlines krijgen de nieuwe tijden eenmaal bij het laden. Andere handmatig ingestelde rondeduren blijven behouden.

De profielbadge bovenaan is voor actieve spelers neutraal. De eigen rol staat in de persoonlijke uitleg; zo verraadt de bovenkant van de telefoon de Gokker niet.

## Lobbybeheer, MP4 en opnieuw spelen

Op **Overzicht** laat je spelers afzonderlijk of tegelijk toe, stel je Manager/Beveiliger/Gokker-aantallen in en upload je de briefing. Alle overige deelnemers worden werknemers. Er is geen vooraf ingestelde lobbycapaciteit in de bediening. **Verdeel rollen en start** verdeelt rollen en taken in dezelfde servertransactie. Het overzicht toont geen rol per speler. Het digibord toont vóór de start een QR-code, lobbycode, deelnemers en hun toelating.

Na afloop staat onder **Lobbybeheer** de knop **Opnieuw met deze deelnemers**. Deze behoudt namen, toelating, telefoontokens, schermkoppelingen, instellingen en permanente laptopcodes. Rollen, taken, ontslagen, rekeningen, incidenten, sollicitaties en resultaten worden gewist. De volgende start verdeelt rollen en taken opnieuw. Een lopend spel moet eerst worden beëindigd. Dubbele verzoeken uit het vorige spel kunnen het nieuwe spel niet opnieuw resetten.

Oude lobbies verwijder je onder **Lobbybeheer** door de lobbycode te typen. Alleen de beheerder kan een lobby in voorbereiding of na afloop definitief wissen. Telefoon- en schermtokens van die lobby worden ingetrokken; andere lobbies en de globale laptopcodes blijven bestaan. De MP4 wordt hierbij niet automatisch uit Blob-opslag verwijderd: meerdere lobbies kunnen dezelfde videolink gebruiken. Verwijder ongebruikte video's eventueel in Vercel Storage.

Upload op Overzicht een **MP4 van maximaal 50 MB**, bij voorkeur H.264. Lokaal wordt die in de genegeerde map `data/uploads` opgeslagen. Online gaat het bestand rechtstreeks naar de publieke Vercel Blob-store, zodat ook grotere video's buiten de function-bodylimiet blijven. De server verstrekt alleen na beheerderscontrole een tijdelijk uploadtoken voor één MP4-pad. Vereist: `BLOB_READ_WRITE_TOKEN` als afgeschermde servervariabele, automatisch gekoppeld door de Blob-installatie. De briefing start pas nadat iemand op het digibord afspelen kiest; browserbeleid kan automatisch afspelen blokkeren. Na afloop begint het spel; de organisator kan ook de briefing afronden.

De vier filmpjes bij de persoonlijke roluitleg duren exact tien seconden en hebben geen audiospoor. Ze staan in `public/roles`. De bewerkbare Remotion-bron staat in `role-videos`; de app heeft Remotion niet nodig tijdens het spelen. Open die map met `npm ci` en `npm run dev` voor Studio; exporteer met `npx remotion render employee ../public/roles/employee.mp4 --muted`, en analoog voor manager/security/gambler.

Ontslagen spelers kunnen solliciteren met servergestuurde wachttijd, controlebalk en uitslag. Een deel wordt eerst groen en daarna afgewezen. Een aangenomen toeschouwer keert niet terug in het actieve spel. Resultaten blijven bij vernieuwen behouden en worden bij opnieuw spelen gewist.

Taak- en sollicitatiebalken bewegen eveneens lokaal met compositoranimaties; de klokweergave ververst eenmaal per seconde. Draaien, schuiven en financiële bedragen instellen werken lokaal; alleen bevestigde acties worden naar de server gestuurd. De client mag geen definitieve uitbetaling of succes kiezen.

## Moeilijkere opdrachten en willekeurige steelspellen

Nieuwe financiële pogingen gebruiken gevarieerde hele bedragen: begroting en winst met oneven antwoorden, facturen met nabije afleiders, wisselverhoudingen zoals €3 → $5, oneven rentepercentages plus rekeningkosten, een verzekeringslimiet, vijf soorten biljetten/munten en wisselende portefeuillepercentages. Alle antwoorden blijven hele getallen. De terminal biedt directe gehele invoer en stappen van €1, €3 en €5; er zijn geen onbereikbare antwoorden door een vaste stap van €10. Reeds lopende oude vragen houden hun oorspronkelijke bedragen.

Na het koppelen wijst de server willekeurig **Slot kraken** of **Geld omleiden** toe. De speler kiest geen methode. Het slot heeft per ronde vier timingpinnen met een gouden trefzone; volgende pinnen en rondes krijgen minder marge en meer snelheid. De wijzer beweegt lokaal met de Web Animations API. Alleen de stoptijd wordt verstuurd. De server berekent de hoek zelf, controleert de tijdmarge en verwerkt iedere nonce eenmaal.

Omleiden gebruikt twaalf draaibare rechte stukken, bochten en splitsingen. Verbind IN linksboven met UIT rechtsonder. Draaien, resetten en de geldroute markeren lopen lokaal; alleen **Test route** stuurt de rotaties naar de server. Die controleert de oorspronkelijke stukken en echte onderlinge aansluitingen. Elke nieuw gegenereerde puzzel heeft een oplossing en begint onverbonden. Eén verbonden route voltooit één ronde. Vier rondebeloningen tellen op zoals bij het slot; een fout kost de opgebouwde buit en maximaal €2 vrije bedrijfskas. Oude steelpogingen worden bij openen eenmalig naar de nieuwe uitvoering vernieuwd, met behoud van ronde en buit.

Bevestigde acties sturen direct de toegestane nieuwe spelstatus terug. Telefoons hoeven na een goede pin, koppeling of sollicitatie niet op de volgende cloudpoll te wachten. De browser accepteert alleen nieuwere revisies voor dezelfde sessie en identiteit; lopende radanimaties blijven beschermd tegen vroeg zichtbare uitbetalingen.

## Toegankelijkere bediening en rolherkenning

De meetingknop vult nu een groot deel van het oproepscherm; ook de primaire meetingacties op de Managertelefoon zijn groter. De browser gebruikt aparte SVG-tabiconen voor beheerpagina's, telefoons, rollen, het digibord, meetings en de acht taaktypes. Op de telefoon is de profielbadge rolgebonden: kroon, schild, schoppen of persoon.

Nieuwe verzekeringsvragen hebben één aftreksom, zonder aanvullende dekkingslimiet. De speler kiest één van vier bedragen en bevestigt. Bedragen blijven geheel. Oude lopende dossiers met een limiet behouden hun oorspronkelijke vraag en antwoord.

De vier lockpickpinnen gebruiken achtereenvolgens de buitenste ring en drie steeds kleinere binnenringen. Wijzer en trefzone liggen altijd op dezelfde actieve ring. Iedere volgende pin draait sneller; een nieuwe ronde begint weer op de buitenring en heeft een hogere basissnelheid.

Elke financiële taak bestaat uit drie verschillende minigames. Alle drie komen uit één persoonlijke, geschudde stapel van twintig varianten. Iedere variant wordt eenmaal aangeboden voordat de stapel opnieuw wordt geschud. Soortgelijke spelwerkingen en rekensommen worden waar mogelijk binnen een reeks gespreid. De persoonlijke reeks blijft bewaard bij herkoppelen, fout, herladen en meeting; een nieuwe taak krijgt een nieuwe trekking. Elk onderdeel heeft 45 seconden. Alleen na alle drie volgt de taakbeloning. Na een fout (standaard €700 kasverlies bij 14 spelers), verlopen tijd of meeting koppel je opnieuw; afgeronde onderdelen blijven bewaard. Opnieuw spelen en testreset wissen deze voortgang. De uitkering vraagt alleen schade minus eigen risico, met vier antwoordkeuzes.


Spelbalans (oktober 2026): alle rollen beginnen met twee verschillende laptoptaken. Iedere hervatte meeting voegt twee nieuwe taken toe tot maximaal acht open taken; afgeronde taken verdwijnen en dezelfde laptop kan later opnieuw werk geven; een taak blijft drie verschillende minigames bevatten. Afgeronde onderdelen blijven bewaard. Standaard levert een taak €5.000 op en kost een fout hetzelfde als de basisbuit van één steelronde (bij 14 spelers €700). Startkas, kasdoel en buitdoel schalen automatisch met het aantal spelers (handmatig instelbaar via Spelinstellingen). Bij 14 spelers: €42.000 start, €490.000 bedrijfsdoel, €168.000 gezamenlijk buitdoel. Alleen de nog actieve medewerkers tellen niet opnieuw voor de schaal: ontslag verlaagt de doelen tijdens het spel niet.

Het rad heeft precies acht winst- en acht verliesvakken. Iedere Gokker heeft twee spins per ronde, ook na refresh; een geannuleerde draai wordt niet teruggegeven. Inzet is begrensd. De zwarte markt verkoopt drie gedeelde aankopen: horloge, auto en villa. Het team moet alle drie kopen voor de aankoopwinst; geld op de rekening alleen geeft geen winst. Nul euro bedrijfskas of uitsluitend actieve Gokkers betekent Gokkerswinst. Een gereserveerde diefstal schrijft nog steeds pas na 30 seconden af.

Ontslagen spelers krijgen een afgeschermde vacatureweergave zonder kas, andere spelers, meetings of eindbedragen. Elke vacature gaat van controle naar groen en eindigt rood. Solliciteren blijft tijdens meetings mogelijk. De Beveiliger krijgt aanvankelijk alleen ‘Verdacht verkeer’; een scan geeft pas aanwijzingen over wat er gebeurde. Het emergency-scherm activeert nu ook audio na interactie en laat dempen/aanzetten toe.

Opslag: zodra een nieuwe lobby wordt gemaakt, worden afgelopen sessies inclusief hun speler- en schermtokens en verzoekcache verwijderd. Tot die tijd is opnieuw spelen mogelijk. Lopende spellen en voorbereide lobbies blijven bij gewone aanmaak bestaan. De beheerder kan via POST /api/admin/reset-sessions met {"confirm":"ALLE SESSIES"} eenmalig alle sessies legen; beheerderslogin en permanente laptopcodes blijven behouden. Cloudopslag bewaart één gzip-gecomprimeerde snapshot in Neon; oude ongecomprimeerde snapshots blijven leesbaar. Aanwezigheid schrijft maximaal eenmaal per ongeveer 30 seconden per apparaat, in plaats van bij iedere hartslag.


De lobby heeft een tab **Plattegrond**: muren en horizontale/verticale deuren op een raster met 16 kolommen en 10–24 instelbare rijen (nieuwe standaard: 14), acht verplaatsbare fysieke laptops en per laptop keuze uit twaalf financiële afdelingssymbolen. Eén algemene kaart wordt apart van de sessies opgeslagen en voor alle sessies gebruikt, ook nadat de laatste lobby is verwijderd. De nieuwste bestaande sessiekaart wordt bij de migratie behouden. De spelerskaart toont alleen een groot spelsymbool en het laptopnummer. Bewerken kan uitsluitend in de lobby. De permanente code blijft bij de fysieke laptop horen, ook als positie of spel verandert. Vier nieuwe spellen: salariscontrole, btw boeken, dubbele betalingen en betaalvolgorde.

Afgeronde taken verlaten de open wachtrij meteen. Na meetings worden maximaal twee nieuwe taken toegevoegd, ook voor eerder betaalde laptops. Per speler blijft één open taak per laptop mogelijk, tot acht tegelijk. De beloningshistorie gebruikt opeenvolgende cycli; oude poging-ID’s kunnen geen nieuwe taak afhandelen. Afronden van de huidige wachtrij beëindigt het spel niet; de volgende meeting levert nieuw werk.

Na iedere meeting verhuizen de kaslocaties naar laptops die in de vorige ronde geen kas hadden. Alleen de Gokkertelefoons krijgen die markeringen. Historische diefstallen en scans blijven aan de oorspronkelijke fysieke laptop gekoppeld. Lockpick wordt bij elke pin sneller, ook tussen opeenvolgende rondes. Omleiden krijgt 60, 55, 50 en 45 seconden per route; verlopen tijd wordt door de server gecontroleerd, pauze verschuift de deadline en na vier voltooide rondes vervalt de routetimer zodat innen mogelijk blijft. De meetingbel is harder en langer dan gewone knopfeedback.

Tekstloze bediening: alle twintig financiële spelvarianten, telefoons, meetings, vacatures, shop en digibord gebruiken beelden en symbolen. Namen, bedragen, nummers en rekentekens blijven; adminbediening houdt tekst. Het ontwerp en de punten voor gebruikerstests staan in ONDERZOEK.md.

Bij iedere nieuwe lobby en na opnieuw spelen komen de lessen opnieuw terug. De telefoon demonstreert het koppelen met voorbeeldvormen. Ieder financieel taaktype heeft drie stille voorbeelden met veilige oefeningen; overslaan, verder en sluiten zijn mogelijk. Ook beide steelspeltypes en het rad hebben stille uitleg. Oefenen verandert geen geld, taken, inzet of spins.

Het vraagteken vervangt de eigen taak door de tutorial en bevriest de taak- of routetimer op de server. Sluiten hervat de resterende tijd; het geeft geen nieuwe 45 seconden. De gezamenlijke meetingklok loopt door. De server bewaart de pauze ook bij herladen. Korte knopgeluiden geven feedback zonder gesproken uitleg.

Zelf testen: start met `npm run dev`, maak een lobby, laat een speler toe en wijs een taak toe. Open de telefoon en laptop via Apparaten & QR. Voltooi of sla de koppelles over, voer de echte laptopvormen in en doorloop de taakles. Controleer dat de echte timer pas daarna start. Open tijdens de taak het vraagteken, wacht even en sluit: dezelfde resterende tijd hoort terug te komen. Rond drie onderdelen af voor één taakbeloning. Speel opnieuw met dezelfde deelnemers om te controleren dat de lessen terugkomen. Automatische controles: `tests/tutorial-pause.test.ts`, `tests/visual-screens.test.ts`, `tests/visual-learning.test.ts` en `tests/audio.test.ts`.


Nieuwe variatie: twintig financiële spelvarianten, inclusief betaalbatch (betalingen combineren tot het doelbedrag) en betaalkalender (drie dagen in volgorde aanklikken). Ook controle en matching kunnen op verschillende plekken voorkomen; ieder onderdeel heeft zijn eigen stille voorbeeld en oefening. De drie voortgangssymbolen op telefoon en laptop volgen de werkelijke reeks. Als nieuwe onderdelen nog niet eerder zijn geleerd, verschijnt de veilige tutorial opnieuw.

De stille rolfilms laden met volledige preload, een zichtbaar rolsymbool tijdens laden en een knop om afspelen of laden opnieuw te proberen. De film wordt na terugkeer naar de browser hervat en blijft altijd gedempt. Er is geen gesproken uitleg.

Lobbyverwijdering wist de sessie met alle spelers, transacties, taken, incidenten, resultaten, tokens, verzoekcache en sessiegebonden limieten. De algemene plattegrond, vaste laptopcodes en beheerderstoegang blijven. De cloud bewaart één overschreven, gecomprimeerde snapshot; er wordt geen applicatiegeschiedenis per verwijderde sessie aangelegd.


De laptopinstelling bepaalt het afdelingssymbool, niet langer het eerste spel. Een speler trekt bij iedere nieuwe taak drie verschillende spellen uit zijn eigen bewaarde voorraad. Open, geannuleerde en mislukte taken houden dezelfde reeks. Andere spelers hebben een eigen geschudde voorraad. Opnieuw spelen en testreset wissen de stapels. Bestaande sessies krijgen de vernieuwde lessen eenmalig opnieuw, zonder kas of deelnemers te resetten.

Minder hoofdrekenen: facturen goedkeuren op handtekening en autorisatie; euro-/dollarbetalingen rubriceren; spaardossiers op looptijd archiveren; beleggingen aan risicoprofielen koppelen; loonstroken op personeelsnummer controleren; btw-dossiers rubriceren; betaalprocesstappen ordenen; onbekende ontvangers blokkeren; watermerken inspecteren; verzekeringsclaims aan de polis toetsen. Vier varianten blijven expliciete rekensommen; kascontrole telt biljetten met automatische totalisering.

De rekenmachine heeft een decimale komma, accepteert ook getypte kommagetallen en is aan de bovenbalk versleepbaar met muis of aanraking. De verplaatsknop ondersteunt ook pijltjestoetsen (Shift voor kleine stappen). Het venster blijft binnen het scherm, ook bij een formaatwijziging. Het rekent lokaal en verandert geen taaktijd of geld.

De stille gokradles staat in een apart venster met drie stappen: inzet kiezen, lokale oefendraai, uitbetaling/nettoresultaat. Voorbeelden tonen ×2, ×0, ½ en ×4 met dezelfde uitbetalingsregels als het echte rad. De 8/16 winstvakken en 8/16 verliesvakken en twee spins per speler na elke meeting blijven zichtbaar uitgelegd. Oefendraaien kosten geen echte inzet of spins.


## Gedetailleerde stille rolintro's

Elke rol begint met herkenbare schermvoorbeelden in hoofdstukken van tien seconden. Na een hoofdstuk stopt de film; alleen de speler kiest verder, terug, herhalen of overslaan. Werknemer: koppelen, drie taakonderdelen en meeting. Manager: ook verzamelen, overleg en ontslag. Gokker: ook stelen, inzet/uitbetaling en buitdoel. Beveiliger: melding met onbekende oorzaak, laptopkeuze, twee scans per ronde, geldspoor, taakfout, geen sporen en bevindingen delen. De drie scansymbolen hebben een veilige lokale herkenningsoefening zonder scanverbruik. De roluitleg blijft opnieuw bereikbaar via het vraagteken en laadt alleen wanneer die wordt geopend.

Een uitgevoerde scan en de inhoud van de uitkomst worden apart getoond. Geldsporen zijn rood met munten, taakfouten amber met een doorgestreept dossier, geen sporen groen met schild en nul. Beide soorten sporen blijven zichtbaar als ze samen voorkomen. Tijden gebruiken HH:mm:ss in Europe/Amsterdam. Een scan wijst geen dader aan. Het historieknopje opent het bewaarde resultaat zonder een scan te verbruiken.

Alle financiële onderdelen krijgen 45 seconden en een zichtbare tijdbalk. Hulp bevriest de resterende tijd en laat ook de gepauzeerde balk zien. Bestaande dertigsecondenpogingen krijgen eenmaal vijftien seconden extra. De diefstalvertraging blijft dertig seconden. Demonstraties, oefenresultaten en tutorialstappen wachten op een klik. De rekenmachine vervangt na = de invoer door het resultaat: 12,5 × 3 = 37,5, daarna + 2 = 39,5. Een nieuw cijfer begint een nieuwe som; een operator rekent verder met het resultaat.


### Rolintro met de echte telefooninterface

De rolintro gebruikt nu dezelfde React-weergaven en vormgeving als de echte telefoon: scanlijst en scanresultaten, Manager-knoppen en namenlijst, Gokker-buitkaart, gokrad en winkel. Per handeling licht één echte knop op en wijst een hand de tik aan. Daarna verschijnt het gevolg. Scènes scrollen mee waar de bediening onderaan de telefoon staat. De films zijn stil en de speler kiest zelf het volgende hoofdstuk.

Koppelen en algemene taakuitleg zijn uit alle rolintro's verwijderd; de losse koppeloefening en financiële taaklessen blijven beschikbaar. Gokkerhulp opent alleen na een tik op het vraagteken. Dat geldt voor het rad en de steelspellen; voorheen verscheen de radles meteen na het wegdrukken van de rolintro en werd een nieuw steelspel automatisch door hulp onderbroken. Een bestaande, zelf geopende steelspelles blijft bij refresh wel gepauzeerd staan.

Beveiliger: echte melding → scan op laptop 3 → gevonden spoor met tijdstip. Een apart rekeningvoorbeeld toont twee biljetten die uit de kas verdwijnen; een dossiervergelijking toont een fout, waarna de bijpassende scan verschijnt. De scanvoorraad daalt zichtbaar van twee naar één. Bij de Manager worden speler kiezen en ontslag bevestigen afzonderlijk voorgedaan. De Gokker ziet inzet €1.000 uit €5.000, daarna een voorbeeld met winst (€6.000) en verlies (€4.000); ook innen, winkelbezit en buitdoel worden op de echte weergaven uitgelegd. Alle voorbeeldgegevens staan alleen in de film en veranderen geen spel, scanvoorraad, geld of spin.
# Aanvulling 22 oktober 2026: scannen en eigen rolfilms

De Beveiliger kiest een laptop en voert vóór iedere nieuwe scan de vier vormen van die laptop in op de telefoon. De server controleert de code; ontbrekende/verkeerde codes verbruiken geen scan. De melding en plattegrond openen dezelfde invoer. Een scan bezet geen werkterminal en onderbreekt geen taak. Eerdere resultaten blijven opnieuw leesbaar. De permanente codes blijven behouden: deze invoer voorkomt scannen zonder code, maar bewijst geen fysieke nabijheid wanneer iemand de code onthoudt.

`public/roles/*.mp4` bevat nu de vier door de eigenaar aangeleverde rolfilms, met ongewijzigd beeld en audio op 25% van de oorspronkelijke amplitude. De oorspronkelijke bestanden in de map Videos zijn niet gewijzigd. De speler speelt de hele film af en biedt pauze, herhalen, zoeken en een eigen dempknop. Video's beginnen standaard gedempt; de keuze wordt op het eigen apparaat onthouden, onafhankelijk van knop- en meetinggeluid. De oude tiensecondenhoofdstukken worden niet meer toegepast op deze bestanden. Opnieuw renderen vanuit `role-videos` zou deze aangeleverde bestanden vervangen; gebruik dat alleen bij een bewuste filmvervanging. De inhoudelijke beoordeling staat in ONDERZOEK.md.
# Aanvulling: tutorials per taakonderdeel — 22 oktober 2026

Elke nog onbekende minigame krijgt pas vlak vóór zijn eigen onderdeel een tutorial. Sluiten/overslaan onthoudt uitsluitend dat huidige speltype. Een bekende eerste minigame kan daardoor direct starten, terwijl een onbekend tweede of derde spel zijn eigen uitleg krijgt. De drie onderdelen gaan na een goed antwoord vanzelf door; alleen de complete reeks levert één beloning op.

De demonstraties blijven op hun stap staan tot een klik: het uitlegbeeld, de uitlegachtergrond of de hand/pijl-knop ín het uitlegbeeld gaan verder. Er staat geen tweede verderknop onder het beeld; daar blijven alleen stapbolletjes. Bovenaan staan herhalen en één aparte ⏭-knop om de huidige tutorial over te slaan. De losse hand/play/schild-statusiconen zijn verwijderd. Een geslaagde oefening start automatisch het echte onderdeel. Actief werk toont een aflopende 45-secondentimer en tijdbalk; oefenen toont een aparte groene pauzestatus zonder generiek schild- of rolsymbool. Hulp via ? bewaart de resterende tijd. Dezelfde enkele overslaanknop is ook gebruikt in de steel- en radtutorials. De eigen rolvideo sluit uitsluitend via X; de mediabediening blijft beschikbaar. Alle instructies blijven visueel; toegankelijke namen bevatten de geschreven omschrijving.
# Netwerkoptimalisatie — 24 oktober 2026

De Neon-opslag controleert nu eerst de gedeelde versie en hergebruikt een gevalideerde cache; andere instanties halen waar mogelijk alleen gecomprimeerde wijzigingen op. Ongewijzigde cloudpolls krijgen een `304` met actuele serverklok. De bestaande lokale WebSockets sturen alleen veranderde velden. Spelregels en schermen blijven gelijk. Onderzoek, meetmethode, grenzen en testresultaten staan in [NEON_NETWERK.md](NEON_NETWERK.md).
# Aanpassing spelbalans — 28 oktober 2026

Standaardbeloning is €10.000 per volledige taak. Automatische kasdoelen groeien mee. Stelen heeft een hogere basisbuit: bij veertien spelers minimaal €3.500 per inning en maximaal €21.000 per kas per Gokker, eenmaal per kas per meetingronde. Het rad gebruikt ×2/×3 en ½/¼ met 50/50 winst- en verliesvakken. Tutorials zijn lichtblauw; de overslaanknop slaat alle taak-, koppel- en vaardigheidslessen voor die speler over tot opnieuw spelen. Hulp via ? blijft beschikbaar. Nieuwe geschudde stapels bevatten zestien speltypen, met meer rekenen. Alleen vacatures krijgen weer zichtbare geschreven inhoud en sollicitatiestatussen.
# Rolfilms vervangen — 28 oktober 2026

De nieuwste aangeleverde Manager-, Beveiliger-, Gokker- en Medewerkerfilms staan in `public/roles/`. Het beeld blijft origineel; audio staat op 25%. De speler behoudt dempen en afspeelbediening. Cacheversie: `provided-20261028`. De Downloads-bronbestanden zijn behouden.
# Tutorial vóór iedere minigame — 28 oktober 2026

Elk nieuw financieel minigame-onderdeel begint met de lichtblauwe tutorial, ook bij eerder gespeelde spellen. De overslaanknop sluit in één klik de volledige huidige les; hij slaat toekomstige minigames niet over. De koppelles en rolintro blijven apart. De taaktimer start na de huidige les. Dit vervangt het eerdere globale overslaan voor de hele sessie.
# Maximaal zes open taken — 28 oktober 2026

Iedere speler start met twee willekeurig gekozen laptops uit 1–8. Na een meeting komen maximaal twee beschikbare taken erbij, tot zes open taken. De telefoon toont de nummers van laag naar hoog; handmatige toewijzing in de lobby heeft dezelfde grens. Bij oudere lijsten met acht taken krijgen gekoppeld werk en checkpoints voorrang. Voortgang en opgeslagen spelreeksen blijven behouden, ook voor werk dat later weer kan worden toegewezen.

# Stille video bij het gokrad — 28 oktober 2026

Het vraagteken naast het gokrad opent een stille video van dertig seconden met screenshots van de echte telefooninterface, klikaanwijzingen, inzet, draaien en de vier uitbetalingen. Alle voorbeelden gebruiken €5.000 beginbuit en €1.000 inzet. Bedragen en symbolen tonen uitbetaling én nettoresultaat. De gebruiker koos expliciet voor geen stem; de video heeft geen audiotrack. Afspelen/pauzeren, zoeken, X en een aparte veilige oefening zijn beschikbaar. Openen gebeurt alleen op eigen verzoek en gebruikt geen geld of spins. De aangeleverde rolintro's blijven ongewijzigd.

### Gokkerdoel en schermuitleg — 29 oktober 2026
De financiële winstvoorwaarde is nu het bezit van alle drie catalogusartikelen. De server beoordeelt dit direct bij de derde aankoop; aankopen zijn gedeeld en blijven bij refresh bewaard. Het oude configuratieveld gamblerGoal bepaalt nog de winkelprijzen en inzetlimiet, geen saldodrempel voor winst. De bestaande faillissements- en ontslagregels blijven gelden.
De telefoon toont drie aankoopvakken, 0–3 vinkjes, de beschikbare buit en wat nog verdiend moet worden voor de ontbrekende aankopen. Het vraagteken bij de drie aankopen speelt /tutorials/gokker.mp4 af: een stille film van 68 seconden met echte schermbeelden voor doel, kaslocatie, code, beide willekeurige steelspellen, veilig innen, 30 seconden kasvertraging, sparen en alle aankopen. De aparte gokradfilm blijft via ? naast het rad beschikbaar. Bron: role-videos/src/GamblerWalkthrough.tsx; beelden uit een geïsoleerde lokale voorbeeldgame in role-videos/public/gambler-help.

29 oktober 2026: de aangeleverde Gokker-intro is teruggezet bij de roluitleg. De nieuwe stille doel-/steelfilm opent uitsluitend via het vraagteken rechtsboven bij de drie aankopen. Achttien gerichte aankoop-/rolfilmtests en de productiebuild geslaagd.

Persoonlijke kassen (29 oktober 2026): iedere Gokker kan per meetingronde één keer innen uit elk van de twee kasterminals. De kas verdwijnt direct na innen alleen uit de eigen kaart; de partner behoudt zijn beurt bij dezelfde terminal. Mislukken, annuleren of geweigerde inning verbruiken geen beurt. De bestaande buitlimiet geldt per kas (bij 14 spelers €3.500–€21.000), maximaal twee inningen. Een nieuwe ronde vernieuwt de beurten en wisselt de locaties. Bestaande diefstalrecords verzorgen dit zonder extra databaseopslag; de kasafschrijving en Beveiliger-melding blijven na 30 seconden.
