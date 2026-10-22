# Orbital Shift VR

Lokale Roblox-ontwikkelbuild, versie 0.1.0 — 18 oktober 2026.

De game staat via MCP in de door jou goedgekeurde lege place **Orbital Shift VR** (voorheen Place3, place-ID 107724165744965). Er is niets openbaar gepubliceerd. De bestaande Finance Imposter-bestanden zijn niet aangepast.

## Starten

1. De aangesloten Studio-place staat in **Edit**. Druk zelf op **Play** en kies **START / RESUME** in het spelmenu.
2. Als zelfstandig bestand: open `build/Orbital Shift VR.rbxlx` in Roblox Studio en druk op Play. Het bestand bevat de bronmodules en een verankerde stationspreview. Bij Play vervangt WorldBuilder alleen zijn eigen preview door de functionele wereld met tags, constraints en attributen.
3. Sla de geopende place zelf lokaal op met **Save to File**. De meegeleverde `.rbxlx` is al een lokale kopie, onafhankelijk van de verbonden Studio-sessie.

Er worden geen Toolbox-scripts, externe `require`-assets, betaalde assets, HTTP-diensten of DataStores gebruikt. De voortgang geldt voor de lopende serversessie.

## Desktopbesturing

| Invoer | Actie |
|---|---|
| Muis | Rondkijken; richt je virtuele handen op een object of reling |
| Q / E vasthouden | Linker- / rechterhand grijpen; een vrije hand reikt zo nodig verder |
| W / S tijdens grip | Handen naar je toe / van je af bewegen; aan een vaste reling gaat je lichaam tegengesteld |
| A / D tijdens grip | Handen zijwaarts verplaatsen |
| R / F tijdens grip | Handen omhoog / omlaag verplaatsen |
| V | Kies beide handen, alleen links of alleen rechts voor handverplaatsing |
| T / G tijdens grip | Geselecteerde hand(en) rollen; rondkijken draait een gedragen object ook mee |
| Z / C | Gebruiken met links / rechts; bij een wiel eerst grijpen en vervolgens USE vasthouden |
| Shift + USE | Een wiel in de andere richting draaien |
| Spatie | Begrensd afzetten bij een bereikbare reling of luik |
| J / L | Snap turn van 30 graden |
| Tab | Pauze- en comfortmenu |
| H | Terug naar het actuele checkpoint |

Begin bij de korte reling recht voor de spawn. Houd Q vast, trek kort met W en laat Q **tijdens het bewegen** los om te zweven. Zonder grip is WASD geen vrij vliegende motor. Pak een bereikbare reling om af te remmen. Een object dock je door het rustig, rechtop en met de juiste oriëntatie in de houder te brengen en los te laten; USE kan ook een plaatsingspoging starten.

## VR-besturing en comfort

Tracking komt uit `VRService`, met afzonderlijke controllerposes en fysieke handproxies. De camera gebruikt `HeadLocked = true`, `HeadScale = 1` en een tracking-oorsprong; de hoofdpose wordt niet nogmaals in de camera vermenigvuldigd. De virtuele horizon blijft recht.

Het menu biedt Assisted/Inertial, snelheidsinstelling, blikgevoeligheid voor desktop, hercentreren, zittend/staand kalibreren, dominante hand, toggle-grab, comfortvignet, objectherstel, checkpointreset en volledige herstart. In VR is het menu een wereldpaneel met een zichtbare aanwijslijn en selectie via de gebruikstrigger. De missiekaart staat bij de linkerhand.

De profielen **Quest**, **Pico / SteamVR** en **Swapped grips/triggers** gebruiken een centrale adapter voor het actuele Input Action System, met ContextActionService als compatibiliteitsroute. Standaard zijn `ButtonL1/R1` grijpen en `ButtonL2/R2` gebruiken; `ButtonY` opent het menu en `ButtonB` herstelt. Het rechterpookje draait in stappen en moet tussendoor terug naar neutraal. Het linkerpookje omlaag keert wielbediening om. De diagnostiek toont ontvangen invoer. Controleer de daadwerkelijke controllerindeling zelf op de gebruikte headset/runtime; kies het omgekeerde profiel als dat nodig is. Systeemknoppen blijven voor Roblox en het platform.

## Spelcyclus

- **Tutorial:** reling grijpen, trekken, loslaten, afremmen, oefencel pakken en docken. Overslaan is beschikbaar; herhalen start een nieuwe sessiecyclus.
- **Stroomherstel:** twee cellen in A/B plaatsen en de hoofdschakelaar bedienen. De deur opent pas na de servercontrole.
- **Signaalverbinding:** beide kabelstekkers aansluiten en de antenne fysiek met twee wielen richten op **yaw 35° / pitch −20°**, gedurende **3 seconden binnen 7° tolerantie**. De antenne en signaalmeter reageren op de gemeten scharnierhoeken.
- **Berging:** binnenluik sluiten en uit de opening blijven, druk vereffenen, veiligheidslijn vastmaken, buitenwiel draaien, onderzoekscontainer terughalen en in de ontvangsthouder plaatsen, buitenluik sluiten en repressuriseren. Benader de houder vanaf zijn open zijde in de cabine. De kist kan tegen panelen of geleiders blijven steken; maak ruimte en benader opnieuw.
- **Einde:** afronding met sessieduur en keuze tussen herstart of verder oefenen. Beide spelers delen dezelfde missiestatus.

## Herstel en techniek

De server bewaakt grijprechten, bereik, zichtlijn, sockettype, afstand, oriëntatie, druk, daadwerkelijke luikposities en toegestane missieovergangen. Poses worden ongeveer 25 keer per seconde verstuurd met volgnummer; oude snapshots worden geweigerd. Losse objecten hebben één primaire netwerkeigenaar. Een tweede speler moet wachten tot de eerste loslaat.

Vaste relingen gebruiken een gedeelde begrensde oplossing voor één of twee handen. Losse objecten vormen geen klimanker. Lichaam en handen hebben botsingen, eindige constraintkrachten en aanvullende casts/overlapherstel. Zware objecten behouden massa en reageren trager. De veiligheidslijn gebruikt een RopeConstraint met begrensde extra trekreactie. Herstel ruimt grips, tijdelijke constraints en de lijn op.

De compacte wereld telt 591 Parts vóór spelers. Er zijn zeven losse voorwerpen, vijf fysieke draai-elementen en drie schuifluiken. Er is geen physics-kabelketen. De verbonden place had streaming aan; het stationsmodel is daarom Persistent. Het losse XML-bestand zet streaming uit. Die instelling wordt niet vanuit runtimescripts gewijzigd. Feedback bestaat uit highlights, lampkleuren, teksten en optionele haptiek na capabilitycontrole; deze versie heeft geen eigen audiotrack of geluidsassets.

## Bronnen wijzigen en opnieuw installeren

Met Node.js:

```powershell
node tools/build.mjs
```

Dit schrijft de XML-place, de bronmanifesten en `build/Install.command.luau`. De installer kan in de Studio Command Bar worden uitgevoerd in een **lege, niet opgeslagen place** of de expliciet goedgekeurde Orbital Shift-place. Stop Play eerst. Hij vervangt alleen de projectnamespace `OrbitalShiftVR` en stelt de voor dit project bedoelde zwaartekracht en verlichting in. Andere bestaande games zijn geen installatiedoel. `default.project.json` is beschikbaar voor een Rojo-werkwijze.

`checkpoints/01-foundation.rbxlx` bewaart een eerdere bronversie. `checkpoints/02-station.rbxlx` is de opleverversie.

## Zelf testen en eventueel publiceren

Op jouw verzoek zijn verdere tests gestopt. Zie `TESTVERSLAG.md` voor het al verzamelde bewijs en de open controles. De scripts in `tools/` voor regressie en multiplayer zijn optionele tijdelijke testopstellingen; ze zitten **niet** als uitvoerende tests in de game.

Voor twee spelers: gebruik Studio **Server & Clients** met twee clients. Controleer overgeven, gelijktijdig grijpen, later aansluiten, resetten en vertrek van een speler die een object vasthoudt. Herhaal met gesimuleerde netwerkvertraging en pakketverlies.

Voor **Quest 3**: gebruik de zelfstandige Roblox-app, controleer de knopdiagnostiek, fysieke schaal, handbereik, hoofdtracking, trackingverlies, menu, comfortvignet, herstel en de hele missiecyclus. Meet frametijden op het apparaat; **72 fps is een doel en geen bevestigd resultaat**. Een headsetrun vraagt om een afzonderlijk door jou toegestane afgeschermde publicatie en passende testerstoegang.

Voor **Pico 4**: verbind via PICO Connect met een geschikte Windows-pc, start SteamVR, stel SteamVR in als actieve OpenXR-runtime en gebruik de Roblox Windows-client met VR ingeschakeld. Controleer controllerprofiel, schaal, hercentreren, trackingverlies, streamingvertraging en comfort. Deze route is bij Roblox onofficieel ondersteund; er wordt geen zelfstandige Pico-app of gegarandeerde compatibiliteit beloofd.

Handmatige account- en publicatiestappen: lokaal opslaan; indien gewenst een private testpublicatie toestaan; testers toegang geven; servergrootte op twee zetten; desktop en VR als doelplatforms configureren volgens de actuele Creator Dashboard-opties; inhouds-/compliancevragen invullen; daarna pas op de echte headsets testen. Openbare publicatie is niet uitgevoerd. Er zijn geen aankopen gedaan. De beoogde eerste speelduur van 20–30 minuten is niet gemeten.

Officiële referenties, geraadpleegd op 18 oktober 2026: [VRService](https://create.roblox.com/docs/reference/engine/classes/VRService), [Camera](https://create.roblox.com/docs/reference/engine/classes/Camera), [mover constraints](https://create.roblox.com/docs/physics/mover-constraints), [Input Action System](https://create.roblox.com/docs/input/input-action-system), [network ownership](https://create.roblox.com/docs/physics/network-ownership), [client/server-validatie](https://create.roblox.com/docs/scripting/security/client-server-boundary), [Meta Quest FAQ](https://en.help.roblox.com/hc/en-us/articles/17810433924628-Meta-Quest-FAQ), [Roblox VR en Pico-status](https://en.help.roblox.com/hc/en-us/articles/208260046-Setting-up-VR-for-Roblox), [PICO Connect](https://www.picoxr.com/global/software/pico-link).
