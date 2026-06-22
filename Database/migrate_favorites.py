"""
Add user_favorites table.
Run: python migrate_favorites.py
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')


def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("=" * 60)
    print("Creating user_favorites table")
    print("=" * 60)
    
    # Check if table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'user_favorites'
        )
    """)
    exists = cur.fetchone()[0]
    
    if exists:
        print("[=] Table user_favorites already exists, skipping.")
    else:
        cur.execute("""
            CREATE TABLE user_favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, institution_id)
            )
        """)
        print("[+] Created user_favorites table")
        
        cur.execute("CREATE INDEX idx_favorites_user ON user_favorites(user_id)")
        cur.execute("CREATE INDEX idx_favorites_school ON user_favorites(institution_id)")
        print("[+] Created indexes")
    
    conn.commit()
    
    # Show structure
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_favorites'
        ORDER BY ordinal_position
    """)
    print("\nTable structure:")
    for col, dtype in cur.fetchall():
        print(f"  - {col}: {dtype}")
    
    cur.close()
    conn.close()
    print("\n[DONE] Migration complete!")


if __name__ == '__main__':
    migrate()