# Backend Update: New Authentication & Role-Based Access Control

Hi team,

The backend has been updated with a complete JWT-based authentication system. This affects how users are managed and how the `/reports` endpoints are accessed. All new features are live on the development server.

Here is a breakdown of everything you need to know to integrate the frontend.

---

### 1. The Big Picture: How Authentication Works

We are using a **Token-Based (JWT) Authentication** system. It is **not** a traditional OAuth2 flow with `client_id` and `client_secret`. The flow is much simpler:

1.  A user signs up and/or signs in with their email and password.
2.  The server provides a unique **`access_token`**.
3.  **The frontend must save this token** (e.g., in `localStorage` or `sessionStorage`).
4.  For every future request to a protected endpoint (like anything under `/api/reports`), the frontend must include this token in the HTTP header.
5.  When the user signs out, the frontend must delete the token from storage.

**The most important change:** All API calls to protected routes must now include the following header:

`Authorization: Bearer <the_access_token_you_saved>`

---

### 2. User Roles (Critical for UI)

There are now two user roles. The frontend will need to show/hide UI elements based on the logged-in user's role. You will get the user's role back from the `sign-in` and `/auth/me` endpoints.

*   **`"citizen"`**:
    *   Can create new pothole reports.
    *   Can only view and manage **their own** reports.

*   **`"engineer"`**:
    *   Can do everything a citizen can.
    *   Can view and manage **all reports** from all users.
    *   Can **update the status** of any report.
    *   Can **delete** any report.

---

### 3. New Authentication Endpoints (Base URL: `/auth`)

These are the new endpoints for handling the entire user session lifecycle.

#### **A. User Registration Page (`POST /auth/sign-up`)**

*   **What it's for:** Creating a new user account.
*   **What you send:** A JSON object with the user's details.
    ```json
    {
      "email": "user@example.com",
      "name": "John Doe",
      "password": "your_password",
      "role": "citizen" 
    }
    ```

*   **What you get back (on success):** A JSON object with the new user's public info.
    ```json
    {
      "email": "user@example.com",
      "name": "John Doe",
      "id": 1,
      "role": "citizen"
    }
    ```

*   **What you get back (on error):** A `400 Bad Request` if the email is already registered.

#### **B. User Login Page (`POST /auth/sign-in`)**

*   **What it's for:** Authenticating a user and getting their access token.
*   **What you send:** A JSON object. **Note: the username field is the user's email.**
    ```json
    {
      "username": "user@example.com",
      "password": "your_password"
    }
    ```

*   **What you get back (on success):** A JSON object containing the token and user info.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer",
      "role": "citizen",
      "user": {
        "email": "user@example.com",
        "name": "John Doe",
        "id": 1,
        "role": "citizen"
      }
    }
    ```
    **Action:** You **must** save the `access_token` and `role` in the browser's storage.

*   **What you get back (on error):** A `401 Unauthorized` if credentials are wrong.

#### **C. Checking the User's Session (`GET /auth/me`)**

*   **What it's for:** Getting the profile of the currently logged-in user. This is perfect for checking if a user's token is still valid when they load or refresh the app.
*   **What you send:** Just the `Authorization: Bearer <token>` header. No request body.
*   **What you get back (on success):** The user's public profile.
    ```json
    {
      "email": "user@example.com",
      "name": "John Doe",
      "id": 1,
      "role": "citizen"
    }
    ```

*   **What you get back (on error):** A `401 Unauthorized` if the token is missing, invalid, or expired.

#### **D. User Logout (`POST /auth/sign-out`)**

*   **What it's for:** Logging a user out.
*   **What you send:** Just the `Authorization: Bearer <token>` header.
*   **What you get back:** A success message.
    ```json
    {
      "msg": "Successfully logged out"
    }
    ```
*   **Action:** After calling this, you **must delete the token** from the browser's storage to complete the logout process on the client side.

---

### 4. Changes to Existing Report Endpoints (Base URL: `/api`)

All endpoints under `/api/reports` are now protected.

#### **A. Create a Report (`POST /api/reports`)**

*   **Change:** Requires the `Authorization` header.
*   **How it works:** The backend will automatically associate the new report with the logged-in user. You no longer need to send any user information in the report body.

#### **B. Get Reports (`GET /api/reports`)**

*   **Change:** Requires the `Authorization` header. The behavior is now role-dependent.
*   **How it works:**
    *   If a **citizen** makes this request, the API will **automatically** filter the results and only return the reports they created.
    *   If an **engineer** makes this request, the API will return all reports from all users.
*   **Frontend Action:** Your UI should adapt. For a citizen, you might have a "My Reports" page. For an engineer, it would be a "Pothole Dashboard".

#### **C. Update & Delete Reports (`PUT /api/reports/{id}` & `DELETE /api/reports/{id}`)**

*   **Change:** Requires the `Authorization` header and is restricted to **engineers only**.
*   **Frontend Action:** The "Edit Status" and "Delete" buttons in your UI should only be visible if the logged-in user's `role` is `"engineer"`. If a citizen tries to call these endpoints, they will get a `403 Forbidden` error.

---

### Summary of Frontend Tasks:

1.  Build the **Sign-Up** and **Sign-I** pages.
2.  On successful login, **store the `access_token` and `role`** from the response.
3.  For all API calls to `/api/reports/*`, **add the `Authorization: Bearer <token>` header**.
4.  Use the `/auth/me` endpoint on app startup to check for an existing valid session.
5.  Implement a **Logout** button that calls `POST /auth/sign-out` and **clears the stored token**.
6.  Implement **conditional UI rendering** based on the user's role (e.g., show/hide "Delete" and "Edit" buttons for reports).
