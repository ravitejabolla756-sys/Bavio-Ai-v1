# Workflows

The current verified Customer opportunity workflow uses an immutable version, ordered steps, sequential execution, fail-fast behavior, preserved completed effects, execution trace, ActionExecution linkage, and evidence linkage.

The verified steps are `bavio.lead.create` followed by `bavio.webhook.deliver`. A failed later step does not undo a successful earlier Lead action. The current runtime does not automatically retry a failed mutating action and supports crash/recovery reconciliation for verified cases.

The current product surface is read-only for verified workflow definitions and executions. Branches, conditions, loops, parallel execution, and a generic workflow builder are not documented because they are not implemented in this scope.
