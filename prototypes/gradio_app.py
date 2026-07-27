"""
Gradio web UI for the QU Schedule Planning Agent.

All conversation logic (phases, rules, program data, model selection)
lives in agent_groq.py — this file only handles:
  1. A structured onboarding step: pick your major from a dropdown, then
     check off completed courses from a list generated straight out of
     that program's data/*.json file (instead of typing course codes).
  2. Handing off to an ordinary chat box for the rest of the conversation
     (credit hours, commitments, schedule adjustments, optional image
     upload for a transcript/degree-audit screenshot).

Known limitation: conversation state is a single global session inside
agent_groq (same pattern run_tests.py already relies on). Fine for a
one-person demo; there's no per-browser-tab isolation and no "start over"
button short of restarting the server. Documented, not silently omitted.

Run with: python gradio_app.py
"""

import gradio as gr
import agent_groq as agent

# QU's brand color is a deep maroon. This hex is a visual approximation
# (not pulled from an official brand guideline file), close enough for a
# student-facing prototype.
QU_MAROON = "#7A1330"
QU_MAROON_DARK = "#5C0E24"
QU_ROSE_BG = "#FBF3F4"

CUSTOM_CSS = f"""
:root, .dark {{
    --body-background-fill: {QU_ROSE_BG} !important;
    --background-fill-primary: #ffffff !important;
    --background-fill-secondary: #ffffff !important;
    --block-background-fill: #ffffff !important;
    --border-color-primary: #e8c9d0 !important;
    --body-text-color: #2a2a2a !important;
    --input-background-fill: #ffffff !important;
    --input-background-fill-focus: #ffffff !important;
    --checkbox-background-color: #ffffff !important;
}}
.qu-header {{
    background: {QU_MAROON};
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 1rem;
}}
.qu-header h1, .qu-header h1 * {{
    margin: 0;
    font-size: 1.5rem;
    color: #ffffff !important;
}}
.qu-header p, .qu-header p * {{
    margin: 0.25rem 0 0 0;
    opacity: 0.95;
    font-size: 0.9rem;
    color: #ffffff !important;
}}
.gradio-container {{
    background: {QU_ROSE_BG} !important;
}}
button.primary {{
    background: {QU_MAROON} !important;
    border-color: {QU_MAROON} !important;
}}
button.primary:hover {{
    background: {QU_MAROON_DARK} !important;
}}
/* Chatbot user bubble has its own dark background (unrelated to the
   --body-text-color override above), so it needs an explicit light text
   color or it renders near-invisible dark-on-dark. Also recolor it to
   the brand maroon instead of Gradio's default dark slate. */
.user.message, .user.message * {{
    background: {QU_MAROON} !important;
    color: #ffffff !important;
}}
.bot.message, .bot.message * {{
    color: #2a2a2a !important;
}}
.disclaimer-banner {{
    background: #fff4e5;
    border: 1px solid #f0c987;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    color: #6b4a1a;
    margin-bottom: 1rem;
}}
"""

# Maps each program data file to a friendly dropdown label. Reuses
# agent_groq.PROGRAM_FILES so the dropdown never drifts out of sync with
# the actual data files the agent loads from.
DISPLAY_LABELS = {
    "cs_prerequisites.json": "Computer Science — College of Engineering",
    "ce_prerequisites.json": "Computer Engineering — College of Engineering",
    "ee_prerequisites.json": "Electrical Engineering — College of Engineering",
    "bba_accounting_prerequisites.json": "Business Administration — Accounting",
    "bba_mis_prerequisites.json": "Business Administration — Management Information Systems",
    "bba_economics_prerequisites.json": "Business Administration — Economics",
    "bba_finance_prerequisites.json": "Business Administration — Finance",
    "bba_management_prerequisites.json": "Business Administration — Management",
    "bba_marketing_prerequisites.json": "Business Administration — Marketing",
    "other_programs.json": "Other / not listed",
}
# Text sent to agent.chat() as the "major answer" for each dropdown choice.
# Constructed to match agent_groq.load_program_data()'s keyword matching
# unambiguously. Deliberately does NOT append "College of Business and
# Economics" to the BBA entries — that phrase contains the substring
# "economics", which would make e.g. Marketing's answer text incorrectly
# match the Economics file (checked earlier in PROGRAM_FILES priority order).
MAJOR_ANSWER_TEXT = {
    "cs_prerequisites.json": "Computer Science",
    "ce_prerequisites.json": "Computer Engineering",
    "ee_prerequisites.json": "Electrical Engineering",
    "bba_accounting_prerequisites.json": "Accounting",
    "bba_mis_prerequisites.json": "Management Information Systems",
    "bba_economics_prerequisites.json": "Economics",
    "bba_finance_prerequisites.json": "Finance",
    "bba_management_prerequisites.json": "Management",
    "bba_marketing_prerequisites.json": "Marketing",
    "other_programs.json": "My program is not listed here",
}
PROGRAM_FILENAMES = [f for f, _ in agent.PROGRAM_FILES] + ["other_programs.json"]
LABEL_TO_FILENAME = {DISPLAY_LABELS[f]: f for f in PROGRAM_FILENAMES}


def _grouped_courses(data: dict):
    """Group a loaded program's courses by (year, term), sorted the same
    way agent_groq.format_program_data() sorts them."""
    groups = {}
    for course in data.get("courses", []):
        key = (course.get("year"), course.get("term"))
        groups.setdefault(key, []).append(course)

    def sort_key(key):
        year, term = key
        return (year if year is not None else 999, term or "")

    return sorted(groups.items(), key=lambda kv: sort_key(kv[0]))


with gr.Blocks(title="QU Schedule Planning Assistant") as demo:
    gr.HTML(
        "<div class='qu-header'>"
        "<h1>QU Schedule Planning Assistant</h1>"
        "<p>Plan your next term's course schedule with prerequisite checks built in.</p>"
        "</div>"
        "<div class='disclaimer-banner'>"
        "⚠️ <strong>Beta tool.</strong> This assistant can make mistakes. "
        "Always verify your schedule with your academic advisor before registering."
        "</div>"
    )

    onboarding_group = gr.Group(visible=True)
    chat_group = gr.Group(visible=False)

    with onboarding_group:
        gr.Markdown(f"**{agent.OPENING_MESSAGE}**")
        major_dd = gr.Dropdown(
            choices=list(LABEL_TO_FILENAME.keys()),
            label="College / Major",
            value=None,
        )

        @gr.render(inputs=major_dd)
        def render_picker(major_label):
            if not major_label:
                gr.Markdown("_Select your major above to see your course list._")
                return

            filename = LABEL_TO_FILENAME[major_label]
            data = agent._load_json(filename)

            checkbox_groups = []
            no_courses_cb = None

            if data.get("courses"):
                gr.Markdown("### Which courses have you already completed?\nCheck all that apply — leave everything unchecked if this is your first semester.")
                for (year, term), courses in _grouped_courses(data):
                    if year is not None and term:
                        group_label = f"Year {year} — {term}"
                    elif year is not None:
                        group_label = f"Year {year}"
                    else:
                        group_label = "Other / unspecified term"
                    choices = [f"{c['code']} — {c['name']}" for c in courses]
                    cb = gr.CheckboxGroup(choices=choices, label=group_label)
                    checkbox_groups.append(cb)
                no_courses_cb = gr.Checkbox(label="I haven't completed any courses yet", value=False)
            else:
                gr.Markdown(
                    f"_{data.get('fallback_instructions', 'Please describe your program in the chat below.')}_"
                )

            continue_btn = gr.Button("Continue to chat", variant="primary")

            def on_continue(*checkbox_values):
                if no_courses_cb is not None:
                    *cb_vals, no_courses_val = checkbox_values
                else:
                    cb_vals, no_courses_val = checkbox_values, False

                completed_codes = []
                for vals in cb_vals:
                    for item in (vals or []):
                        completed_codes.append(item.split(" — ")[0])

                if no_courses_val or not completed_codes:
                    courses_text = "I haven't completed any courses yet."
                else:
                    courses_text = "I've completed: " + ", ".join(completed_codes)

                major_reply = agent.chat(MAJOR_ANSWER_TEXT[filename])
                courses_reply = agent.chat(courses_text)

                new_history = [
                    {"role": "assistant", "content": agent.OPENING_MESSAGE},
                    {"role": "user", "content": major_label},
                    {"role": "assistant", "content": major_reply},
                    {"role": "user", "content": courses_text},
                    {"role": "assistant", "content": courses_reply},
                ]
                return new_history, gr.update(visible=False), gr.update(visible=True)

            continue_inputs = checkbox_groups + ([no_courses_cb] if no_courses_cb else [])
            continue_btn.click(
                on_continue,
                inputs=continue_inputs,
                outputs=[chatbot, onboarding_group, chat_group],
            )

    with chat_group:
        reset_btn = gr.Button("🔄 Start Over", size="sm")
        chatbot = gr.Chatbot(value=[], height=500, label="Chat")
        msg_box = gr.MultimodalTextbox(
            placeholder="Type a message, or attach an image (e.g. a transcript screenshot)...",
            show_label=False,
            file_types=["image"],
        )

        def user_submit(message, history):
            text = message.get("text", "") or ""
            files = message.get("files") or []
            reply = agent.chat(text, image_paths=files if files else None)
            display_text = text + (" 📎 [attached image]" if files else "")
            history = history + [
                {"role": "user", "content": display_text},
                {"role": "assistant", "content": reply},
            ]
            return history, gr.MultimodalTextbox(value=None)

        msg_box.submit(user_submit, inputs=[msg_box, chatbot], outputs=[chatbot, msg_box])

        def on_reset():
            agent.reset_session()

        # gr.render's picker (tied to major_dd's change event) does not
        # reliably re-fire when major_dd is reset programmatically from a
        # different component's output — only on direct user interaction.
        # Rather than fight that, force a real page reload after the
        # backend state is cleared, so the picker regenerates from
        # Gradio's true default state instead of staying stale.
        reset_btn.click(on_reset, inputs=[], outputs=[]).then(
            fn=None, js="() => { window.location.reload(); }"
        )

if __name__ == "__main__":
    demo.launch(theme=gr.themes.Soft(primary_hue="pink", secondary_hue="rose"), css=CUSTOM_CSS)
