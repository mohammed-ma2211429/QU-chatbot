# T4.6 - QU Schedule-Planning Agent

The project is organized into two parts:

```text
T4.6/
|-- prototypes/   Python model experiments and Gradio prototype
|-- webapp/       Final Next.js chatbot
|-- README.md
`-- .gitignore
```

## Development sequence

The `prototypes/` folder preserves the model progression:

1. `agent_mistral.py` - local Mistral through Ollama
2. `agent_llama.py` - local Llama through Ollama
3. `agent_gemini.py` - Gemini API experiment
4. `agent_groq.py` - Groq with program-specific curriculum grounding
5. `gradio_app.py` - interface for the Groq Python prototype

To run them:

```powershell
cd prototypes
python -m pip install -r requirements.txt

ollama pull mistral
ollama pull llama3.1

python agent_mistral.py
python agent_llama.py
python agent_gemini.py
python agent_groq.py
python gradio_app.py
```

Gemini and Groq read their keys from `prototypes/.env`. The safe variable
template is `prototypes/.env.example`. Terminal transcripts are written to
`prototypes/sessions/`.

## Final web application

```powershell
cd webapp
npm install
npm run dev
```

Live application: https://qu-schedule-planner.vercel.app
