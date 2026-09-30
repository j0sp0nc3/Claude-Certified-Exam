import base64, json, html, pathlib, importlib

RECIPIENT = "jponce@nxtara.com"
MINUTES = 90
ROOT = pathlib.Path(__file__).parent
OUT = ROOT.parent / "examenes"
OUT.mkdir(exist_ok=True)
tpl = (ROOT / "template.html").read_text(encoding="utf-8")

cards = []
for mod in ["exam_associate", "exam_developer", "exam_architect_f", "exam_architect_p"]:
    ex = importlib.import_module(mod).EXAM
    qs = ex["questions"] + importlib.import_module(mod + "_2").QUESTIONS
    quota = ex.get("quota") or {d: 10 for d in ex["domains"]}
    assert sum(quota.values()) == 50, mod
    assert len(qs) == 100, (mod, len(qs))
    assert len({x[1] for x in qs}) == 100, (mod, "pregunta duplicada")

    def to_q(d, q, ok, wrong, e):
        # Las correctas van primero (índices 0..n-1); las opciones se barajan al mostrar
        if isinstance(ok, list):
            assert len(ok) in (2, 3) and len(ok) + len(wrong) in (5, 6), (mod, q)
            return {"d": d, "q": q, "o": ok + wrong, "a": list(range(len(ok))), "e": e}
        assert len(wrong) == 3, (mod, q)
        return {"d": d, "q": q, "o": [ok] + wrong, "a": 0, "e": e}

    for x in qs:
        assert x[0] in ex["domains"], (mod, x[1])
    for d in ex["domains"]:
        n = sum(1 for x in qs if x[0] == d)
        assert n >= quota[d], (mod, d, n)
    multi = sum(1 for x in qs if isinstance(x[2], list))
    data = {
        "code": ex["code"], "title": ex["title"], "domains": ex["domains"], "quota": quota,
        "questions": [to_q(*x) for x in qs],
    }
    b64 = base64.b64encode(json.dumps(data, ensure_ascii=False).encode("utf-8")).decode()
    page = (tpl.replace("__DATA__", b64)
               .replace("__TITLE__", html.escape(ex["title"]))
               .replace("__CODE__", ex["code"])
               .replace("__DESC__", html.escape(ex["desc"]))
               .replace("__DOMAINS__", html.escape(" · ".join(ex["domains"])))
               .replace("__MINUTES__", str(MINUTES))
               .replace("__POOL__", str(len(qs)))
               .replace("__RECIPIENT__", RECIPIENT))
    (OUT / ex["file"]).write_text(page, encoding="utf-8")
    cards.append(ex)
    print("OK", ex["file"], f"banco={len(qs)} multiple={multi}")

items = "".join(
    f'<a class="card" href="{c["file"]}"><span class="pill">{c["code"]}</span><h2>{html.escape(c["title"])}</h2>'
    f'<p>{html.escape(c["desc"])}</p><span class="go">Iniciar simulacro →</span></a>' for c in cards)
index = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simulacros Certificación Claude</title><style>
:root{{--bg:#f6f5f1;--surface:#fff;--text:#1f1e1c;--muted:#6b6862;--border:#dedad2;--accent:#c96442;--pill:#f0eee8}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#1a1917;--surface:#242320;--text:#ecebe7;--muted:#a19d95;--border:#3a3834;--accent:#e08a67;--pill:#2d2b28}}}}
:root[data-theme="dark"]{{--bg:#1a1917;--surface:#242320;--text:#ecebe7;--muted:#a19d95;--border:#3a3834;--accent:#e08a67;--pill:#2d2b28}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
.wrap{{max-width:960px;margin:0 auto;padding:32px 16px 64px}}h1{{margin:0 0 6px;font-size:1.7rem}}p{{color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px}}
.card{{display:block;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;text-decoration:none;color:var(--text)}}
.card:hover{{border-color:var(--accent)}}.card h2{{font-size:1.1rem;margin:10px 0 6px}}.card p{{font-size:.92rem;margin:0 0 12px}}
.pill{{font-size:.78rem;padding:2px 10px;border-radius:999px;background:var(--pill);color:var(--muted)}}.go{{color:var(--accent);font-weight:600}}
</style></head><body><div class="wrap"><h1>Simulacros de Certificación Claude</h1>
<p>Cuatro exámenes de práctica. Cada intento sortea 50 preguntas de un banco de 100, con alternativa única y selección múltiple. {MINUTES} minutos, aprobación 72 %. Los resultados se envían a {RECIPIENT}.</p>
<div class="grid">{items}</div>
<p style="font-size:.8rem;margin-top:24px">Material de práctica para entrenamiento interno. No es contenido oficial de Anthropic.</p></div></body></html>"""
(OUT / "index.html").write_text(index, encoding="utf-8")
print("OK index.html")
