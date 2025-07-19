// const activityButton = document.getElementById("activityButton");
// activityButton.addEventListener("click", () => {
//   console.log("Activity button clicked");
// });

class Navigation {
  constructor() {
    this.inventoryNavItem = document.getElementById("inventory");
    this.inventoryNavImg = document.getElementById("inventoryImg");

    this.homeNavItem = document.getElementById("home");
    this.homeNavImg = document.getElementById("homeImg");

    this.issuesNavItem = document.getElementById("issues");
    this.issuesNavImg = document.getElementById("issuesImg");

    this.profileNavItem = document.getElementById("profile");
    this.profileNavImg = document.getElementById("profileImg");

    this.url = window.location.href;

    this.checkUrl();
  }
  checkUrl() {
    if (url.includes("/issues")) {
      issuesNavItem.classList.add("navigationItemActive");
      issuesNavImg.src = "../static/img/icons/issuesFilled.svg";
    } else if (url.includes("/inventory")) {
      inventoryNavItem.classList.add("navigationItemActive");
      inventoryNavImg.src = "../static/img/icons/inventoryFilled.svg";
    } else if (url.includes("/profile")) {
      profileNavItem.classList.add("navigationItemActive");
      profileNavImg.src = "../static/img/icons/profileFilled.svg";
    } else if (url.includes("/")) {
      homeNavItem.classList.add("navigationItemActive");
      homeNavImg.src = "../static/img/icons/homeFilled.svg";
    }
  }
}
// calls get function to get data from an endpoint, API (python). inventory function is put in a variable and logged to the console
// $(document).ready(function () {
//   console.log("hello world");

//   fetchInventoryData();
//   function fetchInventoryData() {
//     $.ajax({
//       type: "GET",
//       url: "/get_inventory",
//       success: function (inventoryData) {
//         // put inventoryData in a function
//         displayInventory(inventoryData);
//       },
//       error: function (error) {
//         console.log("Error fetching sensor data:", error);
//       },
//     });
//   }
//   function displayInventory(inventoryData) {
//     let inventoryList = document.getElementById("inventoryList");
//     inventoryData.forEach((element) => {
//       element.locks.forEach((lock) => {
//         let lockItem = document.createElement("li");
//         lockItem.textContent = `${lock.id} - ${lock.count}`;
//         inventoryList.appendChild(lockItem);
//       });
//     });
//   }
// });
