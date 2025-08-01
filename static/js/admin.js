// Admin Panel JavaScript

document.addEventListener("DOMContentLoaded", function () {
  const createUserForm = document.getElementById("createUserForm");
  const usersTableBody = document.getElementById("usersTableBody");
  const logoutButton = document.getElementById("logoutButton");

  // Load current user info and users list
  loadCurrentUser();
  loadUsers();

  // Create user form submission
  createUserForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("newUsername").value;
    const password = document.getElementById("newPassword").value;
    const role = document.getElementById("newRole").value;

    if (!username || !password || !role) {
      showWarning("Please fill in all fields");
      return;
    }

    fetch("/create_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
        role: role,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccess(data.message);
          createUserForm.reset();
          loadUsers(); // Refresh users list
        } else {
          showError("Error: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred while creating the user");
      });
  });

  // Logout
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("userSession");
    showSuccess("Logged out successfully!");
    window.location.href = "/auth";
  });

  function loadCurrentUser() {
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      const user = JSON.parse(userSession);
      // Validate session with server first
      validateSession(user);
    } else {
      // Redirect to login if no session
      window.location.href = "/auth";
    }
  }

  function validateSession(user) {
    fetch("/current_user")
      .then((response) => {
        if (response.status === 401) {
          // Session invalid, redirect to login
          localStorage.removeItem("userSession");
          showWarning("Your session has expired. Please login again.");
          window.location.href = "/auth";
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.success) {
          // Session valid, show user info
          document.getElementById("currentAdminUsername").textContent =
            data.user.username;
          document.getElementById("currentAdminRole").textContent =
            data.user.role;
        } else {
          // Session invalid, redirect to login
          localStorage.removeItem("userSession");
          showWarning("Your session has expired. Please login again.");
          window.location.href = "/auth";
        }
      })
      .catch((error) => {
        console.error("Error validating session:", error);
        // On error, assume session is invalid and redirect to login
        localStorage.removeItem("userSession");
        showError("Unable to validate session. Please login again.");
        window.location.href = "/auth";
      });
  }

  function loadUsers() {
    fetch("/get_users")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayUsers(data.users);
        } else {
          console.error("Error loading users:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function displayUsers(users) {
    usersTableBody.innerHTML = "";

    users.forEach((user, index) => {
      const row = document.createElement("tr");

      // Get current user from session to check permissions
      const userSession = localStorage.getItem("userSession");
      const currentUser = userSession ? JSON.parse(userSession) : null;

      row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    ${
                      currentUser &&
                      currentUser.role === "admin" &&
                      currentUser.id !== user.id
                        ? `<button class="deleteUserBtn" data-user-id="${user.id}" style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>`
                        : ""
                    }
                </td>
            `;

      usersTableBody.appendChild(row);
    });

    // Add event listeners for delete buttons
    const deleteButtons = document.querySelectorAll(".deleteUserBtn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.getAttribute("data-user-id");
        deleteUser(userId);
      });
    });
  }

  function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    fetch(`/delete_user/${userId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccess(data.message);
          loadUsers(); // Refresh users list
        } else {
          showError("Error: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred while deleting the user");
      });
  }
});
