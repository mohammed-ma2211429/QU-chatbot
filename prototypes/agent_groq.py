"""Terminal prototype for the Groq stage of the QU Schedule Planner.

This is the final Python prototype in the development sequence. It keeps the
same conversational interface as the local-model and Gemini experiments, but
adds program-specific JSON grounding and optional academic-image input.

Run:
    python agent_groq.py
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import re
from datetime import datetime
from pathlib import Path

from groq import Groq


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
TEXT_MODEL = "llama-3.3-70b-versatile"
VISION_MODEL = "qwen/qwen3.6-27b"

OPENING_MESSAGE = (
    "Hi! Let's put together a next-term plan that works for you. "
    "First, which college and major are you in?"
)

PROGRAM_FILES: list[tuple[str, list[str]]] = [
    ("cs_prerequisites.json", ["computer science", "cs", "cmps"]),
    ("ce_prerequisites.json", ["computer engineering", "ce", "cmpe"]),
    ("ee_prerequisites.json", ["electrical engineering", "ee", "elec"]),
    (
        "bba_mis_prerequisites.json",
        ["management information systems", "mis", "mist"],
    ),
    ("bba_accounting_prerequisites.json", ["accounting", "acct"]),
    ("bba_finance_prerequisites.json", ["finance", "fina"]),
    ("bba_economics_prerequisites.json", ["economics", "econ"]),
    ("bba_marketing_prerequisites.json", ["marketing", "makt"]),
    ("bba_management_prerequisites.json", ["management", "magt"]),
]
FALLBACK_FILE = "other_programs.json"
BBA_GENERIC_KEYWORDS = ["business administration", "bba", "business"]
BBA_CONCENTRATIONS = [
    "Accounting",
    "Management Information Systems",
    "Economics",
    "Finance",
    "Management",
    "Marketing",
]


def _load_dotenv(path: Path = ROOT / ".env") -> None:
    """Load simple KEY=value entries without adding another dependency."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key:
            os.environ.setdefault(key, value)


_load_dotenv()


def _client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return Groq(api_key=api_key)


def _load_json(filename: str) -> dict:
    with (DATA_DIR / filename).open(encoding="utf-8") as handle:
        return json.load(handle)


def _matches(text: str, words: set[str], keywords: list[str]) -> bool:
    return any(
        keyword in text if " " in keyword else keyword in words
        for keyword in keywords
    )


def load_program_data(major: str) -> dict:
    """Resolve a free-text major to the corresponding curriculum file."""
    major_lower = (major or "").lower()
    words = set(re.findall(r"[a-z]+", major_lower))

    for filename, keywords in PROGRAM_FILES:
        if _matches(major_lower, words, keywords):
            return _load_json(filename)

    if _matches(major_lower, words, BBA_GENERIC_KEYWORDS):
        return {
            "program": "Business Administration (concentration not specified)",
            "college": "College of Business and Economics",
            "courses": [],
            "fallback_instructions": (
                "Ask which Business Administration concentration the student is in "
                f"before planning. Available concentrations: {', '.join(BBA_CONCENTRATIONS)}."
            ),
        }

    return _load_json(FALLBACK_FILE)


def format_program_data(data: dict) -> str:
    """Convert curriculum JSON into a compact grounding block for the model."""
    lines = [
        "QU PROGRAM DATA FOR THIS SESSION",
        f"Program: {data.get('program', 'Unknown')}",
    ]
    if data.get("college"):
        lines.append(f"College: {data['college']}")
    if data.get("total_credit_hours") is not None:
        lines.append(f"Degree total: {data['total_credit_hours']} credit hours")
    if data.get("fallback_instructions"):
        lines.append(f"Instructions: {data['fallback_instructions']}")

    for course in data.get("courses", []):
        code = course.get("code", "Unknown")
        name = course.get("name", "Unnamed course")
        credits = course.get("credits")
        details: list[str] = []

        required = course.get("prerequisites") or []
        alternatives = course.get("prerequisites_one_of") or []
        corequisites = course.get("corequisites") or []

        if required:
            details.append("requires " + " AND ".join(required))
        if alternatives:
            details.append("requires one of " + " OR ".join(alternatives))
        if corequisites:
            details.append("corequisite " + " AND ".join(corequisites))
        if course.get("min_credit_hours"):
            details.append(f"{course['min_credit_hours']} completed credit hours")
        if course.get("approval_required"):
            details.append(f"approval: {course['approval_required']}")

        for field in ("prerequisite_note", "corequisite_note", "note"):
            if course.get(field):
                details.append(str(course[field]))

        suffix = f" [{' | '.join(details)}]" if details else ""
        lines.append(f"- {code} {name} | {credits} credits{suffix}")

    electives = data.get("electives") or []
    if electives:
        lines.append("Electives:")
        for elective in electives:
            lines.append(
                f"- {elective.get('code', 'Elective')} "
                f"{elective.get('name', '')} | {elective.get('credits', '?')} credits | "
                f"{elective.get('prerequisite_note', '')}"
            )

    return "\n".join(lines)


def _load_base_prompt() -> str:
    """Reuse the final web app's canonical prompt to avoid prompt drift."""
    prompt_path = ROOT.parent / "webapp" / "lib" / "prompt" / "basePrompt.ts"
    source = prompt_path.read_text(encoding="utf-8")
    match = re.search(
        r"export const BASE_SYSTEM_PROMPT = `\r?\n?(.*?)`;",
        source,
        flags=re.DOTALL,
    )
    if not match:
        raise RuntimeError(f"Could not read the canonical prompt from {prompt_path}")
    return match.group(1)


BASE_SYSTEM_PROMPT = _load_base_prompt()


def _build_system_prompt(program_data: dict | None = None) -> str:
    current_date = datetime.now().strftime("%B %d, %Y")
    program_block = (
        format_program_data(program_data)
        if program_data
        else "Program data will be loaded after the student identifies their major."
    )
    return (
        BASE_SYSTEM_PROMPT.replace("{CURRENT_DATE}", current_date)
        .replace("{PROGRAM_DATA}", program_block)
        .strip()
    )


history: list[dict] = []
session_log: list[str] = []
_program_data_loaded = False


def reset_session() -> None:
    global history, session_log, _program_data_loaded
    history = [{"role": "system", "content": _build_system_prompt()}]
    session_log = []
    _program_data_loaded = False


reset_session()


def _image_part(path: str) -> dict:
    image_path = Path(path)
    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")
    mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
    payload = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return {
        "type": "image_url",
        "image_url": {"url": f"data:{mime_type};base64,{payload}"},
    }


def save_session() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sessions_dir = ROOT / "sessions"
    sessions_dir.mkdir(exist_ok=True)
    path = sessions_dir / f"session_{timestamp}.txt"
    header = [
        "QU Schedule Planning Agent - Groq prototype",
        f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "=" * 60,
        "",
    ]
    path.write_text("\n".join(header + session_log), encoding="utf-8")
    print(f"\nSession saved to: {path.name}")
    return path


def chat(user_message: str, image_paths: list[str] | None = None) -> str:
    global _program_data_loaded

    clean_message = (user_message or "").strip()
    if not clean_message and not image_paths:
        return "Tell me what you would like to plan for your next term."

    if not _program_data_loaded and clean_message:
        program_data = load_program_data(clean_message)
        history[0] = {"role": "system", "content": _build_system_prompt(program_data)}
        _program_data_loaded = True

    if image_paths:
        content: str | list[dict] = [
            {"type": "text", "text": clean_message or "Please read this academic document."}
        ]
        content.extend(_image_part(path) for path in image_paths)
        model = VISION_MODEL
    else:
        content = clean_message
        model = TEXT_MODEL

    history.append({"role": "user", "content": content})
    session_log.append(f"Student: {clean_message or '[academic image attached]'}")

    response = _client().chat.completions.create(
        model=model,
        messages=history,
        temperature=0.3,
        max_tokens=2048,
    )
    reply = response.choices[0].message.content or ""
    history.append({"role": "assistant", "content": reply})
    session_log.append(f"Agent: {reply}")
    return reply


def main() -> None:
    print("=" * 60)
    print("QU Schedule Planning Agent - Groq prototype")
    print("=" * 60)
    print("Type 'quit' to exit and save the session.\n")
    session_log.append(f"Agent: {OPENING_MESSAGE}")
    print(f"Agent: {OPENING_MESSAGE}\n")

    while True:
        user_input = input("You: ").strip()
        if not user_input:
            continue
        if user_input.lower() == "quit":
            save_session()
            print("Goodbye!")
            break
        try:
            response = chat(user_input)
        except Exception as exc:
            print(f"\nError: {exc}\n")
            continue
        print(f"\nAgent: {response}\n")


if __name__ == "__main__":
    main()
