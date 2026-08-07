import io
from docx import Document
import pdfplumber


# def parse_docx(file_bytes: bytes) -> list[str]:
#     doc = Document(io.BytesIO(file_bytes))
#     segments = []

#     # walk the document body in order so tables stay near their
#     # surrounding paragraphs instead of being appended at the end
#     for element in doc.element.body:
#         if element.tag.endswith('}p'):  # paragraph
#             para = next((p for p in doc.paragraphs if p._element is element), None)
#             if para and para.text.strip():
#                 segments.append(para.text.strip())
#         elif element.tag.endswith('}tbl'):  # table
#             table = next((t for t in doc.tables if t._element is element), None)
#             if table:
#                 segments.append(_table_to_text(table.rows))

#     return segments


def parse_docx(file_bytes: bytes) -> list[str]:
    doc = Document(io.BytesIO(file_bytes))
    segments = []

    # build O(1) lookup maps once, instead of scanning doc.paragraphs / doc.tables
    # for every single element (which was O(n) per element = O(n²) overall)
    para_by_element = {p._element: p for p in doc.paragraphs}
    table_by_element = {t._element: t for t in doc.tables}

    for element in doc.element.body:
        if element.tag.endswith('}p'):
            para = para_by_element.get(element)
            if para and para.text.strip():
                segments.append(para.text.strip())
        elif element.tag.endswith('}tbl'):
            table = table_by_element.get(element)
            if table:
                segments.append(_table_to_text(table.rows))

    return segments


def _table_to_text(rows) -> str:
    """Flatten a table's rows into a readable text block."""
    rows_text = []
    for row in rows:
        # docx rows have .cells; pdfplumber rows are already plain lists of strings
        cells = [c.text.strip() for c in row.cells] if hasattr(row, "cells") else [c or "" for c in row]
        rows_text.append(" | ".join(cells))
    return "[TABLE]\n" + "\n".join(rows_text)


def _in_any_bbox(x0: float, top: float, bboxes: list) -> bool:
    for bbox in bboxes:
        if bbox[0] - 1 <= x0 <= bbox[2] + 1 and bbox[1] - 1 <= top <= bbox[3] + 1:
            return True
    return False


def parse_pdf(file_bytes: bytes) -> list[str]:
    """
    Extract paragraph-level text and tables from a PDF.

    PDFs have no real paragraph markers, so breaks are inferred from the
    vertical gap between lines, relative to each line's own text height
    (so it scales with font size instead of using a fixed point value,
    which doesn't generalize across PDFs from different generators).
    """
    GAP_RATIO = 0.5  # gap counts as a paragraph break if > 50% of the line's height

    segments = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            table_bboxes = []
            for table in page.find_tables():
                extracted = table.extract()
                if extracted:
                    segments.append(_table_to_text(extracted))
                    table_bboxes.append(table.bbox)

            lines = page.extract_text_lines()
            current_para = None
            prev_bottom = None

            for line in lines:
                if _in_any_bbox(line['x0'], line['top'], table_bboxes):
                    continue

                text = line['text'].strip()
                if not text:
                    continue

                line_height = line['bottom'] - line['top']
                gap = (line['top'] - prev_bottom) if prev_bottom is not None else None
                is_break = gap is None or gap > (line_height * GAP_RATIO)

                if current_para is not None and not is_break:
                    current_para += " " + text
                else:
                    if current_para is not None:
                        segments.append(current_para)
                    current_para = text

                prev_bottom = line['bottom']

            if current_para is not None:
                segments.append(current_para)

    return segments


def parse_document(file_bytes: bytes, filename: str) -> list[str]:
    """
    Dispatches to the correct parser based on file extension.
    Raises ValueError for unsupported types.
    """
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "docx":
        return parse_docx(file_bytes)
    elif ext == "pdf":
        return parse_pdf(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")