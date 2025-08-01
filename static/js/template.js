$(document).ready(function () {
  fetchNecessaryData();
});

// variables

const createIssueButton = document.getElementById("createIssue");
const createIssuePopup = document.getElementById("createIssueContainer");
const createIssueNameInput = document.getElementById("issueName");
const createIssueDescriptionInput = document.getElementById("issueDescription");
const createIssueImageInput = document.getElementById("issueImageInput");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const removeImageButton = document.getElementById("removeImageButton");
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
const createIssueStatusButton = document.getElementById(
  "addStatusUpdateButton"
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
let createIssueImagePath = null;
let createIssueTimeline;

// fetch data

function fetchNecessaryData() {
  $.ajax({
    type: "GET",
    url: `/get_issues/all`,
    success: function (data) {
      console.log("Issue data fetched succesfully: ", data);
      displayTimelineData(data);
    },
    error: function (error) {
      console.log("Error fetching issue data:", error);
    },
  });
  $.ajax({
    type: "GET",
    url: "/get_user_config",
    success: function (userData) {
      console.log("User data fetched successfully:", userData);
      displayTimelineData(userData);
    },
    error: function (error) {
      console.log("Error fetching user data:", error);
    },
  });
}

// create issue popup

// eventListeners for buttons

createIssueButton.addEventListener("click", () => {
  const updateButton = document.getElementById("updateIssueButton");
  updateButton.classList.add("invisible");

  // Check if user is logged in
  const userSession = localStorage.getItem("userSession");
  const currentUserName = document.getElementById("currentUserName");

  if (userSession) {
    // Verify the session is still valid on the server
    fetch('/current_user')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Update local storage with fresh user data
          localStorage.setItem('userSession', JSON.stringify(data.user));
          const user = data.user;
          currentUserName.textContent = user.username;
          createIssueCreatedBy.style.display = "block";
          
          createIssueAssignedToButtonImg.src = "";
          
          // Initialize modal in create mode if the function is available
          if (typeof window.openCreateModal === 'function') {
            window.openCreateModal();
          }
          
          createIssueContainer.classList.add("visible");
          createIssueContainer.classList.remove("invisible");
        } else {
          // Session is invalid, clear and redirect
          localStorage.removeItem('userSession');
          showWarning("Your session has expired. Please login again.");
          window.location.href = "/auth";
        }
      })
      .catch(error => {
        console.error('Error checking session:', error);
        localStorage.removeItem('userSession');
        showWarning("You must be logged in to create issues. Please login first.");
        window.location.href = "/auth";
      });
  } else {
    // User is not logged in, redirect to auth page
    showWarning("You must be logged in to create issues. Please login first.");
    window.location.href = "/auth";
  }
});

// timeline data

function displayTimelineData(data, userData) {
  const createIssueCreatedByName = document.getElementById(
    "createIssueCreatorName"
  );
  const createIssueCreatedBy = document.getElementById("createIssueCreator");
  const createIssueCreatedByImg = document.getElementById(
    "createIssueCreator img"
  );
  console.log("Hii ", data);

  console.log("This data ", data[0]);

  createIssueCreatedByName.textContent = data[0].username;
}

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

// Image upload and preview functionality
createIssueImageInput.addEventListener("change", handleImageUpload);

removeImageButton.addEventListener("click", () => {
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
  createIssueImageInput.value = "";
  imagePreview.style.display = "none";
});

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    // If there was a previous image, delete it from the server
    const previousImagePath = createIssueImagePath;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Upload the file
    const formData = new FormData();
    formData.append("file", file);

    $.ajax({
      type: "POST",
      url: "/upload_issue_image",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        if (response.success) {
          // Delete the previous image if it exists
          if (previousImagePath) {
            $.ajax({
              type: "DELETE",
              url: "/delete_issue_image",
              contentType: "application/json",
              data: JSON.stringify({
                imagePath: previousImagePath,
              }),
              success: function (deleteResponse) {
                console.log(
                  "Previous image deleted from server:",
                  deleteResponse
                );
              },
              error: function (error) {
                console.log(
                  "Error deleting previous image from server:",
                  error
                );
              },
            });
          }

          createIssueImagePath = response.imagePath;
          console.log("Image uploaded successfully:", response.imagePath);
        } else {
          showError("Error uploading image: " + response.error);
          createIssueImageInput.value = "";
          imagePreview.style.display = "none";
        }
      },
      error: function (error) {
        console.log("Error uploading image:", error);
        showError("Error uploading image");
        createIssueImageInput.value = "";
        imagePreview.style.display = "none";
      },
    });
  }
}

createIssueSubmitButton.addEventListener("click", () => {
  createIssueName = createIssueNameInput.value;
  createIssueDescription = createIssueDescriptionInput.value;

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
      resetForms();
      initSort = false;
      fetchAllIssues(); // Refresh the issue data after creation
    },
    error: function (xhr) {
      // xhr is een XMLHttpRequest object, hiermee kunnen we de status en response van de server bekijken.
      if (xhr.status === 401) {
        showError(
          "You must be logged in to create issues. Please login first."
        );
        // Redirect to auth page
        window.location.href = "/auth";
      } else if (xhr.status === 404) {
        showError("User not found. Please login again.");
        window.location.href = "/auth";
      } else {
        showError(
          "An error occurred while creating the issue. Please try again."
        );
      }
    },
  });
});

// fetch data from json for create issue popup
function resetForms() {
  // Reset the form fields
  createIssueNameInput.value = "";
  createIssueDescriptionInput.value = "";
  createIssueImageInput.value = "";
  imagePreview.style.display = "none";
  createIssueRoomSelectButtonImg.src = "../static/img/plusButton.svg";
  createIssueSelectPriorityButtonImg.src =
    "../static/img/priority/priority.svg";
  createIssueAssignedToButtonImg.src = "../static/img/plusButton.svg";

  // Reset global variables
  createIssueSelectedRoom = null;
  createIssueSelectedPriority = null;
  createIssueSelectedAssignedTo = null;
  createIssueImagePath = null;

  createIssueContainer.classList.remove("visible");
  createIssueContainer.classList.add("invisible");

  // Reset submit button text
  // createIssueSubmitButton.textContent = "Opslaan";
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
    url: "/get_users_for_assignment",
    success: function (createIssueUserData) {
      console.log(createIssueUserData);
      displayUsers(createIssueUserData);
    },
    error: function (error) {
      console.log("Error fetching user data:", error);
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
  const userOptions = createIssueUserData;

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
      createIssueAssignedToButtonImg.src = element.avatar || "../static/img/users/default-avatar.svg";

      userList.innerHTML = "";
    });

    let createIssueUserName = document.createElement("p");
    let createIssueUserIcon = document.createElement("img");

    createIssueUserName.textContent = element.name || element.username;
    createIssueUserIcon.src = element.avatar || "../static/img/users/default-avatar.svg";

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
    } else if (
      this.url.includes("/auth") ||
      this.url.includes("/admin") ||
      this.url.includes("/profile")
    ) {
      this.profileNavItem.classList.add("navigationItemActive");
      this.profileNavImg.src = "../static/img/icons/accountFilled.svg";
    } else if (this.url.includes("/")) {
      this.homeNavItem.classList.add("navigationItemActive");
      this.homeNavImg.src = "../static/img/icons/homeFilled.svg";
    }
  }
}

let navigation = new Navigation();

// Custom Notification System
function showNotification(message, type = "info", duration = 4000) {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Create notification content
  const content = document.createElement("div");
  content.className = "notification-content";

  // Add icon based on type
  const icon = document.createElement("div");
  icon.className = "notification-icon";
  let iconSymbol = "";
  switch (type) {
    case "success":
      iconSymbol = "✓";
      break;
    case "error":
      iconSymbol = "✕";
      break;
    case "warning":
      iconSymbol = "⚠";
      break;
    default:
      iconSymbol = "ℹ";
  }
  icon.textContent = iconSymbol;
  icon.style.fontSize = "1.6rem";
  icon.style.fontWeight = "bold";
  icon.style.color =
    type === "success"
      ? "#28a745"
      : type === "error"
      ? "#dc3545"
      : type === "warning"
      ? "#ffc107"
      : "var(--secundaryBackgroundColor500)";

  // Add message
  const messageEl = document.createElement("div");
  messageEl.className = "notification-message";
  messageEl.textContent = message;

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "notification-close";
  closeBtn.innerHTML = "×";
  closeBtn.onclick = () => hideNotification(notification);

  // Assemble notification
  content.appendChild(icon);
  content.appendChild(messageEl);
  content.appendChild(closeBtn);
  notification.appendChild(content);

  // Add to container
  container.appendChild(notification);

  // Show with animation
  setTimeout(() => notification.classList.add("show"), 100);

  // Auto hide
  setTimeout(() => hideNotification(notification), duration);

  return notification;
}

function hideNotification(notification) {
  notification.classList.remove("show");
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Replace all alert calls with custom notifications
window.alert = function (message) {
  showNotification(message, "info");
};

// Add custom notification methods to window for easy access
window.showSuccess = function (message) {
  showNotification(message, "success");
};

window.showError = function (message) {
  showNotification(message, "error");
};

window.showWarning = function (message) {
  showNotification(message, "warning");
};

window.showInfo = function (message) {
  showNotification(message, "info");
};

// Handle profile button click for login/register
const profileButton = document.getElementById("profile");
if (profileButton) {
  profileButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/auth";
  });
}
