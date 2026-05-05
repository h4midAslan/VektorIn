import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.routes import auth, users, posts, connections, messages, admin, certificates, upload, projects, events, articles, notifications

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Hash API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(connections.router)
app.include_router(messages.router)
app.include_router(admin.router)
app.include_router(certificates.router)
app.include_router(upload.router)
app.include_router(projects.router)
app.include_router(events.router)
app.include_router(articles.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"message": "Hash API işləyir"}
