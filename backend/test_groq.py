"""
Interactive chat test for your AI setup.
Type messages and see which AI (Gemini or Groq) answers.

Run: python chat_test.py
"""
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

# Try to import the actual chatbot's AI client
try:
    from llm.gemini_client import generate_response, detect_language
    print("[OK] Loaded your project's AI client (Gemini + Groq fallback)")
except Exception as e:
    print(f"[ERROR] Could not load AI client: {e}")
    print("\nMake sure you're running this from the 'backend' folder!")
    sys.exit(1)


# System prompts (same as your chatbot)
SYSTEM_PROMPT_KM = """អ្នកគឺជាជំនួយការ AI របស់ EduMatch — វេទិកាណែនាំសាលានៅប្រទេសកម្ពុជា។
- ឆ្លើយជាភាសាខ្មែរ ដោយខ្លី និងច្បាស់លាស់
- មានប្រយោជន៍ និងស្មោះត្រង់"""

SYSTEM_PROMPT_EN = """You are the EduMatch AI assistant — a Cambodia school recommendation platform.
- Reply in clear, concise English
- Be helpful and honest"""


def print_banner():
    print("\n" + "=" * 70)
    print("EduMatch AI Chat Test (Direct AI, no database)")
    print("=" * 70)
    print("Type your message and press Enter. The AI will respond.")
    print("Commands:")
    print("  /quit    - Exit")
    print("  /clear   - Clear conversation memory")
    print("  /history - Show conversation history")
    print("=" * 70)


def main():
    print_banner()
    
    # Track conversation
    history = []
    
    while True:
        # Get user input
        try:
            print()
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nGoodbye!")
            break
        
        if not user_input:
            continue
        
        # Commands
        if user_input.lower() in ['/quit', '/exit', '/q']:
            print("\nGoodbye!")
            break
        
        if user_input.lower() == '/clear':
            history = []
            print("[OK] Conversation cleared.")
            continue
        
        if user_input.lower() == '/history':
            if not history:
                print("[INFO] No history yet.")
            else:
                print("\n--- History ---")
                for h in history:
                    print(f"{h['role'].upper()}: {h['content'][:80]}")
                print("---------------")
            continue
        
        # Detect language
        language = detect_language(user_input)
        
        # Build context with history
        history_text = ""
        if history:
            history_text = "\n=== Previous turns ===\n"
            for h in history[-6:]:  # Last 6 messages for context
                role_label = "User" if h['role'] == 'user' else "AI"
                history_text += f"{role_label}: {h['content']}\n"
            history_text += "\n"
        
        # Build full prompt
        full_prompt = f"""{history_text}=== Current Question ===
{user_input}"""
        
        # Choose system prompt by language
        system_prompt = SYSTEM_PROMPT_KM if language == 'km' else SYSTEM_PROMPT_EN
        
        # Call AI with timer
        print("AI: ", end='', flush=True)
        try:
            start = time.time()
            reply = generate_response(full_prompt, system_instruction=system_prompt)
            elapsed = time.time() - start
            
            print(reply)
            print(f"\n[Stats] Lang: {language} | Time: {elapsed:.2f}s")
            
            # Save to history
            history.append({'role': 'user', 'content': user_input})
            history.append({'role': 'bot', 'content': reply})
            
        except Exception as e:
            print(f"\n[ERROR] {str(e)[:200]}")
            print("[INFO] Check your backend terminal logs for details.")


if __name__ == '__main__':
    main()