Feature: List Quizzes
  As a user
  I want to list available quizzes
  So that I can choose one to take

  Scenario: List quizzes returns a paginated result
    Given the query service is available
    When I request the quiz list
    Then the response status is 200
    And the response contains total count and items

  Scenario: Filter quizzes by technology returns matching results
    Given a published quiz exists
    When I request quizzes filtered by technology "Python"
    Then the response status is 200
    And every quiz in the response has technology "Python"

  Scenario: Filter quizzes by difficulty returns matching results
    Given a published quiz exists
    When I request quizzes filtered by difficulty "Easy"
    Then the response status is 200
    And every quiz in the response has difficulty "Easy"
