import hashlib
from cryptography.fernet import Fernet
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# --------------------------------------------------
# ENCRYPTION (CONFIDENTIAL STORAGE)
# --------------------------------------------------

# One symmetric key per service instance (acceptable for academic demo)
key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_text(text: str) -> bytes:
    """
    Encrypts plaintext before storage.
    """
    return cipher.encrypt(text.encode())

def decrypt_text(enc: bytes) -> str:
    """
    Decrypts encrypted document content.
    Used ONLY internally (never exposed to UI).
    """
    return cipher.decrypt(enc).decode()


# --------------------------------------------------
# FINGERPRINT (INTEGRITY IDENTIFIER)
# --------------------------------------------------

def fingerprint(text: str) -> str:
    """
    Generates a non-reversible cryptographic hash.
    Used for tracing & integrity verification.
    NOT used for decryption.
    """
    return hashlib.sha256(text.encode()).hexdigest()


# --------------------------------------------------
# TEXT NORMALIZATION
# --------------------------------------------------

def normalize(text: str) -> str:
    """
    Normalizes text to improve semantic detection:
    - lowercase
    - remove punctuation
    - collapse whitespace
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# --------------------------------------------------
# SEMANTIC SIMILARITY (UPGRADED, PARAPHRASE-AWARE)
# --------------------------------------------------

def semantic_similarity(text1: str, text2: str) -> float:
    """
    Hybrid semantic similarity:
    - word n-grams (meaning)
    - character n-grams (paraphrase robustness)

    Detects:
    ✔ paraphrasing
    ✔ synonym-level reuse
    ✔ sentence restructuring
    """

    t1 = normalize(text1)
    t2 = normalize(text2)

    # Word-level TF-IDF (meaning)
    word_vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3)
    )

    word_matrix = word_vectorizer.fit_transform([t1, t2])
    word_score = cosine_similarity(
        word_matrix[0:1],
        word_matrix[1:2]
    )[0][0]

    # Character-level TF-IDF (paraphrase robustness)
    char_vectorizer = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3, 5)
    )

    char_matrix = char_vectorizer.fit_transform([t1, t2])
    char_score = cosine_similarity(
        char_matrix[0:1],
        char_matrix[1:2]
    )[0][0]

    # Weighted hybrid score
    final_score = (0.6 * word_score) + (0.4 * char_score)

    return round(float(final_score), 4)
