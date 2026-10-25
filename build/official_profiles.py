"""Perfiles de simulación derivados de las guías públicas de Anthropic.

Este archivo es la única fuente de verdad para cantidades, pesos y dominios de
la simulación. No contiene preguntas ni claves de respuesta.
"""

BLUEPRINT_VERSION = "2026.07-v1"
SIMULATION_MINUTES = 120
MIN_FORMS_PER_DOMAIN = 3


def largest_remainder(total, domains):
    """Convierte ponderaciones a enteros que suman exactamente ``total``."""
    raw = [(domain["id"], total * domain["weight"] / 100) for domain in domains]
    counts = {domain_id: int(value) for domain_id, value in raw}
    remaining = total - sum(counts.values())
    ranked = sorted(raw, key=lambda entry: (-(entry[1] - int(entry[1])), entry[0]))
    for domain_id, _ in ranked[:remaining]:
        counts[domain_id] += 1
    return counts


OFFICIAL_PROFILES = {
    "CCAO-F": {
        "title": "Claude Certified Associate – Foundations",
        "question_count": 60,
        "domains": [
            {"id": "prompting-task-execution", "name": "Prompting and Task Execution", "weight": 14},
            {"id": "output-evaluation-validation", "name": "Output Evaluation and Validation", "weight": 21},
            {"id": "product-model-selection", "name": "Product and Model Selection", "weight": 12},
            {"id": "workflow-integration-solution-design", "name": "Workflow Integration and Solution Design", "weight": 16},
            {"id": "configuration-knowledge-management", "name": "Configuration and Knowledge Management", "weight": 12},
            {"id": "governance-risk-responsible-use", "name": "Governance, Risk, and Responsible Use", "weight": 15},
            {"id": "troubleshooting-optimization", "name": "Troubleshooting and Optimization", "weight": 10},
        ],
        # Las preguntas existentes deben clasificarse de forma editorial antes
        # de asociarlas a estos dominios oficiales.
        "source_domain_mapping": {},
    },
    "CCDV-F": {
        "title": "Claude Certified Developer – Foundations",
        "question_count": 53,
        "domains": [
            {"id": "agents-workflows", "name": "Agents and Workflows", "weight": 14.7},
            {"id": "applications-integration", "name": "Applications and Integration", "weight": 33.1},
            {"id": "claude-code", "name": "Claude Code", "weight": 3.1},
            {"id": "eval-testing-debugging", "name": "Eval, Testing, and Debugging", "weight": 2.6},
            {"id": "model-selection-optimization", "name": "Model Selection and Optimization", "weight": 16.8},
            {"id": "prompt-context-engineering", "name": "Prompt and Context Engineering", "weight": 11.0},
            {"id": "security-safety", "name": "Security and Safety", "weight": 8.1},
            {"id": "tools-mcp", "name": "Tools and MCPs", "weight": 10.6},
        ],
        "source_domain_mapping": {},
    },
    "CCAR-F": {
        "title": "Claude Certified Architect – Foundations",
        "question_count": 60,
        "domains": [
            {"id": "agentic-architecture-orchestration", "name": "Agentic Architecture and Orchestration", "weight": 27},
            {"id": "tool-design-mcp-integration", "name": "Tool Design and MCP Integration", "weight": 18},
            {"id": "claude-code-configuration-workflows", "name": "Claude Code Configuration and Workflows", "weight": 20},
            {"id": "prompt-engineering-structured-output", "name": "Prompt Engineering and Structured Output", "weight": 20},
            {"id": "context-management-reliability", "name": "Context Management and Reliability", "weight": 15},
        ],
        "source_domain_mapping": {
            "Arquitectura agéntica y orquestación": "agentic-architecture-orchestration",
            "Diseño de herramientas e integración MCP": "tool-design-mcp-integration",
            "Configuración y flujos de Claude Code": "claude-code-configuration-workflows",
            "Prompt engineering y salida estructurada": "prompt-engineering-structured-output",
            "Gestión de contexto y confiabilidad": "context-management-reliability",
        },
    },
    "CCAR-P": {
        "title": "Claude Certified Architect – Professional",
        "question_count": 63,
        "domains": [
            {"id": "solution-design-architecture", "name": "Solution Design and Architecture", "weight": 17},
            {"id": "models-prompting-context", "name": "Claude Models, Prompting and Context Engineering", "weight": 13},
            {"id": "integration", "name": "Integration", "weight": 19},
            {"id": "evaluation-testing-optimization", "name": "Evaluation, Testing and Optimization", "weight": 16},
            {"id": "governance-safety-risk", "name": "Governance, Safety and Risk Management", "weight": 14},
            {"id": "stakeholder-lifecycle-management", "name": "Stakeholder Communication and Lifecycle Management", "weight": 14},
            {"id": "developer-productivity-operations", "name": "Developer Productivity and Operational Enablement", "weight": 7},
        ],
        "source_domain_mapping": {},
    },
}


for _profile in OFFICIAL_PROFILES.values():
    _profile["quota"] = largest_remainder(_profile["question_count"], _profile["domains"])

