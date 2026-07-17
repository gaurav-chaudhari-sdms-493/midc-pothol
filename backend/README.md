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
