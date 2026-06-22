import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(" Connected to PostgreSQL!")
    print("Version:", version[0])
    
    # Check our tables
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    print(f"\n Tables in database ({len(tables)}):")
    for t in tables:
        print(f"   - {t[0]}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(" Connection failed:")
    print(e)