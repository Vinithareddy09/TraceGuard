import hashlib
import time

def create_trace(action, document, fingerprint):
    trace = {
        "action": action,
        "document": document,
        "fingerprint": fingerprint,
        "timestamp": time.time()
    }
    trace["proof"] = hashlib.sha256(str(trace).encode()).hexdigest()
    return trace

def verify_trace(trace):
    temp = trace.copy()
    proof = temp.pop("proof")
    return hashlib.sha256(str(temp).encode()).hexdigest() == proof
