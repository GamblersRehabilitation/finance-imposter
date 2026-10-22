# Financiële werkzaamheden en spelvertaling

Geraadpleegd op 15 oktober 2026. De afbeelding van de organisator geeft richting aan de rustige documentpanelen, balans, biljetten en diagrammen. Alle interfaceonderdelen zijn eigen HTML/CSS/SVG; er zijn geen beelden uit andere spellen overgenomen.

| Bron | Wat helpt bij dit spel | Vertaling |
| --- | --- | --- |
| [Nibud: inkomsten en uitgaven](https://scholieren.nibud.nl/artikel/inkomsten-en-uitgaven/) | Een begroting vergelijkt geld dat binnenkomt met geld dat uitgegeven wordt. | Een visuele weegschaal met een ontbrekend kostenbedrag; winst als stroom van omzet naar kosten en resultaat. |
| [DNB: financiële criminaliteit tegengaan](https://www.dnb.nl/betrouwbare-financiele-sector/witwassen-en-crimineel-geld-bestrijden/) | Financiële instellingen controleren dossiers en volgen geldtransacties en ongewone gebeurtenissen. | Beveiliger krijgt incidenten, kiest een laptop en onderzoekt tijdstippen. Een melding is een aanwijzing; de speler moet zelf observeren en overleggen. |
| [AFM: is beleggen iets voor jou?](https://www.afm.nl/nl-nl/consumenten/themas/zelf-beleggen/is-beleggen-iets-voor-jou) | Doel, termijn en risico zijn relevant bij vermogensbeheer. | Een portefeuille met zichtbare verdeling. De percentages zijn een fictieve opdracht, geen beleggingsadvies of voorgesteld rendement. |
| [Among Us: officiële speluitleg](https://www.innersloth.com/games/among-us/) | Korte taken, samenwerken, waarnemen en overleg ondersteunen sociale deductie. | Telefoon kiest en koppelt; laptop voert uit. Geen lange handleiding midden in een taak. De Manager leidt een expliciete meetingflow. |
| [Papers, Please: officiële site en spelbeelden](https://papersplea.se/) | Documenten naast elkaar kunnen controlewerk begrijpelijk maken. Dit is onze ontwerpinterpretatie van de officiële beelden. | Bestelling en factuur naast elkaar; een verzekeringsdossier met schade, eigen risico en vergoeding. |

De acht opdrachten vertegenwoordigen eenvoudige administratieve werkzaamheden: begroten, factuurbedragen controleren, omrekenen, rente verwerken, schadevergoeding boeken, biljetten tellen, winst bepalen en een voorgeschreven verdeling uitvoeren. Koers, rente, dekking en verdeling zijn vereenvoudigde spelgegevens. De uitleg staat naast het bijbehorende diagram; invoervelden, knoppen en schuiven geven verschillende manieren om bedragen vast te leggen.

Voor deze iteratie is eenvoud gekozen boven een volledige bank- of verzekeringssimulatie. De server genereert de bedragen en controleert de uitkomst. De telefoon ontvangt geen oplossing. Er zijn geen echte betalingen, handelsorders of goktransacties.

Het buitrad gebruikt inmiddels zestien even waarschijnlijke vakken: acht met winst en acht met verlies. Het aantal spins en de inzet zijn begrensd. De eerste balans is getest op rekenregels en gelijktijdige acties; een klassikale speeltest blijft nodig om de duur en spanning te beoordelen.

## Onderzoek: uitleg zonder tekst of hoorbare rolgegevens

Geraadpleegd op 16 oktober 2026. Dit is een voorstel voor een volgende ontwerpstap. De bestaande prototype-uitleg blijft voorlopig zichtbaar, zoals gevraagd. Er is geen gesproken instructie nodig. Bedragen, aantallen, spelersnamen en laptopnummers blijven functionele spelinformatie.

### Bevindingen uit primaire bronnen

- [W3C: Use Icons that Help the User](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p07-icons-used/) adviseert herkenbare, ondubbelzinnige pictogrammen, met één betekenis per symbool en een duidelijke relatie met de bijbehorende bediening. Een grote verzameling kleine symbolen kan juist verwarren.
- [Nielsen Norman Group: Icon Usability](https://www.nngroup.com/articles/icon-usability/) beschrijft dat herkenning afhangt van ervaring en context; veel pictogrammen hebben meerdere mogelijke betekenissen. De bron beveelt labels aan voor onduidelijke iconen. Voor onze gewenste tekstloze versie is daarom een geteste, aangeleerde beeldtaal nodig. Dat laatste is onze ontwerpconclusie, geen bewijs dat elk label veilig kan verdwijnen.
- [Game Accessibility Guidelines: Include interactive tutorials](https://gameaccessibilityguidelines.com/include-interactive-tutorials/) adviseert oefenen in de spelcontext. Een handeling zelf uitvoeren ondersteunt het onthouden beter dan alleen een los instructiescherm bekijken.
- [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) vereist naast kleur ook andere zichtbare aanwijzingen. Selectie, succes en afwijzing krijgen daarom eveneens een rand, patroon, vink, kruis of verbinding.

### Vertaling voor alle spelonderdelen

De volgende voorstellen zijn onze concrete ontwerpkeuzes op basis van die principes. Ze zijn nog niet met spelers gevalideerd.

| Onderdeel | Beeld dat de handeling uitlegt | Wat nog aangepast moet worden |
| --- | --- | --- |
| Joinen en toelaten | QR → telefoon → persoonskaart → open deur; wachtende kaart krijgt een zandloper. | Laat een geanimeerde voorbeeldkaart van de wachtrij naar de lobby schuiven. Toon de echte naam los van de uitleg. |
| Rol en doel | Stil filmpje met exact dezelfde rol-, kas-, buit- en meetingiconen als in het spel. Doelbedrag staat naast een eindvlag. | Splits de bestaande stille filmpjes op in korte hoofdstukken per vaardigheid; pas de beelden aan op de nieuwe kaart en kasverplaatsing. Voeg een herhaalicoon toe. |
| Taak kiezen en koppelen | Een taakkaart licht op → op de kaart dezelfde laptop → vier vormen reizen van laptop naar de vier telefoonvakken. | Bouw één vrijblijvende oefenkoppeling. Laat de geselecteerde laptop op beide apparaten hetzelfde nummer en hetzelfde symbool tonen. |
| Begroting en winst | Geld komt links binnen; kosten verlaten het schema; het ontbrekende bedrag balanceert de weegschaal of vult het resterende vak. | Vervang instructiealinea’s door een korte voorbeeldanimatie met eigen fictieve bedragen, gevolgd door één oefenstap. |
| Factuur en dubbele betaling | Overeenkomstige velden worden met lijnen verbonden. Twee gelijke referentie-bedragparen krijgen dezelfde omlijsting. | Laat een voorbeeldpaar selecteren en toon het resultaat; behoud geen geschreven “kies twee”-opdracht. |
| Valuta, rente, portefeuille en btw | Omwisselpijl, groei over één kalenderstap, ringverdeling en een toeslagblok. | Geef elke bewerking een vaste richting en toon één zichtbaar tussenresultaat. Leer procentblokken met een eenvoudig gevuld raster aan. |
| Verzekering en salaris | Bruto/schadeblok verliest twee of één gemarkeerde stukken; het restant stroomt naar de ontvanger. | Teken aftrekblokken op schaal; de gebruiker oefent eerst met een klein voorbeeld. Een universeel minteken maakt de bewerking zichtbaar. |
| Kas tellen | Biljetten en munten worden naar overeenkomstige bakjes gesleept; het totaal groeit zichtbaar. | Geef een tik- of sleepdemonstratie en een gevulde voorbeeldlade; maak tellen mogelijk zonder geschreven werkwoord. |
| Documentcontrole en koppelen | Vergrootglas vergelijkt twee bedragen; afwijking krijgt een ongelijke-vormmarkering. Voor koppelen verschijnen vaste lijnen en paartekens. | Voeg een oefenkaart toe en gebruik lijnen en paarnummers naast kleur, ook bij de bestaande derde minigame. |
| Lockpick | Een spookwijzer stopt in een gearceerde doelboog; een drukvinger wijst de bedieningsknop aan; de volgende ring licht op. | Laat één kosteloze oefenpin doen; toon de oplopende snelheid met bewegingssporen. Houd de echte pin en doelboog groot genoeg. |
| Omleiden | Een vinger draait één buis; daarna loopt een gelddeeltje van bron naar ontvanger. De patrouille-/timerboog loopt leeg. | Geef een oefenbord met twee draaibare stukken. Laat het echte bord pas starten na de oefenhandeling. Maak ook gesloten poorten zichtbaar zonder tekst. |
| Buit innen of doorgaan | Munten schuiven naar een veilige buidel of blijven naast een nieuwe gesloten ring/route liggen. Een fout laat de risicobuidel leeglopen. | Scheid veilig geïnde buit en opgebouwde risicobuit visueel. Laat vóór de eerste echte poging zien wat verloren kan gaan. |
| Rad | Inzetmunten gaan onder het rad; acht winst- en acht verliesvakken worden in twee groepen getoond; twee fiches tonen de resterende spins. | Vervang kansalinea door een korte 8/8-animatie en een voorbeeldinzet; markeer uitbetaling als inclusief inzet. Gebruik geen geluid dat een winnende rol verraadt. |
| Shop en buitdoel | Bezit verhuist van etalage naar een eigen vitrine; munten nemen af maar dezelfde totale vermogensmeter blijft staan. | Laat beschikbaar geld en bezit als twee gevulde delen van één doelbalk zien. |
| Kasverplaatsing | Tijdens de meeting verdwijnen de twee kasmarkeringen; daarna verschijnen ze op twee andere laptops. | Toon deze korte overgang alleen op de Gokkertelefoons. Openbare kaarten tonen geen kasmarkeringen. |
| Beveiliger | Een neutrale puls op een laptop → scanraster → tijdwijzers en transactie-/taaksporen. | Maak een voorbeeldscan die duidelijk maakt dat een melding geen schuld bewijst. Houd automatische privémeldingen stil. |
| Meeting en Manager | Persoonsfiguren lopen naar een kring → tekstloze gespreksballonnen → één persoonskaart naar een deur óf een hele groep terug naar bureaus. | Geef elke fase één grote actie met een miniatuurvoorvertoning van het gevolg. Ontslag krijgt een aparte bevestigingshandeling. |
| Ontslag en vacatures | Gesloten deur → vacaturekaart → controle → groen vinkje → rode afwijzingsstempel. | Toon het wisselen van status met vormen en beweging naast kleur. Toon geen kas of meeting op deze telefoons. |
| Einde en opnieuw spelen | Het winnende teamsymbool bij een volle doelbalk of een lege kas; een kringpijl verzamelt dezelfde personen voor een nieuwe start. | Maak winstreden en opnieuw spelen visueel verschillende handelingen. Verberg ook eindbedragen voor ontslagen spelers. |

### Benodigde bouwstenen vóór tekst werkelijk kan verdwijnen

1. Eén gedeelde verzameling iconen en animaties, met vaste betekenissen voor selecteren, bevestigen, risico, wachten en teruggaan. Voorkom dat een koffertje voor meerdere rollen wordt gebruikt.
2. Per vaardigheid een tekstloze demonstratie plus een veilige oefenhandeling. De server start de taak- of routetimer pas na afronding van deze eerste oefening; dit vraagt een aparte tutorialstatus per speler en vaardigheid. Die status bestaat nu nog niet.
3. Een zichtbaar herhaal-/helpicoon dat dezelfde stille demonstratie heropent. Oefeningen wijzigen geen geld, rol, quota of andere echte spelgegevens.
4. Pijlen, vaste ruimtelijke volgorde, verbindingen en patronen naast kleuren. Elke icoonknop blijft technisch een benoemde, toetsenbordbedienbare knop; toegankelijke namen blijven beschikbaar voor hulpmiddelen zonder dat de game automatisch spreekt.
5. Respecteer verminderde beweging: dezelfde informatie moet ook in enkele stilstaande diagramstappen begrijpelijk blijven. Zet instructieanimaties stil zolang iemand een keuze maakt.
6. Publieke meetingbel duidelijk en hoorbaar; tikgeluiden kort en uniform. Geen gesproken uitleg of hoorbare melding die alleen een Beveiliger of Gokker krijgt.

### Hoe we dit met de klas moeten testen

Laat minimaal vijf nieuwe spelers ieder de belangrijkste handelingen uitvoeren op een versie zonder zichtbare instructietekst en zonder audio. Geef vooraf geen uitleg van de symbolen. Registreer eerste keuze, fouten, tijd tot de eerste juiste handeling en herhaald gebruik van hulp. Test de financiële handelingen, koppeling, beide steelspellen en het leiden van een meeting afzonderlijk. Controleer ook het begrijpen van kasverplaatsing, inzet versus uitbetaling en het verschil tussen saldo en bezit.

Een bruikbaar voorlopig acceptatiecriterium is dat ten minste vier van de vijf spelers elke essentiële handeling zelfstandig kunnen vinden en uitvoeren na de korte oefening. Vergelijk met het huidige prototype en test daarna met een groep van veertien om meekijken, rolgeheimen en geluidsoverlast te beoordelen. Dit is een voorgestelde testopzet; deze gebruikerstest is nog niet uitgevoerd. Pas na deze test hoort de prototype-uitleg per onderdeel te verdwijnen.

### Aanbevolen volgorde in onze huidige code

Dit is een uitvoeringsvoorstel; voor dit onderzoek worden de schermen en spelregels niet aangepast.

| Volgorde | Huidig onderdeel | Concrete vervolgaanpassing |
| --- | --- | --- |
| 1 | `RoleHelp.tsx`, `Codes.tsx` en `TaskParts.tsx` | Maak de rolfilmpjes en codekoppeling bruikbaar zonder de geschreven stappen. Laat dezelfde vier vormen van laptop naar telefoon reizen. Vervang de drie geschreven taakstappen door drie grote, verschillende beelden; de eerste stap moet bij de echte handeling passen, dus niet altijd een rekenmachine. |
| 2 | `FinancialTask.tsx`, `TaskParts.tsx` en `FinanceExtras.tsx` | Begin met een representatieve reken-, vergelijk- en koppeltaak. Toon een voorgedaan voorbeeld en laat daarna één kleine oefenhandeling uitvoeren. Vervang financiële termen zoals eigen risico, nettoloon en btw door herkenbare objecten plus een zichtbaar rekenproces. Als dat onduidelijk blijft, vereenvoudig de handeling zelf voordat de tekst vervalt. |
| 3 | `TheftControls.tsx`, `GameWidgets.tsx` en `GambleWheel.tsx` | Demonstreer drukken, draaien, innen en doorzetten met een geanimeerde hand. Toon verlies van risicobuit, behoud van veilig geld, inzet en uitbetaling als aparte geldstromen. De speler moet deze gevolgen begrijpen vóór een echte inzet. |
| 4 | `Player.tsx`, `Device.tsx` en `InfiniteJobs.tsx` | Maak verzamelen, overleg, ontslag, scanresultaten, wachten en vacaturestatus herkenbaar als opeenvolgende beelden. Maak onderscheid tussen tijdelijk wachten en een actie die opnieuw nodig is. Behoud de bedoelde onzekerheid: een kasdaling of incidentbeeld mag niet verklappen of een taak mislukte of een Gokker stal. |
| 5 | Serverstatus en gebruikerstest | Bewaar alleen welke vaardigheden iemand geoefend heeft; gebruik voor de demo vaste oefengegevens. Een demo kan geen echt geld boeken of een echte speler ontslaan. Start de echte timer pas wanneer de oefening klaar is, en maak opnieuw openen van hulp geen manier om een lopende timer stil te zetten. Test daarna per onderdeel of de tekst kan verdwijnen. |

De eerste kleine proef zou bestaan uit koppelen → één financiële taak met drie verschillende onderdelen → zichtbare beloning. Daarmee testen we de hele samenwerking tussen telefoon en laptop, voordat alle schermen worden omgebouwd. Daarna volgen de Gokker- en Managerhandelingen met grotere gevolgen.

Met “zonder tekstuele uitleg” bedoelt dit voorstel de spelerschermen op telefoon, laptop en digibord. Namen, bedragen, rekentekens en herkenningsnummers blijven zichtbaar. Het beheerdersdashboard en de plattegrondeditor kunnen voorlopig tekst gebruiken. Toegankelijke namen voor hulpmiddelen blijven technisch aanwezig. Dit onderscheid moet tijdens het ontwerp behouden blijven.

### Eerste uitvoerbare proef — koppelen en begroting

Op verzoek is nu alleen de koppeldialoog en één volledig taaktype uitgewerkt. De koppeldialoog bevat een stille demonstratie van ongeveer vijf seconden en een oefenkoppeling met vaste voorbeeldvormen. Daarna voert de speler de echte laptopcode in. Het taaktype Begroting bevat drie verschillende onderdelen zonder zichtbare uitlegwoorden: het ontbrekende budget kiezen, een afwijkend dossier selecteren en drie betalingen aan gelijke bedragen koppelen. De bestaande andere taaktypes behouden hun prototype-uitleg.

Vóór de eerste echte begroting doorloopt de speler drie stille voorbeelden van circa 4,5 seconden met telkens een oefenhandeling. De oefening gebruikt eigen voorbeeldgegevens en kan geen geld, taakbeloning of taakcheckpoint veranderen. De server start de echte timer van 30 seconden pas na de oefening. Hulp opnieuw openen tijdens de echte taak stopt of verlengt die timer niet. Oefenvoortgang blijft per deelnemer bewaard, ook bij opnieuw spelen met dezelfde deelnemers. Na vijf minuten vervalt een nog niet afgeronde oefenkoppeling zonder geldverlies.

De uiteindelijke scope is bevestigd: alle uitleg voor spelers op telefoon, laptop én digibord wordt later beeldend; adminbediening mag tekst houden. Deze eerste proef voert die brede omschakeling nog niet uit. De stille voorbeelden zijn met HTML/SVG opgebouwd en spelen lokaal; daarvoor zijn geen video-upload, externe dienst of gesproken instructie nodig. Een test met nieuwe spelers blijft nodig om vast te stellen of de beeldtaal zelfstandig wordt begrepen.

### Uitbreiding na de eerste prototypeproef — huidige werking

De vervolgvraag vervangt de eerdere keuze om de timer tijdens hulp door te laten lopen. Het vraagteken wisselt nu de taak om voor een afzonderlijk tutorialscherm. De server bevriest de resterende tijd van die gekoppelde taak; sluiten hervat exact die tijd, zonder nieuwe 30 seconden toe te kennen. Bij steelspellen worden ook de routeklok en lockpickbeweging verschoven. De gezamenlijke meetingklok blijft voor de andere spelers doorlopen. Een meeting ruimt gekoppelde oefeningen op zonder oefenboete.

Bij elke nieuwe lobby en bij opnieuw spelen wordt alle leerstatus gewist. De eerste codekoppeling, ieder nieuw financieel taaktype en ieder steelspeltype bieden opnieuw een stille les. Het rad heeft ook een persoonlijke les zonder echte inzet of verbruikte spin. Spelers kunnen demonstraties herhalen, snel naar de volgende stap gaan, overslaan of sluiten. Binnen dezelfde speelsessie wordt een al bekeken les niet verplicht herhaald.

Alle twaalf financiële speltypes gebruiken nu objecten, rekenbeelden, documentparen of kalenderbeelden. Het voorbeeld laat de invoer en bevestiging na elkaar zien met een handaanwijzer; de koppelstap tekent de verbindingen. Percentagevoorbeelden tonen ook de tussenberekening. Daarna volgt een oefening met andere bedragen. De koppelaanwijzing op de telefoon toont het nummer en de naam op een afgebeelde laptop, met een hand die naar het scherm wijst. Hetzelfde laptopnummer staat op de echte laptop.

Telefoonrollen, open taken, scans, vergaderfasen, ontslag, vacatures, buitdoel, stelen, rad, shop, laptopstatus en digibordlobby hebben geen zichtbare geschreven instructies meer. Namen, geldbedragen, referentienummers en reken-/voortgangstekens blijven. Knoppen houden toegankelijke namen voor hulpmiddelen. Adminbediening houdt tekst. Geluidsfeedback gebruikt korte tonen voor kiezen, bevestigen, teruggaan, draaien, succes en fouten; automatische privémeldingen blijven stil en er is geen gesproken uitleg. De bestaande rolvideo’s en standaardbriefingweergave zijn stil.

#### Begrippen die nog een gebruikerstest nodig hebben

- **Rente, btw en portefeuillepercentages:** symbolen en een honderdveld tonen de bewerking, maar garanderen niet dat iemand het financiële begrip begrijpt. Test zowel de bediening als het uitrekenen met andere bedragen. Bij verwarring kunnen we in een volgende stap geldblokken daadwerkelijk in honderd delen splitsen.
- **Beveiliger:** een laptopmelding met een vergrootglas kan onterecht als bewijs van schuld worden gelezen. Test of spelers begrijpen dat een mislukte taak ook een incident veroorzaakt en dat scanmomenten naast waarnemingen gelegd moeten worden. Een verdere tekstloze uitbreiding kan een voorbeeld tonen met twee mogelijke oorzaken naast hetzelfde incident.
- **Gokker:** het verschil tussen risicobuit en veilig geïnde buit, en tussen inzet en totale uitbetaling, blijft abstract. De twee geldroutes en het oefenrad maken het zichtbaar; een volgende gebruikerstest moet laten zien of verlies en behoud goed worden voorspeld vóór een echte keuze.
- **Ontslag en misleidende vacatures:** de toegang die verdwijnt en het vinkje dat uiteindelijk in een kruis verandert moeten ook zonder groen/rood begrepen worden. Hiervoor zijn de deur, zandloper, vink en kruis gecombineerd. De grap kan minder duidelijk zijn zonder functietitels; dit is een bewust punt voor de speeltest.

Geen van deze onderdelen heeft noodzakelijk gesproken uitleg nodig. Wat nog onzeker is, is het zelfstandig begrijpen door nieuwe spelers; technische controles en een succesvolle ontwikkelaarstest bewijzen dat niet. Test met nieuwe spelers vóór we de beeldtaal als definitief beschouwen.


### Uitwerking: stille uitleg per betekenis — 16 oktober 2026

De introductie gebruikt nu herkenbare schermvoorbeelden, dezelfde symbolen als de echte bediening, zichtbare tikhandelingen en aparte hoofdstukken per begrip. Een betekenis komt terug in voorbeeld, veilige oefening en echte uitkomst. Kleur wordt altijd gecombineerd met een verschillend pictogram: geldspoor/munten, taakfout/doorgestreept dossier en geen sporen/schild plus nul. Een groen vinkje naast het scansymbool betekent alleen dat de scan is uitgevoerd; de grote uitkomst staat apart. De digitale tijd laat seconden zien en vervangt de moeilijker afleesbare analoge klok. Een melding is eerst een belletje met laptopnummer en vraagteken, geen bewijs van diefstal. De uitleg toont ook dat een gebeurtenis op een laptop geen identiteit bewijst.

De speler bepaalt het tempo met verder/terug/herhalen/overslaan. De film stopt per hoofdstuk; de oefening gaat na een goed antwoord niet vanzelf door. Dit vervangt eerdere automatische voorbeeldwissels. Financiële hulp pauzeert de serverklok en toont de bevroren tijdbalk; nu zijn er 45 seconden per echt onderdeel. Geen gesproken uitleg. De overgang van een spoor naar een vermoeden over een persoon blijft het lastigste begrip zonder tekst: bespreek bij de gebruikerstest wat spelers denken dat het symbool bewijst, zonder de betekenis vooraf voor te zeggen.


### Herkenning door dezelfde bediening — 16 oktober 2026

Na feedback dat de losse symbolen nog cryptisch waren, gebruikt de rolintro nu de echte presentatiecomponenten van de telefoon. De uitleg vraagt daardoor minder vertaling van een abstract diagram naar een andere knop in het spel. De volgorde is scherm herkennen, één bediening aanwijzen, tik voordoen, gevolg laten zien. Dossierfout en kasafschrijving krijgen eerst een concreet voorbeeld en daarna hun scanweergave. Cijfers, bedragen en namen blijven zichtbaar; er is geen geschreven of gesproken uitleg. De abstracte symboolquiz is uit de rolintro verwijderd. Een volgende gebruikerstest moet vooral toetsen of spelers zonder hulp de juiste scan kiezen en een tijdstip als aanwijzing behandelen, zonder daar een zekere dader uit af te leiden.
# Beoordeling aangeleverde rolvideo's — 22 oktober 2026

De vier aangeleverde MP4's zijn lokaal op beeldinhoud bekeken en hun gesproken inhoud is lokaal getranscribeerd. Het zijn overzichtsvideo's met vereenvoudigde tekeningen, geen schermopnames of volledige bedieningslessen. De onderstaande beoordeling vergelijkt ze met de huidige serverregels; zelfstandig begrip door nieuwe spelers is niet onderzocht.

| Rol | Wat goed aansluit | Wat ontbreekt of aandacht nodig heeft |
| --- | --- | --- |
| Beveiliger, circa 14 s | Verdacht verkeer, naar de laptop lopen, tijdstip onderzoeken, twee controles per ronde. | De nieuwe vormcode-invoer ontbreekt. De tekeningen verklaren niet het verschil tussen een taakfout, geldspoor en geen sporen. Een scan wijst geen dader aan: combineer laptop en tijdstip met wat spelers zagen. Het aantal scans is vooral via de stem duidelijk. |
| Gokker, circa 26 s | Bedrijfsgeld stelen na de eerste kwartkasdrempel, gezamenlijke buit, twee spins per ronde, gelijke kans op winst/verlies, geld- of ontslagoverwinning. | De stem gaat uit van precies twee Gokkers; het aantal is instelbaar. De twee spins gelden per Gokker per ronde. Code-invoer, de willekeurige steelspellen, dertig seconden vertraging van de bedrijfsmelding, wisselende kaslocaties en de shop ontbreken. Zonder stem is het verschil tussen inzet, winst en verlies onvoldoende zichtbaar. |
| Manager, circa 16 s | Overleg leiden, aanwijzingen afwegen, maximaal één ontslag per meeting, niemand ontslaan mag ook. | Hand opsteken en beurtverdeling zijn fysieke afspraken, geen automatische telefoonfuncties. De knoppen verzamelen/overleg/ontslag/hervatten en de aparte ontslagbevestiging ontbreken in beeld. Zonder stem is de mogelijkheid om niemand te ontslaan niet duidelijk. |
| Werknemer, circa 14 s | Laptopopdrachten verdienen bedrijfsgeld, collega's observeren en lege kas betekent bedrijfsverlies. | De stem noemt beide Gokkers, terwijl het aantal instelbaar is. Bedrijfsdoel als andere winstvoorwaarde, drie onderdelen per taak, code-invoer en de taaktimer worden niet uitgelegd. De losse koppeloefening en taaklessen blijven hiervoor beschikbaar. |

Conclusie: bruikbaar als korte rolintro met geluid, maar nog niet als volledige tekstloze bedieningsuitleg wanneer spelers dempen. Voor een volgende filmversie helpt een daadwerkelijk getoonde handeling met zichtbaar resultaat: bij Beveiliger code → scan → drie verschillende resultaten; bij Manager naam → bevestiging → ontslag of hervatten; bij Gokker inzet → rad → aantoonbaar stijgende of dalende rekening. Gebruik een variabel aantal teamfiguren of spreek over het Gokkersteam. De aangeleverde films zijn in deze wijziging inhoudelijk behouden, met zachter geluid en een eigen dempknop.
