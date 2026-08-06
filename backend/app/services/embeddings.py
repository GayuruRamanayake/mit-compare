from sentence_transformers import SentenceTransformer, util

# Loaded once at import time and reused for every comparison — small
# (~80MB), CPU-friendly model well suited to semantic similarity tasks
# like this, no API calls or rate limits involved.
_model = SentenceTransformer('all-MiniLM-L6-v2')


def embed_texts(texts: list[str]):
    """Encode a list of strings into embedding vectors, in one batch call."""
    return _model.encode(texts, convert_to_tensor=True)


def cosine_similarity_matrix(embeddings_a, embeddings_b):
    """
    Returns a 2D similarity matrix: matrix[i][j] = cosine similarity
    between embeddings_a[i] and embeddings_b[j], each in range -1..1
    (in practice, close text pairs land roughly in 0.3-1.0).
    """
    return util.cos_sim(embeddings_a, embeddings_b)