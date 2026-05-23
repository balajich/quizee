Feature: Publish Quiz
  As a quiz administrator
  I want to publish a quiz
  So that it becomes visible to users

  Scenario: Successfully publish an unpublished quiz
    Given a quiz exists in draft state
    When I publish the quiz
    Then the response status is 200
    And the response indicates success

  Scenario: Publishing an already published quiz fails
    Given a quiz exists in draft state
    And the quiz has been published
    When I publish the quiz again
    Then the response status is 400

  Scenario: Publishing a non-existent quiz returns not found
    Given the command service is available
    When I publish quiz id "00000000-0000-0000-0000-000000000000"
    Then the response status is 404
