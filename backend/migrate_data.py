import json
import os
from sqlalchemy.orm import Session
import database as db

POTHOLES_DB_JSON = "potholes.json"

def migrate_data():
    """
    Initializes the database and migrates data from potholes.json to the PostgreSQL database.
    """
    # Initialize the database and create tables if they don't exist
    print("Initializing database...")
    db.init_db()
    print("Database initialized.")

    if not os.path.exists(POTHOLES_DB_JSON):
        print(f"JSON file not found: {POTHOLES_DB_JSON}. No data to migrate.")
        return

    with open(POTHOLES_DB_JSON, "r") as f:
        try:
            potholes_data = json.load(f)
        except json.JSONDecodeError:
            print("Error reading JSON file. It might be empty or corrupted.")
            return
    
    if not potholes_data:
        print("JSON file is empty. No data to migrate.")
        return

    db_session: Session = next(db.get_db())
    
    migrated_count = 0
    skipped_count = 0

    for pothole_data in potholes_data:
        # Check if a pothole with the same ID already exists
        exists = db_session.query(db.Pothole).filter(db.Pothole.id == pothole_data['id']).first()
        if exists:
            print(f"Skipping pothole with ID {pothole_data['id']} as it already exists in the database.")
            skipped_count += 1
            continue

        # Create a new Pothole object and add it to the session
        db_pothole = db.Pothole(**pothole_data)
        db_session.add(db_pothole)
        migrated_count += 1

    try:
        db_session.commit()
        print(f"Successfully migrated {migrated_count} new records.")
        if skipped_count > 0:
            print(f"Skipped {skipped_count} records that already existed.")
    except Exception as e:
        print(f"An error occurred during migration: {e}")
        db_session.rollback()
    finally:
        db_session.close()

if __name__ == "__main__":
    print("Starting data migration...")
    migrate_data()
    print("Data migration finished.")
