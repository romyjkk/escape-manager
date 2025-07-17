$(document).ready(function () {
  fetchIssueData(); // Fetch issues after rooms are created

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
    let issueList = document.getElementById("issueCards");
    issueData.forEach((issue) => {
      issue.category.forEach((category) => {
        category.room = `${category.room.replace(/\s+/g, "-").toLowerCase()}`;
          // Create and append the issue item
          if (roomIdCheck !== category.room) {
            console.log("Room ID does not match:", roomIdCheck, category.room);
            return; // Skip if the room ID does not match
          }
          let issueItem = document.createElement("li");
          issueItem.textContent = `${issue.title} - ${issue.status}`;
          issueList.appendChild(issueItem);
      });
    });
  }
});
