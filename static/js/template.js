// contains code used on every page

const activityButton = document.getElementById("activityButton");
activityButton.addEventListener("click", () => {
  console.log("Activity button clicked");
});

const createIssueButton = document.getElementById("createIssue");
const createIssuePopup = document.getElementById("createIssueContainer");
createIssueButton.addEventListener("click", () => {
  createIssueContainer.classList.add("visible");
  createIssueContainer.classList.remove("invisible");
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
