---
allowed-tools: Read, TodoWrite, Bash(git status:*), Bash(git log:*), Bash(git diff:*), Skill(spec:spec-knowledge)
description: Use spec knowledge to convert game design into formal specifications.
argument-hint: [description of design or reference to design document]
---

# Rule

The `<execute>ARGUMENTS</execute>` will execute the main procedure.

# Principles

## Test-Driven Specification

For each design applied, ensure the `docs/testing.md` has corresponding test cases added or updated.

## Minimal and Simple

When applying design changes, **ALWAYS** aim for the simplest possible specification that fulfills the design requirements. The specification should maintain as incremental complexity as necessary.

## Self-Review

Each specification change must include a self-review step to ensure clarity, correctness, and completeness.

## Detailed Documentation

If SPEC.md is growing large, follow the spec knowledge guidelines to split it into multiple files under the `docs/` directory, ensuring each file has a clear purpose and is well-organized.

# Definition

<function name="explore">
    <description>Explore the current specification and identify areas for improvement or addition based on design changes.</description>
    <parameter name="reference to design document" type="string" optional="true">Reference to design document outlining intended features or requirements</parameter>
    <step>1. read SPEC.md to understand the current specification</step>
    <step>2. use `git log` and `git diff` to identify recent relevant changes in the codebase</step>
    <condition if="reference to design document provided">
        <step>3. review the design document to understand intended features and requirements</step>
    </condition>
    <step>4. compare current specification against design requirements to identify gaps or outdated sections</step>
    <step>5. document areas needing specification updates or additions</step>
    <return>List of areas needing specification updates</return>
</function>

<function name="clarify">
    <description>Clarify any ambiguities or uncertainties in the design or specification.</description>
    <parameter name="content to clarify" type="string">Content that needs clarification</parameter>
    <step>1. according to spec knowledge, create questions that unable to pass specification review</step>
    <step>2. use ask question tool to get answers for each question</step>
    <step>3. synthesize answers into clear and unambiguous specification details</step>
    <return>Clarified specification details</return>
</function>

<procedure name="main">
    <description>Use spec knowledge to convert game design into formal specifications.</description>
    <parameter name="description" type="string">Description of design or reference to design document</parameter>
    <step>1. activate the spec-knowledge skill</step>
    <step>2. enter plan mode to prepare for specification update</step>
    <step>3. <execute name="explore">$description</execute></step>
    <loop over="areas needing specification updates">
        <step>4. <execute name="clarify">area needing specification update</execute></step>
        <step>5. update SPEC.md to reflect clarified design and specification</step>
        <step>6. apply `docs/*.md` updates to ensure consistency with SPEC.md</step>
        <step>7. perform self-review of specification changes for clarity, correctness, and completeness</step>
    </loop>
    <condition if="headless mode is active">
        <step>8. skip confirmation step</step>
    </condition>
    <condition if="headless mode is not active">
        <step>8. confirm specification updates with user</step>
    </condition>
    <return>Updated SPEC.md and `docs/*.md` reflecting applied design</return>
</procedure>

# Task

<execute name="main">$ARGUMENTS</execute>
