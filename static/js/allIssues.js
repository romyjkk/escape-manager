$(document).ready(function () {
  fetchConfigData();
  populateFilterOptions();
});

let initSort = false;
let currentEditingIndex = null;
let configData = null;
let issueDataGlobal = [];

const sortPanel = document.getElementById("sortBy");
const sortPanelButton = document.getElementById("sortButton");
const filterPanel = document.getElementById("filterBy");
const filterPanelButton = document.getElementById("filterButton");

// open and close sort and filter panels

if (sortPanelButton) {
  sortPanelButton.addEventListener("click", () => {
    sortPanel.classList.toggle("invisible");
  });

  filterPanelButton.addEventListener("click", () => {
    filterPanel.classList.toggle("invisible");
  });
}

function fetchConfigData() {
  $.ajax({
    type: "GET",
    url: "/get_all_config",
    success: function (data) {
      configData = data;
      if (roomIdCheck !== "") {
        fetchRoomSpecificIssues();
      } else {
        initSort = false;
        fetchAllIssues();
        console.log("You're currently not in a room");
      }
    },
    error: function (error) {
      console.log("Error fetching config data:", error);
      // Fallback to fetch issues without config
      initSort = false;
      fetchAllIssues();
    },
  });
}

function fetchAllIssues() {
  if (roomIdCheck !== "") {
    $.ajax({
      type: "GET",
      url: `/get_issues/${roomIdCheck}`,
      success: function (issueData) {
        initSort = false;
        displayAllIssues(issueData);
      },
      error: function (error) {
        console.log("Error fetching issues:", error);
      },
    });
  } else {
    $.ajax({
      type: "GET",
      url: `/get_issues/all`,
      success: function (issueData) {
        initSort = false;
        displayAllIssues(issueData);
      },
      error: function (error) {
        console.log("Error fetching issues:", error);
      },
    });
  }
}

function fetchRoomSpecificIssues() {
  $.ajax({
    type: "GET",
    url: `/get_issues/${roomIdCheck}`,
    success: function (filteredIssueData) {
      displayAllIssues(filteredIssueData);
    },
    error: function (error) {
      console.log("Error fetching room-specific issues:", error);
    },
  });
}

function displayAllIssues(issueData) {
  issueDataGlobal = issueData; // Store globally for sorting and filtering

  console.log(initSort);
  if (!initSort) {
    initSort = true;
    sortIssues("priorityHighToLow");
    return;
  }

  let issueList = document.getElementById("allIssuesList");
  issueList.innerHTML = ""; // Clear existing content

  issueData.forEach((issue, index) => {
    // Skip empty objects
    if (!issue || typeof issue !== "object") {
      return;
    }

    let issueItem = document.createElement("li");

    let titleText = "";
    let descriptionText = "";
    let roomText = "";
    let priorityText = "";

    // Standard values
    titleText = issue.title || issue.name || "Untitled Issue";
    descriptionText = issue.description || "No description";

    if (issue.room) {
      roomText = issue.room
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    } else if (issue.category && Array.isArray(issue.category)) {
      roomText = issue.category.map((cat) => cat.room).join(", ");
    } else {
      roomText = "No room specified";
    }

    priorityText = issue.priority || "No priority";
    // Still has to be styled properly, you can remove this anytime @romyjkk
    issueItem.innerHTML = `
        <article class="textWrapper">
          <h2>${titleText}</h2>
          <p>${descriptionText}</p>
        </article>
        <article class="imgWrapper">
          <p>${roomText}</p>
          <p>${priorityText}</p>
        </article>
      `;

    // Store the index for editing. IMPORTANT.
    issueItem.dataset.issueIndex = index;

    issueItem.addEventListener("click", function () {
      openEditModal(index, issue);
    });

    issueList.appendChild(issueItem);
  });
}

function openEditModal(issueIndex, issueData) {
  const createIssueButton = document.getElementById("createIssueSubmitButton");

  createIssueButton.classList.add("invisible");

  currentEditingIndex = issueIndex;
  console.log(issueIndex, issueData);
  // Populate the form with current data
  document.getElementById("issueName").value =
    issueData.title || issueData.name || "";
  document.getElementById("issueDescription").value =
    issueData.description || "";

  // Handle image if available
  if (issueData.image) {
    createIssueImagePath = issueData.image;
    document.getElementById("previewImg").src = issueData.image;
    document.getElementById("imagePreview").style.display = "block";
  } else {
    document.getElementById("imagePreview").style.display = "none";
    createIssueImagePath = null;
  }

  // Set room if available and update room button icon
  if (issueData.room && configData && configData.rooms) {
    createIssueSelectedRoom = issueData.room;
    updateRoomButtonIcon(issueData.room);
  }

  // Set priority if available and update priority button icon
  if (issueData.priority && configData && configData.priorities) {
    createIssueSelectedPriority = issueData.priority;
    updatePriorityButtonIcon(issueData.priority);
  }

  // Set assignedTo if available and update assignedTo button icon
  // Handle both "assignedTo" and "assigned" fields
  const assignedUser = issueData.assignedTo || issueData.assigned;
  if (assignedUser && configData && configData.users) {
    createIssueSelectedAssignedTo = assignedUser;
    updateAssignedToButtonIcon(assignedUser);
  }

  // Show the modal
  document.getElementById("createIssueContainer").classList.add("visible");
  document.getElementById("createIssueContainer").classList.remove("invisible");

  // Update submit button to handle editing
  let updateButton = document.getElementById("updateIssueButton");
  // Remove existing click listeners and add new one for updating
  updateButton.removeEventListener("click", originalSubmitHandler);
  updateButton.addEventListener("click", () => {
    console.log("Update button clicked");
    handleUpdateIssue();
  });
}

function updateRoomButtonIcon(roomId) {
  if (!configData || !configData.rooms) return;

  const roomConfig = configData.rooms[0]?.availableRooms;
  if (roomConfig) {
    // Convert the roomId to match against the room name in config
    // roomId is like "cabin-666", room.room is like "Cabin 666"
    const room = roomConfig.find((r) => {
      const configRoomSlug = r.room.replace(/\s+/g, "-").toLowerCase();
      return configRoomSlug === roomId;
    });

    if (room && room.icon) {
      document.querySelector("#createIssueRoomSelectButton img").src =
        room.icon;
    }
  }
}

function updatePriorityButtonIcon(priorityId) {
  if (!configData || !configData.priorities) return;

  const priorityConfig = configData.priorities[0]?.availablePriority;
  if (priorityConfig) {
    const priority = priorityConfig.find((p) => p.id === priorityId);

    if (priority && priority.icon) {
      document.querySelector("#createIssuePrioritySelectButton img").src =
        priority.icon;
    }
  }
}

function updateAssignedToButtonIcon(userIdOrName) {
  if (!configData || !configData.users) return;

  const userConfig = configData.users[0]?.availableUsers;
  if (userConfig) {
    // Try to find by ID first, then by name
    let user = userConfig.find((u) => u.id === userIdOrName);
    if (!user) {
      user = userConfig.find((u) => u.name === userIdOrName);
    }

    if (user && user.avatar) {
      document.querySelector("#createIssueAssignedToButton img").src =
        user.avatar;
    }
  }
}

function handleUpdateIssue() {
  console.log("Updating issue...");
  let updatedIssue = {
    title: document.getElementById("issueName").value || undefined,
    name: document.getElementById("issueName").value || undefined,
    description: document.getElementById("issueDescription").value || undefined,
    room: createIssueSelectedRoom || undefined,
    priority: createIssueSelectedPriority || undefined,
    assignedTo: createIssueSelectedAssignedTo || undefined,
    image: createIssueImagePath || undefined,
  };

  // Remove undefined values
  Object.keys(updatedIssue).forEach((key) => {
    if (updatedIssue[key] === undefined) {
      delete updatedIssue[key];
    }
  });

  $.ajax({
    type: "PUT",
    url: `/update_issue/${currentEditingIndex}`,
    contentType: "application/json",
    data: JSON.stringify(updatedIssue),
    success: function (response) {
      console.log("Issue updated successfully:", response);
      resetFormAndModal();
      initSort = false;
      fetchAllIssues(); // Refresh the list
    },
    error: function (error) {
      console.log("Error updating issue:", error);
      alert("Error updating issue");
    },
  });
}

function resetFormAndModal() {
  // Reset form
  document.getElementById("issueName").value = "";
  document.getElementById("issueDescription").value = "";
  document.getElementById("issueImageInput").value = "";
  document.getElementById("imagePreview").style.display = "none";

  // Reset global variables
  createIssueSelectedRoom = null;
  createIssueSelectedPriority = null;
  createIssueSelectedAssignedTo = null;
  createIssueImagePath = null;

  // Reset button images
  document.querySelector("#createIssueRoomSelectButton img").src =
    "../static/img/plusButton.svg";
  document.querySelector("#createIssuePrioritySelectButton img").src =
    "../static/img/priority/priority.svg";
  document.querySelector("#createIssueAssignedToButton img").src =
    "../static/img/plusButton.svg";

  // Hide modal
  document.getElementById("createIssueContainer").classList.remove("visible");
  document.getElementById("createIssueContainer").classList.add("invisible");

  // Reset submit button
  let updateButton = document.getElementById("updateIssueButton");
  updateButton.removeEventListener("click", handleUpdateIssue);
  updateButton.addEventListener("click", originalSubmitHandler);

  currentEditingIndex = null;
}

// Store original submit handler reference
let originalSubmitHandler = function () {
  createIssueName = document.getElementById("issueName").value;
  createIssueDescription = document.getElementById("issueDescription").value;
  console.log("Creating issue...");

  if (
    !createIssueName ||
    !createIssueSelectedRoom ||
    !createIssueSelectedPriority
  ) {
    alert("Please fill in all required fields");
    return;
  }

  $.ajax({
    type: "POST",
    url: "/create_issue",
    contentType: "application/json",
    data: JSON.stringify({
      name: createIssueName,
      description: createIssueDescription,
      room: createIssueSelectedRoom,
      priority: createIssueSelectedPriority,
      assignedTo: createIssueSelectedAssignedTo,
      image: createIssueImagePath,
    }),
    success: function (response) {
      console.log("Issue created successfully:", response);
      resetFormAndModal();
      initSort = false;
      fetchAllIssues(); // Refresh the list
    },
  });
};

// Handle delete functionality
document.getElementById("deleteIssue").addEventListener("click", function () {
  if (currentEditingIndex !== null) {
    if (confirm("Are you sure you want to delete this issue?")) {
      $.ajax({
        type: "DELETE",
        url: `/delete_issue/${currentEditingIndex}`,
        success: function (response) {
          console.log("Issue deleted successfully:", response);
          resetFormAndModal();
          initSort = false;
          fetchAllIssues(); // Refresh the list
        },
        error: function (error) {
          console.log("Error deleting issue:", error);
          alert("Error deleting issue");
        },
      });
    }
  } else {
    // If not editing, just close the modal
    resetFormAndModal();
  }
});

// Handle remove image functionality
document
  .getElementById("removeImageButton")
  .addEventListener("click", function () {
    // If there's an uploaded image, delete it from the server
    if (createIssueImagePath) {
      $.ajax({
        type: "DELETE",
        url: "/delete_issue_image",
        contentType: "application/json",
        data: JSON.stringify({
          imagePath: createIssueImagePath,
        }),
        success: function (response) {
          console.log("Image deleted from server:", response);
        },
        error: function (error) {
          console.log("Error deleting image from server:", error);
        },
      });
    }

    // Reset the form state
    createIssueImagePath = null;
    document.getElementById("issueImageInput").value = "";
    document.getElementById("imagePreview").style.display = "none";
  });

// filter and sort logic

// filtering

document.querySelectorAll(`input[name="sort"]`).forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const sortType = e.target.closest("li").getAttribute("value");
    sortIssues(sortType);
  });
});

function redisplayIssues(sortedIssues) {
  let issueList = document.getElementById("allIssuesList");
  issueList.innerHTML = ""; // Clear existing content

  const issuesToDisplay = sortedIssues || issueDataGlobal;
  displayAllIssues(issuesToDisplay);
}

function sortIssues(sortType) {
  console.log(sortType);
  let sortedIssues = [...issueDataGlobal];
  let sortedText = document.getElementById("sortedText");

  switch (sortType) {
    case "priorityHighToLow":
      sortedIssues.sort(
        (a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority)
      );
      sortedText.innerHTML = "Hoog naar lage prioriteit";
      break;
    case "priorityLowToHigh":
      sortedIssues.sort(
        (a, b) => getPriorityValue(a.priority) - getPriorityValue(b.priority)
      ); // low to high because if result is positive, b goes in front of a in the list
      sortedText.innerHTML = "Laag naar hoge prioriteit";
      break;
    case "newToOld":
      sortedIssues.sort(
        (a, b) => getDateValue(b.dateCreated) - getDateValue(a.dateCreated)
      );
      sortedText.innerHTML = "Datum nieuw naar oud";
      break;
    case "oldToNew":
      sortedIssues.sort(
        (a, b) => getDateValue(a.dateCreated) - getDateValue(b.dateCreated)
      );
      sortedText.innerHTML = "Datum oud naar nieuw";
      break;
  }

  function getPriorityValue(priority) {
    const values = { high: 3, medium: 2, low: 1 };
    return values[priority] || 0;
  }

  function getDateValue(dateCreated) {
    let formatedDate = new Date(dateCreated);
    return formatedDate.getTime();
  }

  redisplayIssues(sortedIssues);
}

// sorting

document.querySelectorAll(`input[type="checkbox"]`).forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    applyAllFilters(); // hoofdfunctie voor filters
  });
});

function getSelectedFilters() {
  return {
    priority: getCheckedValues("priority"),
    room: getCheckedValues("room"),
    assignedTo: getCheckedValues("assignedTo"),
    createdBy: getCheckedValues("createdBy"),
  };
}

function getCheckedValues(name) {
  return Array.from(
    document.querySelectorAll(`input[name="${name}"]:checked`)
  ).map((checkbox) => checkbox.value);
  // .map() -> voor data transformatie
}

// .sort() -> voor sorteren
// .filter() -> voor filteren
// .find() -> 1 item vinden
// .includes() -> checken of waarde in array zit

function applyAllFilters() {
  const filters = getSelectedFilters();
  let filteredIssues = currentIssues.filter((issue) => {
    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(issue.priority)
    ) {
      return false;
    }

    if (filters.room.length > 0 && !filters.room.includes(issue.room)) {
      return false;
    }

    if (
      filters.assignedTo.length > 0 &&
      !filters.assignedTo.includes(issue.assignedTo)
    ) {
      return false;
    }

    if (
      filters.createdBy.length > 0 &&
      !filters.createdBy.includes(issue.createdBy)
    ) {
    }

    return true; // issue voldoet aan alle filters
  });

  redisplayIssues(filteredIssues);
}

function populateFilterOptions() {
  fetch(`/get_room_config`)
    .then((response) => response.json())
    .then((rooms) => {
      const availableRooms = rooms[0].availableRooms;

      console.log(availableRooms);
      const roomFilter = document.getElementById("roomFilterOptions");
      availableRooms.forEach((room) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<input type="checkbox" name="room" value="${room.room}"><p>${room.room}</p>`;
        roomFilter.appendChild(listItem);
      });
    });

  fetch("/get_user_config")
    .then((response) => response.json())
    .then((users) => {
      const availableUsers = users[0].availableUsers;
      console.log(availableUsers);
      const userFilter = document.getElementById("assignedToFilterOptions");
      availableUsers.forEach((user) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<input type="checkbox" name="assignedTo" value="${user.name}"><p>${user.name}</p>`;
        userFilter.appendChild(listItem);
      });
    });
}
