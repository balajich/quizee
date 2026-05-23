Feature: Get Question
  As a user
  I want to retrieve a single question with its options
  So that I can display it during a quiz session

  Scenario: Get an existing question returns details with options
    Given a published quiz exists
    When I request the first question of the quiz
    Then the response status is 200
    And the response contains question details with options

  Scenario: Get a non-existent question returns not found
    Given a published quiz exists
    When I request a question with id "00000000-0000-0000-0000-000000000000"
    Then the response status is 404
