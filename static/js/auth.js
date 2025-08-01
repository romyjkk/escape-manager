// Authentication JavaScript

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const profileView = document.getElementById("profileView");
  const editProfileForm = document.getElementById("editProfile");
  const logoutButton = document.getElementById("logoutButton");
  const adminPanelButton = document.getElementById("adminPanelButton");
  const editProfileButton = document.getElementById("editProfileButton");
  const saveEditButton = document.getElementById("saveEditButton");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const userAvatarInput = document.getElementById("userAvatarInput");
  const userAvatarImg = document.getElementById("userAvatarImg");
  const userAvatarPreview = document.getElementById("userAvatarPreview");
  const removeAvatarButton = document.getElementById("removeAvatarButton");

  let currentUser = null;
  let currentAvatarPath = null;
  let pendingAvatarFile = null;
  let pendingAvatarPreview = null;

  // Function to handle session expiration
  function handleSessionExpired() {
    localStorage.removeItem("userSession");
    currentUser = null;
    pendingAvatarFile = null;
    pendingAvatarPreview = null;
    showError("Your session has expired. Please log in again.");
    loginForm.classList.remove("invisible");
    profileView.classList.add("invisible");
    editProfileForm.classList.add("invisible");
  }

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
          currentUser = data.user; // Set currentUser immediately
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
    // Clear server-side session
    fetch("/logout", {
      method: "POST",
    })
      .then(() => {
        // Clear local storage and show login form
        localStorage.removeItem("userSession");
        currentUser = null;
        profileView.classList.add("invisible");
        editProfileForm.classList.add("invisible");
        loginForm.classList.remove("invisible");
        showSuccess("Logged out successfully!");
      })
      .catch((error) => {
        console.error("Error during logout:", error);
        // Even if server logout fails, clear local session
        localStorage.removeItem("userSession");
        currentUser = null;
        profileView.classList.add("invisible");
        editProfileForm.classList.add("invisible");
        loginForm.classList.remove("invisible");
        showSuccess("Logged out successfully!");
      });
  });

  // Edit profile button
  if (editProfileButton) {
    editProfileButton.addEventListener("click", function () {
      showEditProfileForm();
    });
  }

  // Save edit button
  if (saveEditButton) {
    saveEditButton.addEventListener("click", function () {
      saveProfileChanges();
    });
  }

  // Cancel edit button
  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", function () {
      cancelEdit();
    });
  }

  // Avatar upload functionality
  if (userAvatarInput) {
    userAvatarInput.addEventListener("change", function (event) {
      handleAvatarUpload(event);
    });
  }

  // Remove avatar button
  if (removeAvatarButton) {
    removeAvatarButton.addEventListener("click", function () {
      removeAvatar();
    });
  }

  function checkAuthStatus() {
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      const user = JSON.parse(userSession);

      // Verify session with server and get fresh user data
      fetch("/current_user")
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Update localStorage with fresh data from server
            localStorage.setItem("userSession", JSON.stringify(data.user));
            currentUser = data.user;
            showProfileView(data.user);
          } else {
            // Session invalid, clear and show login
            localStorage.removeItem("userSession");
            currentUser = null;
            loginForm.classList.remove("invisible");
            profileView.classList.add("invisible");
            editProfileForm.classList.add("invisible");
          }
        })
        .catch((error) => {
          console.error("Error checking auth status:", error);
          // Fallback to cached user data
          currentUser = user;
          showProfileView(user);
        });
    }
  }

  function showProfileView(user) {
    if (!user) return; // Safety check

    currentUser = user; // Ensure currentUser is set

    loginForm.classList.add("invisible");
    editProfileForm.classList.add("invisible");
    profileView.classList.remove("invisible");

    // Populate user info
    document.getElementById("userName").textContent = user.username;
    document.getElementById("userRole").textContent = "Role: " + user.role;

    // Show avatar if available
    const userAvatar = document.getElementById("userAvatar");
    if (user.avatar && userAvatar) {
      userAvatar.src = user.avatar;
      userAvatar.style.display = "block";

      // Handle avatar load errors
      userAvatar.onerror = function () {
        console.log("Avatar image failed to load:", user.avatar);
        this.src = "../static/img/users/default-avatar.svg";
      };
    } else if (userAvatar) {
      userAvatar.src = "../static/img/users/default-avatar.svg";
      userAvatar.style.display = "block";
    }

    // Show admin panel button for admin and manager roles
    if (user.role === "admin" || user.role === "manager") {
      adminPanelButton.classList.remove("invisible");
    } else {
      adminPanelButton.classList.add("invisible");
    }
  }

  function showEditProfileForm() {
    if (!currentUser) {
      showError("User session not found. Please log in again.");
      return;
    }

    profileView.classList.add("invisible");
    editProfileForm.classList.remove("invisible");

    // Reset pending states
    pendingAvatarFile = null;
    pendingAvatarPreview = null;

    // Populate edit form with current data
    document.getElementById("editUsername").value = currentUser.username;
    document.getElementById("editViewUserRole").textContent =
      "Role: " + currentUser.role;

    // Show current avatar
    currentAvatarPath = currentUser.avatar || "";
    if (currentUser.avatar) {
      userAvatarImg.src = currentUser.avatar;
      userAvatarPreview.style.display = "block";

      // Handle avatar load errors
      userAvatarImg.onerror = function () {
        console.log("Avatar image failed to load:", currentUser.avatar);
        this.src = "../static/img/users/default-avatar.svg";
        currentAvatarPath = "../static/img/users/default-avatar.svg";
      };
    } else {
      userAvatarPreview.style.display = "none";
    }
  }

  function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
      // Store the file for later upload
      pendingAvatarFile = file;

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = function (e) {
        pendingAvatarPreview = e.target.result;
        userAvatarImg.src = e.target.result;
        userAvatarPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  }

  function removeAvatar() {
    // Reset form state without deleting from server yet
    pendingAvatarFile = null;
    pendingAvatarPreview = null;
    currentAvatarPath = "";
    userAvatarInput.value = "";
    userAvatarPreview.style.display = "none";
  }

  function saveProfileChanges() {
    if (!currentUser) {
      showError("User session not found. Please log in again.");
      return;
    }

    // Function to update profile with the avatar path
    function updateProfile(avatarPath) {
      // If user removed avatar, delete the old one from server
      if (!avatarPath && currentUser.avatar) {
        fetch("/delete_avatar_image", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imagePath: currentUser.avatar,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              console.log("Failed to delete old avatar:", response.status);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Old avatar delete response:", data);
          })
          .catch((error) => console.log("Error deleting old avatar:", error));
      }

      fetch("/update_profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: currentUser.username, // Keep current username unchanged
          avatar: avatarPath || "",
        }),
      })
        .then((response) => {
          if (response.status === 401) {
            // Session expired
            localStorage.removeItem("userSession");
            currentUser = null;
            showError("Your session has expired. Please log in again.");
            loginForm.classList.remove("invisible");
            profileView.classList.add("invisible");
            editProfileForm.classList.add("invisible");
            return;
          }
          return response.json();
        })
        .then((data) => {
          if (data && data.success) {
            showSuccess(data.message);
            // Update local storage and current user
            currentUser = data.user;
            localStorage.setItem("userSession", JSON.stringify(data.user));

            // Reset pending states
            pendingAvatarFile = null;
            pendingAvatarPreview = null;
            currentAvatarPath = data.user.avatar || "";

            showProfileView(data.user);
          } else if (data) {
            showError("Error updating profile: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showError("An error occurred while updating profile");
        });
    }

    // If there's a pending avatar file, upload it first
    if (pendingAvatarFile) {
      const formData = new FormData();
      formData.append("file", pendingAvatarFile);

      fetch("/upload_avatar_image", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (response.status === 401) {
            handleSessionExpired();
            return null;
          }
          return response.json();
        })
        .then((data) => {
          if (data && data.success) {
            // Delete previous avatar if it exists and is different
            if (currentUser.avatar && currentUser.avatar !== data.imagePath) {
              fetch("/delete_avatar_image", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  imagePath: currentUser.avatar,
                }),
              })
                .then((response) => {
                  if (!response.ok) {
                    console.log(
                      "Failed to delete previous avatar:",
                      response.status
                    );
                  }
                  return response.json();
                })
                .then((deleteData) => {
                  console.log("Previous avatar delete response:", deleteData);
                })
                .catch((error) =>
                  console.log("Error deleting previous avatar:", error)
                );
            }

            updateProfile(data.imagePath);
          } else if (data) {
            showError("Error uploading avatar: " + data.error);
          }
        })
        .catch((error) => {
          console.log("Error uploading avatar:", error);
          showError("Error uploading avatar");
        });
    } else {
      // No new avatar file, use current avatar path or remove if user clicked remove
      updateProfile(currentAvatarPath);
    }
  }

  function cancelEdit() {
    if (!currentUser) {
      showError("User session not found. Please log in again.");
      return;
    }

    // Reset pending states without uploading or deleting anything
    pendingAvatarFile = null;
    pendingAvatarPreview = null;
    currentAvatarPath = currentUser.avatar || "";

    // Reset form and show profile view
    showProfileView(currentUser);
  }
});
