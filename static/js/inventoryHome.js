$(document).ready(function () {
  fetchAllInventoryData();
});

function fetchAllInventoryData() {
  console.log("Fetching inventory data...");
  //   fetch("/get_inventory")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data.success) {
  //         displayInventoryData(data);
  //         console.log("Inventory data fetched successfully:", data);
  //       } else {
  //         showError("Error loading inventory data: " + ata.message);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching inventory data:", error);
  //       showError("An error occurred while fetching inventory data");
  //     });
  $.ajax({
    type: "GET",
    url: "/get_inventory/all",
    success: function (inventoryData) {
      displayInventoryData(inventoryData);
    },
    error: function (error) {
      console.log("Error fetching inventory data:", error);
    },
  });
}

function displayInventoryData(inventoryData) {
  let categoryList = document.getElementById("categoryList");
  inventoryData.forEach((element) => {
    console.log("Element: ", element);
    let categoryListItem = document.createElement("li");
    let categorySection = document.createElement("a");
    categorySection.href = `inventory/${element.id}`;

    let categoryImage = document.createElement("img");
    categoryImage.src = element.image;

    categorySection.id = `categorySection-${element.id}`;

    categoryList.appendChild(categoryListItem);
    categoryListItem.appendChild(categorySection);
    categorySection.appendChild(categoryImage);

    let categoryHeaderContainer = document.createElement("div");
    let categoryHeader = document.createElement("p");
    categoryHeader.textContent = element.name;
    categoryHeaderContainer.appendChild(categoryHeader);
    categorySection.appendChild(categoryHeaderContainer);
  });
}
