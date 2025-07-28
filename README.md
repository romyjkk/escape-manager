# Escape Room Manager - Volgende Stappen


## Wat Werkt vs Wat Nog Moet
-  Room filtering (goed gedaan!)
-  Priority sorting (nice!)
-  Date sorting (ook gelukt!)
-  Filter checkboxes - **DIT IS VOLGENDE STAP**

## Volgende Challenge: Filter Checkboxes Implementation

Nu het sorteren werkt, is het tijd voor de echte filtering! Je hebt 4 soorten filters nodig:

### 1. Filter Types die je moet implementeren:
- **Kamer filter**: Issues van specifieke kamers tonen
- **Prioriteit filter**: High/Medium/Low priority issues
- **Assigned To filter**: Issues toegewezen aan specifieke personen  
- **Created By filter**: Issues gemaakt door specifieke gebruikers

### 2. Checkbox Setup Strategie:

**HTML structuur (voeg toe aan allIssues.html):**
```html
<div class="filter-section">
  <h3>Filter op Prioriteit</h3>
  <label><input type="checkbox" name="priority" value="high"> High</label>
  <label><input type="checkbox" name="priority" value="medium"> Medium</label>
  <label><input type="checkbox" name="priority" value="low"> Low</label>
</div>

<div class="filter-section">
  <h3>Filter op Kamer</h3>
  <!-- Dynamisch laden van kamers uit JSON -->
</div>

<div class="filter-section">
  <h3>Filter op Toegewezen aan</h3>
  <!-- Dynamisch laden van gebruikers -->
</div>

<div class="filter-section">
  <h3>Filter op Gemaakt door</h3>
  <!-- Dynamisch laden van gebruikers -->
</div>
```

### 3. JavaScript Filter Logic:

**Stap 1: Event Listeners voor alle checkboxes**
```javascript
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { // Jij bent echt een sexy monster, godverdomme wat lekker.
  checkbox.addEventListener('change', () => {
    applyAllFilters(); // Hoofdfunctie die alle filters toepast.
  });
});
```

**Stap 2: Verzamel geselecteerde filters**
```javascript
function getSelectedFilters() {
  return {
    priority: getCheckedValues('priority'),
    room: getCheckedValues('room'), 
    assignedTo: getCheckedValues('assignedTo'),
    createdBy: getCheckedValues('createdBy')
  };
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(checkbox => checkbox.value);
}
```

**Stap 3: Filter logica toepassen**
```javascript
function applyAllFilters() {
  const filters = getSelectedFilters();
  let filteredIssues = currentIssues.filter(issue => {  //.filter is een briljante method om op bepaalde dingen te filteren, in dit geval doen we dat op 4 verschillende manieren.
    
    if (filters.priority.length > 0 && !filters.priority.includes(issue.priority)) {
      return false;
    }
    
    if (filters.room.length > 0 && !filters.room.includes(issue.room)) {
      return false;
    }
    
    if (filters.assignedTo.length > 0 && !filters.assignedTo.includes(issue.assignedTo)) {
      return false;
    }
    
    if (filters.createdBy.length > 0 && !filters.createdBy.includes(issue.createdBy)) { // Er is nog geen "createdBy" in de json. Dit moet nog wel gemaakt worden. Dit kan nog niet want we hebben geen inlog. Dus doe het even manually.
      return false;
    }
    
    return true; // Issue voldoet aan alle filters
  });
  
  redisplayIssues(filteredIssues);
}
```

### 4. Dynamische Filter Options Laden:

**Voor kamers en gebruikers uit JSON:**
```javascript
function populateFilterOptions() {
  // Laad kamers uit JSON
  fetch('/get_rooms')
    .then(response => response.json())
    .then(rooms => {
      const roomFilter = document.querySelector('whatever je hier nodig hebt');
      rooms.forEach(room => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="room" value="${room}"`; // dit weet ik niet zeker
        roomFilter.appendChild(label);
      });
    });

  // Laad gebruikers uit JSON
  fetch('/get_users')
    .then(response => response.json())
    .then(users => {
      const userFilter = document.querySelectorAll('zelfde als hierboven, geen idee');
      userFilter.forEach((section, index) => {
        users.forEach(user => {
          const label = document.createElement('label');
          label.innerHTML = `<input type="checkbox" value="${user}"`; // Dit weet ik niet zeker
          section.appendChild(label);
        });
      });
    });
}
```
### 5. Pro Tips voor Implementation:

**Debugging aanpak:**
1. Start met 1 filter type (bijv. priority)
2. Console.log je filter results: `console.log('Filtered issues:', filteredIssues)`
3. Test met verschillende combinaties
4. Voeg de andere filter types één voor één toe


**Reset functionaliteit:**
```javascript
function clearAllFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  redisplayIssues(currentIssues); // Toon alle issues weer
}
```

Start met de priority filter - die is het makkelijkst te testen omdat je de data al hebt!

## Suggesties voor verdere ontwikkeling (als alles eenmaal werkt)

### 2. Geavanceerd Filteren (voor later)

Implementeer filters voor datum, belangrijkheid en toegewezen persoon. Check hierboven voor de basis setup.

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
