from lxml import etree
import zipfile
import io

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}


def _qn(tag):
    return f"{{{W_NS}}}{tag}"


def load_numbering_defs(docx_bytes: bytes):
    """
    Parses word/numbering.xml (if present). Word never stores rendered
    numbers like "3.1" as text — only a numId/level reference per paragraph —
    so this loads the definitions needed to reconstruct them.
    Returns (None, None) if the document uses no automatic numbering at all.
    """
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as z:
        if "word/numbering.xml" not in z.namelist():
            return None, None
        xml_bytes = z.read("word/numbering.xml")

    root = etree.fromstring(xml_bytes)

    num_to_abstract = {}
    for num in root.findall("w:num", NS):
        numId = num.get(_qn("numId"))
        abs_el = num.find("w:abstractNumId", NS)
        if abs_el is not None:
            num_to_abstract[numId] = abs_el.get(_qn("val"))

    abstract_levels = {}
    for absnum in root.findall("w:abstractNum", NS):
        aid = absnum.get(_qn("abstractNumId"))
        levels = {}
        for lvl in absnum.findall("w:lvl", NS):
            ilvl = lvl.get(_qn("ilvl"))
            fmt_el = lvl.find("w:numFmt", NS)
            text_el = lvl.find("w:lvlText", NS)
            start_el = lvl.find("w:start", NS)
            levels[ilvl] = {
                "fmt": fmt_el.get(_qn("val")) if fmt_el is not None else "decimal",
                "text": text_el.get(_qn("val")) if text_el is not None else "%1",
                "start": int(start_el.get(_qn("val"))) if start_el is not None else 1,
            }
        abstract_levels[aid] = levels

    return num_to_abstract, abstract_levels


_LETTERS = "abcdefghijklmnopqrstuvwxyz"
_ROMAN_VALUES = [(1000, 'm'), (900, 'cm'), (500, 'd'), (400, 'cd'), (100, 'c'), (90, 'xc'),
                 (50, 'l'), (40, 'xl'), (10, 'x'), (9, 'ix'), (5, 'v'), (4, 'iv'), (1, 'i')]


def _format_counter(n: int, fmt: str) -> str:
    if fmt == "decimal":
        return str(n)
    if fmt == "lowerLetter":
        return _LETTERS[(n - 1) % 26]
    if fmt == "upperLetter":
        return _LETTERS[(n - 1) % 26].upper()
    if fmt in ("lowerRoman", "upperRoman"):
        result, rem = "", n
        for val, sym in _ROMAN_VALUES:
            while rem >= val:
                result += sym
                rem -= val
        return result.upper() if fmt == "upperRoman" else result
    return str(n)


# Common Wingdings/Symbol private-use codepoints Word uses for bullets,
# mapped to their actual visual meaning. Covers the vast majority of
# real documents; anything not in this table falls back to a level-based
# default sequence instead of showing a broken character.
_BULLET_CHAR_MAP = {
    "\uf0b7": "•",   # Wingdings filled round bullet
    "\uf0a7": "▪",   # Wingdings filled square
    "\uf06e": "○",   # Wingdings open circle
    "\uf0d8": "➢",   # Wingdings arrow bullet
    "\uf0a8": "□",   # Wingdings open square
    "\uf076": "◆",   # Wingdings filled diamond
    "-": "-",         # plain hyphen bullets (some templates use these literally)
    "*": "•",
}

# fallback sequence by nesting depth, used when the actual symbol
# can't be identified from the codepoint above
_BULLET_FALLBACK_BY_LEVEL = ["•", "○", "▪", "‣", "◦"]


def _resolve_bullet_symbol(lvl_text: str, ilvl: int) -> str:
    stripped = (lvl_text or "").strip()
    if stripped in _BULLET_CHAR_MAP:
        return _BULLET_CHAR_MAP[stripped]
    return _BULLET_FALLBACK_BY_LEVEL[ilvl % len(_BULLET_FALLBACK_BY_LEVEL)]


class NumberingTracker:
    """
    Walks paragraphs in document order, tracking a running counter per
    numbering list/level, so each paragraph's number (e.g. "3.1") can be
    reconstructed the same way Word renders it on screen. Bullet-format
    levels are handled separately, since they don't count up — every
    item just repeats a symbol.
    """
    def __init__(self, num_to_abstract, abstract_levels):
        self.num_to_abstract = num_to_abstract or {}
        self.abstract_levels = abstract_levels or {}
        self.counters = {}

    def render(self, numId: str, ilvl: str) -> str | None:
        abstract_id = self.num_to_abstract.get(numId)
        if abstract_id is None:
            return None
        levels = self.abstract_levels.get(abstract_id)
        if not levels:
            return None

        ilvl_int = int(ilvl)
        level_def = levels.get(str(ilvl_int))
        if level_def is None:
            return None

        # Bullets aren't counted — Word just repeats a symbol from a font
        # (Wingdings/Symbol), which shows as a broken character outside
        # Word. Normalize instead of passing that raw codepoint through,
        # and don't touch the numbering counters for this list/level.
        if level_def["fmt"] == "bullet":
            return _resolve_bullet_symbol(level_def["text"], ilvl_int)

        counters = self.counters.setdefault(abstract_id, {})
        start = level_def["start"]
        counters[ilvl_int] = counters.get(ilvl_int, start - 1) + 1

        # a shallower level incrementing resets all deeper levels
        for deeper in list(counters.keys()):
            if deeper > ilvl_int:
                del counters[deeper]

        rendered = level_def["text"]
        for level_num in range(ilvl_int + 1):
            placeholder = f"%{level_num + 1}"
            if placeholder in rendered:
                lvl_def_n = levels.get(str(level_num), level_def)
                count_n = counters.get(level_num, lvl_def_n["start"])
                rendered = rendered.replace(placeholder, _format_counter(count_n, lvl_def_n["fmt"]))
        return rendered