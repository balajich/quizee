Feature: Delete Quiz
  As a quiz administrator
  I want to delete a quiz
  So that outdated content is removed

  Scenario: Successfully delete an existing quiz
    Given a quiz exists in draft state
    When I delete the quiz
    Then the response status is 204

  Scenario: Deleting a non-existent quiz returns not found
    Given the command service is available
    When I delete quiz id "00000000-0000-0000-0000-000000000000"
    Then the response status is 404
