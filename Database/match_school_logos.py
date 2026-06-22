"""
Match logo files to schools using a pre-built mapping table.
Updates institutions.logo_url and institutions.image_url.

Run: python match_school_logos.py
"""
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

# Path to logos folder
LOGOS_DIR = Path(__file__).resolve().parent.parent / 'frontend' / 'public' / 'school-logos' / 'logos'
SCHOOLS_DIR = Path(__file__).resolve().parent.parent / 'frontend' / 'public' / 'school-logos' / 'schools'

# Pre-built mapping: school_id -> logo basename (without extension)
SCHOOL_MAP = {
    1: 'rupp',
    2: 'rua',
    3: 'rule',
    4: 'num',
    5: 'uhs',
    6: 'rufa',
    7: 'psb',
    8: 'sbu',
    9: 'itc',
    10: 'tsipwt',
    11: 'cmi',
    12: 'hsi',
    13: 'ies',
    14: 'cadt',
    15: 'nia',
    16: 'nis',
    17: 'ibs',
    18: 'norton',
    19: 'beltei',
    20: 'puc',
    21: 'bbu',
    22: 'aeu',
    23: 'cus',
    24: 'hru',
    25: 'mekong',
    26: 'camiu',
    27: 'iu',
    28: 'ppiu',
    29: 'uc',
    30: 'puthisastra',
    31: 'western',
    32: 'khemarak',
    33: 'limkok',
    34: 'pcu',
    35: 'chenla',
    36: 'iic',
    37: 'paragon',
    38: 'aupp',
    39: 'uef',
    40: 'camtect',
    41: 'acleda',
    42: 'ccutech',
    43: 'ppua',
    44: 'dmf',
    45: 'ui',
    46: 'vanda',
    47: 'camed',
    48: 'ksit',
    49: 'aga',
    50: 'cijt',
    51: 'life',
    52: 'ais',
    53: 'tux',
    54: 'raffles',
    55: 'passerelles',
    56: 'sbku',
    57: 'western',
    58: 'nubb',
    59: 'sbu',
    60: 'ume',
    61: 'diu',
    62: 'puc',
    63: 'bbu',
    64: 'cus',
    65: 'khemarak',
    66: 'vanda',
    67: 'ui',
    68: 'nmu',
    69: 'bbu',
    70: 'ume',
    71: 'cus',
    72: 'iu',
    73: 'sru',
    74: 'promtevy',
    75: 'nuck',
    76: 'nuck',
    77: 'aci',
    78: 'khemarasas',
    79: 'uhst',
    80: 'itc',
    81: 'bbu',
    82: 'ukc',
    83: 'ume',
    84: 'kcit',
    85: 'cus',
    86: 'aci',
    87: 'ksit',
    88: 'cadt',
    89: 'angkorkhemara',
    90: 'kit',
    91: 'kcnia',
    92: 'nuck',
    93: 'hsbu',
    94: 'western',
    95: 'ume',
    96: 'cambobiu',
    97: 'usea',
    98: 'angkor',
    99: 'bbu',
    100: 'puc',
    101: 'cus',
    102: 'vanda',
    103: 'ui',
    104: 'life',
    105: 'ume',
    106: 'bbu',
    107: 'mongrithy',
    108: 'sibt',
    109: 'angkorkhemara',
    110: 'cus',
    111: 'imd',
    112: 'ume',
    113: 'angkorkhemara',
    114: 'sbu',
    115: 'bhi',
    116: 'bolyno',
    117: 'bbu',
    118: 'angkorkhemara',
    119: 'spi',
    120: 'ume',
    121: 'bbu',
    122: 'bbu',
    123: 'iu',
    132: 'eamu',
    133: 'rci',
    134: 'cus',
}


def find_file(folder: Path, basename: str) -> str:
    """Find file with any extension matching the basename. Case-insensitive."""
    if not folder.exists():
        return None
    
    # Try common extensions
    for ext in ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']:
        candidate = folder / f"{basename}{ext}"
        if candidate.exists():
            return candidate.name
    
    # Case-insensitive search
    basename_lower = basename.lower()
    for f in folder.iterdir():
        if f.stem.lower() == basename_lower:
            return f.name
    
    return None


def main():
    print("=" * 60)
    print("Matching school logos and images")
    print("=" * 60)
    
    if not LOGOS_DIR.exists():
        print(f"[ERROR] Logos folder not found: {LOGOS_DIR}")
        return
    
    print(f"[OK] Logos dir: {LOGOS_DIR}")
    print(f"[OK] Schools dir: {SCHOOLS_DIR}")
    
    available_logos = [f.name for f in LOGOS_DIR.iterdir() if f.is_file()]
    print(f"\n[+] Found {len(available_logos)} logo files")
    
    available_photos = []
    if SCHOOLS_DIR.exists():
        available_photos = [f.name for f in SCHOOLS_DIR.iterdir() if f.is_file()]
        print(f"[+] Found {len(available_photos)} school photos")
    
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    cur.execute("SELECT id, name_kh FROM institutions ORDER BY id")
    schools = cur.fetchall()
    
    matched_logo = 0
    matched_photo = 0
    skipped = 0
    missing_logos = []
    
    print(f"\n[+] Processing {len(schools)} schools...\n")
    
    for school_id, name_kh in schools:
        logo_basename = SCHOOL_MAP.get(school_id)
        
        if not logo_basename:
            print(f"  [SKIP] ID {school_id}: {name_kh[:40]}")
            skipped += 1
            continue
        
        logo_filename = find_file(LOGOS_DIR, logo_basename)
        photo_filename = find_file(SCHOOLS_DIR, logo_basename)
        
        logo_url = f"/school-logos/logos/{logo_filename}" if logo_filename else None
        image_url = f"/school-logos/schools/{photo_filename}" if photo_filename else None
        
        cur.execute(
            "UPDATE institutions SET logo_url = %s, image_url = %s WHERE id = %s",
            (logo_url, image_url, school_id)
        )
        
        status_logo = "OK  " if logo_filename else "MISS"
        status_photo = "OK  " if photo_filename else "MISS"
        
        print(f"  ID {school_id:3d} | logo:{status_logo} | photo:{status_photo} | {logo_basename:18s} -> {name_kh[:35]}")
        
        if logo_filename:
            matched_logo += 1
        else:
            missing_logos.append((school_id, logo_basename, name_kh))
        
        if photo_filename:
            matched_photo += 1
    
    conn.commit()
    
    print(f"\n{'=' * 60}")
    print(f"SUMMARY:")
    print(f"  Total schools: {len(schools)}")
    print(f"  Matched with logo: {matched_logo}")
    print(f"  Matched with photo: {matched_photo}")
    print(f"  Skipped (no mapping): {skipped}")
    print(f"{'=' * 60}")
    
    if missing_logos:
        print(f"\n[WARN] {len(missing_logos)} logos in mapping but file not found:")
        for sid, basename, name in missing_logos[:30]:
            print(f"  - Looking for: '{basename}' (school {sid}: {name[:40]})")
        print("\nCheck if your file names match exactly (case-insensitive).")
    
    cur.close()
    conn.close()
    print("\n[DONE]")


if __name__ == '__main__':
    main()