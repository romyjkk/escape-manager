$(document).ready(function () {
  fetchConfigData();
  populateFilterOptions();
  // selectCheckboxes();

  // Initialize modal in create mode
  setModalMode("create");
});

let roomTitle = document.getElementById("pageTitle");

if (roomIdCheck === "") {
  roomTitle.textContent = "Alle meldingen";
} else {
  roomTitle.textContent = `${roomIdCheck.replace(/-/g, " ")}`.replace(
    /\b\w/g,
    (l) => l.toUpperCase()
  );
}

let initSort = false;
let currentEditingIndex = null;
let configData = null;
let userDataGlobal = [];
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
      // Also fetch user data
      fetchUserData();
      if (roomIdCheck !== "") {
        fetchRoomSpecificIssues();
      } else {
        initSort = false;
        fetchAllIssues();
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

function fetchUserData() {
  $.ajax({
    type: "GET",
    url: "/get_users_for_assignment",
    success: function (data) {
      userDataGlobal = data;
      console.log("User data fetched:", userDataGlobal);
    },
    error: function (error) {
      console.log("Error fetching user data:", error);
    },
  });
}

function getUserAvatar(userIdOrUsername) {
  if (!userDataGlobal || userDataGlobal.length === 0) {
    return "../static/img/users/default-avatar.svg";
  }

  // Try to find by ID first, then by username
  let user = userDataGlobal.find((u) => u.id === userIdOrUsername);
  if (!user) {
    user = userDataGlobal.find((u) => u.username === userIdOrUsername);
  }

  return user && user.avatar
    ? user.avatar
    : "../static/img/users/default-avatar.svg";
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
let originalIssueData = [];

function displayAllIssues(issueData) {
  if (!originalIssueData.length || issueData !== issueDataGlobal) {
    originalIssueData = [...issueData]; // Store original unfiltered data
  }

  issueDataGlobal = issueData; // Current display data

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

    // Get created by information
    let createdByText = "";
    let createdByAvatar = "";
    if (issue.createdBy && issue.createdBy.username) {
      createdByText = `Created by: ${issue.createdBy.username}`;
      createdByAvatar =
        issue.createdBy.avatar || getUserAvatar(issue.createdBy.username);
    } else {
      createdByText = "Creator unknown";
      createdByAvatar = "../static/img/users/default-avatar.svg";
    }

    // Get assigned to information
    let assignedToText = "";
    let assignedToAvatar = "";
    const assignedUser = issue.assignedTo || issue.assigned;
    if (assignedUser) {
      // If assignedUser is an object, get username; if it's a string (user ID), find the user
      let assignedUsername;
      if (typeof assignedUser === "object") {
        assignedUsername = assignedUser.username;
        assignedToAvatar =
          assignedUser.avatar || getUserAvatar(assignedUsername);
      } else {
        // assignedUser is a user ID string, find the actual user
        const userObj = userDataGlobal.find((u) => u.id === assignedUser);
        assignedUsername = userObj ? userObj.username : assignedUser;
        assignedToAvatar = getUserAvatar(assignedUser);
      }
      assignedToText = `Assigned to: ${assignedUsername}`;
    } else {
      assignedToText = "Unassigned";
      assignedToAvatar = "../static/img/users/default-avatar.svg";
    }

    // Still has to be styled properly, you can remove this anytime @romyjkk
    issueItem.innerHTML = `
        <article class="textWrapper">
          <h2>${titleText}</h2>
          <p>${descriptionText}</p>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
            <img src="${createdByAvatar}" alt="Creator" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">
            <p style="font-size: 1rem; color: var(--secundaryBackgroundColor600); font-style: italic;">${createdByText}</p>
          </div>
          ${
            assignedUser
              ? `
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
            <img src="${assignedToAvatar}" alt="Assigned" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">
            <p style="font-size: 1rem; color: var(--secundaryBackgroundColor600); font-style: italic;">${assignedToText}</p>
          </div>
          `
              : `<p style="font-size: 1rem; color: var(--secundaryBackgroundColor600); font-style: italic;">${assignedToText}</p>`
          }
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

// Function to manage modal mode (create vs edit)
function setModalMode(mode) {
  const createButton = document.getElementById("createIssueSubmitButton");
  const updateButton = document.getElementById("updateIssueButton");

  if (!createButton || !updateButton) {
    console.log("Modal buttons not found, retrying...");
    setTimeout(() => setModalMode(mode), 100);
    return;
  }

  if (mode === "edit") {
    // Hide create button, show update button
    createButton.classList.add("invisible");
    updateButton.classList.remove("invisible");

    // Remove any existing listeners and add update listener
    updateButton.replaceWith(updateButton.cloneNode(true)); // Remove all listeners
    document
      .getElementById("updateIssueButton")
      .addEventListener("click", () => {
        handleUpdateIssue();
      });
  } else {
    // Show create button, hide update button (create mode)
    createButton.classList.remove("invisible");
    updateButton.classList.add("invisible");

    // Remove any existing listeners and add create listener
    createButton.replaceWith(createButton.cloneNode(true)); // Remove all listeners
    document
      .getElementById("createIssueSubmitButton")
      .addEventListener("click", originalSubmitHandler);
  }
}

// Global function to open modal in create mode (can be called from template.js)
window.openCreateModal = function () {
  setModalMode("create");
  // Reset form fields
  document.getElementById("issueName").value = "";
  document.getElementById("issueDescription").value = "";
  document.getElementById("issueImageInput").value = "";
  document.getElementById("imagePreview").style.display = "none";

  // Reset global variables
  createIssueSelectedRoom = null;
  createIssueSelectedPriority = null;
  createIssueSelectedAssignedTo = null;
  createIssueImagePath = null;
  currentEditingIndex = null;

  // Reset button images
  document.querySelector("#createIssueRoomSelectButton img").src =
    "../static/img/plusButton.svg";
  document.querySelector("#createIssuePrioritySelectButton img").src =
    "../static/img/priority/priority.svg";
  document.querySelector("#createIssueAssignedToButton img").src =
    "../static/img/plusButton.svg";
};

function openEditModal(issueIndex, issueData) {
  currentEditingIndex = issueIndex;

  // Set modal to edit mode
  setModalMode("edit");

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
  if (assignedUser) {
    createIssueSelectedAssignedTo = assignedUser;
    updateAssignedToButtonIcon(assignedUser);
  }

  // Show who created the issue
  const createdByUser = issueData.createdBy;
  if (createdByUser) {
    createIssueSelectedCreatedBy = createdByUser;
  }

  // Show the modal
  document.getElementById("createIssueContainer").classList.add("visible");
  document.getElementById("createIssueContainer").classList.remove("invisible");
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
  if (!userDataGlobal || userDataGlobal.length === 0) return;

  let user;
  // If it's an object with username property, use that
  if (typeof userIdOrName === "object" && userIdOrName.username) {
    user = userDataGlobal.find((u) => u.username === userIdOrName.username);
  } else {
    // Try to find by ID first, then by username
    user = userDataGlobal.find((u) => u.id === userIdOrName);
    if (!user) {
      user = userDataGlobal.find((u) => u.username === userIdOrName);
    }
  }

  if (user && user.avatar) {
    document.querySelector("#createIssueAssignedToButton img").src =
      user.avatar;
  } else {
    // Fallback to default avatar
    document.querySelector("#createIssueAssignedToButton img").src =
      "../static/img/users/default-avatar.svg";
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
    createdBy: createIssueSelectedCreatedBy || undefined,
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
      showError("Error updating issue");
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

  // Reset to create mode
  setModalMode("create");

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
    showWarning("Please fill in all required fields");
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
          showError("Error deleting issue");
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

function selectCheckboxes() {
  // create badge for room, which you can click away to go to all issues
  if (roomIdCheck && roomIdCheck !== "") {
    console.log("You're on a room page");
    const filterOptionItem = document.createElement("li");
    filterOptionItem.innerHTML = `
          <button type="button" id="filter-${roomIdCheck}" class="filterOptionBadge">
            ${roomIdCheck
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.05273 3.01758L3.01764 9.05267" stroke="white" stroke-width="0.7" stroke-linecap="round"/>
                <path d="M9.05273 9.05266L3.01764 3.01756" stroke="white" stroke-width="0.7" stroke-linecap="round"/>
            </svg>
          </button>`;
    document.getElementById("filterOptions").appendChild(filterOptionItem);

    const roomFilterButton = document.getElementById(`filter-${roomIdCheck}`);
    roomFilterButton.addEventListener("click", () => {
      console.log("Leaving room page");
      window.location.href = "/issues/all-issues";
    });
  }

  document.querySelectorAll(`input[type="checkbox"]`).forEach((checkbox) => {
    const filterOptionsList = document.getElementById("filterOptions");
    const displayText = checkbox.nextElementSibling.textContent;

    checkbox.addEventListener("change", () => {
      console.log(
        `Checkbox ${checkbox.value} is now ${
          checkbox.checked ? "checked" : "unchecked"
        }`
      );

      if (checkbox.checked) {
        // CREATE a new filter badge when checked
        const filterOptionItem = document.createElement("li");
        filterOptionItem.innerHTML = `
          <button type="button" id="filter-${checkbox.value}" class="filterOptionBadge">
            ${displayText}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.05273 3.01758L3.01764 9.05267" stroke="white" stroke-width="0.7" stroke-linecap="round"/>
                <path d="M9.05273 9.05266L3.01764 3.01756" stroke="white" stroke-width="0.7" stroke-linecap="round"/>
            </svg>
          </button>
        `;

        // Add click handler to the filter badge for removal
        const filterButton =
          filterOptionItem.querySelector(".filterOptionBadge");
        filterButton.addEventListener("click", () => {
          checkbox.checked = false; // Uncheck the checkbox
          checkbox.dispatchEvent(new Event("change")); // Trigger change event
        });

        filterOptionsList.appendChild(filterOptionItem);
        applyAllFilters();
      } else {
        // REMOVE the specific filter badge when unchecked
        const existingBadge = document.getElementById(
          `filter-${checkbox.value}`
        );
        if (existingBadge && existingBadge.parentElement) {
          existingBadge.parentElement.remove();
        }

        // Check if any filters are still active
        const filters = getSelectedFilters();
        const hasActiveFilters =
          filters.priority.length > 0 ||
          filters.room.length > 0 ||
          filters.assignedTo.length > 0 ||
          filters.createdBy.length > 0;

        if (hasActiveFilters) {
          applyAllFilters();
        } else {
          clearAllFilters();
        }
      }
    });
  });
}

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
}

// .map() -> voor data transformatie
// .sort() -> voor sorteren
// .filter() -> voor filteren
// .find() -> 1 item vinden
// .includes() -> checken of waarde in array zit

function applyAllFilters() {
  const filters = getSelectedFilters();

  // Always filter from the original unfiltered data
  let filteredIssues = originalIssueData.filter((issue) => {
    console.log("Filtering issue:", issue);

    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(issue.priority)
    ) {
      return false;
    }

    if (filters.room.length > 0 && !filters.room.includes(issue.room)) {
      return false;
    }

    // Handle assignedTo filtering - check both user ID and username
    if (filters.assignedTo.length > 0) {
      const assignedUser = issue.assignedTo || issue.assigned;
      let assignedUsername;

      if (typeof assignedUser === "object") {
        assignedUsername = assignedUser.username;
      } else if (assignedUser) {
        // assignedUser is a user ID string, find the actual user
        const userObj = userDataGlobal.find((u) => u.id === assignedUser);
        assignedUsername = userObj ? userObj.username : assignedUser;
      }

      if (!assignedUsername || !filters.assignedTo.includes(assignedUsername)) {
        return false;
      }
    }

    if (
      filters.createdBy.length > 0 &&
      !filters.createdBy.includes(issue.createdBy.username)
    ) {
      return false;
    }

    return true;
  });

  console.log("Filtered issues:", filteredIssues);

  // Update the current display data and redisplay
  issueDataGlobal = filteredIssues;
  displayAllIssues(filteredIssues);
}

// clearen na wanneer je op iets klikt

function clearAllFilters() {
  document
    .querySelectorAll(`input[type="checkbox"]`)
    .forEach((cb) => (cb.checked = false));

  // Reset to original unfiltered data
  issueDataGlobal = [...originalIssueData];
  displayAllIssues(originalIssueData);
}

// clearAllFilters();

function populateFilterOptions() {
  fetch(`/get_priority`)
    .then((response) => response.json())
    .then((priorities) => {
      const availablePriorities = priorities[0].availablePriority;
      const priorityFilter = document.getElementById("priorityFilterOptions");
      availablePriorities.forEach((priority) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<input type="checkbox" name="priority" value="${priority.id}"><p>${priority.name}</p>`;
        priorityFilter.appendChild(listItem);
      });
    });

  if (roomIdCheck === "") {
    fetch(`/get_room_config`)
      .then((response) => response.json())
      .then((rooms) => {
        const availableRooms = rooms[0].availableRooms;
        const roomFilter = document.getElementById("roomFilterOptions");
        availableRooms.forEach((room) => {
          const listItem = document.createElement("li");
          listItem.innerHTML = `<input type="checkbox" name="room" value="${room.id}"><p>${room.room}</p>`;
          roomFilter.appendChild(listItem);
        });
      });
  }

  fetch("/get_users_for_assignment")
    .then((response) => response.json())
    .then((users) => {
      const userFilter = document.getElementById("assignedToFilterOptions");
      const createdByFilter = document.getElementById("createdByFilterOptions");
      users.forEach((user) => {
        const assignedToListItem = document.createElement("li");
        const createdByListItem = document.createElement("li");
        assignedToListItem.innerHTML = `<input type="checkbox" name="assignedTo" value="${user.username}"><p>${user.username}</p>`;
        createdByListItem.innerHTML = `<input type="checkbox" name="createdBy" value="${user.username}"><p>${user.username}</p>`;
        userFilter.appendChild(assignedToListItem);
        createdByFilter.appendChild(createdByListItem);
      });
      selectCheckboxes();
    });
}
