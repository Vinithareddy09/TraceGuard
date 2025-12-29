import hashlib
import time
import json

def create_trace(action, document, fingerprint, user=None):
    """
    Creates a tamper-proof audit trace.

    This trace proves:
    - WHAT happened (action)
    - WHICH document
    - WHICH user (identity)
    - WHEN it happened
    """

    trace_data = {
        "action": action,
        "document": document,
        "fingerprint": fingerprint,
        "user": user,
        "timestamp": round(time.time(), 3)
    }

    # Canonical serialization (important for verification)
    serialized = json.dumps(trace_data, sort_keys=True)

    # Cryptographic integrity proof
    proof = hashlib.sha256(serialized.encode()).hexdigest()

    trace_data["proof"] = proof
    return trace_data


def verify_trace(trace):
    """
    Verifies if a trace has been tampered with.

    If ANY field changes (user, time, document, etc),
    verification will FAIL.
    """

    proof = trace.get("proof")
    if not proof:
        return False

    temp = trace.copy()
    temp.pop("proof")

    serialized = json.dumps(temp, sort_keys=True)
    recalculated = hashlib.sha256(serialized.encode()).hexdigest()

    return recalculated == proof
