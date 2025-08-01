// Authentication JavaScript

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const profileView = document.getElementById("profileView");
  const logoutButton = document.getElementById("logoutButton");
  const adminPanelButton = document.getElementById("adminPanelButton");
  const editProfileButton = document.getElementById("editProfileButton");
  const editProfileView = document.getElementById("editProfile");
  const avatarImageInput = document.getElementById("userAvatarInput");
  const avatarImagePreview = document.getElementById("userAvatarPreview");
  const avatarImage = document.getElementById("avatarImagePreview");
  const removeAvatarButton = document.getElementById("removeAvatarButton");
  const saveEditButton = document.getElementById("saveEditsButton");
  const cancelEditButton = document.getElementById("cancelEditButton");

  let createAvatarImagePath = null;
  let currentEditingUserIndex = null;
  // Check if user is already logged in
  checkAuthStatus();

  // Login form submission
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccess("Login successful!");
          localStorage.setItem("userSession", JSON.stringify(data.user));
          showProfileView(data.user);
        } else {
          showError("Login failed: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred during login");
      });
  });

  // Admin panel button
  if (adminPanelButton) {
    adminPanelButton.addEventListener("click", function () {
      window.location.href = "/admin";
    });
  }

  // Logout
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("userSession");
    profileView.classList.add("invisible");
    loginForm.classList.remove("invisible");
    showSuccess("Logged out successfully!");
  });

  function checkAuthStatus() {
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      const user = JSON.parse(userSession);
      // Validate session with server
      validateSession(user);
    }
  }

  function validateSession(user) {
    fetch("/current_user")
      .then((response) => {
        if (response.status === 401) {
          // Session invalid, log out
          localStorage.removeItem("userSession");
          profileView.classList.add("invisible");
          loginForm.classList.remove("invisible");
          showWarning("Your session has expired. Please login again.");
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.success) {
          // Session valid, show profile
          showProfileView(user);
        } else {
          // Session invalid, log out
          localStorage.removeItem("userSession");
          profileView.classList.add("invisible");
          loginForm.classList.remove("invisible");
          showWarning("Your session has expired. Please login again.");
        }
      })
      .catch((error) => {
        console.error("Error validating session:", error);
        // On error, assume session is invalid and log out
        localStorage.removeItem("userSession");
        profileView.classList.add("invisible");
        loginForm.classList.remove("invisible");
        showError("Unable to validate session. Please login again.");
      });
  }

  function showProfileView(user) {
    loginForm.classList.add("invisible");
    profileView.classList.remove("invisible");

    // Populate user info
    document.getElementById("userName").textContent = user.username;
    document.getElementById("userRole").textContent = "Role: " + user.role;

    avatarImageInput.addEventListener("change", handleAvatarImageUpload);

    removeAvatarButton.addEventListener("click", () => {
      console.log("Remove avatar");
      // if there's an uploaded image, delete it from the server
      if (createAvatarImagePath) {
        $.ajax({
          type: "DELETE",
          url: "/delete_avatar_image",
          contentType: "application/json",
          data: JSON.stringify({
            imagePath: createAvatarImagePath,
          }),
          success: function (response) {
            console.log("Image deleted from server:", response);
          },
          error: function (error) {
            console.log("Error deleting image from server: ", error);
          },
        });
      }

      createAvatarImagePath = null;
      avatarImageInput.value = "";
      avatarImagePreview.style.display = "none";
    });

    // Show admin panel button for admin and manager roles
    if (user.role === "admin" || user.role === "manager") {
      adminPanelButton.classList.remove("invisible");
    } else {
      adminPanelButton.classList.add("invisible");
    }
  }

  editProfileButton.addEventListener("click", () => {
    profileView.classList.add("invisible");
    editProfileView.classList.remove("invisible");

    const userSession = localStorage.getItem("userSession");
    if (!userSession) {
      showError("No user session found. Please log in.");
      return;
    }

    const currentUser = JSON.parse(userSession);
    handleEditProfile(currentUser);
  });

  cancelEditButton.addEventListener("click", () => {
    profileView.classList.remove("invisible");
    editProfileView.classList.add("invisible");
  });
});

function handleEditProfile(userData) {
  const usernameInput = document.getElementById("editUsername");
  const userRole = document.getElementById("editViewUserRole");
  console.log("Editing profile");

  // fill in username and role (role = view only)
  usernameInput.value = userData.username;
  userRole.textContent = `Role: ${userData.role}`;

  // handle avatar image upload

  // handle profile update
}

// function for handling avatar image upload

function handleAvatarImageUpload(event) {
  const avatarFile = event.target.files[0];
  if (avatarFile) {
    const previousAvatarImagePath = createAvatarImagePath;

    // show preview
    const fileReader = new FileReader();
    fileReader.onload = function (e) {
      avatarImage.src = e.target.result;
      avatarImagePreview.style.display = "block";
    };
    fileReader.readAsDataURL(avatarFile);

    // upload file
    const avatarFormData = new FormData();
    avatarFormData.append("file", avatarFile);

    $.ajax({
      type: "POST",
      url: "/upload_avatar_image",
      data: avatarFormData,
      processData: false,
      contentType: false,
      success: function (response) {
        if (response.success) {
          // delete previous image if it exists
          if (previousAvatarImagePath) {
            $.ajax({
              type: "DELETE",
              url: "/delete_avatar_image",
              contentType: "application/json",
              data: JSON.stringify({
                imagePath: previousAvatarImagePath,
              }),
              success: function (deleteResponse) {
                console.log(
                  "Previous image deleted from server:",
                  deleteResponse
                );
              },
              error: function (error) {
                console.log("Error deleting previous image:", error);
              },
            });
          }

          createAvatarImagePath = response.imagePath;
          console.log("Avatar uploaded successfully:", response.imagePath);
        } else {
          showError("Error uploading avatar: " + response.error);
          avatarImageInput.value = ""; // Reset input
          avatarImagePreview.style.display = "none";
        }
      },
      error: function (error) {
        console.log("Error uploading avatar:", error);
        showError("Error uploading avatar");
        avatarImageInput.value = ""; // Reset input
        avatarImagePreview.style.display = "none";
      },
    });
  }
}
