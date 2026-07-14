import database as db
from sqlalchemy import MetaData

def migrate_data():
    """
    Applies database schema changes by dropping the old analysis tables and creating the new ones.
    WARNING: This will delete all existing data in the analysis_sessions and detected_potholes tables.
    """
    print("Applying database schema changes...")
    
    engine = db.engine
    
    # Reflect the existing database schema
    meta = MetaData()
    meta.reflect(bind=engine)
    
    # Drop the tables in the correct order (child then parent)
    if 'detected_potholes' in meta.tables:
        print("Dropping old 'detected_potholes' table...")
        meta.tables['detected_potholes'].drop(engine)
        
    if 'analysis_sessions' in meta.tables:
        print("Dropping old 'analysis_sessions' table...")
        meta.tables['analysis_sessions'].drop(engine)

    # Now, create the tables based on the new schema defined in database.py
    print("Creating tables with the new schema...")
    db.init_db()
    
    print("Database schema updated successfully.")

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_data()
    print("Database migration finished.")