"""
Create chat_messages table for storing chat history per user.
"""
import psycopg2
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from project root
ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')

def create_table():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("Creating chat_messages table...")
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(10) NOT NULL,
            content TEXT NOT NULL,
            school_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Index for faster lookups by user
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
        ON chat_messages(user_id, created_at DESC);
    """)
    
    conn.commit()
    print("[OK] chat_messages table created!")
    
    # Verify
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages'
        ORDER BY ordinal_position;
    """)
    
    print("\nTable structure:")
    for row in cur.fetchall():
        print(f"  - {row[0]}: {row[1]}")
    
    cur.close()
    conn.close()
    print("\n[DONE] Ready to use!")


if __name__ == '__main__':
    create_table()