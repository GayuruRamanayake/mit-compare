from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import comparisons
from app.database import init_db

app = FastAPI(title="Contract Comparison API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(comparisons.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}