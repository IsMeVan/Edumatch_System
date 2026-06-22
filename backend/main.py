from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from routes import chat
from routes import favorites
from routes import admin
from routes import reports
from routes import notifications

load_dotenv(dotenv_path="../.env")

from routes import auth, survey, recommend, history, schools, users

app = FastAPI(title="Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(survey.router, prefix="/survey", tags=["Survey"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommend"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(schools.router, prefix="/schools", tags=["Schools"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(chat.router)
app.include_router(favorites.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"status": "running"}


@app.get("/health")
def health():
    from db.database import get_pool
    try:
        pool = get_pool()
        conn = pool.getconn()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM institutions;")
        count = cur.fetchone()[0]
        cur.close()
        pool.putconn(conn)
        return {"db": "connected", "institutions_in_db": count}
    except Exception as e:
        return {"db": "error", "detail": str(e)}