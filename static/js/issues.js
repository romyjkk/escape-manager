$(document).ready(function () {
  let userDataCopy = [];

  // Fetch issue data
  Promise.all([$.get("/get_issues"), $.get("/get_user_config")])
    .then(([issueData, userData]) => {
      userDataCopy = userData;
      displayIssues(issueData);
    })
    .catch((error) => {
      console.log("Error fetching data:", error);
    });

  // Dynamically display issues
  function displayIssues(issueData) {
    let issueList = document.getElementById("issueCards");
    let roomTitle = document.getElementById("pageTitle");
    roomTitle.textContent = `${roomIdCheck.replace(/-/g, " ")}`.replace(
      /\b\w/g,
      (l) => l.toUpperCase()
    );

    issueData.forEach((issue) => {
      issue.category.forEach((category) => {
        category.room = `${category.room.replace(/\s+/g, "-").toLowerCase()}`;
        // Create and append the issue item
        if (roomIdCheck !== category.room) {
          console.log("Room ID does not match:", roomIdCheck, category.room);
          return; // Skip if the room ID does not match
        }

        let issueImg;
        let issueAssigned;

        let issueItem = document.createElement("li");

        let issueName = document.createElement("h2");
        let issueDescription = document.createElement("p");
        let textWrapper = document.createElement("article");
        textWrapper.classList.add("textWrapper");

        if (issue.image) {
          issueImg = document.createElement("img");
        }
        let issueStatus = document.createElement("p");
        let imgAndStatusWrapper = document.createElement("figure");
        imgAndStatusWrapper.classList.add("imgAndStatusWrapper");

        if (issue.assigned) {
          issueAssigned = document.createElement("img");
        }
        let issuePriority = document.createElement("p");
        let priorityAndAssignedWrapper = document.createElement("figure");
        priorityAndAssignedWrapper.classList.add("priorityAndAssignedWrapper");

        let infoWrapper = document.createElement("article");
        infoWrapper.classList.add("infoWrapper");

        issueName.textContent = `${issue.title}`;
        issueDescription.textContent = `${issue.description}`;
        issueImg.src = `${issue.image}`;
        issueStatus.textContent = `${issue.status}`;
        userDataCopy.forEach((user) => {
          console.log("Checking user:", user.name);
          if (user.name === issue.assigned) {
            console.log("User found:", user.name);
            issueAssigned.src = user.avatar;
          }
        });

        issuePriority.textContent = `${issue.priority}`;

        textWrapper.appendChild(issueName);
        textWrapper.appendChild(issueDescription);

        imgAndStatusWrapper.appendChild(issueImg);
        imgAndStatusWrapper.appendChild(issueStatus);

        priorityAndAssignedWrapper.appendChild(issueAssigned);
        priorityAndAssignedWrapper.appendChild(issuePriority);

        infoWrapper.appendChild(imgAndStatusWrapper);
        infoWrapper.appendChild(priorityAndAssignedWrapper);

        issueItem.appendChild(textWrapper);
        issueItem.appendChild(infoWrapper);
        issueList.appendChild(issueItem);
      });
    });
  }
});
