import hashlib
from cryptography.fernet import Fernet
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------- ENCRYPTION ----------
# One symmetric key per service instance (acceptable for demo / academic use)
key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_text(text: str) -> bytes:
    """
    Encrypts plaintext before storage
    """
    return cipher.encrypt(text.encode())

def decrypt_text(enc: bytes) -> str:
    """
    Decrypts encrypted document content
    (Used internally only, never exposed to UI)
    """
    return cipher.decrypt(enc).decode()

# ---------- FINGERPRINT ----------
def fingerprint(text: str) -> str:
    """
    Generates a non-reversible hash for tracing & integrity verification
    NOT used for decryption
    """
    return hashlib.sha256(text.encode()).hexdigest()

# ---------- SEMANTIC SIMILARITY ----------
def semantic_similarity(text1: str, text2: str) -> float:
    """
    Lightweight semantic similarity using TF-IDF with n-grams
    Detects paraphrased reuse (meaning-based, not exact match)
    """

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3)
    )

    tfidf_matrix = vectorizer.fit_transform([text1, text2])
    similarity = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:2]
    )[0][0]

    return float(similarity)
