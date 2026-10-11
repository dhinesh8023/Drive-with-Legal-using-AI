from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import api_router

app = FastAPI(
    title="Drive Legal AI — Predictive Road Safety Microservice",
    description="Intelligent Risk Engine, Driver State Monitoring & AI Violation Analysis",
    version="1.0.0 (SIH 2026)",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {
        "status": "ONLINE",
        "service": "Drive Legal AI Microservice (FastAPI)",
        "mode": "DEMO AI + REAL ML READY",
        "version": "1.0.0",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
