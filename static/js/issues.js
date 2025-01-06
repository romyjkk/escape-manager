$(document).ready(function () {
  fetchRoomConfig();

  // Fetch room configuration
  function fetchRoomConfig() {
    $.ajax({
      type: "GET",
      url: "/get_room_config",
      success: function (roomConfigData) {
        displayRooms(roomConfigData);
      },
      error: function (error) {
        console.log("Error fetching room config data:", error);
      },
    });
  }

  // Dynamically display rooms
  function displayRooms(roomConfigData) {
    let roomList = document.getElementById("rooms");

    // Access the availableRooms array
    let availableRooms = roomConfigData[0].availableRooms;

    availableRooms.forEach((room) => {
      let roomSection = document.createElement("section");
      roomSection.id = `${room.room.replace(/\s+/g, "-").toLowerCase()}`; // Convert room name to ID-safe string

      let roomHeader = document.createElement("h2");
      roomHeader.textContent = room.room; // Room name
      roomSection.appendChild(roomHeader);

      let issueList = document.createElement("ul");
      issueList.id = `issueList-${room.room
        .replace(/\s+/g, "-")
        .toLowerCase()}`;
      roomSection.appendChild(issueList);

      roomList.appendChild(roomSection);
    });

    fetchIssueData(); // Fetch issues after rooms are created
  }

  // Fetch issue data
  function fetchIssueData() {
    $.ajax({
      type: "GET",
      url: "/get_issues",
      success: function (issueData) {
        displayIssues(issueData);
      },
      error: function (error) {
        console.log("Error fetching issue data:", error);
      },
    });
  }

  // Dynamically display issues
  function displayIssues(issueData) {
    issueData.forEach((issue) => {
      issue.category.forEach((category) => {
        // Generate the ID-safe string for the room
        let roomId = `issueList-${category.room
          .replace(/\s+/g, "-")
          .toLowerCase()}`;
        let issueList = document.getElementById(roomId);

        if (issueList) {
          // Create and append the issue item
          let issueItem = document.createElement("li");
          issueItem.textContent = `${issue.title} - ${issue.status}`;
          issueList.appendChild(issueItem);
        } else {
          console.warn(`Room not found for issue: ${category.room}`);
        }
      });
    });
  }
});
