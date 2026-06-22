"""
ner_extractor.py with Gemini API
Extract entities (interests, regions) from user text.
Priority:
  1. Google Gemini (LLM) — understands typos, Khmer/English mix
  2. Fuzzy keyword match — free fallback
"""

import os
import json
import httpx
from difflib import get_close_matches
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Try Gemini models in order
GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
]

# ─── VALID KHMER FIELD NAMES ───
VALID_FIELDS = [
    "ព័ត៌មានវិទ្យា", "វេជ្ជសាស្ត្រ", "គិលានុបដ្ឋាក", "ឆ្មប", "ទន្តពេទ្យ",
    "ឱសថ", "សុខភាពសាធារណៈ", "វិស្វកម្ម", "វិស្វកម្មសំណង់", "វិស្វកម្មអគ្គិសនី",
    "វិស្វកម្មមេកានិច", "វិស្វកម្មគីមី", "វិស្វកម្មឧស្សាហកម្ម", "វិស្វកម្មយានយន្ត",
    "ស្ថាបត្យកម្ម", "គណិតវិទ្យា", "ស្ថិតិវិទ្យា", "រូបវិទ្យា", "គីមីវិទ្យា",
    "ជីវនវិទ្យា", "បរិស្ថានវិទ្យា", "ភូគព្ភវិទ្យា", "នីតិសាស្ត្រ",
    "វិទ្យាសាស្ត្រនយោបាយ", "ទំនាក់ទំនងអន្តរជាតិ", "អប់រំ", "កសិកម្ម",
    "ជលផល", "វារីវប្បកម្ម", "ព្រៃឈើ", "វិចិត្រសិល្បៈ", "ក្រាហ្វិកឌីហ្សាញ",
    "តន្ត្រី", "របាំ", "ភាពយន្ត", "ម៉ូត", "ការថតរូប", "ទេសចរណ៍",
    "ការគ្រប់គ្រងសណ្ឋាគារ", "ការធ្វើម្ហូប", "គ្រប់គ្រងពាណិជ្ជកម្ម",
    "ហិរញ្ញវត្ថុ", "សេដ្ឋកិច្ច", "គណនេយ្យ", "ទីផ្សារ", "ដឹកជញ្ជូន",
    "ប្រវត្តិវិទ្យា", "ភូមិវិទ្យា", "ចិត្តវិទ្យា", "សង្គមវិទ្យា",
    "ទស្សនវិជ្ជា", "មនុស្សវិទ្យា", "បុរាណវិទ្យា", "ភាសាអង់គ្លេស",
    "ភាសាបារាំង", "ភាសាជប៉ុន", "ភាសាកូរ៉េ", "ភាសាចិន", "ភាសាថៃ",
    "ភាសាវៀតណាម", "ភាសាស្ប៉ាញ", "ភាសាអាល្លឺម៉ង់", "អក្សរសាស្ត្រ",
    "សារព័ត៌មាន", "ប្រព័ន្ធផ្សព្វផ្សាយ", "ទំនាក់ទំនង", "ទំនាក់ទំនងសាធារណៈ",
    "រដ្ឋបាល", "យោធា", "ប៉ូលីស", "កីឡា",
]

# Full CAREER_VOCAB (same as before, just pasted here for completeness)
CAREER_VOCAB = {
    "កូដ": "ព័ត៌មានវិទ្យា", "កម្មវិធី": "ព័ត៌មានវិទ្យា",
    "កុំព្យូទ័រ": "ព័ត៌មានវិទ្យា", "បណ្តាញ": "ព័ត៌មានវិទ្យា",
    "សុហ្មមែរ": "ព័ត៌មានវិទ្យា", "បច្ចេកវិទ្យា": "ព័ត៌មានវិទ្យា",
    "computer": "ព័ត៌មានវិទ្យា", "programming": "ព័ត៌មានវិទ្យា",
    "software": "ព័ត៌មានវិទ្យា", "coding": "ព័ត៌មានវិទ្យា",
    "code": "ព័ត៌មានវិទ្យា", "ai": "ព័ត៌មានវិទ្យា",
    "machine learning": "ព័ត៌មានវិទ្យា", "data": "ព័ត៌មានវិទ្យា",
    "ទិន្នន័យ": "ព័ត៌មានវិទ្យា", "cybersecurity": "ព័ត៌មានវិទ្យា",
    "web": "ព័ត៌មានវិទ្យា", "app": "ព័ត៌មានវិទ្យា",
    "developer": "ព័ត៌មានវិទ្យា", "it": "ព័ត៌មានវិទ្យា",
    "ឱសថ": "ឱសថ", "ពេទ្យ": "វេជ្ជសាស្ត្រ",
    "វេជ្ជ": "វេជ្ជសាស្ត្រ", "គិលានុបដ្ឋាក": "គិលានុបដ្ឋាក",
    "ឆ្មប": "ឆ្មប", "doctor": "វេជ្ជសាស្ត្រ",
    "medicine": "វេជ្ជសាស្ត្រ", "medical": "វេជ្ជសាស្ត្រ",
    "nurse": "គិលានុបដ្ឋាក", "nursing": "គិលានុបដ្ឋាក",
    "pharmacy": "ឱសថ", "pharmacist": "ឱសថ",
    "dental": "ទន្តពេទ្យ", "ទន្ត": "ទន្តពេទ្យ",
    "midwife": "ឆ្មប", "health": "សុខភាពសាធារណៈ",
    "វិស្វកម្ម": "វិស្វកម្ម", "engineering": "វិស្វកម្ម",
    "engineer": "វិស្វកម្ម", "សំណង់": "វិស្វកម្មសំណង់",
    "civil": "វិស្វកម្មសំណង់", "construction": "វិស្វកម្មសំណង់",
    "សាងសង់": "វិស្វកម្មសំណង់", "ផ្ទះ": "វិស្វកម្មសំណង់",
    "electrical": "វិស្វកម្មអគ្គិសនី", "អគ្គិសនី": "វិស្វកម្មអគ្គិសនី",
    "mechanical": "វិស្វកម្មមេកានិច", "មេកានិច": "វិស្វកម្មមេកានិច",
    "ម៉ាស៊ីន": "វិស្វកម្មមេកានិច", "chemical": "វិស្វកម្មគីមី",
    "industrial": "វិស្វកម្មឧស្សាហកម្ម", "ឧស្សាហកម្ម": "វិស្វកម្មឧស្សាហកម្ម",
    "automotive": "វិស្វកម្មយានយន្ត", "យានយន្ត": "វិស្វកម្មយានយន្ត",
    "robotics": "វិស្វកម្ម",
    "ស្ថាបត្យកម្ម": "ស្ថាបត្យកម្ម", "architecture": "ស្ថាបត្យកម្ម",
    "architect": "ស្ថាបត្យកម្ម", "building": "ស្ថាបត្យកម្ម",
    "អគារ": "ស្ថាបត្យកម្ម", "រចនា": "ស្ថាបត្យកម្ម",
    "ប្លង់": "ស្ថាបត្យកម្ម",
    "គណិត": "គណិតវិទ្យា", "math": "គណិតវិទ្យា",
    "mathematics": "គណិតវិទ្យា", "statistics": "ស្ថិតិវិទ្យា",
    "ស្ថិតិ": "ស្ថិតិវិទ្យា", "រូប": "រូបវិទ្យា",
    "physics": "រូបវិទ្យា", "គីមី": "គីមីវិទ្យា",
    "chemistry": "គីមីវិទ្យា", "biology": "ជីវនវិទ្យា",
    "biotechnology": "ជីវនវិទ្យា", "environment": "បរិស្ថានវិទ្យា",
    "បរិស្ថាន": "បរិស្ថានវិទ្យា", "geology": "ភូគព្ភវិទ្យា",
    "ភូគព្ភ": "ភូគព្ភវិទ្យា",
    "ច្បាប់": "នីតិសាស្ត្រ", "នីតិ": "នីតិសាស្ត្រ",
    "law": "នីតិសាស្ត្រ", "lawyer": "នីតិសាស្ត្រ",
    "legal": "នីតិសាស្ត្រ", "attorney": "នីតិសាស្ត្រ",
    "advocate": "នីតិសាស្ត្រ", "court": "នីតិសាស្ត្រ",
    "judge": "នីតិសាស្ត្រ", "ចៅក្រម": "នីតិសាស្ត្រ",
    "political": "វិទ្យាសាស្ត្រនយោបាយ", "នយោបាយ": "វិទ្យាសាស្ត្រនយោបាយ",
    "diplomacy": "ទំនាក់ទំនងអន្តរជាតិ", "ការទូត": "ទំនាក់ទំនងអន្តរជាតិ",
    "international": "ទំនាក់ទំនងអន្តរជាតិ",
    "បង្រៀន": "អប់រំ", "គ្រូ": "អប់រំ", "អប់រំ": "អប់រំ",
    "teach": "អប់រំ", "teacher": "អប់រំ",
    "education": "អប់រំ", "pedagogy": "អប់រំ",
    "ដី": "កសិកម្ម", "ដាំ": "កសិកម្ម",
    "កសិកម្ម": "កសិកម្ម", "ស្រូវ": "កសិកម្ម",
    "ដំណាំ": "កសិកម្ម", "agriculture": "កសិកម្ម",
    "farming": "កសិកម្ម", "ត្រី": "ជលផល",
    "ចិញ្ចឹមត្រី": "ជលផល", "fishery": "ជលផល",
    "សត្វ": "វារីវប្បកម្ម", "veterinary": "វារីវប្បកម្ម",
    "forestry": "ព្រៃឈើ", "ព្រៃ": "ព្រៃឈើ",
    "សិល្បៈ": "វិចិត្រសិល្បៈ", "គូរ": "វិចិត្រសិល្បៈ",
    "art": "វិចិត្រសិល្បៈ", "artist": "វិចិត្រសិល្បៈ",
    "design": "ក្រាហ្វិកឌីហ្សាញ", "graphic": "ក្រាហ្វិកឌីហ្សាញ",
    "ឌីហ្សាញ": "ក្រាហ្វិកឌីហ្សាញ", "music": "តន្ត្រី",
    "តន្ត្រី": "តន្ត្រី", "dance": "របាំ",
    "របាំ": "របាំ", "film": "ភាពយន្ត",
    "ភាពយន្ត": "ភាពយន្ត", "fashion": "ម៉ូត",
    "ម៉ូត": "ម៉ូត", "photography": "ការថតរូប",
    "ថតរូប": "ការថតរូប",
    "ទេសចរ": "ទេសចរណ៍", "ទេសចរណ៍": "ទេសចរណ៍",
    "tourism": "ទេសចរណ៍", "tourist": "ទេសចរណ៍",
    "សណ្ឋាគារ": "ការគ្រប់គ្រងសណ្ឋាគារ", "hotel": "ការគ្រប់គ្រងសណ្ឋាគារ",
    "hospitality": "ការគ្រប់គ្រងសណ្ឋាគារ", "ភោជនីយដ្ឋាន": "ការគ្រប់គ្រងសណ្ឋាគារ",
    "restaurant": "ការគ្រប់គ្រងសណ្ឋាគារ", "ធ្វើម្ហូប": "ការធ្វើម្ហូប",
    "cooking": "ការធ្វើម្ហូប", "chef": "ការធ្វើម្ហូប",
    "culinary": "ការធ្វើម្ហូប",
    "ធុរ": "គ្រប់គ្រងពាណិជ្ជកម្ម", "ធុរកិច្ច": "គ្រប់គ្រងពាណិជ្ជកម្ម",
    "ពាណិជ្ជ": "គ្រប់គ្រងពាណិជ្ជកម្ម", "គ្រប់គ្រង": "គ្រប់គ្រងពាណិជ្ជកម្ម",
    "business": "គ្រប់គ្រងពាណិជ្ជកម្ម", "management": "គ្រប់គ្រងពាណិជ្ជកម្ម",
    "entrepreneur": "គ្រប់គ្រងពាណិជ្ជកម្ម", "ហិរញ្ញ": "ហិរញ្ញវត្ថុ",
    "ហិរញ្ញវត្ថុ": "ហិរញ្ញវត្ថុ", "finance": "ហិរញ្ញវត្ថុ",
    "ធនាគារ": "ហិរញ្ញវត្ថុ", "banking": "ហិរញ្ញវត្ថុ",
    "សេដ្ឋកិច្ច": "សេដ្ឋកិច្ច", "economic": "សេដ្ឋកិច្ច",
    "economics": "សេដ្ឋកិច្ច", "គណនេយ្យ": "គណនេយ្យ",
    "accounting": "គណនេយ្យ", "accountant": "គណនេយ្យ",
    "audit": "គណនេយ្យ", "សវនកម្ម": "គណនេយ្យ",
    "ទីផ្សារ": "ទីផ្សារ", "marketing": "ទីផ្សារ",
    "advertising": "ទីផ្សារ", "ផ្សាយពាណិជ្ជកម្ម": "ទីផ្សារ",
    "sales": "ទីផ្សារ", "logistic": "ដឹកជញ្ជូន",
    "ដឹកជញ្ជូន": "ដឹកជញ្ជូន", "supply chain": "ដឹកជញ្ជូន",
    "ប្រវត្តិ": "ប្រវត្តិវិទ្យា", "history": "ប្រវត្តិវិទ្យា",
    "ភូមិវិទ្យា": "ភូមិវិទ្យា", "geography": "ភូមិវិទ្យា",
    "ចិត្ត": "ចិត្តវិទ្យា", "psychology": "ចិត្តវិទ្យា",
    "psychologist": "ចិត្តវិទ្យា", "sociology": "សង្គមវិទ្យា",
    "សង្គម": "សង្គមវិទ្យា", "philosophy": "ទស្សនវិជ្ជា",
    "ទស្សន": "ទស្សនវិជ្ជា", "anthropology": "មនុស្សវិទ្យា",
    "មនុស្ស": "មនុស្សវិទ្យា", "archaeology": "បុរាណវិទ្យា",
    "បុរាណ": "បុរាណវិទ្យា",
    "ភាសា": "ភាសាអង់គ្លេស", "english": "ភាសាអង់គ្លេស",
    "អង់គ្លេស": "ភាសាអង់គ្លេស", "french": "ភាសាបារាំង",
    "បារាំង": "ភាសាបារាំង", "japanese": "ភាសាជប៉ុន",
    "ជប៉ុន": "ភាសាជប៉ុន", "korean": "ភាសាកូរ៉េ",
    "កូរ៉េ": "ភាសាកូរ៉េ", "chinese": "ភាសាចិន",
    "ចិន": "ភាសាចិន", "thai": "ភាសាថៃ",
    "ថៃ": "ភាសាថៃ", "vietnamese": "ភាសាវៀតណាម",
    "វៀតណាម": "ភាសាវៀតណាម", "ស្ប៉ាញ": "ភាសាស្ប៉ាញ",
    "spanish": "ភាសាស្ប៉ាញ", "germany": "ភាសាអាល្លឺម៉ង់",
    "german": "ភាសាអាល្លឺម៉ង់", "អក្សរសាស្ត្រ": "អក្សរសាស្ត្រ",
    "literature": "អក្សរសាស្ត្រ",
    "សារព័ត៌មាន": "សារព័ត៌មាន", "ព័ត៌មាន": "សារព័ត៌មាន",
    "journalism": "សារព័ត៌មាន", "journalist": "សារព័ត៌មាន",
    "media": "ប្រព័ន្ធផ្សព្វផ្សាយ", "ផ្សព្វផ្សាយ": "ប្រព័ន្ធផ្សព្វផ្សាយ",
    "communication": "ទំនាក់ទំនង", "ទំនាក់ទំនង": "ទំនាក់ទំនង",
    "broadcast": "ប្រព័ន្ធផ្សព្វផ្សាយ", "public relations": "ទំនាក់ទំនងសាធារណៈ",
    "ផ្នែករដ្ឋបាល": "រដ្ឋបាល", "administration": "រដ្ឋបាល",
    "administrator": "រដ្ឋបាល", "military": "យោធា",
    "យោធា": "យោធា", "police": "ប៉ូលីស",
    "ប៉ូលីស": "ប៉ូលីស", "sport": "កីឡា",
    "កីឡា": "កីឡា", "athletic": "កីឡា",
}

_ENGLISH_KEYWORDS = [k for k in CAREER_VOCAB if k.isascii() and len(k) >= 4]

# ─── REGION KEYWORDS ───
REGION_KEYWORDS = {
    "ភ្នំពេញ": "ភ្នំពេញ", "phnom penh": "ភ្នំពេញ", "pp": "ភ្នំពេញ",
    "បាត់ដំបង": "បាត់ដំបង", "battambang": "បាត់ដំបង",
    "សៀមរាប": "សៀមរាប", "siem reap": "សៀមរាប", "siemreap": "សៀមរាប",
    "កំពង់ចាម": "កំពង់ចាម", "kampong cham": "កំពង់ចាម",
    "កំពង់ឆ្នាំង": "កំពង់ឆ្នាំង", "kampong chhnang": "កំពង់ឆ្នាំង",
    "កំពង់ស្ពឺ": "កំពង់ស្ពឺ", "kampong speu": "កំពង់ស្ពឺ",
    "កំពង់ធំ": "កំពង់ធំ", "kampong thom": "កំពង់ធំ",
    "ស្វាយរៀង": "ស្វាយរៀង", "svay rieng": "ស្វាយរៀង",
    "ក្រចេះ": "ក្រចេះ", "kratie": "ក្រចេះ",
    "ព្រៃវែង": "ព្រៃវែង", "prey veng": "ព្រៃវែង",
    "តាកែវ": "តាកែវ", "takeo": "តាកែវ",
    "កំពត": "កំពត", "kampot": "កំពត",
    "ព្រះសីហនុ": "ព្រះសីហនុ", "sihanouk": "ព្រះសីហនុ",
    "sihanoukville": "ព្រះសីហនុ", "preah sihanouk": "ព្រះសីហនុ",
    "កែប": "កែប", "kep": "កែប",
    "រតនគិរី": "រតនគិរី", "ratanakiri": "រតនគិរី",
    "មណ្ឌលគិរី": "មណ្ឌលគិរី", "mondulkiri": "មណ្ឌលគិរី",
    "ពោធិ៍សាត់": "ពោធិ៍សាត់", "pursat": "ពោធិ៍សាត់",
}


# ══════════════════════════════════════════════════
# LAYER 1: Google Gemini
# ══════════════════════════════════════════════════

def extract_entities_gemini(text: str) -> list[str]:
    """Send to Gemini API. Falls back silently if unavailable."""
    if not text or not GEMINI_API_KEY:
        return []

    valid_fields_str = ", ".join(VALID_FIELDS)
    prompt = f"""Extract study/career fields the student is interested in.

Student text: "{text}"

Valid field names (ONLY from this list):
{valid_fields_str}

Handle typos, Khmer, mixed language.
Return ONLY JSON array. Example: ["នីតិសាស្ត្រ"]
If nothing, return: []"""

    for model in GEMINI_MODELS:
        try:
            response = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": GEMINI_API_KEY},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 200},
                },
                timeout=8.0,
            )
            raw = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw)
            valid = [f for f in parsed if f in VALID_FIELDS]
            print(f"[Gemini {model}] '{text[:30]}...' → {valid}")
            return valid
        except Exception as e:
            print(f"[Gemini {model} failed] {type(e).__name__}")
            continue
    return []


# ══════════════════════════════════════════════════
# LAYER 2: Fuzzy keyword
# ══════════════════════════════════════════════════

def extract_entities_fuzzy(text: str) -> list[str]:
    """Keyword + difflib fuzzy match. Free fallback."""
    if not text:
        return []

    found = []
    text_lower = text.lower()

    sorted_vocab = sorted(CAREER_VOCAB.items(), key=lambda x: len(x[0]), reverse=True)
    for keyword, field in sorted_vocab:
        if keyword.lower() in text_lower and field not in found:
            found.append(field)

    for word in text_lower.split():
        if len(word) < 4:
            continue
        matches = get_close_matches(word, _ENGLISH_KEYWORDS, n=1, cutoff=0.80)
        if matches:
            field = CAREER_VOCAB.get(matches[0])
            if field and field not in found:
                found.append(field)

    return found


# ══════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════

def extract_entities(text: str) -> list[str]:
    """Try Gemini first, fall back to fuzzy."""
    results = extract_entities_gemini(text)
    if results:
        return results
    return extract_entities_fuzzy(text)


def extract_region(text: str) -> str | None:
    if not text:
        return None
    text_lower = text.lower()
    sorted_regions = sorted(REGION_KEYWORDS.items(), key=lambda x: len(x[0]), reverse=True)
    for keyword, normalized in sorted_regions:
        if keyword.lower() in text_lower:
            return normalized
    return None


def build_user_profile(survey: dict) -> dict:
    parts = []
    extracted_interests = []

    if survey.get("career_interest"):
        ci = survey["career_interest"]
        parts.append(f"ខ្ញុំចង់សិក្សាផ្នែក{ci}")
        parts.append(f"ខ្ញុំចាប់អារម្មណ៍លើ{ci}")
        parts.append(f"ខ្ញុំចង់ក្លាយជាអ្នកជំនាญផ្នែក{ci}")
        parts.append(f"គោលដៅអាជីពរបស់ខ្ញុំគឺ{ci}")
        parts.append(ci)
        extracted_interests.append(ci)

    if survey.get("strong_subjects"):
        subject_list = survey["strong_subjects"]
        if isinstance(subject_list, str):
            subject_list = [subject_list]

        mapped = []
        for s in subject_list:
            if not s:
                continue
            entities = extract_entities(str(s))
            if entities:
                mapped.extend(entities)
            else:
                mapped.append(str(s))

        seen = set()
        unique = []
        for s in mapped:
            if s not in seen:
                unique.append(s)
                seen.add(s)

        if unique:
            subjects_text = ", ".join(unique)
            parts.append(f"មុខវិជ្ជាខ្លាំង៖ {subjects_text}")
            parts.append(f"ខ្ញុំពូកែក្នុង{subjects_text}")
            parts.append(subjects_text)
            extracted_interests.extend(unique)

    if survey.get("study_track"):
        parts.append(f"ខ្ញុំរៀនថ្នាក់{survey['study_track']}")

    gpa_map = {
        "high": "ខ្ញុំមានលទ្ធផលសិក្សាខ្ពស់",
        "medium": "ខ្ញុំមានលទ្ធផលសិក្សាមធ្យម",
        "low": "ខ្ញុំមានលទ្ធផលសិក្សាទាប",
    }
    if survey.get("gpa_level") and survey["gpa_level"] in gpa_map:
        parts.append(gpa_map[survey["gpa_level"]])

    free_text = (survey.get("free_text") or "").strip()
    if free_text:
        parts.append(free_text)
        entities = extract_entities(free_text)
        if entities:
            parts.append("ខ្ញុំចាប់អារម្មណ៍លើ " + " ".join(entities))
            extracted_interests.extend(entities)

    region = survey.get("region_preference")
    if not region and free_text:
        region = extract_region(free_text)

    seen = set()
    unique_interests = []
    for i in extracted_interests:
        if i not in seen:
            unique_interests.append(i)
            seen.add(i)

    return {
        "profile_text": " ".join(parts),
        "region": region,
        "extracted_interests": unique_interests,
    }