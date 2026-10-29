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

## Tekstloze proef — 16 oktober 2026

Alleen koppelen en de volledige begrotingstaak zijn omgezet. Stille voorbeelden draaien lokaal met HTML/SVG; echte codes en boekingen gaan pas na de oefening naar de betreffende spelacties. Andere taaktypes, rollen, meetings en digibord behouden hun prototype-uitleg. De latere scope blijft alle spelerschermen zonder uitlegtekst, met tekst toegestaan voor admin.

192 automatische tests slagen in twaalf bestanden, inclusief tien nieuwe controles voor oefening zonder geldmutatie, verkeerde voorbeeldantwoorden, bevoegdheden, timerstart, timeout, dubbele verzoeken, herladen, behouden voortgang, hulp zonder tijdverlenging en zichtbare tekst in lessen/werkborden/feedback. TypeScript en productiebuild slagen.

Browsercontrole in een eigen in-memory testlobby: koppeldemonstratie op 390 × 844; foute oefencode geeft een kruis en herkansingssymbool; correcte oefencode opent echte code-invoer. Echte laptopcode koppelt telefoon en laptop. Op laptop: begroting oefenen, afwijkend dossier aanwijzen en drie betalingen koppelen. Tijdens oefenen blijft de kas €42.000 en ontbreekt de echte timer. Daarna verschijnen drie echte onderdelen met afzonderlijke 30-secondendeadlines. Alleen na het derde onderdeel stijgt de kas naar €47.000 en blijft op de telefoon één andere taak open. Succesmeldingen op beide apparaten tonen symbolen; toegankelijke namen blijven aanwezig.

Na opnieuw spelen met dezelfde deelnemers zijn beide lessen onthouden. De hele echte taak is opnieuw via de browser afgerond; de kas ontvangt opnieuw precies één beloning. Herladen van de laptop tijdens het derde onderdeel bewaart het servercheckpoint. De compacte laptoplayout past met alle bediening in de geteste viewport van 1265 × 712. De testserver gebruikt een bestuurbare klok; exacte timergrenzen en pauzehervatting zijn daarnaast geautomatiseerd getest. Een gebruikerstest met nieuwe spelers die de symbolen nog niet kennen is nog niet uitgevoerd. Deze wijziging is lokaal getest, zonder productiegegevens te wissen of een Vercel-publicatie uit te voeren.

## Vervolg: alle spelerschermen en pauzerende tutorials — 16 oktober 2026

De nieuwe opdracht vervangt de eerdere testverwachtingen: hulp pauzeert nu de eigen timer en opnieuw spelen wist de leerstatus. 237 tests slagen in veertien bestanden. TypeScript en productiebuild slagen. De servercontroles omvatten pauzeren/herladen/hervatten met exact dezelfde resterende milliseconden, globale pauze tijdens hulp, verboden bediening vanaf andere apparaten, geen antwoordinzending tijdens hulp, terugkerende lessen na opnieuw spelen, en geen financiële gevolgen van oefeningen. Alle twaalf taaktypes zijn met hun drie echte serveronderdelen doorlopen; vaste voorbeeldberekeningen en hun oplossingen zijn apart gecontroleerd.

De schermcontroles controleren de zichtbare tekst van alle twaalf taaktypes, de vier roluitleggen, digibordlobby, drie meetingfasen, beide steelspellen, het rad, de shop, vacatures, rekenmachine, briefing en feedback. Ze behouden de toegankelijke namen en stille video's. Geluidstests controleren verschillende korte toonreeksen voor kiezen, bevestigen, teruggaan en draaien, met behoud van dempen en de openbare meetingbel.

Browsercontrole in een eigen in-memory lobby met echte lopende klok: 390 × 844 telefoonweergave met alleen namen, bedragen, cijfers en symbolen; overslaan van koppelles; echte vormcode; nieuwe koppelaanwijzing met laptopnummer, spelernaam en wijzende hand. Op de laptop bleef de pauze-indicator tijdens een langere tutorial onveranderd op 30 staan; sluiten hervatte de echte taak. Na drie voltooide onderdelen steeg de testkas eenmaal van €150.000 naar €155.000. Herladen tijdens de tutorial behield de serverpauze en opende de uitleg bij het huidige taakonderdeel.

Alle vier roltelefoons zijn op zichtbare tekst gecontroleerd. De Manager doorliep verzamelen, overleg, spelerkeuze, ontslagbevestiging en werk hervatten. Andere rollen bleven tijdens het overleg geblokkeerd. De ontslagen speler zag geen kas of meeting en kon de visuele vacatures openen. Het digibord toonde QR, namen en aantallen zonder geschreven stappen. Opnieuw spelen bracht de koppelles en de taakles terug; ook de btw-les is in de browser bekeken. Een kascontroletaak is daadwerkelijk met alle telinvoeren ingevuld en door de server goedgekeurd. De omleidingsoefening kon zonder geldverlies worden opgelost, waarna de echte routeklok op 60 seconden hervatte. De automatische radles kon zonder inzet of spin worden overgeslagen. Geen browserconsolefouten op de gecontroleerde financiële laptop.

Deze controles bewijzen werking en tekstloze weergave, geen zelfstandig begrip door nieuwe spelers. Vooral procentbegrippen, onzekere aanwijzingen, risico/veilig innen en de vacaturegrap blijven punten voor een gebruikerstest; zie ONDERZOEK.md. Er is in deze stap geen productiepublicatie of database-opruiming uitgevoerd.


## Willekeurige taakreeksen en algemene plattegrond — 16 oktober 2026

262 tests in vijftien bestanden: geen herhaling binnen een reeks, zestien spelvarianten op verschillende volgposities, checkpoints na fouten/annuleren/meetings, geen oplossing in publieke projecties, drie onderdelen voor één beloning. Veilige voorbeelden voor betaalbatch en kalender zijn rekenkundig gecontroleerd en zonder zichtbare uitlegtekst gerenderd. TypeScript en productiebuild slagen.

De kaart heeft een instelbare hoogte van 10–24 rijen. Nieuwe standaard: 16×14. Verkleinen mag geen laptop verwijderen. Er is één algemene kaart in de instellingen; sessie-JSON bevat geen kopie. Getest: bestaande en nieuwe lobbies, snapshot/herstart, migratie uit oude sessiekaart, verwijderen laatste lobby en opnieuw aanmaken via onafhankelijke cloud-aanroepen. Sessies, spelers/apparaattokens, verzoekcache en sessiegebonden limieten verdwijnen; kaart en vaste codes blijven.

Browser: wachtruimte → rolintro gaf een spelende stille MP4 (readyState 4, 640 pixels breed, geen mediafout). Op 390×844 overlappen kaarticonen niet. Echte reeks begroting → betaalbatch → kalender afgerond: de kas steeg pas na het derde onderdeel eenmaal van €150.000 naar €155.000. Editorhoogte 14→18 opgeslagen en na herladen behouden. Geen consolefouten op de geteste telefoon/laptop/editor. Testgegevens stonden in een afzonderlijke in-memory server.


Publicatie: productie-deployment `dpl_BEp5x6azQCqv1U7GMgwGV77U6BbH` staat op https://finance-imposter.vercel.app/ (handmatige bronrelease vanuit `codex/financiele-minigames-feedback`, basis `44a99bf`, inclusief lokale wijzigingen; geen Git-push). Productie levert de nieuwe bundel `index-BoP_BfL8.js`; `/api/health` is goed en alle vier MP4-bestanden geven correcte video/mp4-range-antwoorden (206). Een nieuwe online testlobby is bewust niet aangemaakt: er staan bestaande eindoverzichten die de normale aanmaakroute zou opruimen. Er is geen productie-reset of verwijdering van bestaande eindoverzichten uitgevoerd. De volledige cloud-sessieopruiming is via de geautomatiseerde HTTP-cloudtests bewezen. Lokale Vite-site en gameserver zijn opnieuw gestart.


## Spelstapels, interactie en verplaatsbare rekenmachine — 16 oktober 2026

297 tests in zestien bestanden, typecontrole en productiebuild. Honderd deterministische schudreeksen doorlopen meerdere volledige stapels: alle twintig spellen eenmaal per stapel, geen dubbele variant in één taak, ook niet over een stapelgrens. Getest: voorraad per speler, behoud bij annuleren/herkoppelen/snapshot, reset bij opnieuw spelen en dubbele online beginverzoeken via onafhankelijke cloud-instanties. Zes rekenspellen vervangen door interactieve financiële controles/rubricering; vier nieuwe varianten toegevoegd. Tien interactieve regelsets zijn over dertig verschillende dossierindelingen en verschillende oefendossiers gecontroleerd. Publieke projecties blijven zonder antwoorden.

Browserproef: via de kommatoets 12,5 × 3 ingevuld en 37,5 gekregen; daarna de rekenmachine daadwerkelijk met muis van rechts naar links versleept. Venster bleef geheel in beeld. Volledige servertaak valutabetalingen → factuurgoedkeuring → bankbiljet-watermerken afgerond voor één beloning van €5.000. Interactieve taken passen op een laptopscherm met compacte kaarten.

Op 390×844 de afzonderlijke radles doorlopen: voorbeeld ×2 gaf netto +€1.000; ×0 −€1.000; ½ −€500; ×4 +€3.000 bij inzet €1.000. Voorbeeldrekening startte op €5.000. De echte buit bleef €0 en geen echte spin werd gebruikt. Alle uitleg bleef stil, met alleen symbolen, cijfers en bedragen. Geen consolefouten op de geteste interfaces. Bestaande sessies verliezen geen kas of deelnemers door de lesmigratie.


Vercel-publicatie van deze stap: `dpl_GLdUunfmJj1LQqLwuyEYsQ85xFD9`, productie https://finance-imposter.vercel.app/, bundel `index-C1j20Cl7.js`. Productie-API, nieuwe kommatoets, vernieuwde radles en servervelden voor spelstapel/lesversie gecontroleerd. Bestaande online lobbies en eindoverzichten behouden; geen nieuwe productie-testlobby aangemaakt. Handmatige bronrelease van de huidige werkmap, geen Git-push. Lokale gameserver bijgewerkt; poorten 3000 en 5173 geven HTTP 200.


## Stille rolhoofdstukken, duidelijke scans en taakbediening — 16 oktober 2026

324 tests in zeventien bestanden slagen, inclusief de bestaande HTTP-, WebSocket- en cloudtests. Nieuwe controles: alle twintig spelvarianten hebben een timer en tijdbalk tijdens werk en gepauzeerde hulp; actieve en gepauzeerde oude pogingen krijgen slechts eenmaal vijftien seconden extra; scanresultaten onderscheiden geldspoor/taakfout/geen sporen, tonen beide gebeurtenissen wanneer nodig en behouden privacy. Herhalen met dezelfde aanvraag-ID verbruikt slechts één scan. Digitale tijden zijn gecontroleerd met Nederlandse zomer- en wintertijd. Typecontrole van app en Remotion en productiebuild slagen.

Browser op aparte lokale in-memory server, zonder bestaande sessies te wijzigen: alle vier stille MP4's laden op 640×480 zonder mediafout. Tiensecondenhoofdstukken stoppen vóór de volgende scène en blijven op hetzelfde hoofdstuk totdat de speler klikt. Beveiligersoefening: verkeerd symbool geeft opnieuw-proberen, juist symbool toont het echte resultaatvoorbeeld; nul echte scans verbruikt. Echte scans gecontroleerd voor alleen taakfout, geen sporen en geldspoor samen met taakfout. De taakfout toont geen tegenstrijdig groen resultaat. Digitale gebeurtenistijd en scantijd zijn afzonderlijk zichtbaar. Quota reset na meeting.

Calculator in echte taak: 12,5 × 3 werd 37,5 in zowel invoer als uitvoer; daarna + 2 gaf 39,5. Hulp opende met 28 seconden resterend. Na zestig extra serverseconden en echte wachttijd bleef de tutorial op dezelfde stap en bleef 28 seconden over. De echte taak begon met 45 seconden en zichtbare balk. Scanuitkomst visueel gecontroleerd op 390×844. Dit bewijst de bediening en tekstloze weergave; begrip van de beelden moet ook met nieuwe spelers worden beproefd.


Publicatie: `dpl_x3ETkiDumGuCaXN7TPcKzZEBVerB` staat op https://finance-imposter.vercel.app/, bundel `index-B2GinSJa.js`. Productiehealth, bestaande beheerderstoegang en alle vier MP4's gecontroleerd: SHA-256 gelijk aan de geteste lokale bestanden, correcte video/mp4-respons en 206-range-antwoorden. Geen productie-testlobby aangemaakt, geen eindoverzicht verwijderd. Handmatige bronrelease vanuit `codex/financiele-minigames-feedback` met lokale wijzigingen, zonder Git-push. Lokale gameserver opnieuw gestart; poorten 3000 en 5173 geven HTTP 200. Twee oude tests accepteerden nog alleen een numeriek antwoord ondanks willekeurige koppelspellen; hun proefinvoer ondersteunt nu ook matchoplossingen en foutieve dubbele koppelingen.


## Echte telefoonschermen en optionele Gokker-hulp — 16 oktober 2026

332 tests in achttien bestanden, typecontrole en productiebuild slagen. Nieuwe regressiegevallen controleren een Gokker zonder geleerde radles, directe speelbaarheid van beide onbekende steelspellen, afwezigheid van koppelen/algemene taakles in alle rolintro's en de gedeelde Manager-keuze met aparte ontslagbevestiging. De films zijn met de echte presentatiecomponenten gebouwd; de render gebruikt één consistente bestaande React-versie. Alle vier MP4-renders slagen.

Browser op aparte in-memory server: rolintro van de Gokker gesloten; geen open dialogen of verborgen rolvideo's daarna. Radles opent pas na klik op vraagteken. Na sluiten bleef echte buit €0 en bleven twee spins beschikbaar. De losse koppeloefening verschijnt nog wel bij het bewust openen van een taak. Een eerste lockpick startte direct speelbaar met tutorialPausedAt=null; alleen na klik op het eigen vraagteken werd de timer gepauzeerd. Sluiten hervatte het spel. De native rolintro toont de film schermvullend met een bereikbare sluitknop; er is geen klein telefoonscherm in de gewone telefoonpagina genest.

Media: 390×640, altijd muted, zonder mediafout. Beveiliger 60 seconden in zes hoofdstukken; Manager 40 seconden in vier; Gokker 60 seconden in zes; Werknemer 10 seconden zonder algemene koppelen-/geldles. De Beveiliger stopte op 9,85 seconden; de Manager bleef na keuze van het derde hoofdstuk op 29,86 seconden; Werknemer stopte op 9,84 seconden. Alleen een eigen klik wisselt hoofdstuk. Scènes zijn in Studio visueel gecontroleerd op knoppositie, zichtbare naamkeuze, bevestigingsknop, inzet en koopknop. De camera schuift waar de bediening onderaan de echte telefoon staat.

De echte Manager doorliep vervolgens verzamelen → overleg → ontslagkeuze → Yara selecteren → bevestigen → werk hervatten. De overige telefoons bleven tijdens de vergadering geblokkeerd. Bestaande productiegegevens zijn voor deze browserproeven niet gebruikt. Zelfstandig begrip van de beelden moet ook met nieuwe spelers worden getest; de controle bewijst werking, afleesbaarheid en overeenkomst met de telefooninterface.


Vercel-publicatie: `dpl_Ab4Z5R5TjLhop32HSvzDZFPa8vM7`, https://finance-imposter.vercel.app/, bundel `index-CHE-86bA.js`. Productiehealth, beheerderslogin en bestaande sessielijst gecontroleerd. Alle vier MP4's geven video/mp4 en correcte 206-range-antwoorden; SHA-256 komt overeen met de geteste lokale bestanden. Geen productie-testlobby aangemaakt en geen bestaande sessie of eindoverzicht verwijderd. Handmatige bronrelease vanuit `codex/financiele-minigames-feedback` met lokale wijzigingen, zonder Git-push. De Gokkersfilm is ook na herladen via de eigen roluitlegknop bekeken: muted, 390×640, 60 seconden, geen mediafout en stilstaand op 29,85 seconden in het gekozen radhoofdstuk; sluiten opende geen extra hulp.

Laatste publicatie na een CSS-correctie voor de schermvullende rolintro: `dpl_CxrZLjaHKAujruHYQEHGF5M3WNjD`, https://finance-imposter.vercel.app/, bundel `index-CMYecxLc.js`, stylesheet `index-DisRbI71.css`. De achtergrondscrollbalk verdwijnt zolang de intro openstaat; op een viewport van 390×844 ligt de dialoogrand op 390 en de navigatierand op 378, zodat de bediening volledig in beeld blijft. Productiebuild en laatste productiecontrole geslaagd: health, beheerderslogin, ongewijzigde sessielijst en alle vier MP4-bestanden met identieke SHA-256 en 206-range-antwoorden. Ook bij deze controle zijn geen productielobbies aangemaakt of verwijderd.
# Code vóór iedere Beveiligersscan en aangeleverde rolfilms — 22 oktober 2026

Productiepublicatie: `dpl_ACHKcgxonUQQGV49HdXJG3DWU5WF`, https://finance-imposter.vercel.app/, bundel `index-1JdhUf4B.js`. Health, beheerderslogin, bestaande sessielijst en alle vier MP4-bestanden gecontroleerd. De online bestanden hebben dezelfde SHA-256 als de geteste bestanden en geven correcte video/mp4-range-antwoorden (206). Geen productie-testlobby aangemaakt en geen bestaande lobby of eindoverzicht verwijderd. Handmatige bronrelease vanuit de bestaande branch met lokale wijzigingen, zonder Git-push. Laatste browsercontrole bevestigt pauzeren, zoeken naar 0,1 s en behoud van dempen; geen browserconsolefouten. De rolintro blijft volledig binnen de 390px-viewport. Tijdelijke testserver en testtabs zijn opgeruimd; de gewone lokale game en Vite blijven draaien.

347 tests in negentien bestanden slagen; TypeScript en productiebuild slagen. Nieuwe controles: ontbrekende, ongeldige en verkeerde laptopcodes geven geen scan en kosten geen quotum; een juiste code geldt alleen voor de gekozen laptop; iedere nieuwe scan vereist opnieuw invoer; hetzelfde verzoek-ID blijft idempotent; codes geven geen toegang aan andere rollen en omzeilen meetings niet; scannen verstoort een actieve financiële taak niet. De echte REST-route is ook getest op code, quotum, herhalen en afwezigheid van laptopcodes in de telefoonprojectie.

Alle vier bronfilms zijn gecontroleerd op H.264-beeld en AAC-geluid. Het beeld is zonder hercodering overgenomen; audio is lokaal verlaagd tot 25%. Gemeten RMS-verhouding per film: 0,249 ten opzichte van het origineel. De film start standaard gedempt en onthoudt een eigen apparaatvoorkeur zonder de instelling van meetinggeluid te wijzigen. De speler heeft geen vaste tiensecondenstop meer.

Browserproef in afzonderlijke in-memory lobby op 390×844: melding bij laptop 3 opent lege vormcode-invoer met nul verbruikte scans; vier verkeerde vormen geven foutfeedback en wissen de invoer. De juiste vier vormen tonen het echte taakfoutresultaat, met digitale tijd, en kosten precies één scan. Nogmaals openen vraagt weer vier vormen. Alle films laden zonder mediafout op 1280×720: Beveiliger 13,783 s, Manager 16,254 s, Gokker 26,238 s en Werknemer 13,875 s. De drie laatstgenoemde films zijn in de browser tot hun echte einde afgespeeld. Beveiligervideo speelt voorbij tien seconden, kan herhaald en hoorbaar gemaakt worden en opnieuw gedempt worden; opnieuw openen behoudt dempen. Lokale site op 5173 en game-API op 3000 zijn gestart en bereikbaar. De inhoudelijke beperkingen van de films en de permanente laptopcodes zijn beschreven in ONDERZOEK.md en README.md.
# Stapsgewijze tutorials en timers per onderdeel — 22 oktober 2026

Publicatie gecontroleerd: `dpl_DrC66wvZHw62hfPTWyMXrXNpHp5Q`, https://finance-imposter.vercel.app/, bundel `index-DElElr4G.js`, stylesheet `index-Ck5NMjVD.css`. Health en beheerderslogin werken; de bestaande sessielijst is behouden. De vier aangeleverde rolfilms zijn ongewijzigd ten opzichte van de vorige publicatie en geven identieke SHA-256 en correcte 206-antwoorden. Geen productie-testlobby aangemaakt of bestaande lobby verwijderd. De lokale servers op 5173 en 3000 zijn bereikbaar; tijdelijke browserproeven en hun server zijn gesloten. Handmatige bronrelease vanuit de bestaande branch met lokale wijzigingen, zonder Git-push.

373 tests in twintig bestanden, TypeScript en productiebuild slagen. Nieuwe controles doorlopen alle twintig minigames in drie verschillende reeksposities: uitsluitend het huidige spel wordt geleerd; volgende onbekende spellen openen pas na een juist echt antwoord; elke echte stap start met 45 seconden en heeft negen seconden later 36 seconden over. Oefenen heeft geen deadline voor echt werk en geen financiële gevolgen; alleen na drie juiste echte onderdelen volgt één beloning. Een bekende eerste game met onbekende vervolgspellen, herladen tijdens de tweede les en hervatten van handmatig gepauzeerde hulp zijn getest. Bestaande tests zijn aangepast aan de expliciete oefenstatus in plaats van een stilstaande actieve timer. Idempotentie, cloud-, HTTP- en WebSocket-regressies blijven slagen.

Browserproef in een aparte in-memory lobby: op 390×844 past de koppeldemonstratie met één ⏭-knop, zichtbare stapbolletjes en een grote verderknop. Tikken op het uitlegbeeld én op de achtergrond bij de modusindicator gaat exact één stap verder. Een goede koppeloefening opent vanzelf echte code-invoer. De overslaanknop opent die invoer direct. De afsluit-X verschijnt pas buiten de les.

Op de laptop werkelijk begroting → dossiercontrole → valuta koppelen afgerond, met een eigen demonstratie en oefening direct vóór elk onderdeel. Een goede oefening startte vanzelf het echte spel; een juist echt antwoord opende vanzelf de volgende onbekende les. Eerste echte timer 45 → 40; ? bevroor deze op 40; sluiten hervatte dezelfde poging. Derde timer 45 → 37 tijdens het daadwerkelijk koppelen. De kas bleef €42.000 tijdens de eerste twee onderdelen en werd na het derde eenmaal €47.000. Geen consolefouten op de geteste laptop. De aanwijzingen voor dossiers, dubbele betalingen, tellen en volgorde zijn verduidelijkt; categoriedemonstraties wijzen nu afwisselend het dossier en de bestemming aan en tonen de gemaakte koppeling. Dit is een technische en visuele controle, geen gebruikerstest met nieuwe spelers.
# Vereenvoudiging tutorialbediening — 22 oktober 2026

Publicatie: `dpl_Gb7LzETrtWJTcqQywHE95DNDmJjj`, https://finance-imposter.vercel.app/, bundel `index-BBs5gQPJ.js`, stylesheet `index-CwUtq8FJ.css`. Productiehealth, beheerderslogin en bestaande sessielijst gecontroleerd; vier rolfilms behouden met identieke SHA-256 en 206-range-antwoorden. Geen productielobby aangemaakt of verwijderd. Handmatige bronrelease zonder Git-push.

373 tests en TypeScript slagen; productiebuild geslaagd. De onderste verderknop is uit de koppel- en financiële demonstraties verwijderd; alleen de knop over het uitlegbeeld blijft, met stapbolletjes eronder. Op de laatste stap verandert de toegankelijke naam van dezelfde knop naar Zelf oefenen. De niet-interactieve hand/play/schild-status linksboven is verwijderd, evenals de generieke schildjes in de financiële oefenstatus, oefenbanner en oefenfout. De rolvideo heeft uitsluitend de X als sluitknop; de onderste Rol begrepen-knop en de losse rol/play-symbolen bovenaan zijn verwijderd. Afspelen, dempen en zoeken blijven beschikbaar.

Browser: nieuwe Beveiliger-rolintro op 390×844 heeft nul onderste sluitknoppen en nul losse boveniconen; X sluit de echte eerste intro. De koppelles heeft één verderknop en geen onderste navigatieknop. Alle beeldstappen, de laatste stap naar oefenen en de echte koppeloefening zijn doorlopen. Op de gekoppelde begrotingsterminal van deze Beveiliger: nul generieke Beveiligersschilden, geen rolaanduiding, één verderknop over het beeld en nul onderste verderknoppen. Alle stappen plus begrotingsoefening afgerond, waarna de echte timer op 45 seconden startte. Geen consolefouten. Functionele taaksymbolen binnen financiële opdrachten blijven inhoudelijke symbolen van de opdracht; de terminal ontvangt geen persoonlijke rol in het gekoppelde spelerobject.
# Neon Public Network Transfer — 24 oktober 2026

Gepubliceerd als `dpl_EsGZ5oBNTTKyUTRQJas1CYVG1WgH` op https://finance-imposter.vercel.app/, bundel `index-CvaDdcQG.js`, dezelfde stylesheet `index-CwUtq8FJ.css`. Productiehealth, beheerderslogin, bestaande sessielijst en vier ongewijzigde rolfilms met correcte 206-antwoorden slagen. Er waren nul bestaande lobbies; geen online testlobby aangemaakt of sessie verwijderd. Tien healthchecks lieten de databaseversie gelijk. Nieuwe wijzigingscache: twee rijen, samen 594 bytes. De echte SQL voor het wissen van oude cachepakketten bij lobbyverwijdering is eveneens op tijdelijke Neon-tabellen gecontroleerd. Tijdelijke auditvariabelen zijn verwijderd. Handmatige bronrelease zonder Git-push.

397 tests in 23 bestanden, TypeScript en productiebuild slagen. Nieuwe regressies: 720 onveranderde polls zonder volledige read na opwarmen; twintig echte wijzigingen via twee warme instanties met twintig kleine wijzigingsreads; cachecontrole bij conflicten, dubbele acties, ingetrokken toegang, verwijderde lobby en opslaguitval; herstel van een ontbrekende wijzigingsschakel; conditionele HTTP met klok en diefstaldeadline; clientopruiming, foutbackoff en niet-overlappende polls; echte WebSocket-patches, rollenprivacy en volledige status bij herverbinden. Lobbyverwijdering wist ook het eerdere databasejournal van wijzigingspakketten.

Gemeten SQL-resultaatinhoud: 15.637.680 → 28.800 bytes bij 720 onveranderde polls (99,82% minder); 921.131 → 14.107 bytes bij twintig wijzigingen/uitlezingen (98,47% minder). Dit zijn gecontroleerde warme tests, geen factuurmeting en exclusief TLS/protocoloverhead. De daadwerkelijke SQL voor versiecontrole, atomische opslag en wijzigingsketen is bovendien succesvol op tijdelijke Neon-tabellen uitgevoerd, zonder bestaande spelgegevens te wijzigen. Onderzoek en beperkingen staan in NEON_NETWERK.md.
# Geld, vacatures en tutorials — 28 oktober 2026

Definitieve Vercel-release: `dpl_DWsNKK7Psks83YdXjB8xVDRB3oVu`, https://finance-imposter.vercel.app/, bundel `index-Dd_45uNi.js`, stylesheet `index-B6SKDyy6.css`. Online health, nieuwe bestanden en bestaande beheerderstoegang gecontroleerd. Drie bestaande lobbies behouden; geen productie-testlobby aangemaakt of lobby verwijderd. Tijdelijke in-memory testserver en browsertab gesloten. Handmatige bronrelease, zonder Git-push.

Gericht gecontroleerd: 176 tests in negen relevante bestanden, TypeScript en productiebuild. Geen volledige testset uitgevoerd. De nieuwe controles behandelen €10.000 na drie echte taakonderdelen, minimale inning en totale buit per Gokker/meetingronde, reeds gereserveerde diefstallen, quotum na herkoppelen/refresh, reset na meeting, overslaan voor alleen de gekoppelde speler, hervatten van de 45-secondentimer, nieuwe sessielessen na replay en migratie van bestaande kas/maatwerkbedragen/lopende radspin. Ook een gedeeltelijk gebruikt steelbudget stopt bij de grens de puzzel en de verborgen routetimer. Het rad houdt acht winst- en acht verliesvakken en betaalt ook bij kleine inzetten iets terug.

Nieuwe standaard bij veertien spelers: €10.000 per volledige taak, €3.500 minimale inning en maximaal €21.000 per Gokker per meetingronde. Vier steelonderdelen verdienen achtereenvolgens 1×, 1×, 2× en 2× de basisbuit. Automatische doelen groeien mee: bedrijf €938.000, Gokkers samen €280.000. Bestaande kas en geboekte resultaten blijven intact. Nieuwe taakstapels gebruiken zestien varianten, waarvan tien rekenopdrachten; vier abstracte speltypen worden niet meer opnieuw uitgedeeld. Lopende opdrachten blijven afmaakbaar.

Browsercontrole op aparte lokale in-memory server: lichtblauwe factuurles; één tik op Alle tutorials overslaan opent de echte taak met 45 seconden en zichtbare rekenmachine. Vacature toont titel, werkgever, salaris, versturen/controleren en uiteindelijk rode afwijzing met reden. Groen voorlopig aangenomen blijft onderdeel van de bestaande sollicitatiestroom. Tekstcontrast verhoogd. Geen browserconsolefouten bij deze proef. Screenshots staan in `data/tutorial-oct28.png` en `data/vacatures-oct28-definitief.png`. Dit is een technische/visuele controle, geen begripstest met nieuwe spelers.
# Nieuwe aangeleverde rolfilms — 28 oktober 2026

Online als `dpl_A5QmqNRvCJxeKYA6u3cBt8Aqt1gP` op https://finance-imposter.vercel.app/, bundel `index-D1mRJi-p.js`. Alle vier online MP4's hebben dezelfde SHA-256 als de nieuwe lokale bestanden, correct video/mp4 en 206-range-antwoorden. Volledige lokale beeld-/audiodecodering zonder fouten; online health slaagt. Geen sessie aangemaakt, verwijderd of aangepast voor deze proef. Handmatige bronrelease zonder Git-push.

`Downloads/Manager.mp4`, `Beveiliger.mp4`, `Gokker.mp4` en `Medewerker.mp4` vervangen respectievelijk manager, security, gambler en employee. Alle films zijn H.264 op 1280×720 met AAC-audio. Duur: 16,27 / 13,76 / 26,29 / 13,92 seconden. Gecodeerde videopakketten hebben vóór en na vervanging dezelfde SHA-256; audio is verlaagd naar 25% (gemeten RMS-verhouding 0,249). Oorspronkelijke Downloads-bestanden blijven behouden. MP4-metadata staat vooraan voor snel starten.

Veertien gerichte controles van scankoppeling en rolvideospeler slagen, evenals TypeScript en productiebuild. Bestaande dempvoorkeur, afspelen/pauzeren, zoeken en X blijven behouden. Assetversie `provided-20261028` vervangt `provided-20261022`, zodat de speler de nieuwe bestanden ophaalt. Geen spelregels of interfaces gewijzigd.
# Iedere financiële minigame begint met uitleg — 28 oktober 2026

Vercel-publicatie: `dpl_6CVte8TiVCUZZwBJR51qo5Ppz9xo`, https://finance-imposter.vercel.app/, bundel `index-DDPsH_aa.js`. Handmatige bronrelease zonder Git-push. Online bestanden, health en beheerderstoegang gecontroleerd; geen productie-testlobby aangemaakt of sessie verwijderd.

37 gerichte tests in `stepwise-task-lessons.test.ts` en `game-tuning.test.ts`, TypeScript en productiebuild slagen. Elk nieuw financieel onderdeel begint nu met zijn eigen tutorial, ook wanneer de speler het spel eerder heeft geleerd of eerder globaal heeft overgeslagen. De oude actie `skip-tutorials` blijft bruikbaar voor bestaande clients, maar sluit uitsluitend alle stappen van de huidige les. De koppelles overslaan markeert geen financiële lessen of rolintro meer als gezien. Volgende onderdelen en nieuwe pogingen tonen weer uitleg; een refresh van een lopend echt onderdeel opent niet ineens opnieuw hulp. De timer begint pas na de les; handmatige hulp bewaart de resterende tijd. Nieuwe rolfilms blijven behouden.
# Willekeurige laptopnummers en maximaal zes taken — 28 oktober 2026

Gepubliceerd als `dpl_4N38gsExDefAGQNfjuwkr7sN4etp`, https://finance-imposter.vercel.app/, bundel `index-DUQHaA7J.js`. Online health, bestanden en bestaande beheerderstoegang gecontroleerd; één bestaande lobby behouden, geen productietestlobby aangemaakt of verwijderd. Handmatige bronrelease zonder Git-push.

50 gerichte tests in `task-assignment.test.ts`, `balance.test.ts` en `floor-plan-and-refresh.test.ts`, TypeScript en productiebuild slagen. Over honderd deterministische schudreeksen komen alle acht laptopnummers en verschillende combinaties voor. Iedere lijst is uniek en numeriek gesorteerd. Tests controleren twee starttaken, maximaal twee toevoegingen per meeting, grens zes, weigeren van zeven handmatige toewijzingen, sorteervolgorde in de telefoonprojectie, behoud van gekoppelde laptop en checkpoints bij oude lijsten van acht en hervatten van bewaard werk. Bestaande economische en vernieuwbare-taakregels blijven in deze gerichte controles werken. De telefoon toont nu /6; de beheerder kan geen zevende vak selecteren.

# Gokrad-uitleg met echte schermbeelden — 28 oktober 2026

Vercel-release `dpl_G4sJFxktwqRDsYH5cRdJWEoufMdn` staat op https://finance-imposter.vercel.app/, bundel `index-C3fYKeZB.js`, stylesheet `index-BCeOZchA.css`. Nieuwe MP4 (1.033.823 bytes) en poster zijn online hashgelijk aan lokaal; content-types, 206-range-antwoorden en health slagen. Geen productie-testlobby aangemaakt of bestaande sessie verwijderd. Handmatige bronrelease zonder Git-push.

Zeventien gerichte tests voor de nieuwe hulp en bestaande rolvideospeler slagen; TypeScript voor app en Remotion en de productiebuild slagen. De dertigseconden-MP4 is 390×780, 30 fps, H.264/yuv420p, zonder audio. Volledig gedecodeerd zonder fouten. De gebruiker koos na een geweigerde eerste HeyGen-aanvraag voor stilte; er is geen tweede stemgeneratie aangevraagd. Vier aangeleverde rolfilms zijn behouden.

Schermbeelden zijn werkelijk opgenomen in een eigen lokale in-memory lobby. Het rad werd met €1.000 inzet vanaf €5.000 getest op ×2, ×3, ½ en ¼: eindbuit €6.000 / €7.000 / €4.500 / €4.250. De montage toont de uitbetaling en de berekening van de eindbuit, zodat onafhankelijke voorbeelden niet als opeenvolgende spins worden verward. De aanwijzers zijn op de screenshots gecontroleerd; de vaste pijl draait niet mee met de schijf.

Browser op 390×844: vraagteken opent de nieuwe video, duur 30 seconden, 390×780, muted en zonder mediafout. Dialoog past precies binnen de viewport. Video eindigt en blijft open; zoeken naar zes seconden werkt. Veilige oefening opent via de aparte knop; na sluiten is de echte buit nog €5.000, blijven twee spins beschikbaar en zijn er nul open dialogen. Geen browserconsolefouten. Screenshot: `data/gokrad-uitleg-telefoon.png`. De video laadt pas als de speler hulp opent. Dit is een technische en visuele controle, geen begripstest met nieuwe spelers.

### Gokker-aankoopwinst en uitlegfilm — 29 oktober 2026
Gericht getest: aankoopwinst met nul resterende buit; veel saldo zonder winst; gezamenlijke aankopen en herladen; dubbele/vervalste items; ontslagen partner deelt mee; aankoopvoortgang tijdens een radanimatie; stille film alleen voor de Gokker. Balance/game-tuning en engine/rolfilm/gokradtests geslaagd. TypeScript en productiebuild geslaagd. Bestaande HTTP-herstarttest verwacht nu 0/3 aankoopvoortgang na een diefstal. Geen productiegame gemaakt of database gewist.

Definitieve mediacontrole: H264 390×780, 68 seconden, geen audiostream; volledige decode geslaagd. Op 390×844 telefoonformaat: dialoog past, afspelen/pauseren/zoeken naar 2 seconden werken, geen videofout. Vercel-productie dpl_4mX2tywwJvurZk6KkBy8afRNd7vG: client index-Fc0d3CmP.js; video en poster met lokale SHA256 vergeleken; HTTP206 voor doorspoelen.

29 oktober 2026: de aangeleverde Gokker-intro is teruggezet bij de roluitleg. De nieuwe stille doel-/steelfilm opent uitsluitend via het vraagteken rechtsboven bij de drie aankopen. Achttien gerichte aankoop-/rolfilmtests en de productiebuild geslaagd.
