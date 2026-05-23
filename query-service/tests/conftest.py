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
QUERY_URL = os.getenv("QUERY_URL", "http://localhost:8002")

EXPECTED_TECHNOLOGIES = ["Java", "Python", "AI", "JavaScript", "SQL", "DevOps"]

SAMPLE_QUIZ = {
    "title": "BDD Query Test Quiz",
    "description": "Published quiz for BDD query tests",
    "technology": "Python",
    "difficulty": "Easy",
    "tags": ["bdd", "query"],
    "questions": [
        {
            "text": "What does API stand for?",
            "question_type": "MCQ",
            "points": 1,
            "options": [
                {"text": "Application Programming Interface", "is_correct": True},
                {"text": "Applied Program Index", "is_correct": False},
                {"text": "Automated Process Integration", "is_correct": False},
                {"text": "None of the above", "is_correct": False},
            ],
        }
    ],
}


@pytest.fixture(scope="session")
def published_quiz_id():
    """Create and publish one quiz for the whole test session, delete it on teardown."""
    resp = requests.post(f"{COMMAND_URL}/commands/quizzes", json=SAMPLE_QUIZ)
    assert resp.status_code == 201, f"Quiz creation failed: {resp.text}"
    quiz_id = resp.json()["quiz_id"]

    resp = requests.post(f"{COMMAND_URL}/commands/quizzes/{quiz_id}/publish")
    assert resp.status_code == 200, f"Publish failed: {resp.text}"

    yield quiz_id

    requests.delete(f"{COMMAND_URL}/commands/quizzes/{quiz_id}")


@pytest.fixture(scope="session")
def published_quiz_detail(published_quiz_id):
    """Full quiz detail fetched once and reused across all query tests."""
    resp = requests.get(f"{QUERY_URL}/queries/quizzes/{published_quiz_id}")
    assert resp.status_code == 200, f"Could not fetch quiz detail: {resp.text}"
    return resp.json()


@pytest.fixture
def ctx():
    """Mutable dict for sharing state between steps within one scenario."""
    return {}


# ── Given ────────────────────────────────────────────────────────────────────


@given("the query service is available")
def query_service_available():
    resp = requests.get(f"{QUERY_URL}/health")
    assert resp.status_code == 200, f"Query service not reachable (HTTP {resp.status_code})"


@given("a published quiz exists")
def published_quiz_exists(ctx, published_quiz_id, published_quiz_detail):
    ctx["quiz_id"] = published_quiz_id
    ctx["quiz_detail"] = published_quiz_detail


# ── When ─────────────────────────────────────────────────────────────────────


@when("I request the quiz list")
def request_quiz_list(ctx):
    ctx["response"] = requests.get(
        f"{QUERY_URL}/queries/quizzes", params={"published_only": False}
    )


@when(parsers.parse('I request quizzes filtered by technology "{tech}"'))
def request_quizzes_by_technology(ctx, tech):
    ctx["response"] = requests.get(
        f"{QUERY_URL}/queries/quizzes",
        params={"technology": tech, "published_only": False},
    )


@when(parsers.parse('I request quizzes filtered by difficulty "{difficulty}"'))
def request_quizzes_by_difficulty(ctx, difficulty):
    ctx["response"] = requests.get(
        f"{QUERY_URL}/queries/quizzes",
        params={"difficulty": difficulty, "published_only": False},
    )


@when("I request the quiz by id")
def request_quiz_by_id(ctx):
    ctx["response"] = requests.get(f"{QUERY_URL}/queries/quizzes/{ctx['quiz_id']}")


@when(parsers.parse('I request quiz id "{quiz_id}"'))
def request_nonexistent_quiz(ctx, quiz_id):
    ctx["response"] = requests.get(f"{QUERY_URL}/queries/quizzes/{quiz_id}")


@when("I request the first question of the quiz")
def request_first_question(ctx):
    question_id = ctx["quiz_detail"]["questions"][0]["question_id"]
    ctx["response"] = requests.get(
        f"{QUERY_URL}/queries/quizzes/{ctx['quiz_id']}/questions/{question_id}"
    )


@when(parsers.parse('I request a question with id "{question_id}"'))
def request_nonexistent_question(ctx, question_id):
    ctx["response"] = requests.get(
        f"{QUERY_URL}/queries/quizzes/{ctx['quiz_id']}/questions/{question_id}"
    )


@when("I request the list of technologies")
def request_technologies(ctx):
    ctx["response"] = requests.get(f"{QUERY_URL}/queries/technologies")


# ── Then ─────────────────────────────────────────────────────────────────────


@then(parsers.parse("the response status is {status:d}"))
def check_status(ctx, status):
    assert ctx["response"].status_code == status, (
        f"Expected {status}, got {ctx['response'].status_code}. Body: {ctx['response'].text}"
    )


@then("the response contains total count and items")
def check_list_shape(ctx):
    body = ctx["response"].json()
    assert "total" in body, f"Missing 'total' in response: {body}"
    assert "items" in body, f"Missing 'items' in response: {body}"
    assert isinstance(body["total"], int)
    assert isinstance(body["items"], list)


@then(parsers.parse('every quiz in the response has technology "{tech}"'))
def check_technology_filter(ctx, tech):
    items = ctx["response"].json()["items"]
    assert items, "Response returned no quizzes"
    for quiz in items:
        assert quiz["technology"] == tech, (
            f"Quiz {quiz['quiz_id']} has technology '{quiz['technology']}', expected '{tech}'"
        )


@then(parsers.parse('every quiz in the response has difficulty "{difficulty}"'))
def check_difficulty_filter(ctx, difficulty):
    items = ctx["response"].json()["items"]
    assert items, "Response returned no quizzes"
    for quiz in items:
        assert quiz["difficulty"] == difficulty, (
            f"Quiz {quiz['quiz_id']} has difficulty '{quiz['difficulty']}', expected '{difficulty}'"
        )


@then("the response contains quiz details with questions and options")
def check_quiz_detail_shape(ctx):
    body = ctx["response"].json()
    for field in ("quiz_id", "title", "technology", "difficulty", "questions"):
        assert field in body, f"Missing '{field}' in quiz detail"
    assert isinstance(body["questions"], list) and len(body["questions"]) > 0
    first_q = body["questions"][0]
    assert "options" in first_q, "First question has no options"
    assert len(first_q["options"]) > 0


@then("the response contains question details with options")
def check_question_detail_shape(ctx):
    body = ctx["response"].json()
    for field in ("question_id", "text", "question_type", "options"):
        assert field in body, f"Missing '{field}' in question detail"
    assert isinstance(body["options"], list) and len(body["options"]) > 0


@then("the response contains all expected technologies")
def check_technologies(ctx):
    body = ctx["response"].json()
    assert "technologies" in body, f"Missing 'technologies' key: {body}"
    for tech in EXPECTED_TECHNOLOGIES:
        assert tech in body["technologies"], f"'{tech}' missing from technologies list"
