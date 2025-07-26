# Escape Room Manager - Volgende Stappen

## Wat werkt er al?

- Issues per kamer weergeven (`/issues/<room_id>`) - **NOG KAPOT!**
- Alle issues overzicht (`/issues/all-issues`) - grotendeels
- Basis issue weergave met afbeeldingen
- JSON data opslag voor issues, configuratie en gebruikers

## Wat er nog kapot is (en hoe je het kan aanpakken)

### Issues per kamer werkt niet

Je krijgt deze errors en dat komt omdat:

**Error 1: `Cannot read properties of undefined (reading 'forEach')`**

- Je JavaScript verwacht data, maar krijgt `undefined`
- Check in `allIssues.js` regel 47 en 61 en 67: waarschijnlijk krijg je geen data terug van de server/en of geef je niet de juiste arguments mee.
- **Tip**: Voeg `console.log(issueData)` toe om te zien wat je daadwerkelijk krijgt

**Error 2: `Failed to load resource: /get_issues/ 404 NOT FOUND`**

- De server route bestaat niet of werkt niet
- Hieronder heb ik dit probleem in meer detail uitgeschreven.
- **Tip**: Check of die route überhaupt bestaat, en of die wel de juiste JSON teruggeeft

### Hoe dit te fixen (zonder dat ik het voor je doe <3)

1. **Backend eerst**: Zorg dat `/get_issues` route werkt in `app.py` Je boft, ik heb de backend al aangepast zodat ie voor je filtert op kamer, kijk even naar `get_issues(room_id)`.
2. **Test de route**: Ga naar `127.0.0.1/get_issues` in je browser - krijg je JSON terug?
3. **Frontend debuggen**: Gebruik `console.log()` overal om te zien wat er gebeurt
4. **HTML checken**: Kijk of je template de juiste HTML elementen heeft

## Suggesties voor verdere ontwikkeling (als alles eenmaal werkt)

### 1. Filteren per Kamer

Het systeem heeft al basis room filtering, maar dit kan beter:

**In `static/js/allIssues.js`:**

```javascript
// Voeg een dropdown toe voor kamer selectie
function createRoomFilter() {
  const rooms = [...new Set(issueData.map((issue) => issue.room))];
  // Genereer dropdown opties dynamisch
}
```

**Python kant (`app.py`):**

- Gebruik de /issues/room_id route om je issues op te halen, je kan ze het beste filteren bij de frontend.
- Uiteraard kan het ook uit de backend, maar dan moet je python schrijven :3

### 2. Geavanceerd Filteren (voor later)

Implementeer filters voor datum, belangrijkheid en toegewezen persoon:

**Frontend filter systeem:**

```javascript
// In allIssues.js
function applyFilters(issues, filters) {
  return issues.filter((issue) => {
    // Filter op datum: issue.dateCreated
    // Filter op prioriteit: issue.priority
    // Filter op toegewezen: issue.assigned
  });
}
```

**HTML template aanpassingen:**

- Voeg filter controls toe aan `templates/allIssues.html`

### 3. Datum Functionaliteit

Issues missen momenteel datum tracking:

**JSON structuur uitbreiden:**

```json
{
  "name": "Issue naam",
  "description": "Beschrijving",
  "room": "cabin-666",
  "priority": "medium",
  "dateCreated": "2025-01-26T10:30:00Z",
  "assignedTo": "gebruiker_id"
}
```

**Python backend:**

```python
# In app.py - voeg datum toe bij nieuwe issues
import datetime
issue_data['dateCreated'] = datetime.datetime.now().isoformat() # BELANGRIJK, dit is de juiste manier van het maken van dates! Daarover gesproken, when date? <3
```

## Technische Tips

### JavaScript:

- `allIssues.js` bevat al veel filter logica - bouw hierop voort
- Gebruik `fetch()` (<- sneller) of `$.ajax()` (<- Hierdoor begrijp je het beter) voor nieuwe API calls
- Met bijvoorbeeld "url: `/route/${roomIdCheck}`" (` <- dit tekentje is belangrijk) kun je ervoor zorgen dat je een variable meestuurt naar de backend, erg nuttig als je bijvoorbeeld wilt filteren. Check de backend!
- **Debug tip**: `console.log()` Asjeblieft, gebruik dit voor alles.

### Python/Flask (dit is nieuw voor je):

- Routes toevoegen: `@app.route('/new-endpoint')`
- JSON data lezen: `json.load(open('json/filename.json'))`
- Data filteren: gebruik Python's `filter()` functie
- Response sturen: `jsonify(filtered_data)` <- Dit is echt heel belangrijk voor het terugsturen van data, anders kunnen ze niet met elkander communiceren.
- **Debug tip**: `print()` statements in je Python code om te zien wat er gebeurt

## Eerste Prioriteit: Fix de kapotte zooi

1. **Start met de backend**: Check allIssues.js. Hieronder zie je ergens een fout, waardoor de call niet goed gaat en deze error voorkomt: `Failed to load resource: the server responded with a status of 404 (NOT FOUND), /get_issues/:1`

```js
function fetchRoomSpecificIssues() {
  console.log("You're currently in a room");
  $.ajax({
    type: "GET",
    url: "/get_issues/", // <--- een route kun je nooit eindigen met /. Hierboven heb ik voor je beschreven hoe je dit het beste op kan lossen!
    succes: function (issueData) {
      // <------- WEER EEN S TE WEINIG LIEVE SCHAT!!!!!!!
      displayRoomSpecificIssues(issueData);
    },
    error: function (error) {
      console.log("Error fetching room-specific issues:", error);
    },
  });
}
```

<!--
#############
STAP 1: FIXED
#############
-->

2. **Test direct**: Ga naar de URL in je browser, moet JSON geven
3. **Frontend daarna**: Als de backend werkt, debug je JavaScript
4. **Stap voor stap**: Fix één error tegelijk, niet alles tegelijk

## Algemeen advies:

1. **Start klein**: Voeg één filter toe (bijv. prioriteit)
2. **JSON eerst**: Test je filter logica met statische data
3. **Frontend dan backend**: Maak eerst de UI, dan de Python API
4. **Iteratief werken**: Één feature per keer implementeren

## Nog meer vervolgstappen:

1. **Filters**: Zoals hierboven ook al uitgebreid besproken. Maar wel belangrijk.
2. **Required**: Sommige velden moeten ingevuld zijn voor een issue opgeslagen kan worden.
3. **get_all_routes**: Een nieuwe route aanmaken voor alle routes.
4. **If statements verminderen**: Zorgt voor efficiënte code. Hoe het niet moet: Undertale.
