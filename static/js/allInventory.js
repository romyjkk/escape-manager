$(document).ready(function () {
  console.log("allInventory.js works");
  fetchInventoryData();
});

let inventoryData = null;
let inventoryDataGlobal = [];

let inventoryPageTitle = document.getElementById("pageTitle");

function fetchInventoryData() {
  if (id !== "") {
    $.ajax({
      type: "GET",
      url: `/get_inventory/${id}`,
      success: function (inventoryData) {
        displayInventoryData(inventoryData);
      },
      error: function (error) {
        console.log("Error fetching inventory:", error);
      },
    });
  } else {
    $.ajax({
      type: "GET",
      url: `/get_inventory/all`,
      success: function (inventoryData) {
        displayInventoryData(inventoryData);
      },
      error: function (error) {
        console.log("Error fetching inventory:", error);
      },
    });
  }
}

// function fetchAllInventoryData() {
//   console.log("Fetching all inventory data...");
// }

let originalInventoryData = [];

function displayInventoryData(inventoryData) {
  console.log("Displaying inventory data: ", inventoryData);
  if (!originalInventoryData.length || inventoryData !== inventoryDataGlobal) {
    originalInventoryData = [...inventoryData];
  }
  inventoryDataGlobal = inventoryData;

  let inventoryList = document.getElementById("inventoryList");
  inventoryList.innerHTML = ""; // Clear content

  let items = inventoryData[0].items || []; // Ensure items is an array

  items.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }
    console.log("Item: ", item);
    let inventoryListItem = document.createElement("li");

    let inventoryName = "";
    inventoryName = item.name || "Untitled item";

    let inventoryImage = "";
    inventoryImage = item.image || "../static/img/placeholder.svg";
    let inventoryQuantity = "";
    if (item.type === "item") {
      inventoryQuantity = item.quantity || "Untitled quantity";
    }

    if (item.type === "folder") {
      inventoryListItem.innerHTML = `
        <a href="">
            <img src="${inventoryImage}" alt="${inventoryName}">
            <div class="inventoryNameContainer">
                <p>${inventoryName}</p>
            </div>
        </a>
    `;
    } else if (item.type === "item") {
      inventoryListItem.innerHTML = `
            <button>
                <figure>
                    <p>${inventoryQuantity}</p>
                </figure>
                <img src="${inventoryImage}" alt="${inventoryName}">
                <div class="inventoryNameContainer">
                    <p>${inventoryName}</p>
                </div>
            </button>
        `;
    }

    inventoryList.appendChild(inventoryListItem);
  });
}

function handleLowQuantity() {
  $.ajax({
    type: "GET",
    url: "/get_quantity_warnings",
    success: function (data) {
      console.log(data);
    },
    error: function (error) {
      console.log("Error fetching warning data: ", error);
    },
  });
}
