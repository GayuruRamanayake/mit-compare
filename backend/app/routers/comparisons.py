# import uuid

# from fastapi import APIRouter, UploadFile, File, HTTPException

# from app.storage import save_comparison, get_comparison
# from app.services.parser import parse_document

# from app.services.aligner import align_clauses


# from app.services.gemini_analysis import analyze_clause_change, analyze_new_or_removed_clause



# router = APIRouter(prefix="/comparisons", tags=["comparisons"])

# ALLOWED_TYPES = {".docx", ".pdf"}
# MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


# def _validate_file(file: UploadFile) -> None:
#     ext = "." + file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
#     if ext not in ALLOWED_TYPES:
#         raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


# @router.post("/upload")
# async def upload_documents(
#     original: UploadFile = File(...),
#     revised: UploadFile = File(...),
# ):
#     _validate_file(original)
#     _validate_file(revised)

#     original_bytes = await original.read()
#     revised_bytes = await revised.read()

#     if len(original_bytes) > MAX_FILE_SIZE or len(revised_bytes) > MAX_FILE_SIZE:
#         raise HTTPException(status_code=400, detail="File exceeds 20MB limit")

#     try:
#         original_paragraphs = parse_document(original_bytes, original.filename)
#         revised_paragraphs = parse_document(revised_bytes, revised.filename)
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))

#     comparison_id = str(uuid.uuid4())
#     save_comparison(comparison_id, {
#         "original_filename": original.filename,
#         "original_bytes": original_bytes,
#         "original_paragraphs": original_paragraphs,
#         "revised_filename": revised.filename,
#         "revised_bytes": revised_bytes,
#         "revised_paragraphs": revised_paragraphs,
#         "status": "parsed",
#     })

#     return {
#         "comparison_id": comparison_id,
#         "status": "parsed",
#         "original_paragraph_count": len(original_paragraphs),
#         "revised_paragraph_count": len(revised_paragraphs),
#         "original_paragraphs": original_paragraphs,  # temporary — for debugging
#         "revised_paragraphs": revised_paragraphs,     # temporary — for debugging
#     }


# @router.get("/{comparison_id}")
# async def get_comparison_status(comparison_id: str):
#     record = get_comparison(comparison_id)
#     if record is None:
#         raise HTTPException(status_code=404, detail="Comparison not found")

#     return {
#         "comparison_id": comparison_id,
#         "status": record["status"],
#         "original_filename": record["original_filename"],
#         "revised_filename": record["revised_filename"],
#         "original_paragraph_count": len(record["original_paragraphs"]),
#         "revised_paragraph_count": len(record["revised_paragraphs"]),
#     }



# @router.get("/{comparison_id}/clauses")
# async def get_comparison_clauses(comparison_id: str):
#     record = get_comparison(comparison_id)
#     if record is None:
#         raise HTTPException(status_code=404, detail="Comparison not found")

#     results = align_clauses(record["original_paragraphs"], record["revised_paragraphs"])

#     return {"comparison_id": comparison_id, "clauses": results}





# @router.get("/{comparison_id}/analysis")
# async def get_comparison_analysis(comparison_id: str):
#     record = get_comparison(comparison_id)
#     if record is None:
#         raise HTTPException(status_code=404, detail="Comparison not found")

#     aligned = align_clauses(record["original_paragraphs"], record["revised_paragraphs"])

#     for clause in aligned:
#         if clause["status"] == "modified":
#             analysis = analyze_clause_change(
#                 clause["original_text"], clause["revised_text"], clause["similarity"]
#             )
#         elif clause["status"] == "added":
#             analysis = analyze_new_or_removed_clause(clause["revised_text"], "added")
#         elif clause["status"] == "deleted":
#             analysis = analyze_new_or_removed_clause(clause["original_text"], "deleted")
#         else:
#             clause["ai_summary"] = None
#             clause["risk_level"] = None
#             continue

#         clause["ai_summary"] = analysis["summary"]
#         clause["risk_level"] = analysis["risk_level"]

#     return {"comparison_id": comparison_id, "clauses": aligned}







from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid
import asyncio

from app.storage import save_comparison, get_comparison
from app.services.parser import parse_document
from app.services.aligner import align_clauses
from app.services.gemini_analysis import chunk_list, analyze_batch_throttled

router = APIRouter(prefix="/comparisons", tags=["comparisons"])

ALLOWED_TYPES = {".docx", ".pdf"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
BATCH_SIZE = 10


def _validate_file(file: UploadFile) -> None:
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


@router.post("/upload")
async def upload_documents(
    original: UploadFile = File(...),
    revised: UploadFile = File(...),
):
    _validate_file(original)
    _validate_file(revised)

    original_bytes = await original.read()
    revised_bytes = await revised.read()

    if len(original_bytes) > MAX_FILE_SIZE or len(revised_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit")

    try:
        original_paragraphs = parse_document(original_bytes, original.filename)
        revised_paragraphs = parse_document(revised_bytes, revised.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    comparison_id = str(uuid.uuid4())
    save_comparison(comparison_id, {
        "original_filename": original.filename,
        "original_bytes": original_bytes,
        "original_paragraphs": original_paragraphs,
        "revised_filename": revised.filename,
        "revised_bytes": revised_bytes,
        "revised_paragraphs": revised_paragraphs,
        "status": "parsed",
    })

    return {
        "comparison_id": comparison_id,
        "status": "parsed",
        "original_paragraph_count": len(original_paragraphs),
        "revised_paragraph_count": len(revised_paragraphs),
    }


@router.get("/{comparison_id}")
async def get_comparison_status(comparison_id: str):
    record = get_comparison(comparison_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Comparison not found")

    return {
        "comparison_id": comparison_id,
        "status": record["status"],
        "original_filename": record["original_filename"],
        "revised_filename": record["revised_filename"],
        "original_paragraph_count": len(record["original_paragraphs"]),
        "revised_paragraph_count": len(record["revised_paragraphs"]),
    }


@router.get("/{comparison_id}/clauses")
async def get_comparison_clauses(comparison_id: str):
    record = get_comparison(comparison_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Comparison not found")

    results = align_clauses(record["original_paragraphs"], record["revised_paragraphs"])
    return {"comparison_id": comparison_id, "clauses": results}


@router.get("/{comparison_id}/analysis")
async def get_comparison_analysis(comparison_id: str):
    record = get_comparison(comparison_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Comparison not found")

    aligned = align_clauses(record["original_paragraphs"], record["revised_paragraphs"])
    changed = [c for c in aligned if c["status"] != "unchanged"]

    if not changed:
        return {"comparison_id": comparison_id, "clauses": aligned}

    batches = list(chunk_list(changed, BATCH_SIZE))

    batch_inputs = []
    for batch in batches:
        batch_input = []
        for c in batch:
            if c["status"] == "modified":
                batch_input.append({
                    "type": "modified",
                    "original": c["original_text"],
                    "revised": c["revised_text"],
                    "similarity": c["similarity"],
                })
            else:
                batch_input.append({
                    "type": c["status"],
                    "text": c["original_text"] or c["revised_text"],
                })
        batch_inputs.append(batch_input)

    # each batch call is capped by the semaphore inside analyze_batch_throttled,
    # so this never exceeds the concurrency limit even with many batches
    all_results = await asyncio.gather(*(analyze_batch_throttled(b) for b in batch_inputs))

    for batch, results in zip(batches, all_results):
        for clause, result in zip(batch, results):
            clause["ai_summary"] = result["summary"]
            clause["risk_level"] = result["risk_level"]

    for clause in aligned:
        if clause["status"] == "unchanged":
            clause["ai_summary"] = None
            clause["risk_level"] = None

    return {"comparison_id": comparison_id, "clauses": aligned}