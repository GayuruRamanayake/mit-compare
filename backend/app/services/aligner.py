from rapidfuzz import fuzz
from app.services.embeddings import embed_texts, cosine_similarity_matrix

SEMANTIC_MATCH_THRESHOLD = 0.68  # cosine similarity
MIN_LENGTH_FOR_SEMANTIC_MATCH = 40  # characters — skip short text like headings


def align_clauses(original: list[str], revised: list[str], match_threshold: float = 60.0) -> list[dict]:
    used_revised_idx = set()
    results = []

    # --- Pass 1: fuzzy text matching ---
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
            matched_text = revised[best_idx]
            status = "unchanged" if orig_text.strip() == matched_text.strip() else "modified"
            results.append({
                "clause_id": f"c{orig_idx}",
                "status": status,
                "original_text": orig_text,
                "revised_text": matched_text,
                "original_index": orig_idx,
                "revised_index": best_idx,
                "similarity": round(best_score, 1),
                "match_method": "fuzzy",
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
                "match_method": None,
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
                "match_method": None,
            })

    # --- Pass 2: semantic fallback — try to re-pair leftover deleted/added ---
    # Skip short text (headings, labels) — structurally similar phrases like
    # "Example 4 - Project Title: X" and "Example 5 - Project Title: Y" can
    # score deceptively high on semantic similarity despite being unrelated.
    deleted = [r for r in results if r["status"] == "deleted" and len(r["original_text"]) >= MIN_LENGTH_FOR_SEMANTIC_MATCH]
    added = [r for r in results if r["status"] == "added" and len(r["revised_text"]) >= MIN_LENGTH_FOR_SEMANTIC_MATCH]

    if deleted and added:
        deleted_embeddings = embed_texts([r["original_text"] for r in deleted])
        added_embeddings = embed_texts([r["revised_text"] for r in added])
        sim_matrix = cosine_similarity_matrix(deleted_embeddings, added_embeddings)

        used_added_idx = set()
        for i, del_clause in enumerate(deleted):
            best_j, best_sim = None, 0.0
            for j in range(len(added)):
                if j in used_added_idx:
                    continue
                sim = sim_matrix[i][j].item()
                if sim > best_sim:
                    best_sim, best_j = sim, j

            if best_j is not None and best_sim >= SEMANTIC_MATCH_THRESHOLD:
                used_added_idx.add(best_j)
                add_clause = added[best_j]
                del_clause["status"] = "modified"
                del_clause["revised_text"] = add_clause["revised_text"]
                del_clause["revised_index"] = add_clause["revised_index"]
                del_clause["similarity"] = round(best_sim * 100, 1)
                del_clause["match_method"] = "semantic"
                add_clause["_merged"] = True

        results = [r for r in results if not r.get("_merged")]

    return results