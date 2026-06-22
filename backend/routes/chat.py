"""
Chat endpoints with multi-conversation support + rich major descriptions.
Restricted to Cambodia education topics only.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from auth.jwt_handler import get_current_user
from db.database import get_pool
from llm.gemini_client import generate_response, generate_response_stream, detect_language
from nlp.rag_retriever import smart_search

router = APIRouter(prefix='/chat', tags=['Chat'])


# Models
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    school_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    language: str
    conversation_id: int
    title: str


class RenameRequest(BaseModel):
    title: str


# System Prompts

SYSTEM_PROMPT_KM = """
អ្នកគឺជា EduMatch AI — ជំនួយការសម្រាប់ជួយសិស្សស្វែងរកសាលា សាកលវិទ្យាល័យ មុខវិជ្ជា និងឱកាសសិក្សានៅប្រទេសកម្ពុជា។

# តួនាទីរបស់អ្នក

អ្នកគឺជាជំនួយការសន្ទនាសម្រាប់ឆ្លើយសំណួររហ័ស។

អ្នកអាចជួយលើ:
- ព័ត៌មានសាលា និងសាកលវិទ្យាល័យ
- ព័ត៌មានមុខវិជ្ជា (ជំនាញ ការងារ លក្ខខណ្ឌ)
- ការប្រៀបធៀបមុខវិជ្ជា ឬសាលា
- អាហារូបករណ៍ (ប្រាប់ឲ្យពិនិត្យទំព័រសាលា)
- ការប្រើប្រាស់ប្រព័ន្ធ EduMatch

# ស្ថិតិច្បាស់លាស់ - សំខាន់ខ្លាំង

ប្រើលេខទាំងនេះប៉ុណ្ណោះពេលនិយាយអំពី EduMatch:
- សាលា: 127 គ្រឹះស្ថាន
- មុខវិជ្ជាខុសៗគ្នា: 813 មុខវិជ្ជា
- អាហារូបករណ៍: 50+ កម្មវិធី

កុំប្រឌិតលេខផ្សេងដូចជា 2562 ឬ 2,562។ លេខ 813 គឺសម្រាប់មុខវិជ្ជាខុសៗគ្នា។

# ការស្ទង់មតិសម្រាប់ការណែនាំមុខវិជ្ជា និងសាលា

ការស្ទង់មតិណែនាំមុខវិជ្ជា និងសាលា តាមចំណាប់អារម្មណ៍សិស្ស។
ការស្ទង់មតិមិនណែនាំអាហារូបករណ៍ទេ។

ពេលណែនាំ Survey:
- សិស្សមិនច្បាស់ថាគួររៀនមុខវិជ្ជាអ្វី
- សួរ "តើខ្ញុំគួររៀនអ្វី?"
- ចង់បានការណែនាំសាលា

កុំណែនាំ Survey សម្រាប់:
- សំណួរអាហារូបករណ៍ (ប្រាប់ឲ្យពិនិត្យទំព័រសាលា)
- សំណួរជាក់លាក់ (ឆ្លើយដោយផ្ទាល់)
- សំណួរ "X ជាអ្វី?" (ពន្យល់អំពី X តែម្តង)

# សំណួរអាហារូបករណ៍

ពេលសិស្សសួរអំពីអាហារូបករណ៍:
- រាយឈ្មោះអាហារូបករណ៍ពី CONTEXT បើមាន
- ប្រាប់សិស្សឲ្យចូលទៅទំព័រ សាលា ហើយចុចមើលលម្អិតសាលានីមួយៗ
- ទំព័រសាលានីមួយៗបង្ហាញអាហារូបករណ៍ជាក់លាក់
- កុំណែនាំ Survey សម្រាប់រកអាហារូបករណ៍

# ច្បាប់ប្រវែងចម្លើយ - សំខាន់ខ្លាំង

## ឆ្លើយខ្លី (DEFAULT - SHORT)
- ចម្លើយធម្មតា: 50-100 ពាក្យ
- កុំសរសេរវែងពេក
- ប្រើ bullet points ឲ្យងាយអាន

## ឆ្លើយវែងជាងបន្តិច (ONLY WHEN ASKED)
ប្រសិនបើអ្នកប្រើស្នើ "ប្រាប់លម្អិត" ឬ "explain in detail" - ផ្តល់ព័ត៌មានច្រើនបន្តិច។

# ច្បាប់ការប្រកប - សំខាន់ខ្លាំង

ប្រកបពាក្យខ្មែរឲ្យត្រឹមត្រូវជានិច្ច។ ពាក្យសំខាន់ៗ:

ត្រឹមត្រូវ -> ខុស (កុំសរសេរ):
- មុខវិជ្ជា (មិនមែន មុខវិច្ចា ឬ មុខវិច្ជា)
- សាកលវិទ្យាល័យ (មិនមែន សាកលវិទ្យាល័យ)
- បរិញ្ញាបត្រ (មិនមែន បរិន្ញាបត្រ)
- មហាវិទ្យាល័យ (មិនមែន មហាវិទ្យាល័យ)
- វិទ្យាស្ថាន (មិនមែន វិទ្យាស្ថាន)
- គ្រឹះស្ថាន (មិនមែន គ្រឹះស្ថាន)
- ឧត្តមសិក្សា (មិនមែន ឧត្តមសិក្ស)
- បច្ចេកវិទ្យា (មិនមែន បច្ចេកវិច្ច)
- វិទ្យាសាស្ត្រ (មិនមែន វិទ្យាសាស្ត្រ)
- វិស្វកម្ម (មិនមែន វិស្វកម្ម)
- គណិតវិទ្យា (មិនមែន គណិតវិទ្ច)
- ហិរញ្ញវត្ថុ (មិនមែន ហិរញ្ញាវត្ថុ)
- គ្រប់គ្រង (មិនមែន គ្រប់គ្រង)
- កម្មវិធី (មិនមែន កម្មវិច្ច)
- ស្ទង់មតិ (មិនមែន ស្ទង់មតិ)
- អាហារូបករណ៍ (មិនមែន អាហារូបករណ៍)

ប្រសិនបើមិនច្បាស់អំពីការប្រកប សូមប្រើពាក្យសាមញ្ញ ឬប្រើពាក្យអង់គ្លេសជំនួស។

# ការប្រៀបធៀប (COMPARISON FEATURE)

ពេលអ្នកប្រើសួរ "ប្រៀបធៀប X និង Y" សូមផ្តល់:

ឧទាហរណ៍ - ប្រៀបធៀប Business និង IT:
"ការប្រៀបធៀបរហ័ស:

ពាណិជ្ជកម្ម (Business):
- ផ្តោត: ការគ្រប់គ្រង ហិរញ្ញវត្ថុ ទីផ្សារ
- សមរម្យសម្រាប់: អ្នកដឹកនាំ សហគ្រិន
- ការងារ: អ្នកគ្រប់គ្រង អ្នកជំនួញ

ព័ត៌មានវិទ្យា (IT):
- ផ្តោត: ការសរសេរកម្មវិធី ប្រព័ន្ធ
- សមរម្យសម្រាប់: អ្នកដោះស្រាយបញ្ហា អ្នកស្រឡាញ់បច្ចេកវិទ្យា
- ការងារ: អ្នកអភិវឌ្ឍកម្មវិធី អ្នកវិភាគទិន្នន័យ

មិនច្បាស់ថាមួយណាសមនឹងអ្នក? ការស្ទង់មតិរបស់យើងអាចវិភាគចំណាប់អារម្មណ៍របស់អ្នក ហើយណែនាំមុខវិជ្ជាដ៏ល្អបំផុត។ ចុច ស្វែងរក នៅខាងលើ!"

# ដែនកំណត់

កុំឆ្លើយសំណួរក្រៅពីការអប់រំនៅកម្ពុជា ឬការប្រើប្រាស់ EduMatch។

ប្រសិនបើសំណួរក្រៅពីវិសាលភាព សូមឆ្លើយថា:
"សុំទោស ខ្ញុំជាជំនួយការ EduMatch ហើយឆ្លើយបានតែសំណួរទាក់ទងនឹងសាលា ការសិក្សានៅប្រទេសកម្ពុជា និងការប្រើប្រាស់ប្រព័ន្ធ EduMatch ប៉ុណ្ណោះ។"

# ច្បាប់ការធ្វើទ្រង់ទ្រាយ

- កុំប្រើ Markdown (**bold** ឬ *italic*)
- កុំប្រើ # ឬ ## headings
- កុំប្រើ emoji
- ប្រើ bullet points ដោយ -
- ខ្លី និងងាយអាន

# ឧទាហរណ៍ការឆ្លើយល្អ

ឧទាហរណ៍ 1 - "តើ EduMatch ជាអ្វី?":
"EduMatch គឺជាប្រព័ន្ធណែនាំសាលា និងមុខវិជ្ជា ដែលប្រើ AI សម្រាប់សិស្សកម្ពុជា។

យើងមាន:
- 127 សាកលវិទ្យាល័យ
- 813 មុខវិជ្ជា
- 50+ អាហារូបករណ៍

ដើម្បីទទួលបានការណែនាំល្អបំផុត សូមធ្វើការស្ទង់មតិនៅទំព័រ ស្វែងរក!"

ឧទាហរណ៍ 2 - "តើខ្ញុំគួររៀនអ្វី?":
"សំណួរល្អ! វិធីល្អបំផុតដើម្បីដឹង គឺការស្ទង់មតិរបស់យើង។

វាវិភាគចំណាប់អារម្មណ៍ ជំនាញ និងគោលដៅរបស់អ្នក ហើយណែនាំមុខវិជ្ជាសមរម្យ។

ចុច ស្វែងរក នៅខាងលើ - ត្រឹមតែ 5 នាទីប៉ុណ្ណោះ!"

ឧទាហរណ៍ 3 - "តើ Computer Science រៀននៅឯណា?":
"វិទ្យាសាស្ត្រកុំព្យូទ័រ (Computer Science) ផ្តោតលើ:
- ការសរសេរកម្មវិធី
- ការដោះស្រាយបញ្ហា
- ការវិភាគទិន្នន័យ

ការងារ: អ្នកអភិវឌ្ឍ Software, Data Analyst, IT Consultant

មាននៅសាលាដូចជា RUPP, ITC, NUM។"

ឧទាហរណ៍ 4 - "តើមានអាហារូបករណ៍អ្វីខ្លះ?":
"EduMatch មានកម្មវិធីអាហារូបករណ៍ច្រើនជាង 50 ក្នុងប្រទេសកម្ពុជា។

ដើម្បីរកអាហារូបករណ៍:
- ចូលទៅទំព័រ សាលា
- ចុចលើសាលាដែលអ្នកចាប់អារម្មណ៍
- ទំព័រលម្អិតសាលាបង្ហាញអាហារូបករណ៍ដែលមាន

សាលានីមួយៗមានអាហារូបករណ៍ខុសៗគ្នា និងភាគរយផ្សេងៗគ្នា។"

ឧទាហរណ៍ 5 - "តើមានអាហារូបករណ៍ពេញទេ?":
"មាន! សាលាមួយចំនួននៅកម្ពុជាផ្តល់អាហារូបករណ៍ពេញ (100%)។

ដើម្បីរក:
- ចូលទៅទំព័រ សាលា
- រកមើលសាកលវិទ្យាល័យផ្សេងៗ
- ពិនិត្យផ្នែកអាហារូបករណ៍នៃសាលានីមួយៗ"

# សំខាន់ខ្លាំង
- ឆ្លើយខ្លី (50-100 ពាក្យ)
- កុំប្រឌិតលេខ - ប្រើតែ 127, 813, 50+
- ប្រកបពាក្យខ្មែរឲ្យត្រឹមត្រូវជានិច្ច (សូមមើលបញ្ជីការប្រកបខាងលើ)
- ណែនាំ Survey សម្រាប់ការណែនាំមុខវិជ្ជា/សាលា (មិនមែនអាហារូបករណ៍ទេ)
- កុំប្រើ emoji ឬ markdown
"""


SYSTEM_PROMPT_EN = """
You are EduMatch AI — an assistant that helps students find schools, universities, majors, and study opportunities in Cambodia.

# YOUR ROLE

You are a quick chat assistant.

You can help with:
- Information about schools and universities
- Major information (skills, careers, requirements)
- Comparing majors or schools
- Scholarship information (with guidance to browse Schools page)
- How to use EduMatch features

# EXACT STATISTICS - VERY IMPORTANT

ONLY use these numbers when talking about EduMatch:
- Schools: 127 institutions
- Unique majors: 813 majors
- Scholarships: 50+ programs

DO NOT make up other numbers like 2562 or 2,562. The number 813 is for unique major names.

# SURVEY IS FOR MAJOR/SCHOOL RECOMMENDATIONS ONLY

The Survey recommends MAJORS and SCHOOLS based on student interests.
The Survey does NOT recommend scholarships.

When to recommend the Survey:
- User unsure what major to study
- User asks "What should I study?"
- User wants personalized school recommendations
- User asks "Which major fits me?"

DO NOT recommend Survey for:
- Scholarship questions (tell user to browse schools in the Schools page)
- Specific factual questions (just answer directly)
- "What is X?" questions (just explain X)

# SCHOLARSHIP QUESTIONS

When user asks about scholarships:
- List available scholarships from CONTEXT if available
- Tell user to visit the Schools page and check each school's detail page
- Each school's page shows their specific scholarships
- DO NOT suggest the Survey for scholarship matching

# RESPONSE LENGTH RULES - CRITICAL

## Short Answers (DEFAULT)
- Normal responses: 50-100 words
- Do NOT write long walls of text
- Use bullet points for easy scanning

## Longer Answers (ONLY WHEN ASKED)
If the user asks for "details" or "explain in detail" - provide more information.

# SPELLING ACCURACY - IMPORTANT

When writing in Khmer, ALWAYS use correct spelling for these key words:
- "មុខវិជ្ជា" (major) - NOT មុខវិច្ចា
- "សាកលវិទ្យាល័យ" (university)
- "បរិញ្ញាបត្រ" (bachelor)
- "មហាវិទ្យាល័យ" (faculty)
- "បច្ចេកវិទ្យា" (technology)
- "វិទ្យាសាស្ត្រ" (science)
- "កម្មវិធី" (program)
- "ស្ទង់មតិ" (survey)
- "អាហារូបករណ៍" (scholarship)

If unsure about Khmer spelling, use simpler words or English equivalents.

# COMPARISON FEATURE

When a user asks "compare X and Y" provide:

Example - Compare Business vs IT:
"Quick comparison:

Business:
- Focus: Management, finance, marketing
- Best for: Leadership, entrepreneurship
- Careers: Manager, business owner

IT/Computer Science:
- Focus: Programming, systems
- Best for: Problem solving, tech lovers
- Careers: Software developer, Data analyst

Not sure which fits you? Our Survey can analyze your interests and recommend the best major for YOU. Click 'ស្វែងរក' (Survey) at the top!"

# STRICT LIMITS

Do NOT answer questions outside of Cambodia education or EduMatch usage.

If outside scope, respond with:
"I'm sorry, I'm the EduMatch assistant and can only answer questions related to schools, education in Cambodia, and using the EduMatch platform."

# FORMATTING RULES

- Do NOT use Markdown like **bold** or *italic*
- Do NOT use # or ## headings
- Do NOT use emojis
- Use bullet points with -
- Keep responses short and scannable

# GOOD ANSWER EXAMPLES

Example 1 - "What is EduMatch?":
"EduMatch is an AI-powered platform that helps Cambodian students find the right schools and majors.

What we offer:
- 127 universities
- 813 unique majors
- 50+ scholarships
- AI chat for instant questions

For the best personalized recommendations, take our Survey - click ស្វែងរក at the top!"

Example 2 - "What should I study?":
"Great question! The best way to find out is our Survey.

It analyzes your interests, skills, and career goals to recommend majors that fit YOU specifically.

Click ស្វែងរក (Survey) at the top - takes just 5 minutes!

Or, if you have a major in mind, ask me about it directly."

Example 3 - "Where can I study Computer Science?":
"Computer Science focuses on:
- Programming and software development
- Problem solving
- Data analysis

Careers: Software Developer, Data Analyst, IT Consultant

Available at schools like RUPP, ITC, NUM."

Example 4 - "Compare Computer Science and Business":
"Quick comparison:

Computer Science:
- Focus: Programming, systems, AI
- Best for: Tech enthusiasts
- Careers: Developer, Analyst, Engineer

Business:
- Focus: Management, finance, marketing
- Best for: Leaders, entrepreneurs
- Careers: Manager, Consultant, CEO

Need help choosing? Take the Survey to get personalized matches!"

Example 5 - "What scholarships are available?":
"EduMatch tracks 50+ scholarship programs across Cambodia. 

To find scholarships:
- Visit the Schools page
- Click on any school you're interested in
- Their detail page shows available scholarships

Each school offers different scholarships with various coverage percentages. Browse to compare and find ones that fit your situation!"

Example 6 - "Are there full scholarships?":
"Yes, several schools in Cambodia offer full scholarships (100% coverage).

To see which schools offer them:
- Go to the Schools page
- Browse different universities
- Check each school's scholarship section

Coverage varies by school and program, so checking individual schools is the best way to find what fits you."

# VERY IMPORTANT
- Keep answers SHORT (50-100 words)
- DO NOT invent numbers - only use 127, 813, 50+
- Use correct Khmer spelling (see spelling section)
- Promote Survey ONLY for major/school recommendations (NOT scholarships)
- Do NOT use emojis or markdown
"""


# Helpers
def get_major_descriptions(query: str) -> List[dict]:
    """
    Find major info from BOTH:
    1. major_descriptions table (85 official majors with rich info)
    2. majors table (812 variations - basic info: which schools offer it)
    """
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        query_lower = query.lower()
        
        results = []
        seen_names = set()
        
        cur.execute("""
            SELECT name_kh, name_en, prerequisites, degree_requirements,
                   skills_and_knowledge, career_opportunities
            FROM major_descriptions
            WHERE 
                %s ILIKE '%%' || name_kh || '%%'
                OR (LOWER(name_en) IS NOT NULL AND %s ILIKE '%%' || LOWER(name_en) || '%%')
                OR name_kh ILIKE '%%' || %s || '%%'
            LIMIT 5
        """, (query, query_lower, query))
        
        for row in cur.fetchall():
            seen_names.add(row[0])
            results.append({
                'name_kh': row[0],
                'name_en': row[1],
                'prerequisites': row[2],
                'degree_requirements': row[3],
                'skills_and_knowledge': row[4],
                'career_opportunities': row[5],
                'source': 'official',
                'schools_count': None,
                'schools': [],
            })
        
        cur.execute("""
            SELECT 
                m.name_kh,
                COUNT(DISTINCT m.institution_id) as school_count,
                ARRAY_AGG(DISTINCT i.name_kh ORDER BY i.name_kh) FILTER (WHERE i.name_kh IS NOT NULL) as school_names
            FROM majors m
            LEFT JOIN institutions i ON i.id = m.institution_id
            WHERE 
                %s ILIKE '%%' || m.name_kh || '%%'
                OR m.name_kh ILIKE '%%' || %s || '%%'
            GROUP BY m.name_kh
            ORDER BY school_count DESC
            LIMIT 8
        """, (query, query))
        
        for row in cur.fetchall():
            name_kh = row[0]
            
            if name_kh in seen_names:
                for r in results:
                    if r['name_kh'] == name_kh:
                        r['schools_count'] = row[1]
                        r['schools'] = (row[2] or [])[:8]
                        break
                continue
            
            seen_names.add(name_kh)
            results.append({
                'name_kh': name_kh,
                'name_en': None,
                'prerequisites': None,
                'degree_requirements': None,
                'skills_and_knowledge': None,
                'career_opportunities': None,
                'source': 'majors_table',
                'schools_count': row[1],
                'schools': (row[2] or [])[:8],
            })
        
        return results[:10]
        
    except Exception as e:
        print(f"[Chat] get_major_descriptions error: {e}")
        return []
    finally:
        pool.putconn(conn)


def build_context(search_results: dict, query: str = "") -> str:
    """Build context string from RAG retriever + major descriptions."""
    parts = []
    
    major_descs = get_major_descriptions(query) if query else []
    if major_descs:
        parts.append("=== Major Information ===")
        for md in major_descs:
            name_en = f" ({md['name_en']})" if md.get('name_en') else ""
            parts.append(f"\n[Major: {md['name_kh']}{name_en}]")
            
            if md.get('prerequisites'):
                parts.append(f"Prerequisites: {md['prerequisites']}")
            if md.get('degree_requirements'):
                parts.append(f"Degree: {md['degree_requirements']}")
            if md.get('skills_and_knowledge'):
                skills = md['skills_and_knowledge'].replace(' | ', '\n  - ')
                parts.append(f"Skills:\n  - {skills}")
            if md.get('career_opportunities'):
                careers = md['career_opportunities'].replace(' | ', '\n  - ')
                parts.append(f"Careers:\n  - {careers}")
            
            if md.get('schools_count') and md.get('schools'):
                parts.append(f"Available at {md['schools_count']} schools:")
                for school in md['schools'][:8]:
                    parts.append(f"  - {school}")
            
            if md.get('source') == 'majors_table' and not md.get('skills_and_knowledge'):
                parts.append("(Detailed info not in official database, but this major is offered at the schools above)")
        
        parts.append("")
    
    if search_results.get('found_schools'):
        parts.append("=== Found Schools ===")
        for school in search_results['found_schools'][:5]:
            parts.append(f"\n[School ID: {school['id']}]")
            parts.append(f"Name: {school['name_kh']}")
            parts.append(f"Type: {school.get('type', 'N/A')}")
            parts.append(f"Region: {school.get('region', 'N/A')}")
            parts.append(f"Address: {school.get('address', 'N/A')}")
            
            if school.get('phones'):
                parts.append(f"Phones: {', '.join(school['phones'])}")
            
            if school.get('departments'):
                parts.append(f"\nDepartments ({len(school['departments'])}):")
                for dept in school['departments'][:5]:
                    parts.append(f"  - {dept['name_kh']}")
            
            if school.get('majors'):
                parts.append(f"\nMajors ({len(school['majors'])}):")
                for major in school['majors'][:10]:
                    parts.append(f"  - {major['name_kh']}")
            
            if school.get('scholarships'):
                parts.append(f"\nScholarships ({len(school['scholarships'])}):")
                for sch in school['scholarships']:
                    parts.append(f"  - {sch['scholarship_name']} ({sch.get('coverage_percentage', 'N/A')}%)")
        
        parts.append("")
    
    if search_results.get('scholarships'):
        parts.append("=== Scholarships ===")
        for sch in search_results['scholarships'][:5]:
            parts.append(f"- {sch['scholarship_name']} at {sch['institution_name']}")
            parts.append(f"  Coverage: {sch.get('coverage_percentage', 'N/A')}%")
        parts.append("")
    
    return "\n".join(parts) if parts else "No relevant information found."


def generate_title_from_message(message: str, max_length: int = 50) -> str:
    """Generate a conversation title from the first message."""
    title = message.strip().replace('\n', ' ')
    if len(title) > max_length:
        title = title[:max_length].rsplit(' ', 1)[0] + '...'
    return title or 'New Chat'


def create_conversation(user_id: int, title: str, school_id: Optional[int] = None) -> int:
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO chat_conversations (user_id, title, school_id)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (user_id, title, school_id)
        )
        conv_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return conv_id
    finally:
        pool.putconn(conn)


def save_message(conversation_id: int, user_id: int, role: str, content: str):
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO chat_messages (conversation_id, user_id, role, content)
            VALUES (%s, %s, %s, %s)
            """,
            (conversation_id, user_id, role, content)
        )
        conn.commit()
        cur.close()
    finally:
        pool.putconn(conn)


def get_conversation_messages(conversation_id: int, limit: int = 50) -> List[dict]:
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT role, content
            FROM chat_messages
            WHERE conversation_id = %s
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (conversation_id, limit)
        )
        rows = cur.fetchall()
        cur.close()
        return [{'role': r[0], 'content': r[1]} for r in reversed(rows)]
    finally:
        pool.putconn(conn)


def verify_conversation_owner(conversation_id: int, user_id: int) -> bool:
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM chat_conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id)
        )
        result = cur.fetchone() is not None
        cur.close()
        return result
    finally:
        pool.putconn(conn)


# Endpoints

@router.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'chat'}


@router.get('/conversations')
def list_conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT 
                c.id, c.title, c.school_id, c.created_at, c.updated_at,
                (SELECT content FROM chat_messages 
                 WHERE conversation_id = c.id 
                 ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT COUNT(*) FROM chat_messages 
                 WHERE conversation_id = c.id) as message_count
            FROM chat_conversations c
            WHERE c.user_id = %s
            ORDER BY c.updated_at DESC
            LIMIT 100
            """,
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        
        conversations = [
            {
                'id': r[0],
                'title': r[1],
                'school_id': r[2],
                'created_at': r[3].isoformat() if r[3] else None,
                'updated_at': r[4].isoformat() if r[4] else None,
                'last_message': r[5][:100] if r[5] else None,
                'message_count': r[6],
            }
            for r in rows
        ]
        return {'conversations': conversations, 'count': len(conversations)}
    finally:
        pool.putconn(conn)


@router.get('/conversations/{conversation_id}')
def get_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    if not verify_conversation_owner(conversation_id, user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, title, school_id, created_at, updated_at FROM chat_conversations WHERE id = %s",
            (conversation_id,)
        )
        conv = cur.fetchone()
        
        cur.execute(
            """
            SELECT id, role, content, created_at
            FROM chat_messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC
            """,
            (conversation_id,)
        )
        rows = cur.fetchall()
        cur.close()
        
        messages = [
            {
                'id': r[0],
                'role': r[1],
                'content': r[2],
                'created_at': r[3].isoformat() if r[3] else None,
            }
            for r in rows
        ]
        
        return {
            'conversation': {
                'id': conv[0],
                'title': conv[1],
                'school_id': conv[2],
                'created_at': conv[3].isoformat() if conv[3] else None,
                'updated_at': conv[4].isoformat() if conv[4] else None,
            },
            'messages': messages,
        }
    finally:
        pool.putconn(conn)


@router.delete('/conversations/{conversation_id}')
def delete_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    if not verify_conversation_owner(conversation_id, user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM chat_conversations WHERE id = %s",
            (conversation_id,)
        )
        conn.commit()
        cur.close()
        return {'deleted': True, 'conversation_id': conversation_id}
    finally:
        pool.putconn(conn)


@router.patch('/conversations/{conversation_id}')
def rename_conversation(
    conversation_id: int,
    request: RenameRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    if not verify_conversation_owner(conversation_id, user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    new_title = request.title.strip()[:200]
    if not new_title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE chat_conversations SET title = %s WHERE id = %s",
            (new_title, conversation_id)
        )
        conn.commit()
        cur.close()
        return {'id': conversation_id, 'title': new_title}
    finally:
        pool.putconn(conn)


@router.post('/message', response_model=ChatResponse)
def chat_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a message in a conversation. Creates new conversation if needed."""
    import traceback
    
    try:
        user_id = current_user['id'] if isinstance(current_user, dict) else current_user.id
        message = request.message.strip()
        
        if not message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        language = detect_language(message)
        
        conversation_id = request.conversation_id
        
        if conversation_id is None:
            title = generate_title_from_message(message)
            conversation_id = create_conversation(user_id, title, request.school_id)
            print(f"[CHAT] Created new conversation #{conversation_id}: '{title}'")
        else:
            if not verify_conversation_owner(conversation_id, user_id):
                raise HTTPException(status_code=404, detail="Conversation not found")
            print(f"[CHAT] Continuing conversation #{conversation_id}")
        
        save_message(conversation_id, user_id, 'user', message)
        
        try:
            search_results = smart_search(message, focused_school_id=request.school_id)
        except TypeError:
            search_results = smart_search(message)
        
        context = build_context(search_results, query=message)
        
        major_descs = get_major_descriptions(message)
        if major_descs:
            print(f"[CHAT] Found {len(major_descs)} major descriptions: {[m['name_kh'] for m in major_descs]}")
        
        history = get_conversation_messages(conversation_id, limit=10)
        history_text = ""
        if len(history) > 1:
            history_text = "\n\n=== Previous Conversation ===\n"
            for msg in history[:-1]:
                role_label = "User" if msg['role'] == 'user' else "AI"
                history_text += f"{role_label}: {msg['content']}\n"
        
        system_prompt = SYSTEM_PROMPT_KM if language == 'km' else SYSTEM_PROMPT_EN
        full_prompt = f"""{history_text}

=== CONTEXT (Information from EduMatch Database) ===
{context}

=== Current Question ===
{message}

REMINDER: Keep answer SHORT (50-100 words). Use only numbers 127, 813, 50+ for EduMatch stats. Use CORRECT Khmer spelling (មុខវិជ្ជា not មុខវិច្ចា). Promote Survey ONLY for major/school recommendations (NOT scholarships - tell users to browse Schools page for those). Answer using only the CONTEXT above."""
        
        try:
            reply = generate_response(full_prompt, system_instruction=system_prompt)
        except Exception as e:
            error_str = str(e)
            print(f"[CHAT ERROR] Gemini failed: {error_str[:300]}")
            
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                reply = ("សុំទោស! ខ្ញុំបានឆ្លើយច្រើនពេកថ្ងៃនេះ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។"
                         if language == 'km'
                         else "Sorry! I've reached today's free tier limit. Please try again later.")
            elif '503' in error_str or 'UNAVAILABLE' in error_str or 'high demand' in error_str.lower():
                reply = ("សុំទោស! ម៉ាស៊ីនមេ AI កំពុងមមាញឹក។ សូមព្យាយាមម្តងទៀតក្នុងរយៈពេលប៉ុន្មាននាទី។"
                         if language == 'km'
                         else "Sorry! AI servers are busy right now. Please try again in a few minutes.")
            else:
                reply = ("សុំទោស ខ្ញុំជួបបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។" 
                         if language == 'km' 
                         else "Sorry, I'm having technical issues. Please try again.")
        
        save_message(conversation_id, user_id, 'bot', reply)
        
        pool = get_pool()
        conn = pool.getconn()
        try:
            cur = conn.cursor()
            cur.execute("SELECT title FROM chat_conversations WHERE id = %s", (conversation_id,))
            title = cur.fetchone()[0]
            cur.close()
        finally:
            pool.putconn(conn)
        
        return ChatResponse(
            reply=reply, 
            language=language, 
            conversation_id=conversation_id,
            title=title,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n!!!!! CHAT ERROR !!!!!")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post('/message/stream')
async def chat_message_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    STREAMING version (async) - sends reply token-by-token.
    Uses async generator + asyncio.sleep(0) to force immediate flush.
    """
    import json
    import asyncio
    import traceback

    user_id = current_user['id'] if isinstance(current_user, dict) else current_user.id
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    language = detect_language(message)
    conversation_id = request.conversation_id

    if conversation_id is None:
        title = generate_title_from_message(message)
        conversation_id = create_conversation(user_id, title, request.school_id)
        print(f"[CHAT STREAM] Created conversation #{conversation_id}")
    else:
        if not verify_conversation_owner(conversation_id, user_id):
            raise HTTPException(status_code=404, detail="Conversation not found")

    save_message(conversation_id, user_id, 'user', message)

    try:
        search_results = smart_search(message, focused_school_id=request.school_id)
    except TypeError:
        search_results = smart_search(message)

    context = build_context(search_results, query=message)

    history = get_conversation_messages(conversation_id, limit=10)
    history_text = ""
    if len(history) > 1:
        history_text = "\n\n=== Previous Conversation ===\n"
        for msg in history[:-1]:
            role_label = "User" if msg['role'] == 'user' else "AI"
            history_text += f"{role_label}: {msg['content']}\n"

    system_prompt = SYSTEM_PROMPT_KM if language == 'km' else SYSTEM_PROMPT_EN
    full_prompt = f"""{history_text}

=== CONTEXT (Information from EduMatch Database) ===
{context}

=== Current Question ===
{message}

REMINDER: Keep answer SHORT (50-100 words). Use only numbers 127, 813, 50+ for EduMatch stats. Use CORRECT Khmer spelling (មុខវិជ្ជា not មុខវិច្ចា). Promote Survey ONLY for major/school recommendations (NOT scholarships - tell users to browse Schools page for those). Answer using only the CONTEXT above."""

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT title FROM chat_conversations WHERE id = %s", (conversation_id,))
        row = cur.fetchone()
        conv_title = row[0] if row else "New Chat"
        cur.close()
    finally:
        pool.putconn(conn)

    async def event_generator():
        meta = {
            "type": "meta",
            "conversation_id": conversation_id,
            "language": language,
            "title": conv_title,
        }
        yield f"data: {json.dumps(meta)}\n\n"
        await asyncio.sleep(0)

        full_reply = ""
        first_text_sent = False
        error_occurred = False

        try:
            # generate_response_stream is a SYNC generator.
            # We iterate it but yield control after each chunk.
            for chunk in generate_response_stream(full_prompt, system_instruction=system_prompt):
                if chunk == "[ERROR]":
                    error_occurred = True
                    break

                if not first_text_sent:
                    chunk = chunk.lstrip('\n ')
                    if not chunk:
                        continue
                    first_text_sent = True

                # Split chunk into smaller pieces for smoother token feel
                for piece in _split_for_stream(chunk):
                    full_reply += piece
                    payload = {"type": "chunk", "text": piece}
                    yield f"data: {json.dumps(payload)}\n\n"
                    await asyncio.sleep(0.15) # forces flush + nice pace
        except Exception as e:
            print(f"[CHAT STREAM ERROR] {str(e)[:300]}")
            traceback.print_exc()
            error_occurred = True

        if error_occurred or not full_reply.strip():
            full_reply = ("សុំទោស ខ្ញុំជួបបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។"
                          if language == 'km'
                          else "Sorry, I'm having technical issues. Please try again.")
            yield f"data: {json.dumps({'type': 'chunk', 'text': full_reply})}\n\n"
            await asyncio.sleep(0)

        try:
            save_message(conversation_id, user_id, 'bot', full_reply)
        except Exception as e:
            print(f"[CHAT STREAM] Failed to save: {str(e)[:200]}")

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _split_for_stream(text: str):
    """
    Split a chunk into smaller pieces (a few characters each)
    so streaming feels smooth even when Gemini sends big chunks.
    Works for Khmer (no spaces) by splitting every 2-3 characters.
    """
    pieces = []
    step = 3
    for i in range(0, len(text), step):
        pieces.append(text[i:i + step])
    return pieces
@router.get('/stream-test')
async def stream_test():
    """Pure streaming test - no auth, no Gemini. Just counts 1-20 slowly."""
    import asyncio

    async def gen():
        for i in range(1, 21):
            yield f"data: chunk {i}\n\n"
            await asyncio.sleep(0.3)  # 0.3 sec between each
        yield "data: done\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )