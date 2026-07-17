# Backend

This is the backend for the MIDC Pothole project.

## Folder Structure

The backend follows a modular, Express-style MVC structure:

- `src/`: Contains the core application logic.
  - `api/`: Aggregates all the API routers.
  - `config/`: Handles application configuration, including database connections and environment variables.
  - `controllers/`: Contains the business logic for each route.
  - `middlewares/`: Custom middleware for the FastAPI application.
  - `routes/`: Defines the API routes and their corresponding controller functions.
  - `schemas/`: Pydantic and SQLAlchemy schemas for data validation and ORM.
  - `services/`: Houses external services, such as S3, YOLO, and Gemini.
  - `utils/`: Utility functions.
- `main.py`: The main entry point for the FastAPI application.
- `scripts/`: Contains standalone scripts, such as database migration scripts.
- `models/`: Contains the machine learning models.
- `legacy_mock_data/`: Contains unused mock data files.

## Authentication

The backend uses JWT-based Role-Based Access Control (RBAC) for authentication.

### Roles

- **citizen**: Can create pothole reports and view their own reports.
- **engineer**: Can view all reports, update report status, and delete reports.

### Endpoints

- `POST /auth/sign-up`: Register a new user.
- `POST /auth/sign-in`: Log in and receive a JWT.
- `POST /auth/sign-out`: Log out.
- `GET /auth/me`: Get the current user's profile.

### Protected Routes

To access protected routes, include the JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```
