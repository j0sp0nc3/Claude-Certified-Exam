"""Generate English text for the practice banks using the public Google Translate endpoint."""
import importlib
import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).parent
sys.path.insert(0, str(ROOT))
EXAMS = ["exam_associate", "exam_developer", "exam_architect_f", "exam_architect_p"]
SEP = "QZSEP819"


def translate_batch(parts):
    text = f"\n{SEP}\n".join(parts)
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=" + urllib.parse.quote(text)
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))
            translated = "".join(segment[0] for segment in payload[0] if segment and segment[0])
            values = [item.strip() for item in translated.split(SEP)]
            if len(values) != len(parts):
                raise ValueError(f"separator mismatch: expected {len(parts)}, got {len(values)}")
            return values
        except Exception:
            if attempt == 4:
                raise
            time.sleep(1 + attempt)


def main():
    sources = {}
    entries = {}
    for mod in EXAMS:
        exam = importlib.import_module(mod).EXAM
        questions = exam["questions"] + importlib.import_module(mod + "_2").QUESTIONS
        code = exam["code"]
        entries[code] = {"title": exam["title"], "desc": exam["desc"], "domains": exam["domains"], "questions": []}
        sources[code] = []
        for domain, question, correct, wrong, explanation in questions:
            options = ([*correct] if isinstance(correct, list) else [correct]) + wrong
            fields = [question, *options, explanation, domain]
            sources[code].append((isinstance(correct, list), len(correct) if isinstance(correct, list) else 1, len(options)))
            entries[code]["questions"].append(fields)
    unique = list(dict.fromkeys(
        text for code in entries for text in
        [entries[code]["title"], entries[code]["desc"], *entries[code]["domains"],
         *(field for row in entries[code]["questions"] for field in row)]
    ))
    lookup = {}
    batches, batch = [], []
    size = 0
    for text in unique:
        if batch and size + len(text) + len(SEP) + 2 > 2200:
            batches.append(batch)
            batch, size = [], 0
        batch.append(text)
        size += len(text) + len(SEP) + 2
    if batch:
        batches.append(batch)
    print(f"Translating {len(unique)} unique strings in {len(batches)} requests", flush=True)
    for n, group in enumerate(batches, 1):
        lookup.update(zip(group, translate_batch(group)))
        if n % 10 == 0 or n == len(batches):
            print(f"Translated {n}/{len(batches)} batches", flush=True)
        time.sleep(0.12)
    for code, exam in entries.items():
        exam["title"] = lookup[exam["title"]]
        exam["desc"] = lookup[exam["desc"]]
        exam["domains"] = [lookup[value] for value in exam["domains"]]
        translated_questions = []
        for fields, shape in zip(exam["questions"], sources[code]):
            translated = [lookup[value] for value in fields]
            translated_questions.append({"q_es": fields[0], "q": translated[0], "o": translated[1:-2], "e": translated[-2], "d": translated[-1]})
        exam["questions"] = translated_questions
    (ROOT / "translations_en.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Wrote translations_en.json", flush=True)


if __name__ == "__main__":
    main()
