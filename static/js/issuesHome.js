$(document).ready(function () {
  fetchRoomConfig();
  function fetchRoomConfig() {
    $.ajax({
      type: "GET",
      url: "/get_room_config",
      success: function (roomConfigData) {
        displayRoomConfig(roomConfigData);
      },
      error: function (error) {
        console.log("Error fetching room config data:", error);
      },
    });
  }
  function displayRoomConfig(roomConfigData) {
    let roomConfigList = document.getElementById("roomList");
    const availableRooms = roomConfigData[0].availableRooms;
    availableRooms.forEach((element) => {
      console.log(element);

      let roomConfigSection = document.createElement("a");
      roomConfigSection.href = `issues/${element.room
        .replace(/\s+/g, "-")
        .toLowerCase()}`;

      let roomConfigImage = document.createElement("img");
      roomConfigImage.src = element.image;

      roomConfigSection.id = `roomConfigSection-${element.room
        .replace(/\s+/g, "-")
        .toLowerCase()}`;

      roomConfigSection.appendChild(roomConfigImage);
      roomConfigList.appendChild(roomConfigSection);
      let roomConfigHeader = document.createElement("h2");
      roomConfigHeader.textContent = element.room;
      roomConfigSection.appendChild(roomConfigHeader);
    });
  }
});
