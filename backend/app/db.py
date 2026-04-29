"""
db.py — Supabase client singleton.
Credentials are read from environment variables (set in backend/.env).
"""

import os
from supabase import create_client, Client

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise EnvironmentError(
                "SUPABASE_URL and SUPABASE_KEY must be set in backend/.env"
            )
        _client = create_client(url, key)
    return _client
