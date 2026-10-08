(() => {
  "use strict";
  const translations = {
    "Simulacros de Certificación Claude": "Claude Certification Practice Exams",
    "Simulacros de práctica en español e inglés con duración de": "Practice exams in Spanish and English with a time limit of",
    "minutos. Cada examen usa la cantidad de preguntas de su formato de referencia y sortea desde un banco de 100. El umbral interno de práctica es 72 %; no equivale a la puntuación escalada oficial. El avance y los resultados se guardan en el panel privado.": "minutes. Each exam follows its reference format and selects questions from a bank of 100. The practice threshold is 72%; it is not equivalent to the official scaled score. Progress and results are saved to the private dashboard.",
    "Iniciar simulacro →": "Start practice exam →",
    "Material de práctica para entrenamiento interno. No es contenido oficial de Anthropic.": "Practice material for internal training. This is not official Anthropic content.",
    "Simulacro de práctica": "Practice exam",
    "Antes de comenzar": "Before you begin",
    " preguntas de dos tipos: ": " questions in two formats: ",
    "alternativa única": "single choice",
    "selección múltiple": "multiple choice",
    " (se indica cuántas opciones elegir; en este simulacro debes acertar el conjunto completo).": " (the required number of choices is shown; you must select the complete correct set).",
    "Tiempo límite: ": "Time limit: ",
    " minutos. Al terminar el tiempo el examen se envía automáticamente.": " minutes. The exam is submitted automatically when time runs out.",
    "Umbral interno de práctica: ": "Internal practice threshold: ",
    " %. No es una conversión del puntaje escalado oficial.": "%. This is not a conversion of the official scaled score.",
    "Cada intento sortea preguntas de un banco de ": "Each attempt randomly selects questions from a bank of ",
    "; el orden de preguntas y respuestas también cambia.": "; question and answer order is also randomized.",
    "El examen oficial se rinde en inglés y es a libro cerrado. Este simulacro está en español y no está supervisado.": "The official exam is taken in English and is closed-book. This practice exam is not proctored.",
    "El panel privado permite observar en línea tu avance, pregunta actual, marcas y tiempo. Las respuestas no se muestran durante el examen.": "The private dashboard shows your live progress, current question, flagged questions, and time. Your answers are not shown during the exam.",
    "Áreas de este banco de práctica: ": "Practice bank domains: ",
    "Nombre completo": "Full name",
    "Correo corporativo": "Work email",
    "Comenzar examen": "Start exam",
    "Validando acceso…": "Checking access…",
    "Ingresa tu nombre completo.": "Enter your full name.",
    "Ingresa un correo válido.": "Enter a valid email address.",
    "No se pudo validar el acceso. Intenta de nuevo.": "Could not verify access. Please try again.",
    "Navegación de preguntas": "Question navigation",
    "Anterior": "Previous",
    "Marcar para revisar": "Flag for review",
    "Quitar marca": "Unflag",
    "Siguiente": "Next",
    "Última pregunta": "Last question",
    "Enviar examen": "Submit exam",
    "El avance se guardará al comenzar.": "Your progress will be saved when you start.",
    "Resultado": "Result",
    "Resultado por área del banco": "Results by practice domain",
    "Dominio": "Domain",
    "Aciertos": "Correct",
    "Revisión de respuestas": "Answer review",
    "Todas": "All",
    "Solo incorrectas": "Incorrect only",
    "Reintentar guardado": "Retry saving",
    "UMBRAL DE PRÁCTICA ALCANZADO": "PRACTICE THRESHOLD REACHED",
    "BAJO EL UMBRAL DE PRÁCTICA": "BELOW PRACTICE THRESHOLD",
    "tu respuesta": "your answer",
    "Sin responder.": "Unanswered.",
    "Explicación:": "Explanation:",
    "Observación en vivo": "Live monitoring",
    "Avance y tiempos de los simulacros. Actualización automática cada 5 segundos; las respuestas elegidas no se muestran.": "Practice exam progress and timing. Refreshes every 5 seconds; selected answers are not shown.",
    "Clave de administración": "Admin key",
    "Conectar": "Connect",
    "Admisión al examen": "Exam access",
    "Dominio (admite cualquier usuario de ese dominio y sus subdominios) o correo (admite solo esa dirección). El Worker genera y evalúa el patrón correspondiente al validar el acceso.": "Add one rule per row: a domain (allows any user at that domain and its subdomains) or an email (allows only that address). The Worker checks the matching rule when access is validated.",
    "Dominio": "Domain",
    "Correo exacto": "Exact email",
    "Agregar": "Add",
    "Tipo de regla": "Rule type",
    "Dominio o correo": "Domain or email",
    "Guardar reglas": "Save rules",
    "Intentos": "Attempts",
    "En línea": "Online",
    "En curso sin señal": "In progress · offline",
    "Finalizados": "Completed",
    "Buscar participante o correo": "Search participant or email",
    "Todos los exámenes": "All exams",
    "Todos los estados": "All statuses",
    "Descargar CSV": "Download CSV",
    "Participante": "Participant",
    "Examen": "Exam",
    "Estado": "Status",
    "Pregunta actual": "Current question",
    "Respondidas": "Answered",
    "Área más débil / detalle": "Weakest domain / details",
    "Marcadas": "Flagged",
    "Transcurrido": "Elapsed",
    "Restante": "Remaining",
    "Entrada": "Started",
    "Salida": "Finished",
    "Última señal": "Last activity",
    "Conectado": "Online",
    "Sin señal": "Offline",
    "Ver desglose": "View breakdown",
    "Ocultar desglose": "Hide breakdown",
    "Desglose final": "Final breakdown",
    "Desglose provisional de las preguntas ya respondidas": "Provisional breakdown of answered questions",
    "Aún sin respuestas por área": "No answers by domain yet",
    "Aciertos": "Correct answers",
    "Porcentaje": "Percentage",
    "No hay reglas de admisión configuradas.": "No access rules configured.",
    "Configuración cargada": "Settings loaded",
    "Escribe un dominio o correo para agregarlo.": "Enter a domain or email to add.",
    "Regla agregada a la tabla. Guarda para aplicarla.": "Rule added. Save to apply it.",
    "Reglas guardadas": "Rules saved",
    "Ingresa la clave ADMIN_TOKEN configurada en Cloudflare.": "Enter the ADMIN_TOKEN configured in Cloudflare.",
    "Conectado · sincronizando cada 5 s": "Connected · syncing every 5 seconds",
    "resultados · ": "results · ",
    " intentos totales · actualizado ": " total attempts · updated ",
    " preguntas respondidas · umbral interno de práctica: 72 %": " correct · internal practice threshold: 72%",
    "Tienes ": "You have ",
    " pregunta(s) sin responder. ¿Enviar de todos modos?": " unanswered question(s). Submit anyway?",
    "¿Confirmas el envío del examen?": "Confirm exam submission?",
    "Preguntas respondidas": "Questions answered",
    "Umbral de práctica alcanzado": "Practice threshold reached",
    "Bajo el umbral de práctica": "Below practice threshold",
    "No se pudo guardar el resultado: ": "Could not save result: ",
    ". Reintenta el guardado.": ". Please retry saving.",
    "Resultado guardado correctamente. El equipo puede verlo en el panel privado.": "Result saved successfully. The team can view it in the private dashboard.",
    "No se pudo guardar el avance; se reintentará al responder.": "Could not save progress; it will retry when you answer.",
    "El avance se guardará al comenzar.": "Progress will be saved when you start.",
    "Agrega una regla por fila: dominio (admite cualquier usuario de ese dominio y sus subdominios) o correo (admite solo esa dirección). El Worker genera y evalúa el patrón correspondiente al validar el acceso.": "Add one rule per row: a domain (allows any user at that domain and its subdomains) or an email (allows only that address). The Worker checks the matching rule when access is validated.",
    "Reglas guardadas · ": "Rules saved · ",
    "No se pudo cargar admisión.": "Could not load access settings.",
    "No se pudo guardar.": "Could not save.",
    "Aún sin respuestas por área": "No answers by domain yet",
    "Sin hora de salida": "No finish time",
    "Sin salida registrada": "No finish time recorded",
    "· más débil": "· weakest",
    "· menor provisional": "· currently lowest",
    "(provisional)": "(provisional)",
    "Actualizado": "Updated",
    "Ingresar": "Enter",
    "completadas": "completed",
    " respondidas": " answered",
    "Marcada para revisar": "Flagged for review",
    "Respondida": "Answered",
    "Sin responder": "Unanswered",
    " · Tiempo: ": " · Time: ",
    " (tiempo agotado)": " (time expired)",
    " correctas · umbral interno de práctica: 72 %": " correct · internal practice threshold: 72%",
    " de ": " of ",
    " resultados · ": " results · ",
    " actualizado ": " updated ",
  };
  const key = "claude-exam-language";
  const placeholders = {
    "Ej. María González": "e.g. Maria Gonzalez",
    "nombre@empresa.com": "name@company.com",
    "nxtara.com": "nxtara.com",
    "persona@empresa.com": "person@company.com",
    "Buscar participante o correo": "Search participant or email",
  };
  let language = localStorage.getItem(key) || "es";
  const excluded = (node) => node.parentElement?.closest("#questions, #review, script, style, textarea, input, select");
  function apply(root = document.body) {
    if (language !== "en" || !root) return;
    if (root.matches?.("[data-en]") && root.textContent !== root.dataset.en) root.textContent = root.dataset.en;
    root.querySelectorAll?.("[data-en]").forEach(element => { if (element.textContent !== element.dataset.en) element.textContent = element.dataset.en; });
    if (root.matches?.("[placeholder]") && placeholders[root.getAttribute("placeholder")]) root.setAttribute("placeholder", placeholders[root.getAttribute("placeholder")]);
    root.querySelectorAll?.("[placeholder]").forEach(element => { if (placeholders[element.getAttribute("placeholder")]) element.setAttribute("placeholder", placeholders[element.getAttribute("placeholder")]); });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (excluded(node)) continue;
      let value = node.nodeValue;
      for (const [es, en] of Object.entries(translations)) value = value.split(es).join(en);
      if (value !== node.nodeValue) node.nodeValue = value;
    }
  }
  function setLanguage(lang) {
    language = lang === "en" ? "en" : "es";
    localStorage.setItem(key, language);
    document.documentElement.lang = language;
    location.reload();
  }
  const picker = document.createElement("label");
  picker.setAttribute("aria-label", "Language / Idioma");
  picker.style.cssText = "position:fixed;z-index:20;right:14px;top:12px;display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid #aaa;border-radius:8px;background:Canvas;color:CanvasText;font:14px system-ui;box-shadow:0 2px 8px #0002";
  picker.innerHTML = '<span>🌐</span><select style="border:0;background:transparent;color:inherit;font:inherit"><option value="es">Español</option><option value="en">English</option></select>';
  const select = picker.querySelector("select");
  select.value = language;
  select.addEventListener("change", () => setLanguage(select.value));
  document.body.appendChild(picker);
  document.documentElement.lang = language;
  if (language === "en") {
    const title = document.querySelector("title");
    if (title?.dataset.en) title.textContent = title.dataset.en;
  }
  apply();
  new MutationObserver(records => records.forEach(record => {
    if (record.type === "characterData") apply(record.target.parentElement);
    else record.addedNodes.forEach(node => { if (node.nodeType === 1) apply(node); });
  })).observe(document.body, { subtree: true, childList: true, characterData: true });
  window.examI18n = { get language() { return language; }, t(value) { return language === "en" ? (translations[value] || value) : value; } };
})();
