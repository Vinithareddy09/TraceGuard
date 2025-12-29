import hashlib
import time
import json

def create_trace(action, document, fingerprint, user=None):
    """
    Creates a cryptographically verifiable audit trace.

    This proves:
    - WHAT happened        (action)
    - WHICH document       (document)
    - WHICH user           (user identity)
    - WHEN it happened     (timestamp)
    """

    trace_data = {
        "action": action,
        "document": document,
        "fingerprint": fingerprint,
        "user": user,
        "timestamp": round(time.time(), 3)
    }

    # Canonical serialization (order + format fixed)
    serialized = json.dumps(
        trace_data,
        sort_keys=True,
        separators=(",", ":")
    )

    # Cryptographic integrity proof
    proof = hashlib.sha256(serialized.encode()).hexdigest()

    trace_data["proof"] = proof
    return trace_data


def verify_trace(trace):
    """
    Verifies if a trace has been tampered with.

    If ANY field is modified (user, time, doc, etc),
    verification will FAIL.
    """

    proof = trace.get("proof")
    if not proof:
        return False

    temp = trace.copy()
    temp.pop("proof")

    serialized = json.dumps(
        temp,
        sort_keys=True,
        separators=(",", ":")
    )

    recalculated = hashlib.sha256(serialized.encode()).hexdigest()

    return recalculated == proof
