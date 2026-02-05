import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@db:5432/restaurant"
)

connect_args = {}
if DATABASE_URL.startswith("postgresql") and "sslmode=" not in DATABASE_URL:
    if "localhost" not in DATABASE_URL and "@db:" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=30,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
