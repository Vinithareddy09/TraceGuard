import hashlib
import time

def create_trace(action, document, fingerprint, user=None):
    """
    Creates a verifiable trace entry for every sensitive event
    (upload, access, reuse detection)
    """

    trace = {
        "action": action,
        "document": document,
        "fingerprint": fingerprint,
        "user": user,
        "timestamp": time.time()
    }

    # Cryptographic proof (integrity hash)
    trace["proof"] = hashlib.sha256(
        str(trace).encode()
    ).hexdigest()

    return trace


def verify_trace(trace):
    """
    Verifies whether a trace entry was tampered with.
    If any field changes, proof verification fails.
    """

    temp = trace.copy()
    original_proof = temp.pop("proof")

    recalculated = hashlib.sha256(
        str(temp).encode()
    ).hexdigest()

    return recalculated == original_proof
