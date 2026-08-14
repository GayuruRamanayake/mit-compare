from lxml import etree
import zipfile
import io

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}


def _qn(tag):
    return f"{{{W_NS}}}{tag}"


def load_comments(docx_bytes: bytes) -> dict:
    """
    Reads word/comments.xml (if present). Returns {comment_id: {author, date, text}}.
    Returns {} if the document has no comments at all.
    """
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as z:
        if "word/comments.xml" not in z.namelist():
            return {}
        xml_bytes = z.read("word/comments.xml")

    root = etree.fromstring(xml_bytes)
    comments = {}
    for c in root.findall("w:comment", NS):
        cid = c.get(_qn("id"))
        author = c.get(_qn("author"))
        date = c.get(_qn("date"))
        texts = c.findall(".//w:t", NS)
        text = "".join(t.text or "" for t in texts).strip()
        comments[cid] = {"author": author, "date": date, "text": text}

    return comments


def get_comment_ids_for_paragraph(p_element) -> list[str]:
    """Returns the comment IDs anchored anywhere inside this paragraph."""
    ids = set()
    for ref in p_element.findall(".//w:commentReference", NS):
        ids.add(ref.get(_qn("id")))
    for start in p_element.findall(".//w:commentRangeStart", NS):
        ids.add(start.get(_qn("id")))
    return sorted(ids)