"""
Migrate chat system to support multiple conversations.
- Drop old chat_messages table (only had 2 test messages)
- Create chat_conversations table
- Create new chat_messages table with conversation_id
"""
import psycopg2
from dotenv import load_dotenv
import os
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')


def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("=" * 60)
    print("Migrating Chat System to Multi-Conversation")
    print("=" * 60)
    
    # Step 1: Drop old table
    print("\n[1/4] Dropping old chat_messages table...")
    cur.execute("DROP TABLE IF EXISTS chat_messages CASCADE;")
    print("      [OK] Dropped.")
    
    # Step 2: Create conversations table
    print("\n[2/4] Creating chat_conversations table...")
    cur.execute("""
        CREATE TABLE chat_conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
            school_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE INDEX idx_conversations_user 
        ON chat_conversations(user_id, updated_at DESC);
    """)
    print("      [OK] Created.")
    
    # Step 3: Create new messages table
    print("\n[3/4] Creating new chat_messages table...")
    cur.execute("""
        CREATE TABLE chat_messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(10) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE INDEX idx_messages_conversation 
        ON chat_messages(conversation_id, created_at ASC);
    """)
    cur.execute("""
        CREATE INDEX idx_messages_user 
        ON chat_messages(user_id);
    """)
    print("      [OK] Created.")
    
    # Step 4: Create auto-update trigger for conversations.updated_at
    print("\n[4/4] Creating auto-update trigger...")
    cur.execute("""
        CREATE OR REPLACE FUNCTION update_conversation_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE chat_conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = NEW.conversation_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    cur.execute("DROP TRIGGER IF EXISTS trg_update_conversation ON chat_messages;")
    cur.execute("""
        CREATE TRIGGER trg_update_conversation
        AFTER INSERT ON chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_conversation_timestamp();
    """)
    print("      [OK] Trigger created (auto-updates conversation timestamp when new message).")
    
    conn.commit()
    
    # Verify
    print("\n" + "=" * 60)
    print("Verifying...")
    print("=" * 60)
    
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_name IN ('chat_conversations', 'chat_messages')
        ORDER BY table_name;
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"\nTables: {tables}")
    
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'chat_conversations'
        ORDER BY ordinal_position;
    """)
    print("\nchat_conversations columns:")
    for col, dtype in cur.fetchall():
        print(f"  - {col}: {dtype}")
    
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages'
        ORDER BY ordinal_position;
    """)
    print("\nchat_messages columns:")
    for col, dtype in cur.fetchall():
        print(f"  - {col}: {dtype}")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("[DONE] Migration complete!")
    print("=" * 60)


if __name__ == '__main__':
    migrate()