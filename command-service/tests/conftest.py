import copy
import json
import os
from unittest.mock import patch

import pytest
import requests
from pytest_bdd import given, when, then, parsers

# ── HTTP call capture ─────────────────────────────────────────────────────────

_http_call_log: dict[str, list] = {}


def _safe_json(value):
    if value is None:
        return None
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="replace")
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return value


def _build_http_table(calls: list) -> str:
    rows = ""
    for i, c in enumerate(calls, 1):
        req, resp = c["request"], c["response"]
        req_body = json.dumps(req["body"], indent=2) if req["body"] is not None else ""
        resp_body = (
            json.dumps(resp["body"], indent=2)
            if isinstance(resp["body"], (dict, list))
            else (resp["body"] or "")
        )
        status_colour = "#2a7a2a" if 200 <= resp["status"] < 300 else "#c0392b"
        rows += f"""
        <tr>
          <td style="padding:4px 8px;text-align:center">{i}</td>
          <td style="padding:4px 8px;font-weight:bold">{req["method"]}</td>
          <td style="padding:4px 8px;word-break:break-all">{req["url"]}</td>
          <td style="padding:4px 8px;font-weight:bold;color:{status_colour}">{resp["status"]}</td>
          <td style="padding:4px 8px"><pre style="margin:0;font-size:11px;max-height:180px;overflow:auto;white-space:pre-wrap">{req_body}</pre></td>
          <td style="padding:4px 8px"><pre style="margin:0;font-size:11px;max-height:180px;overflow:auto;white-space:pre-wrap">{resp_body}</pre></td>
        </tr>"""
    return f"""
    <div style="margin-top:12px">
      <b>HTTP Calls ({len(calls)})</b>
      <table border="1" style="border-collapse:collapse;width:100%;font-size:12px;margin-top:6px">
        <thead>
          <tr style="background:#e8e8e8">
            <th style="padding:4px 8px">#</th>
            <th style="padding:4px 8px">Method</th>
            <th style="padding:4px 8px">URL</th>
            <th style="padding:4px 8px">Status</th>
            <th style="padding:4px 8px;min-width:220px">Request Body</th>
            <th style="padding:4px 8px;min-width:220px">Response Body</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>"""


@pytest.fixture(autouse=True)
def capture_http(request):
    """Intercept every requests.Session.send call and record it for the report."""
    calls: list = []
    _http_call_log[request.node.nodeid] = calls
    original_send = requests.Session.send

    def _send(session, prepared, **kwargs):
        response = original_send(session, prepared, **kwargs)
        calls.append({
            "request": {
                "method": prepared.method,
                "url": prepared.url,
                "body": _safe_json(prepared.body),
            },
            "response": {
                "status": response.status_code,
                "body": _safe_json(response.text),
            },
        })
        return response

    with patch.object(requests.Session, "send", _send):
        yield


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call":
        calls = _http_call_log.get(item.nodeid, [])
        if calls:
            from pytest_html import extras
            if not hasattr(report, "extras"):
                report.extras = []
            report.extras.append(extras.html(_build_http_table(calls)))

COMMAND_URL = os.getenv("COMMAND_URL", "http://localhost:8001")

SAMPLE_QUIZ = {
    "title": "BDD Test Quiz",
    "description": "Automated BDD test quiz",
    "technology": "Python",
    "difficulty": "Easy",
    "tags": ["bdd", "test"],
    "questions": [
        {
            "text": "What does BDD stand for?",
            "question_type": "MCQ",
            "points": 1,
            "options": [
                {"text": "Behaviour Driven Development", "is_correct": True},
                {"text": "Bug Driven Development", "is_correct": False},
                {"text": "Build Deploy Deliver", "is_correct": False},
                {"text": "None of the above", "is_correct": False},
            ],
        }
    ],
}


@pytest.fixture
def ctx():
    """Mutable dict for sharing state between steps within one scenario."""
    return {}


@pytest.fixture
def cleanup():
    """Accumulates quiz IDs to delete after each test."""
    ids = []
    yield ids
    for qid in ids:
        requests.delete(f"{COMMAND_URL}/commands/quizzes/{qid}")


# ── Given ────────────────────────────────────────────────────────────────────


@given("the command service is available")
def command_service_available():
    resp = requests.get(f"{COMMAND_URL}/health")
    assert resp.status_code == 200, f"Command service not reachable (HTTP {resp.status_code})"


@given("a quiz exists in draft state")
def quiz_in_draft(ctx, cleanup):
    resp = requests.post(f"{COMMAND_URL}/commands/quizzes", json=SAMPLE_QUIZ)
    assert resp.status_code == 201, f"Quiz creation failed: {resp.text}"
    ctx["quiz_id"] = resp.json()["quiz_id"]
    cleanup.append(ctx["quiz_id"])


@given("the quiz has been published")
def quiz_already_published(ctx):
    resp = requests.post(f"{COMMAND_URL}/commands/quizzes/{ctx['quiz_id']}/publish")
    assert resp.status_code == 200, f"Publish setup failed: {resp.text}"


# ── When ─────────────────────────────────────────────────────────────────────


@when("I submit a valid create quiz request")
def submit_valid_quiz(ctx, cleanup):
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes", json=SAMPLE_QUIZ)
    if ctx["response"].status_code == 201:
        cleanup.append(ctx["response"].json()["quiz_id"])


@when(parsers.parse('I submit a create quiz request with technology "{tech}"'))
def submit_quiz_bad_tech(ctx, tech):
    payload = {**SAMPLE_QUIZ, "technology": tech}
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes", json=payload)


@when(parsers.parse('I submit a create quiz request with difficulty "{difficulty}"'))
def submit_quiz_bad_difficulty(ctx, difficulty):
    payload = {**SAMPLE_QUIZ, "difficulty": difficulty}
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes", json=payload)


@when("I submit a quiz with an MCQ question having no correct option")
def submit_quiz_no_correct(ctx):
    payload = copy.deepcopy(SAMPLE_QUIZ)
    payload["questions"][0]["options"] = [
        {"text": "Option A", "is_correct": False},
        {"text": "Option B", "is_correct": False},
    ]
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes", json=payload)


@when(parsers.parse('I create a Java quiz named "{title}" with the following MCQ questions:'))
def create_java_quiz_from_table(ctx, title, datatable, cleanup):
    questions = []
    for row in datatable[1:]:  # first row is the header
        question_text, correct, w1, w2, w3 = row
        questions.append({
            "text": question_text,
            "question_type": "MCQ",
            "points": 1,
            "options": [
                {"text": correct, "is_correct": True},
                {"text": w1, "is_correct": False},
                {"text": w2, "is_correct": False},
                {"text": w3, "is_correct": False},
            ],
        })
    payload = {
        "title": title,
        "technology": "Java",
        "difficulty": "Easy",
        "tags": ["java", "fundamentals"],
        "questions": questions,
    }
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes", json=payload)
    if ctx["response"].status_code == 201:
        cleanup.append(ctx["response"].json()["quiz_id"])


@when("I submit a quiz with an MCQ question having multiple correct options")
def submit_quiz_multi_correct(ctx):
    payload = copy.deepcopy(SAMPLE_QUIZ)
    payload["questions"][0]["options"] = [
        {"text": "Option A", "is_correct": True},
        {"text": "Option B", "is_correct": True},
    ]
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes", json=payload)


@when("I publish the quiz")
def publish_quiz(ctx):
    ctx["response"] = requests.post(
        f"{COMMAND_URL}/commands/quizzes/{ctx['quiz_id']}/publish"
    )


@when("I publish the quiz again")
def publish_quiz_again(ctx):
    ctx["response"] = requests.post(
        f"{COMMAND_URL}/commands/quizzes/{ctx['quiz_id']}/publish"
    )


@when(parsers.parse('I publish quiz id "{quiz_id}"'))
def publish_nonexistent_quiz(ctx, quiz_id):
    ctx["response"] = requests.post(f"{COMMAND_URL}/commands/quizzes/{quiz_id}/publish")


@when("I delete the quiz")
def delete_quiz(ctx, cleanup):
    ctx["response"] = requests.delete(
        f"{COMMAND_URL}/commands/quizzes/{ctx['quiz_id']}"
    )
    if ctx["response"].status_code == 204:
        cleanup[:] = [qid for qid in cleanup if qid != ctx["quiz_id"]]


@when(parsers.parse('I delete quiz id "{quiz_id}"'))
def delete_nonexistent_quiz(ctx, quiz_id):
    ctx["response"] = requests.delete(f"{COMMAND_URL}/commands/quizzes/{quiz_id}")


# ── Then ─────────────────────────────────────────────────────────────────────


@then(parsers.parse("the response status is {status:d}"))
def check_status(ctx, status):
    assert ctx["response"].status_code == status, (
        f"Expected {status}, got {ctx['response'].status_code}. Body: {ctx['response'].text}"
    )


@then("the response contains a valid quiz_id")
def check_quiz_id(ctx):
    body = ctx["response"].json()
    assert "quiz_id" in body, f"No quiz_id in response: {body}"
    assert body["quiz_id"], "quiz_id is empty"


@then("the response indicates success")
def check_success(ctx):
    body = ctx["response"].json()
    assert body.get("success") is True, f"Expected success=True, got: {body}"
