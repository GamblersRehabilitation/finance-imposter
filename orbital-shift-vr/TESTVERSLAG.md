# Testverslag — 18 oktober 2026

**Verdere tests zijn op verzoek van de gebruiker gestopt.** De place staat in Edit. Tijdelijke netwerk-testskripts zijn verwijderd en de eerdere Studio-netwerkvertraging is hersteld. Er is na dit verzoek geen nieuwe Play-sessie gestart. De laatste bronwijzigingen aan handselectie en hand-overlapherstel zijn geïnstalleerd, maar niet opnieuw gespeeld.

Omgeving tijdens de eerdere controles: Roblox Studio `0.743.0.7431133`, Windows, één desktopclient, viewport 655 × 806, VRService.VREnabled false. HeadScale 1, HeadLocked true, VRTiltAndRollEnabled false werden waargenomen. De goedgekeurde lege place was Place3, ID 107724165744965, daarna Orbital Shift VR.

## Werkelijk verzameld bewijs

- Een gewone muisklik op START/RESUME opende het spel. Echte Q/W-toetsinvoer greep een reling en verplaatste het lichaam van ongeveer `(0,5,7)` naar `(0,4.53,4.97)`. De tutorial ging van grijpen naar de loslaatstap. Loslaten tijdens een kortere trekbeweging leverde tutorialstap 4 (afremmen) op, met resterende snelheid. Dit was geen volledige menselijke tutorialdoorloop.
- Een afzonderlijke, gecontroleerde serverfixture doorliep **59 geslaagde controles**, waaronder beide energiecellen docken, de echte leverhoek, fysiek openende stroomdeur, beide kabelstekkers, gemeten wielhoeken en signaalvasthouden, luikbeweging, weigeren van vereffenen bij open luik, veiligheidslijn, zware onderzoekscontainer, fysieke sluiting, repressurisatie, eindstatus, snapshot en volledige herstart. Bewijs: `evidence/mission-regression.json`.
- Die fixture stuurde controllerposes en positioneerde het lichaam voor de componenttests. Losse objecten en mechanismen bewogen via de productieconstraints. De fixture stelde de missies niet direct op voltooid. Dit bewijst de geteste missievoorwaarden en onderdelen, niet een volledige menselijke solo-playthrough, VR-comfort of netwerkgedrag.
- Eerdere pogingen liepen vast op het opstartwachten op een ontbrekende PlayerModule, een luik dat tegen stationgeometrie kon botsen en problemen in de fixture: lokale herstelhooks, een geblokkeerde zichtlijn, een lichaam in een luikopening en een kist die tegen de achterkant van de houder werd gestuurd. De opstart- en luikconfiguratie zijn hersteld; de fixture is aangepast om normale vrije benaderingsroutes te gebruiken. Een eerdere mislukte poging is bewaard in `evidence/regression-previous-attempt.json`.
- De tijdelijke multiplayeropstelling werd gestart met een beoogde replicatievertraging van 150 ms. De gebruiker vroeg tijdens deze fase om tests over te slaan. Daarom is de opstelling gestopt en wordt hiervoor geen geslaagd resultaat geclaimd.
- Studio-output liet server- en clientopstart zien. Er waren ook Roblox CorePackages/UIBlox-waarschuwingen over FoundationProvider. Die kwamen uit Roblox' eigen UI-pakketten. De oorspronkelijk waargenomen eigen opstartwachtrij is hersteld.

## Acceptatiegevallen

Een status geldt voor het volledige genoemde geval. Bij gedeeltelijk bewijs blijft de volledige acceptatie open.

| # | Status | Observatie / bewijs en vervolgstap |
|---|---|---|
| 1 | Niet uitgevoerd | Starten en tutorialstappen 1–4 zijn met echte desktopinvoer bereikt; complete tutorial zonder ontwikkelcommando's nog zelf doorlopen. |
| 2 | Niet uitgevoerd | Camera-eigenschappen en trackingcode aanwezig; juiste fysieke linker/rechtercontroller, schaal en eenmaal toegepaste hoofdpose vragen om VR-emulatie of hardware. |
| 3 | Geslaagd | Beperkte desktopcontrole: relinggreep verplaatste het lichaam; loslaten tijdens bewegen liet snelheid over. Vrije armbeweging in echte VR nog controleren. |
| 4 | Niet uitgevoerd | Gedeelde tweehandsoplossing en begrenzing zijn geïmplementeerd; tweehandige releases en handwissels nog gericht testen. |
| 5 | Niet uitgevoerd | Fysieke colliders, casts en overlapherstel zijn aanwezig; geen volledige matrix van snelheden/startoverlap. Laatste hand-overlapwijziging niet gespeeld. |
| 6 | Niet uitgevoerd | Kleine cellen en zware kist bewogen en dockten in de fixture; handmatige rotatie-, loslaat- en massaverschilproef nog doen. |
| 7 | Niet uitgevoerd | Filtervenster en begrenzing geïmplementeerd; worpen tijdens zweven en na draaien nog zelf controleren. |
| 8 | Geslaagd | Knoppen, lever, wielen, echte schuifluiken, socketvoorwaarden en beide kabeluiteinden doorliepen de componentfixture. |
| 9 | Niet uitgevoerd | Drie missies, einde en volledige herstart geslaagd in de gecontroleerde fixture; menselijke solo-doorloop en afzonderlijke checkpointreset nog open. |
| 10 | Niet uitgevoerd | Multiplayercode en late-join-snapshot aanwezig; lopende test op gebruikersverzoek afgebroken. |
| 11 | Geslaagd | Servicecontroles weigerden NaN/inf, verkeerde objecten, onbereikbare handen, dubbele transitions en te veel token-bucketverzoeken. Volledige aanvalstest via twee echte clients nog open. |
| 12 | Niet uitgevoerd | Herstel via H is gebruikt; geen complete matrix van trackingverlies, respawn, hercentreren, focusverlies en buitengrenzen. |
| 13 | Niet uitgevoerd | Desktop beperkt uitgevoerd; geëmuleerde VR, echte Quest 3 en echte Pico 4 niet uitgevoerd. |
| 14 | Niet uitgevoerd | Console en beelden zijn bekeken; geen representatieve fps-/frametijdmeting, pakketverliestest of voltooide multiplayervertragingsrun. |

## Nog door jullie te doen

Volledige desktopdoorloop, twee clients, controller-/VR-emulatie, echte Quest 3, echte Pico 4 via PC/SteamVR, comfortbeoordeling, schaal/handbindings, worpen, worst-case-botsingen en frametijden. Geen claim van gegarandeerde headsetcompatibiliteit, gemeten 72 fps of gemeten speelduur. Er is geen openbare of private testpublicatie verricht.

De herhaalbare fixtures staan in `tools/`; zij zijn bewust uitgesloten van de geïnstalleerde runtime en de `.rbxlx`-scripts. De uiteindelijke bronbestanden staan met hashes in `build/manifest.json`.
