// variables

const createIssueButton = document.getElementById("createIssue");
const createIssuePopup = document.getElementById("createIssueContainer");
const createIssueNameInput = document.getElementById("issueName");
const createIssueDescriptionInput = document.getElementById("issueDescription");
const deleteIssueButton = document.getElementById("deleteIssue");
const createIssueRoomSelectButton = document.getElementById(
  "createIssueRoomSelectButton"
);
const createIssueRoomSelectButtonImg = document.querySelector(
  "#createIssueRoomSelectButton img"
);
const createIssueSelectPriorityButton = document.getElementById(
  "createIssuePrioritySelectButton"
);
const createIssueSelectPriorityButtonImg = document.querySelector(
  "#createIssuePrioritySelectButton img"
);
const createIssueAssignedToButton = document.getElementById(
  "createIssueAssignedToButton"
);
const createIssueAssignedToButtonImg = document.querySelector(
  "#createIssueAssignedToButton img"
);
const createIssueSubmitButton = document.getElementById(
  "createIssueSubmitButton"
);
// global variables

let createIssueName;
let createIssueDescription;
let createIssueSelectedRoom;
let createIssueSelectedPriority;
let createIssueSelectedAssignedTo;

// create issue popup

// eventListeners for buttons

createIssueButton.addEventListener("click", () => {
  createIssueContainer.classList.add("visible");
  createIssueContainer.classList.remove("invisible");
});

createIssueRoomSelectButton.addEventListener("click", () => {
  createIssueFetchRoomConfig();
});

createIssueSelectPriorityButton.addEventListener("click", () => {
  createIssueFetchPriorityData();
});

createIssueAssignedToButton.addEventListener("click", () => {
  createIssueFetchUserData();
});

deleteIssueButton.addEventListener("click", () => {
  resetForms();
});

createIssueSubmitButton.addEventListener("click", () => {
  createIssueName = createIssueNameInput.value;
  createIssueDescription = createIssueDescriptionInput.value;

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
    }),
    success: function (response) {
      console.log("Issue created successfully:", response);
      resetForms();
    },
  });
});

// fetch data from json for create issue popup
function resetForms() {
  // Reset the form fields
  createIssueNameInput.value = "";
  createIssueDescriptionInput.value = "";
  createIssueRoomSelectButtonImg.src = "../static/img/plusButton.svg";
  createIssueSelectPriorityButtonImg.src =
    "../static/img/priority/priority.svg";
  createIssueAssignedToButtonImg.src = "../static/img/plusButton.svg";
  createIssueContainer.classList.remove("visible");
  createIssueContainer.classList.add("invisible");
}

function createIssueFetchRoomConfig() {
  $.ajax({
    type: "GET",
    url: "/get_room_config",
    success: function (createIssueRoomConfigData) {
      console.log(createIssueRoomConfigData);
      displayRooms(createIssueRoomConfigData);
    },
    error: function (error) {
      console.log("Error fetching room config data:", error);
    },
  });
}

function createIssueFetchPriorityData() {
  $.ajax({
    type: "GET",
    url: "/get_priority",
    success: function (createIssuePriorityData) {
      console.log(createIssuePriorityData);
      displayPriority(createIssuePriorityData);
    },
    error: function (error) {
      console.log("Error fetching priority config data:", error);
    },
  });
}

function createIssueFetchUserData() {
  $.ajax({
    type: "GET",
    url: "/get_user_config",
    success: function (createIssueUserData) {
      console.log(createIssueUserData);
      displayUsers(createIssueUserData);
    },
    error: function (error) {
      console.log("Error fetching priority config data:", error);
    },
  });
}

// when the button to pick a room is clicked, this function will run

function displayRooms(createIssueRoomConfigData) {
  let roomList = document.getElementById("createIssueRoomOptions");
  const roomOptions = createIssueRoomConfigData[0].availableRooms;

  if (roomList.hasChildNodes()) {
    return;
  }

  roomOptions.forEach((element) => {
    console.log(element);

    let createIssueRoomOption = document.createElement("li");
    let createIssueRoomButton = document.createElement("button");
    createIssueRoomButton.type = "button";

    createIssueRoomButton.id = `${element.room
      .replace(/\s+/g, "-")
      .toLowerCase()}`;

    createIssueRoomButton.addEventListener("click", () => {
      createIssueSelectedRoom = createIssueRoomButton.id;
      createIssueRoomSelectButtonImg.src = element.icon;

      roomList.innerHTML = ""; // Clear the room list
    });

    let createIssueRoomName = document.createElement("p");
    let createIssueRoomIcon = document.createElement("img");

    createIssueRoomName.textContent = element.room;
    createIssueRoomIcon.src = element.icon;

    createIssueRoomButton.appendChild(createIssueRoomName);
    createIssueRoomButton.appendChild(createIssueRoomIcon);

    createIssueRoomOption.appendChild(createIssueRoomButton);

    roomList.appendChild(createIssueRoomOption);
  });
}

// when the button to pick a priority is clicked, this function will run

function displayPriority(createIssuePriorityData) {
  let priorityList = document.getElementById("createIssuePriorityOptions");
  const priorityOptions = createIssuePriorityData[0].availablePriority;

  if (priorityList.hasChildNodes()) {
    return;
  }

  priorityOptions.forEach((element) => {
    console.log(element);

    let createIssuePriorityOption = document.createElement("li");
    let createIssuePriorityButton = document.createElement("button");
    createIssuePriorityButton.type = "button";

    createIssuePriorityButton.id = element.id;
    console.log(createIssuePriorityButton.id);

    createIssuePriorityButton.addEventListener("click", () => {
      createIssueSelectedPriority = createIssuePriorityButton.id;
      createIssueSelectPriorityButtonImg.src = element.icon;

      priorityList.innerHTML = ""; // Clear the priority list
    });

    let createIssuePriorityName = document.createElement("p");
    let createIssuePriorityIcon = document.createElement("img");

    createIssuePriorityName.textContent = element.name;
    createIssuePriorityIcon.src = element.icon;

    createIssuePriorityButton.appendChild(createIssuePriorityName);
    createIssuePriorityButton.appendChild(createIssuePriorityIcon);

    createIssuePriorityOption.appendChild(createIssuePriorityButton);

    priorityList.appendChild(createIssuePriorityOption);
  });
}

// when the button to pick someone to assign is clicked, this function will run

function displayUsers(createIssueUserData) {
  let userList = document.getElementById("createIssueAssignedToOptions");
  const userOptions = createIssueUserData[0].availableUsers;

  if (userList.hasChildNodes()) {
    return;
  }

  console.log("werk it queennn");

  userOptions.forEach((element) => {
    console.log(element);

    let createIssueUserOption = document.createElement("li");
    let createIssueUserButton = document.createElement("button");
    createIssueUserButton.type = "button";

    createIssueUserButton.id = element.id;

    createIssueUserButton.addEventListener("click", () => {
      createIssueSelectedAssignedTo = createIssueUserButton.id;
      createIssueAssignedToButtonImg.src = element.avatar;

      userList.innerHTML = "";
    });

    let createIssueUserName = document.createElement("p");
    let createIssueUserIcon = document.createElement("img");

    createIssueUserName.textContent = element.name;
    createIssueUserIcon.src = element.avatar;

    createIssueUserButton.appendChild(createIssueUserName);
    createIssueUserButton.appendChild(createIssueUserIcon);

    createIssueUserOption.appendChild(createIssueUserButton);
    userList.appendChild(createIssueUserOption);
  });
}

// contains code used on every page

const activityButton = document.getElementById("activityButton");
activityButton.addEventListener("click", () => {
  console.log("Activity button clicked");
});

class Navigation {
  constructor() {
    this.inventoryNavItem = document.getElementById("inventoryWrapper");
    this.inventoryNavImg = document.getElementById("inventoryImg");

    this.homeNavItem = document.getElementById("homeWrapper");
    this.homeNavImg = document.getElementById("homeImg");

    this.issuesNavItem = document.getElementById("issueWrapper");
    this.issuesNavImg = document.getElementById("issuesImg");

    this.profileNavItem = document.getElementById("profileWrapper");
    this.profileNavImg = document.getElementById("profileImg");

    this.url = window.location.href;

    this.checkUrl();
  }
  checkUrl() {
    if (this.url.includes("/issues")) {
      this.issuesNavItem.classList.add("navigationItemActive");
      this.issuesNavImg.src = "../static/img/icons/issuesFilled.svg";
    } else if (this.url.includes("/inventory")) {
      this.inventoryNavItem.classList.add("navigationItemActive");
      this.inventoryNavImg.src = "../static/img/icons/inventoryFilled.svg";
    } else if (this.url.includes("/profile")) {
      this.profileNavItem.classList.add("navigationItemActive");
      this.profileNavImg.src = "../static/img/icons/profileFilled.svg";
    } else if (this.url.includes("/")) {
      this.homeNavItem.classList.add("navigationItemActive");
      this.homeNavImg.src = "../static/img/icons/homeFilled.svg";
    }
  }
}

let navigation = new Navigation();
