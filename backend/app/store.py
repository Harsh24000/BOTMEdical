from dataclasses import dataclass, field

# In-memory session store. Fine for an MVP / single-process deployment.
# Swap for Redis or a database before running multiple workers or persisting data.


@dataclass
class Session:
    session_id: str
    report_text: str
    analysis: dict
    # Conversation history in Anthropic message format:
    # [{"role": "user"|"assistant", "content": ...}]
    messages: list[dict] = field(default_factory=list)
    # Number of completed chat exchanges. Used for the 1-free-question
    # paywall gate — no payment provider wired in yet, this just enforces
    # the limit server-side so it can't be bypassed by calling the API directly.
    chat_count: int = 0


_sessions: dict[str, Session] = {}


def save_session(session: Session) -> None:
    _sessions[session.session_id] = session


def get_session(session_id: str) -> Session | None:
    return _sessions.get(session_id)
