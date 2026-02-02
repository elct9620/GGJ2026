---
allowed-tools: Read, TodoWrite, Bash(git status:*), Bash(git log:*), Bash(git diff:*), Skill(spec:spec-knowledge)
description: Refactor codebase to improve structure, readability, and maintainability
argument-hint: focus areas
---

# Rule

The `<execute>ARGUMENTS</execute>` will execute the main procedure.

# Principles

The principles is ordered by priority, ensure follow project's convention not force applying these principles.

| Type                | Condition                                                                                                                            |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Long method / class | > 100 lines, consider breaking down using design patterns or review violation of single responsibility principle                     |
| Duplicated code     | Only merge if in same domain, otherwise consider abstraction                                                                         |
| Over engineering    | Reduce method, class, or module complexity if logic is simple enough, e.g. only 3 branch use switch case instead of strategy pattern |
| Coupling            | When modify a feature need to modify 3 or more other related files, consider decoupling using interfaces or abstractions             |

## 1. Clear and Consistent Naming

Use meaningful and consistent names for variables, functions, and classes.

## 2. Keep Simple

No duplicate or unnecessary complexity. Aim for simplicity and strightforwardness in design and implementation.

## 3. SOLID

Adhere to SOLID principles for object-oriented design.

## 4. Design Patterns

Identity and utilize appropriate design patterns where applicable.

# Anti Patterns

## 1. Design for Testability

Never create a accessor/mutator methods for the sole purpose of testing. Public mehods should cover all test scenarios otherwise violate cohesion principle.

## 2. Leave Code Smells

Review relevant code to avoid code smells such as feature envy, dead code, and other anti-patterns.

## 3. Backward Compatibility

Avoid leaving backward compatibility when refactoring didn't break existing functionality.

# Definition

<function name="explore">
    <description>Explore the current codebase and identify areas that need refactoring.</description>
    <parameter name="focus areas" type="string" optional="true">Specific areas of the codebase to focus on</parameter>
    <step>1. read through the codebase or {focus_areas} if provided</step>
    <step>2. identify naming, structural, and design issues</step>
    <step>3. use `git log` and `git diff` to ensure refactoring directions not revert recent refactoring</step>
    <step>4. document areas needing refactoring</step>
    <return>List of areas needing refactoring</return>
</function>

<function name="refactor">
    <description>Refactor code to improve alignment with the specification.</description>
    <parameter name="area to refactor" type="string">Specific area of the codebase that needs refactoring</parameter>
    <condition if="duplicated code found in same domain">
        <step>1. identify duplicated code segments</step>
        <step>2. consolidate duplicated code into single reusable components or functions</step>
    </condition>
    <condition if="outdated code found">
        <step>3. identify outdated code segments</step>
        <step>4. update or remove outdated code to reflect current best practices and specifications</step>
    </condition>
    <condition if="coupled code found">
        <step>5. identify tightly coupled code segments</step>
        <step>6. decouple code by introducing interfaces or abstractions as needed</step>
    </condition>
    <condition if="redundant code found">
        <step>7. identify redundant code segments</step>
        <step>8. remove redundant code to streamline the codebase</step>
    </condition>
    <step>9. ensure all changes are tested and documented appropriately</step>
    <return>Confirmation of refactoring completion</return>
</function>

<function name="testing">
    <description>Review and update tests to ensure all changes are covered.</description>
    <parameter name="changes made" type="string">Description of changes made to the codebase</parameter>
    <step>1. review existing tests in `docs/testing.md` related to the changes made</step>
    <condition if="tests missing for changes made">
        <step>2. add new test cases to cover the changes made</step>
    </condition>
    <condition if="tests outdated for changes made">
        <step>3. update existing test cases to reflect the changes made</step>
    </condition>
    <step>4. run all tests to ensure they pass successfully</step>
    <return>Confirmation that all tests pass and are up to date</return>
</function>

<procedure name="main">
    <description>Refactor codebase to improve structure, readability, and maintainability</description>
    <parameter name="focus areas" type="string" optional="true">Specific areas of the codebase to focus refactoring efforts on</parameter>
    <condition if="headless mode is active">
        <step>1. skip plan mode activation</step>
    </condition>
    <condition if="headless mode is not active">
        <step>1. enter plan mode to prepare for refactoring</step>
    </condition>
    <step>2. <execute name="explore">$focus areas</execute></step>
    <step>3. pick top 3 areas needing refactoring based on impact and effort</step>
    <loop over="areas needing refactoring" max="3">
        <step>4. <execute name="refactor">area needing refactoring</execute></step>
        <step>5. <execute name="testing">refactoring changes</execute></step>
    </loop>
    <step>6. review all changes to ensure they adhere to principles</step>
    <step>7. document all refactoring changes made</step>
    <return>Refactored codebase and documentation of changes</return>
</procedure>

# Task

<execute name="main">$ARGUMENTS</execute>
