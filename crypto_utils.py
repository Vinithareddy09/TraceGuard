import hashlib
from cryptography.fernet import Fernet
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ---------- ENCRYPTION ----------
key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_text(text: str) -> bytes:
    return cipher.encrypt(text.encode())

def decrypt_text(enc: bytes) -> str:
    return cipher.decrypt(enc).decode()

# ---------- FINGERPRINT ----------
def fingerprint(text: str) -> str:
    """
    Stable identifier for tracing
    """
    return hashlib.sha256(text.encode()).hexdigest()

# ---------- SEMANTIC SIMILARITY (LIGHTWEIGHT) ----------
def semantic_similarity(text1: str, text2: str) -> float:
    """
    TF-IDF based semantic similarity (cloud-safe)
    """
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf = vectorizer.fit_transform([text1, text2])
    similarity = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
    return float(similarity)
