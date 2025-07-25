$(document).ready(function () {
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

  // Make fetchAllIssues available globally
  window.fetchAllIssues = fetchAllIssues;

  function displayAllIssues(issueData) {
    let issueList = document.getElementById("allIssuesList");
    issueList.innerHTML = ""; // Clear existing content

    issueData.forEach((issue, index) => {
      // Skip empty objects
      if (!issue || typeof issue !== 'object') {
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
        roomText = issue.room.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      } else if (issue.category && Array.isArray(issue.category)) {
        roomText = issue.category.map(cat => cat.room).join(", ");
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

      issueItem.addEventListener("click", function() {
        openEditModal(index, null, issue);
      });

      issueList.appendChild(issueItem);
    });
  }

  function openEditModal(issueIndex, subIssueIndex, issueData) {
    // Use the global setEditMode function from template.js
    setEditMode(issueIndex, issueData);
    
    // Update button icons if config data is available
    if (configData) {
      if (issueData.room) {
        updateRoomButtonIcon(issueData.room);
      }
      if (issueData.priority) {
        updatePriorityButtonIcon(issueData.priority);
      }
      const assignedUser = issueData.assignedTo || issueData.assigned;
      if (assignedUser) {
        updateAssignedToButtonIcon(assignedUser);
      }
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
      const room = roomConfig.find(r => {
        const configRoomSlug = r.room.replace(/\s+/g, "-").toLowerCase();
        return configRoomSlug === roomId;
      });
      
      if (room && room.icon) {
        document.querySelector("#createIssueRoomSelectButton img").src = room.icon;
      }
    }
  }

  function updatePriorityButtonIcon(priorityId) {
    if (!configData || !configData.priorities) return;
    
    const priorityConfig = configData.priorities[0]?.availablePriority;
    if (priorityConfig) {
      const priority = priorityConfig.find(p => p.id === priorityId);
      
      if (priority && priority.icon) {
        document.querySelector("#createIssuePrioritySelectButton img").src = priority.icon;
      }
    }
  }

  function updateAssignedToButtonIcon(userIdOrName) {
    if (!configData || !configData.users) return;
    
    const userConfig = configData.users[0]?.availableUsers;
    if (userConfig) {
      // Try to find by ID first, then by name
      let user = userConfig.find(u => u.id === userIdOrName);
      if (!user) {
        user = userConfig.find(u => u.name === userIdOrName);
      }
      
      if (user && user.avatar) {
        document.querySelector("#createIssueAssignedToButton img").src = user.avatar;
      }
    }
  }

  function resetFormAndModal() {
    // Use the global resetForms function from template.js
    resetForms();
  }

  // Handle delete functionality
  document.getElementById("deleteIssue").addEventListener("click", function() {
    if (isEditMode && currentEditingIndex !== null) {
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
          }
        });
      }
    } else {
      // If not editing, just close the modal
      resetFormAndModal();
    }
  });

  // Handle remove image functionality
  document.getElementById("removeImageButton").addEventListener("click", function() {
    // If there's an uploaded image, delete it from the server
    if (createIssueImagePath) {
      $.ajax({
        type: "DELETE",
        url: "/delete_issue_image",
        contentType: "application/json",
        data: JSON.stringify({
          imagePath: createIssueImagePath
        }),
        success: function(response) {
          console.log("Image deleted from server:", response);
        },
        error: function(error) {
          console.log("Error deleting image from server:", error);
        }
      });
    }
    
    // Reset the form state
    createIssueImagePath = null;
    document.getElementById("issueImageInput").value = "";
    document.getElementById("imagePreview").style.display = "none";
  });
});
