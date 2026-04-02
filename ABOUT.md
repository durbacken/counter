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

| Räknare | Kryssrutor |
|---|---|
| Öka och minska namngivna kategorier | Bocka av punkter i en lista |
| Se live-summor över alla kategorier | Följ framsteg i procent |
| Exportera sammanfattning som PNG-bild | Exportera avklarad lista som PNG |

### Realtidssamarbete
Bjud in kollegor via e-post. Alla medlemmar ser varje förändring direkt — ingen uppdatering av sidan behövs. Arbetsytor kan också delas som en publik länk för läsning utan inloggning.

### Ändringshistorik
Varje knapptryckning loggas med tidsstämpel och vem som gjorde ändringen. Valfria kommentarer låter dig lägga till sammanhang till enskilda händelser. Hela loggen kan exporteras till Excel (.xlsx) för rapportering eller arkivering.

### Beskrivning av arbetsyta
Lägg till en beskrivning på valfri arbetsyta — synlig på kortet i listan och inuti arbetsytan, så alla vet vad de följer upp och varför.

### Fungerar offline
Som en PWA laddar appen blixtsnabbt vid återbesök och kan installeras direkt på hemskärmen på både iOS och Android — utan app store.

### Arkivering
Klar med en arbetsyta? Arkivera den istället för att radera. Arkiverade arbetsytor döljs från listan men kan återställas när som helst, eller raderas permanent när du är säker.

---

## Teknik

- Byggd med **Angular 19** och **Firebase** (Firestore + Auth)
- Driftsatt på **Vercel** med automatisk HTTPS
- Lösenordsfri inloggning via e-postlänk eller Google
- Firestore-säkerhetsregler styr åtkomst per arbetsyta
- Ingen reklam, ingen spårning, ingen tredjepartsanalys

---

*Utvecklad av Tobias Sjöbeck / Durbacken Design*
