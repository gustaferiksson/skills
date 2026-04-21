---
name: pr-review
description: Reviews a pull request by investigating code changes, permissions, infra, and best practices, then outputs a structured review with Good points and Problems.
---

Check the changes in the PR, the code around it and other repos if any relevant code is mentioned in the changes or affects it. Make a review where you review what is good and find potential bugs. Make sure you look at permissions, infra, best practices, naming conventions and existing file structures in the current repository. Display the review in the following format.


```
PR #XXX — <name of the PR>

What it does: <short overview of what is implemented>

Good

- <bullet list of all the things that is good>
- ...


Problems

1. <numbered issues list with everything ordered from most important to least, should be marked as critical, high, low>
2. ...

Style issues

1. <if there are any misplaced files or the file structure is wrong>
2. <or if the PR doesn't follow the naming convention or a dead on classic REST structure>
```

