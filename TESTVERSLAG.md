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
