$(document).ready(function () {
  let currentEditingIndex = null;
  let configData = null;

  // Fetch config data and then fetch issues
  fetchConfigData();

  function fetchConfigData() {
    $.ajax({
      type: "GET",
      url: "/get_all_config",
      success: function (data) {
        configData = data;
        fetchAllIssues();
        if (roomIdCheck !== "") {
          fetchRoomSpecificIssues();
        } else {
          fetchAllIssues();
          console.log("You're currently not in a room");
        }
      },
      error: function (error) {
        console.log("Error fetching config data:", error);
        // Fallback to fetch issues without config
        fetchAllIssues();
      },
    });
  }

  function fetchAllIssues() {
    $.ajax({
      type: "GET",
      url: "/get_issues",
      success: function (issueData) {
        displayAllIssues(issueData);
      },
      error: function (error) {
        console.log("Error fetching issues:", error);
      },
    });
  }

  function fetchRoomSpecificIssues() {
    console.log("You're currently in a room");
    $.ajax({
      type: "GET",
      url: "/get_issues/",
      succes: function (issueData) {
        displayRoomSpecificIssues(issueData);
      },
      error: function (error) {
        console.log("Error fetching room-specific issues:", error);
      },
    });
  }

  function displayRoomSpecificIssues(issueData) {
    let roomSpecificIssueList = document.getElementById("issueCards");
    roomSpecificIssueList.innerHTML = ""; // Clear existing content

    issueData.forEach((issue, index) => {
      if (!issue || typeof issue !== "object") {
        return;
      }
    });
  }

  displayRoomSpecificIssues();

  function displayAllIssues(issueData) {
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
        <strong>${titleText}</strong><br>
        <small>${descriptionText}</small><br>
        <small>Room: ${roomText}</small><br>
        <small>Priority: ${priorityText}</small>
      `;

      // Store the index for editing. IMPORTANT.
      issueItem.dataset.issueIndex = index;

      issueItem.addEventListener("click", function () {
        openEditModal(index, null, issue);
      });

      issueList.appendChild(issueItem);
    });
  }

  function openEditModal(issueIndex, subIssueIndex, issueData) {
    currentEditingIndex = issueIndex;

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
    document
      .getElementById("createIssueContainer")
      .classList.remove("invisible");

    // Update submit button to handle editing
    let submitButton = document.getElementById("createIssueSubmitButton");
    submitButton.textContent = "Update";

    // Remove existing click listeners and add new one for updating
    submitButton.removeEventListener("click", originalSubmitHandler);
    submitButton.addEventListener("click", handleUpdateIssue);
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
    let updatedIssue = {
      title: document.getElementById("issueName").value || undefined,
      name: document.getElementById("issueName").value || undefined,
      description:
        document.getElementById("issueDescription").value || undefined,
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
    let submitButton = document.getElementById("createIssueSubmitButton");
    submitButton.textContent = "Opslaan";
    submitButton.removeEventListener("click", handleUpdateIssue);
    submitButton.addEventListener("click", originalSubmitHandler);

    currentEditingIndex = null;
  }

  // Store original submit handler reference
  let originalSubmitHandler = function () {
    createIssueName = document.getElementById("issueName").value;
    createIssueDescription = document.getElementById("issueDescription").value;

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
});
