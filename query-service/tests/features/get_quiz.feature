Feature: Get Quiz Detail
  As a user
  I want to retrieve the full detail of a quiz
  So that I can see all its questions and options

  Scenario: Get an existing quiz returns full detail
    Given a published quiz exists
    When I request the quiz by id
    Then the response status is 200
    And the response contains quiz details with questions and options

  Scenario: Get a non-existent quiz returns not found
    Given the query service is available
    When I request quiz id "00000000-0000-0000-0000-000000000000"
    Then the response status is 404
