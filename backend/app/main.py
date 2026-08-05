from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import comparisons

app = FastAPI(title="Contract Comparison API")

# allow the Vite dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(comparisons.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}