from src.config.database import Base, engine
from src.models import user, token_blacklist
from src.schemas import report

def main():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    main()
