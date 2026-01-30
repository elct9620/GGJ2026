---
allowed-tools: Read, TodoWrite, Bash(git status:*), Bash(git log:*), Bash(git diff:*), Skill(spec:spec-knowledge)
description: Align codebase to match the specification use spec knowledge.
argument-hint: scope of alignment
---

# Rule

The `<execute>ARGUMENTS</execute>` will execute the main procedure.

# Principles

## Refactoring First

Review any duplicated, outdated, coupled, or redundant code which blocks alignment with the specification. Refactor such code before implementing new changes.

## Test-Driven

After refactoring, or implementing changes, ensure that all changes passed. Then review `docs/testing.md` to ensure that all relevant test cases are added or updated before implementing further changes.

## Backward Compatibility

No need to maintain backward compatibility for internal changes. Keep going changes to align with the specification.

## Renaming

If any renaming is needed to align with the specification, ensure that all references in the codebase and documentation are updated accordingly.

# Definition

<function name="explore">
    <description>Explore the current specification and identify areas that do not align with the codebase.</description>
    <parameter name="scope of alignment" type="string">Scope of alignment should be considered, e.g., specific module, feature set, or entire codebase</parameter>
    <step>1. read SPEC.md to understand the current specification</step>
    <step>2. use `git log` and `git diff` to identify recent relevant changes in the codebase</step>
    <step>3. explore the codebase to identify areas that may not align with the specification</step>
    <step>4. document areas where the codebase does not align with the specification</step>
    <return>List of areas where codebase does not align with specification</return>
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
    <description>Align specification and codebase with spec-knowledge skill</description>
    <parameter name="scope of alignment" type="string">Scope of alignment should be considered, e.g., specific module, feature set, or entire codebase</parameter>
    <step>1. activate the spec-knowledge skill</step>
    <step>2. enter plan mode to prepare for alignment</step>
    <step>3. <execute name="explore">$scope of alignment</execute></step>
    <loop over="areas where codebase does not align with specification">
        <step>4. <execute name="refactor">area to refactor</execute></step>
        <step>5. <execute name="testing">refactoring changes</execute></step>
        <step>6. implement changes to align code with specification</step>
        <step>7. if renaming is needed, ensure all references in codebase and documentation are updated accordingly</step>
        <step>8. <execute name="testing">changes made</execute></step>
        <step>9. self-review changes to ensure clarity, correctness, and completeness</step>
    </loop>
    <step>9. confirm and execute all changes</step>
    <return>Summary of alignment changes made</return>
</procedure>

# Task

<execute name="main">$ARGUMENTS</execute>
