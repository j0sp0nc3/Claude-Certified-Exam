"""Official learning references for the existing Study taxonomy (not the exam blueprint).

Labels are bilingual. Source material is English; we never imply a translated
source exists. Reviewed URLs and mappings: 2026-10-25.
"""

RESOURCE_VERSION = "2026-10-25-v1"
RESOURCES = {
    "claude101": {"title": "Claude 101", "title_en": "Claude 101", "url": "https://anthropic.skilljar.com/claude-101", "language": "en"},
    "fluency": {"title": "Uso responsable: AI Fluency", "title_en": "Responsible use: AI Fluency", "url": "https://anthropic.skilljar.com/ai-fluency-framework-foundations", "language": "en"},
    "prompting": {"title": "Ingeniería de prompts", "title_en": "Prompt engineering", "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", "language": "en"},
    "tools": {"title": "Uso de herramientas con Claude", "title_en": "Tool use with Claude", "url": "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview", "language": "en"},
    "api": {"title": "Curso: construir con la API de Claude", "title_en": "Course: Building with the Claude API", "url": "https://anthropic.skilljar.com/claude-with-the-anthropic-api", "language": "en"},
    "code": {"title": "Buenas prácticas de Claude Code", "title_en": "Claude Code best practices", "url": "https://code.claude.com/docs/en/best-practices", "language": "en"},
    "evals": {"title": "Criterios de éxito y evaluaciones", "title_en": "Success criteria and evaluations", "url": "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests", "language": "en"},
    "caching": {"title": "Caché de prompts y costos", "title_en": "Prompt caching and cost", "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-caching", "language": "en"},
}

STUDY_DOMAIN_RESOURCES = {
    "CCAO-F": {
        "Fundamentos de IA y Claude": ["claude101"],
        "Prompting efectivo": ["prompting"],
        "Productos y funcionalidades": ["claude101"],
        "Uso responsable y seguridad": ["fluency"],
        "Casos de uso empresariales": ["claude101", "evals"],
    },
    "CCDV-F": {
        "Messages API y fundamentos": ["api"],
        "Tool use y MCP": ["tools"],
        "Prompt engineering para desarrolladores": ["prompting"],
        "Rendimiento y costos": ["caching"],
        "Claude Code y Agent SDK": ["code"],
    },
    "CCAR-F": {
        "Arquitectura agéntica y orquestación": ["tools", "api"],
        "Diseño de herramientas e integración MCP": ["tools"],
        "Configuración y flujos de Claude Code": ["code"],
        "Prompt engineering y salida estructurada": ["prompting"],
        "Gestión de contexto y confiabilidad": ["caching", "evals"],
    },
    "CCAR-P": {
        "Despliegue empresarial y plataformas": ["api"],
        "Seguridad, gobernanza y cumplimiento": ["fluency"],
        "Sistemas multiagente avanzados": ["tools", "code"],
        "Evaluación y calidad a escala": ["evals"],
        "Operación, costos y rendimiento": ["caching", "evals"],
    },
}
