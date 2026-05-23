Feature: List Technologies
  As a user
  I want to know the supported technologies
  So that I can filter quizzes correctly

  Scenario: Get technologies returns all supported values
    Given the query service is available
    When I request the list of technologies
    Then the response status is 200
    And the response contains all expected technologies
