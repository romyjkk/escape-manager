// calls get function to get data from an endpoint, API (python). inventory function is put in a variable and logged to the console
$(document).ready(function () {
  fetchInventoryData();
  function fetchInventoryData() {
    $.ajax({
      type: "GET",
      url: "/get_inventory",
      success: function (inventoryData) {
        // put inventoryData in a function
        displayInventory(inventoryData);
      },
      error: function (error) {
        console.log("Error fetching sensor data:", error);
      },
    });
  }
  function displayInventory(inventoryData) {
    let inventoryList = document.getElementById("inventoryList");
    inventoryData.forEach((element) => {
      element.locks.forEach((lock) => {
        let lockItem = document.createElement("li");
        lockItem.textContent = `${lock.id} - ${lock.count}`;
        inventoryList.appendChild(lockItem);
      });
    });
  }
});
