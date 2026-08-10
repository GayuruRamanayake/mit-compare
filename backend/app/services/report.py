import io
from docx import Document
from docx.shared import RGBColor

RISK_COLORS = {
    "high": RGBColor(0xC1, 0x27, 0x2D),
    "medium": RGBColor(0xC9, 0x9A, 0x2E),
    "low": RGBColor(0x2E, 0x7D, 0xC9),
    "cosmetic": RGBColor(0x6B, 0x72, 0x80),
}


def generate_report(comparison_id: str, original_filename: str, revised_filename: str, clauses: list[dict]) -> bytes:
    doc = Document()

    doc.add_heading("Contract Comparison Summary", level=0)

    meta = doc.add_paragraph()
    meta.add_run(f"Original: {original_filename}\n").bold = True
    meta.add_run(f"Revised: {revised_filename}\n").bold = True

    changed = [c for c in clauses if c["status"] != "unchanged"]
    summary = doc.add_paragraph()
    summary.add_run(f"{len(changed)} change(s) found out of {len(clauses)} sections reviewed.").italic = True

    doc.add_paragraph()

    for c in changed:
        heading = doc.add_paragraph()
        status_run = heading.add_run(f"[{c['status'].upper()}] ")
        status_run.bold = True

        if c.get("risk_level"):
            risk_run = heading.add_run(f"{c['risk_level'].upper()} RISK")
            risk_run.bold = True
            risk_run.font.color.rgb = RISK_COLORS.get(c["risk_level"], RGBColor(0, 0, 0))

        if c.get("ai_summary"):
            summary_p = doc.add_paragraph()
            summary_p.add_run(c["ai_summary"]).italic = True

        if c["status"] == "modified":
            orig_p = doc.add_paragraph()
            orig_p.add_run("Original: ").bold = True
            orig_run = orig_p.add_run(c["original_text"] or "")
            orig_run.font.strike = True
            orig_run.font.color.rgb = RGBColor(0xB2, 0x3A, 0x2E)

            rev_p = doc.add_paragraph()
            rev_p.add_run("Revised: ").bold = True
            rev_run = rev_p.add_run(c["revised_text"] or "")
            rev_run.font.color.rgb = RGBColor(0x1F, 0x7A, 0x5C)

        elif c["status"] == "added":
            p = doc.add_paragraph()
            p.add_run("Added: ").bold = True
            p.add_run(c["revised_text"] or "")

        elif c["status"] == "deleted":
            p = doc.add_paragraph()
            p.add_run("Removed: ").bold = True
            del_run = p.add_run(c["original_text"] or "")
            del_run.font.strike = True

        doc.add_paragraph()

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()