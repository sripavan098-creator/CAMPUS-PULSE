"""Parse the ACSE timetable workbook, resolving each grid cell to its full
subject name and the real faculty assigned in the per-section legend block.

The workbook encodes cells as "<ABBR>\\n<ROOM>" and lists, below each section
grid, lines of the form "<Full Subject Name>(<MODE>): <Faculty, Faculty...>".
Abbreviations in cells differ from the legend acronym, so an explicit alias
table bridges them; unmatched cells keep the raw abbreviation.
"""
import json
import re
import sys

import openpyxl

DAYS = {"MON", "TUE", "WED", "THU", "FRI", "SAT"}
SKIP_SHEETS = {"MINORHONORS", "LIBRARY SLOTS"}
NON_CLASS = {"BREAK", "LUNCH", "NULL", "--", ""}

# Grid slot -> (start, end). Columns are 1-based in openpyxl.
SLOTS = [
    ("08:15", "09:05", 2), ("09:05", "09:55", 3),
    ("10:10", "11:00", 5), ("11:00", "11:50", 6), ("11:50", "12:40", 7),
    ("13:40", "14:30", 9), ("14:30", "15:20", 10), ("15:20", "16:05", 11),
]

# Cell abbreviation -> legend acronym.
ALIAS = {
    "OOPS": "OOP", "SFCDS": "SFFCADS", "AI": "AISMFPS", "CV": "CVD",
    "CNS": "CANS", "KRR": "KRAR", "ETHICS": "EICAAI", "MLOP": "MLOD",
    "P&S": "PAS", "FIP": "FOIP", "TSAF": "TSAAFD", "MAD": "MADD",
    "ADS": "ADSD", "GEN AI": "GAAASD", "GEN AI & AS": "GAAASD",
    "GENAI": "GAAASD", "FIS": "FOIS", "AAI": "AATA", "DSA": "DSAA",
    "MFCS": "MFFCS", "MFSC": "MFFCS", "DWV": "DWAV", "DHV": "DHAV",
    "EH": "EHD", "WDS": "WADS", "ID&PS": "IDAPSD", "DMA": "DMAA",
    "IIMP": "ITIIMAEDE", "SDS": "SFDS", "FDS": "FFDS", "FOOP": "FOOOP",
    "FML": "FFML", "PSM": "PASM", "CEA": "CAEA", "DLCO": "DLACO",
    "DLOC": "DLACO", "MPMC": "MAM", "PQC": "PFQC", "AI & IES": "AIESD",
    "AI &IES": "AIESD", "IOT A & P": "IAAP", "ITW&CS": "IWACS",
    "MAI": "MFAIADS", "ML-II": "MLI", "SS": "SSL", "TS&AF": "TSAAFD",
    "ES": "ESE", "EM": "EME", "AT&DWV": "AATADWAVO", "CC & A": "CCA",
}

MODE_ALIASES = {"L": "L", "P": "P", "T": "T", "T&P": "P", "LAB": "P"}


def acronym(name: str) -> str:
    return "".join(w[0].upper() for w in re.findall(r"[A-Za-z]+", name))


DAY_SUFFIX = re.compile(r"\s*\((?:MON|TUE|WED|THU|FRI|SAT)[A-Z]*\)\s*$", re.I)


def clean_faculty(raw):
    """Normalise a legend faculty string: drop empties, day annotations and
    duplicate names, keeping the listed order."""
    if not raw:
        return None
    seen, out = set(), []
    for part in re.split(r"[,;]", raw):
        name = re.sub(r"\s+", " ", part).strip(" .")
        name = DAY_SUFFIX.sub("", name).strip(" .")
        if len(name) < 4 or name.isdigit():
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(name)
    return ", ".join(out) if out else None


def is_section(value) -> bool:
    s = str(value).strip()
    if not s:
        return False
    if any(k in s.upper() for k in ("DEPARTMENT", "ACADEMIC", "COUNCEL", "FACULTY ADVISOR", "CC:")):
        return False
    return bool(
        re.match(
            r"^(I|II|III|IV)\s*[-–]?\s*(AIML|CS|DS|CSBS|IOT|BS|MSC|M\.?TECH)",
            s,
            re.I,
        )
    )


def clean_section(name: str) -> str:
    return re.sub(r"\s*\(\s*\d+\s*\)\s*$", "", str(name).strip()).strip()


def year_of(name: str) -> int:
    n = name.upper()
    if n.startswith("IV "):
        return 4
    if n.startswith("III "):
        return 3
    if n.startswith("II "):
        return 2
    return 1


def parse(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    groups, entries, rooms, faculty_names = [], [], set(), set()

    for ws in wb.worksheets:
        if ws.title in SKIP_SHEETS:
            continue
        rows = list(ws.iter_rows(values_only=True))
        i = 0
        while i < len(rows):
            row = rows[i]
            if not (row and is_section(row[0])):
                i += 1
                continue

            section = clean_section(row[0])
            day_rows = {}
            for j in range(i + 1, min(i + 12, len(rows))):
                r = rows[j]
                if r and r[0]:
                    key = str(r[0]).strip().upper()[:3]
                    if key in DAYS:
                        day_rows[key] = r

            legend_acronym, legend_full, legend_faculty = {}, {}, {}
            k = i + 1
            while k < len(rows):
                r = rows[k]
                if r and is_section(r[0]):
                    break
                if r:
                    for cell in r:
                        if cell is None:
                            continue
                        m = re.match(
                            r"^(.+?)\s*\((L|P|T|T&P|L&P)\)\s*:\s*(.+)$",
                            str(cell).replace("\n", " ").strip(),
                        )
                        if m and m.group(3).strip():
                            full, mode, fac = m.group(1).strip(), m.group(2), m.group(3).strip()
                            key = acronym(full)
                            legend_acronym.setdefault(key, full)
                            legend_full.setdefault(full, full)
                            legend_faculty[(key, MODE_ALIASES.get(mode, mode))] = fac
                            legend_faculty.setdefault((key, None), fac)
                k += 1

            groups.append({
                "id": f"group-acse-{re.sub(r'[^a-z0-9]+', '-', section.lower())}",
                "name": section,
                "year": year_of(section),
                "departmentCode": "ACSE",
                "section": section,
            })

            for day, r in day_rows.items():
                for start, end, col in SLOTS:
                    if col - 1 >= len(r):
                        continue
                    cell = r[col - 1]
                    if cell is None:
                        continue
                    text = str(cell).strip()
                    if not text:
                        continue
                    lines = [x.strip() for x in text.split("\n") if x.strip()]
                    raw_subject = lines[0]
                    room = lines[1] if len(lines) > 1 else None

                    mm = re.match(r"^(.*?)\s*\((P|T|T&P|L|LAB)\)\s*$", raw_subject)
                    abbr = (mm.group(1) if mm else raw_subject).strip()
                    mode = MODE_ALIASES.get(mm.group(2), "L") if mm else "L"

                    if abbr.upper() in NON_CLASS or not abbr:
                        continue

                    key = ALIAS.get(abbr.upper(), abbr.upper())
                    subject = legend_acronym.get(key, abbr)
                    faculty = clean_faculty(
                        legend_faculty.get((key, mode)) or legend_faculty.get((key, None))
                    )

                    if room:
                        room = re.sub(r"^[-\s]+", "", room).strip()
                        room = re.sub(r"room no:?", "", room, flags=re.I).strip()
                    room_clean = room.upper() if room else None
                    if room_clean and room_clean not in ("MOBILE", ""):
                        rooms.add(room_clean)

                    if faculty:
                        for f in re.split(r"[,;]", faculty):
                            f = re.sub(r"\s+", " ", f).strip(" .")
                            if len(f) > 3 and not f.isdigit():
                                faculty_names.add(f)

                    entries.append({
                        "group": section,
                        "day": day,
                        "startTime": start,
                        "endTime": end,
                        "subject": subject,
                        "room": room_clean if room_clean not in (None, "MOBILE") else None,
                        "faculty": faculty,
                        "entryType": "lab" if mode == "P" else "class",
                    })
            i = k

    return groups, sorted(rooms), entries, sorted(faculty_names)


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "acse.xlsx"
    g, r, e, f = parse(src)
    resolved = sum(1 for x in e if x["faculty"])
    print(f"groups={len(g)} rooms={len(r)} entries={len(e)}")
    print(f"faculty resolved on {resolved}/{len(e)} entries ({100*resolved/max(len(e),1):.0f}%)")
    print(f"distinct faculty names={len(f)}")
    with open("server/data/parsed_acse.json", "w") as fh:
        json.dump({"groups": g, "rooms": r, "entries": e}, fh, indent=2)
    print("wrote server/data/parsed_acse.json")
