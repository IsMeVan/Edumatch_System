import psycopg2.pool
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=os.getenv("DATABASE_URL")
        )
    return _pool


def get_db():
    pool = get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)