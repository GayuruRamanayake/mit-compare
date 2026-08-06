from rapidfuzz import fuzz


def align_clauses(original: list[str], revised: list[str], match_threshold: float = 60.0) -> list[dict]:
    used_revised_idx = set()
    results = []

    for orig_idx, orig_text in enumerate(original):
        best_idx, best_score = None, 0.0
        for i, rev_text in enumerate(revised):
            if i in used_revised_idx:
                continue
            score = fuzz.ratio(orig_text, rev_text)
            if score > best_score:
                best_score, best_idx = score, i

        if best_idx is not None and best_score >= match_threshold:
            used_revised_idx.add(best_idx)
            status = "unchanged" if best_score >= 99.5 else "modified"
            results.append({
                "clause_id": f"c{orig_idx}",
                "status": status,
                "original_text": orig_text,
                "revised_text": revised[best_idx],
                "original_index": orig_idx,
                "revised_index": best_idx,
                "similarity": round(best_score, 1),
            })
        else:
            results.append({
                "clause_id": f"c{orig_idx}",
                "status": "deleted",
                "original_text": orig_text,
                "revised_text": None,
                "original_index": orig_idx,
                "revised_index": None,
                "similarity": round(best_score, 1) if best_idx is not None else 0.0,
            })

    for i, rev_text in enumerate(revised):
        if i not in used_revised_idx:
            results.append({
                "clause_id": f"c_new_{i}",
                "status": "added",
                "original_text": None,
                "revised_text": rev_text,
                "original_index": None,
                "revised_index": i,
                "similarity": 0.0,
            })

    return results