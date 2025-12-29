import hashlib
import os
from cryptography.fernet import Fernet
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------- ENCRYPTION (STABLE KEY) ----------
KEY_FILE = "secret.key"

def load_key():
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as f:
            f.write(key)
        return key
    return open(KEY_FILE, "rb").read()

cipher = Fernet(load_key())

def encrypt_text(text: str) -> bytes:
    return cipher.encrypt(text.encode())

def decrypt_text(enc: bytes) -> str:
    return cipher.decrypt(enc).decode()

# ---------- FINGERPRINT ----------
def fingerprint(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

# ---------- SEMANTIC SIMILARITY ----------
def semantic_similarity(text1: str, text2: str) -> float:
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3)
    )
    tfidf = vectorizer.fit_transform([text1, text2])
    return float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
