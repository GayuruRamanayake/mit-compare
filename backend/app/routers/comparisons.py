from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid

from app.storage import save_comparison, get_comparison

router = APIRouter(prefix="/comparisons", tags=["comparisons"])

ALLOWED_TYPES = {".docx", ".pdf"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


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

    comparison_id = str(uuid.uuid4())
    save_comparison(comparison_id, {
        "original_filename": original.filename,
        "original_bytes": original_bytes,
        "revised_filename": revised.filename,
        "revised_bytes": revised_bytes,
        "status": "uploaded",
    })

    return {"comparison_id": comparison_id, "status": "uploaded"}


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
    }