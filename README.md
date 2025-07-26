# Escape Room Manager - Volgende Stappen

## Wat werkt er al?

- Issues per kamer weergeven (`/issues/<room_id>`)
- Alle issues overzicht (`/issues/all-issues`) - grotendeels
- Basis issue weergave met afbeeldingen
- JSON data opslag voor issues, configuratie en gebruikers

## Update: Issues per kamer werkt nu!
Supa dupa, hoe moet je filteren?

## Volgende uitdaging: Sorteren & Filteren

### De HTML is er al! 
De ui heb je zelf al gemaakt, deze radio buttons kun je gebruiken om de filtering te maken.

### JavaScript Sort Functies (gebruik deze in allIssues.js)

**Basis sort setup:**
```javascript
// Deze geef ik je mee, ik kan me voorstellen dat dit moeilijk is om zelf te maken.
document.querySelectorAll('input[name="sort"]').forEach(radio => { // Selecteer alle inputs met id "sort", daarna itereren over elke radio knop.
  radio.addEventListener('change', (e) => { //Luister naar change
    const sortType = e.target.closest('li').getAttribute('value'); //Vergelijk die "li" met de value van die li.
    sortIssues(currentIssues, sortType); //Sort functie. Deze mag je zelf maken.
  });
});

// Hoofdsort functie
function sortIssues(issues, sortType) {
  let sortedIssues = [...issues]; // Hiermee kopieer je de array zonder hem te refereren. Dit is handig om niet de originele data aan te passen per ongeluk.
  
  switch(sortType) {
    case 'priorityHighToLow':
      // Sorteren.
      break;
    case 'priorityLowToHigh':
      // Sorteren.
      break;
    case 'newToOld':
      // Sorteren
      break;
    case 'oldToNew':
      // Sorteren.
      break;
  }
  
  // Update de display
  redisplayIssues(sortedIssues);
}
```

### Prioriteit Sorteren
Hoe kun je sorteren?
```javascript
sortedIssues.sort((a, b) => getPriorityValue(a.priority) - getPriorityValue(b.priority));
// Dit is de functie die je nodig hebt om issues te sorteren op prioriteit. Deze functie iterateert over de prioriteit van de issues en geeft een numerieke waarde terug die gebruikt wordt om te sorteren. Als de uitkomst negatief is, dan komt issue a voor issue b in de gesorteerde lijst.
// Als de uitkomst positief is, dan komt issue b voor issue a in de gesorteerde lijst.
// De rest kun je vast zelf maken, dit is de basis.
// Hieronder zie je een voorbeeld van "getPriorityValue" functie die je kan gebruiken. Hierbij wordt de prioriteit omgezet naar een numerieke waarde, zodat je kunt sorteren op basis van die waarde.
// Quiz vraag: De "sort" hierboven, sorteert die van laag naar hoog, of van hoog naar laag? En waarom?
```

**Helper functie voor prioriteit:**
```javascript
function getPriorityValue(priority) {
  const values = { 'high': 3, 'medium': 2, 'low': 1 };
  return values[priority] || 0;
}
```

### Filter Checkboxes Setup

**Voor de checkboxes (priority, createdBy, etc.):**
Checkboxes kun je vast zelf maken in html, dat red jij wel <3. Maar hier is de JavaScript code die je nodig hebt om de checkboxes te laten werken:

```javascript
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    filterIssues(); // Deze functie moet je zelf maken, die filtert de issues op basis van de geselecteerde checkboxes.
  });
});
```
### Array Methods die je Nodig Hebt

**Voor filteren:**
```javascript
// Filter op basis van geselecteerde opties
function filterIssues(issues, filters) {
  return issues.filter(issue => {
    if (filters.priority.length > 0 && !filters.priority.includes(issue.priority)) { // Hier filter je op prioriteit. Is de prioriteit van de issue niet in de geselecteerde prioriteiten, dan wordt de issue niet getoond. 
    // "filters.priority" is een array van geselecteerde prioriteiten, en "issue.priority" is de prioriteit van de huidige issue.
      return false;
    }
    
    return true; // Deze issue voldoet aan alle filters
  });
}
```

**Handy Array methods:**
- `.sort()` - voor sorteren
- `.filter()` - voor filteren  
- `.map()` - voor data transformatie
- `.find()` - 1 item vinden
- `.includes()` - checken of waarde in array zit

### Debugging Tips voor Filters
1. **Console.log alles**: `console.log('Sorting by:', sortType)`
2. **Test stap voor stap**: Eerst sorteren werkend krijgen, dan filteren
3. **Check je data**: Hebben je issues wel de juiste velden?
4. **Event listeners**: Gebruik browser dev tools om te checken of ze aangeroepen worden

### Wat Werkt vs Wat Nog Moet
- ✅ Room filtering (goed gedaan!)
- ❌ Priority sorting - **DIT IS VOLGENDE STAP**
- ❌ Date sorting - komt daarna
- ❌ Filter checkboxes - als sorting werkt

Start met priority sorting - dat is het makkelijkst om te testen!

## Suggesties voor verdere ontwikkeling (als alles eenmaal werkt)

### 2. Geavanceerd Filteren (voor later)

Implementeer filters voor datum, belangrijkheid en toegewezen persoon. Check hierboven voor de basis setup.

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
