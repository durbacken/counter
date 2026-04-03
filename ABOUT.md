# Koll på läget?

> Räknare och checklistor i realtid — byggt för team.

## Vad är det?

**Koll på läget?** är en lättviktig webbapp för att hålla koll på saker tillsammans i realtid. Oavsett om du räknar besökare på ett evenemang, bockar av punkter på en checklista eller följer upp återkommande uppgifter — alla i teamet ser varje uppdatering direkt när den händer.

Ingen app store. Ingen installation krävs. Fungerar på alla enheter med en webbläsare och kan läggas till på hemskärmen för känslan av en vanlig app.

---

## Vem är det för?

Alla som behöver räkna eller följa upp saker tillsammans:

- **Eventpersonal** som räknar besökare, utrustning eller händelser
- **Sportlag** som noterar statistik under träning eller match
- **Lager och butik** som gör snabba inventeringar tillsammans
- **Vård och säkerhet** som kör skiftchecklistor eller tillsynsrundor
- **Projektteam** som följer upp dagliga punkter eller sprintuppgifter
- **Alla** som någon gång tagit till ett delat kalkylblad bara för att hålla en löpande räkning

---

## Funktioner

### Två lägen

| Räknare | Checklistor |
|---|---|
| Öka och minska namngivna punkter | Bocka av punkter i en lista |
| Se live-summor över alla kategorier | Följ framsteg i procent |
| Exportera sammanfattning som PNG-bild | Exportera avklarad lista som PNG |

### Realtidssamarbete
Bjud in kollegor via e-post. Alla medlemmar ser varje förändring direkt — ingen uppdatering av sidan behövs. Arbetsytor kan också delas som en publik länk för läsning utan inloggning.

### Senast ändrad av
Under varje punkt i en arbetsyta visas vem som senast ändrade den och när — t.ex. "Anna · 3 min sedan". Samma info visas på listkortet i startvyn.

### Ändringshistorik
Varje knapptryckning loggas med tidsstämpel och vem som gjorde ändringen. Valfria kommentarer låter dig lägga till sammanhang till enskilda händelser. Hela loggen kan exporteras till Excel (.xlsx) för rapportering eller arkivering.

### Beskrivning av arbetsyta
Lägg till en beskrivning på valfri arbetsyta — synlig på kortet i listan och inuti arbetsytan, så alla vet vad de följer upp och varför.

### Prova utan konto
Vill du se hur appen fungerar innan du registrerar dig? Tryck på "Prova utan att logga in" på inloggningssidan för att komma igång direkt. Datan är tillfällig och försvinner om du loggar ut, men det räcker för att få en känsla för appen.

### Visuell igenkänning
Varje arbetsyta får en unik färg och initial-avatar — automatiskt, utan att du behöver välja något. Gör det enkelt att hitta rätt på ett ögonblick.

### Fungerar offline
Som en PWA laddar appen blixtsnabbt vid återbesök och kan installeras direkt på hemskärmen på både iOS och Android — utan app store. En diskret banner visas om enheten tappar uppkopplingen.

### Arkivering
Klar med en arbetsyta? Arkivera den istället för att radera. Arkiverade arbetsytor döljs från listan men kan återställas när som helst, eller raderas permanent när du är säker.

### Duplicera
Vill du återanvända strukturen på en arbetsyta? Duplicera den — du får en kopia med samma punkter men alla värden nollställda.

---

## Teknik

- Byggd med **Angular 19** och **Firebase** (Firestore + Auth)
- Driftsatt med automatisk HTTPS och PWA-stöd
- Lösenordsfri inloggning via e-postlänk, Google eller anonymt gästläge
- Firestore-säkerhetsregler styr åtkomst per arbetsyta
- Ingen reklam, ingen spårning, ingen tredjepartsanalys

---

*Utvecklad av Tobias Sjöbeck / Durbacken Design*
