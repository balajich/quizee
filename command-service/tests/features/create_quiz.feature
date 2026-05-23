Feature: Create Quiz
  As a quiz administrator
  I want to create quizzes with questions and options
  So that users can take them

  Scenario: Successfully create a quiz with valid data
    Given the command service is available
    When I submit a valid create quiz request
    Then the response status is 201
    And the response contains a valid quiz_id

  Scenario: Create quiz with unsupported technology fails
    Given the command service is available
    When I submit a create quiz request with technology "COBOL"
    Then the response status is 422

  Scenario: Create quiz with unsupported difficulty fails
    Given the command service is available
    When I submit a create quiz request with difficulty "Expert"
    Then the response status is 422

  Scenario: Create MCQ question with no correct option fails
    Given the command service is available
    When I submit a quiz with an MCQ question having no correct option
    Then the response status is 422

  Scenario: Create MCQ question with multiple correct options fails
    Given the command service is available
    When I submit a quiz with an MCQ question having multiple correct options
    Then the response status is 422

  Scenario: Create a Java quiz with 10 MCQ questions
    Given the command service is available
    When I create a Java quiz named "Core Java Fundamentals" with the following MCQ questions:
      | question                                                        | correct_answer       | wrong_1                | wrong_2               | wrong_3                  |
      | What is the default value of an int variable in Java?           | 0                    | null                   | false                 | undefined                |
      | Which keyword prevents method overriding in Java?               | final                | static                 | private               | abstract                 |
      | What is the size of a long data type in Java?                   | 64 bits              | 32 bits                | 16 bits               | 128 bits                 |
      | Which method must be implemented when using Runnable?           | run()                | start()                | execute()             | main()                   |
      | What does JVM stand for?                                        | Java Virtual Machine | Java Verified Module   | Java Variable Method  | Java Visual Manager      |
      | Which collection class allows null keys in Java?                | HashMap              | Hashtable              | TreeMap               | ConcurrentHashMap        |
      | What is the output of System.out.println(10 / 3)?              | 3                    | 3.33                   | 3.0                   | Compilation Error        |
      | Which modifier makes a member accessible only within its class? | private              | protected              | default               | public                   |
      | What is the parent class of all classes in Java?               | Object               | Class                  | Root                  | Base                     |
      | Which keyword is used to handle exceptions in Java?             | try                  | catch                  | handle                | throws                   |
    Then the response status is 201
    And the response contains a valid quiz_id
