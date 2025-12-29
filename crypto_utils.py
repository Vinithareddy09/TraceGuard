import hashlib
import gc
from cryptography.fernet import Fernet

# ---------- ENCRYPTION ----------
key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_text(text: str) -> bytes:
    return cipher.encrypt(text.encode())

def decrypt_text(enc: bytes) -> str:
    return cipher.decrypt(enc).decode()

# ---------- LIGHTWEIGHT FINGERPRINT (ALWAYS ON) ----------
def cheap_fingerprint(text: str) -> str:
    """
    Fast fingerprint (zero ML, zero memory risk)
    """
    return hashlib.sha256(text.encode()).hexdigest()

# ---------- LAZY SEMANTIC MODEL ----------
_model = None

def load_model():
    """
    Loads semantic model ONLY when required
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def unload_model():
    """
    Frees memory immediately
    """
    global _model
    _model = None
    gc.collect()

def semantic_fingerprint(text: str) -> str:
    """
    Semantic fingerprint (used ONLY after cheap match)
    """
    model = load_model()
    vec = model.encode(text)
    fp = hashlib.sha256(vec.tobytes()).hexdigest()
    unload_model()
    return fp
