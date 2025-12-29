from cryptography.fernet import Fernet
from sentence_transformers import SentenceTransformer
import hashlib

model = SentenceTransformer("all-MiniLM-L6-v2")

key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_text(text):
    return cipher.encrypt(text.encode())

def semantic_fingerprint(text):
    vec = model.encode(text)
    return hashlib.sha256(vec.tobytes()).hexdigest()
