from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./comparisons.db"

# check_same_thread=False is required for SQLite + FastAPI's multi-request
# handling; SQLite itself is still safe here since FastAPI's dev server
# processes requests one at a time by default
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session