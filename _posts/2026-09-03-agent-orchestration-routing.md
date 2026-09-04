---
title: "Agent Orchestration Is a Routing Problem, Not a Prompting Trick"
date: 2026-09-03
permalink: /multi-agent-routing/
author_profile: true
read_time: true
tags:
  - AI agents
  - multi-agent systems
  - orchestration
  - computer use
  - MCP
---

My previous article reduced an agent to four primitives: **model, tools, state, and a runtime that keeps the loop moving**. Multi-agent systems seem like the obvious next step: put several loops next to each other and let them collaborate.

That description is directionally right and operationally incomplete. The moment two agents can touch the same repository, browser, task, or external record, the interesting problem is no longer how many agents you can spawn. It is **where work is routed, who owns mutable state, what survives failure, and what evidence is required before the system says “done.”**

I reached this view by comparing current agent-team runtimes, tracing a two-level code-execution stack, and running black-box isolation and concurrency probes against a multi-Bot desktop environment. The recurring pattern was surprisingly consistent:

> **Parallelize independent lanes. Serialize shared state. Make every join carry evidence.**

![Evidence-bearing multi-agent orchestration](/assets/images/multi-agent-routing.svg)

## TL;DR

- A subagent call, a conversation handoff, a durable teammate, and a remote computer worker are different topologies. Name the one you are building.
- A transcript is an audit log, not a message bus. Live coordination needs addresses, mailboxes, task state, wake-up rules, and a separate interruption primitive.
- Concurrency should be keyed by the **stateful resource** - a checkout, browser session, display, or account - rather than by the friendly name of an agent.
- Models are good at semantic judgment. Code should own repeatable fan-out, joins, barriers, budgets, retries, and cleanup.
- Adding agents does not define correctness. Explicit intermediate invariants and independent verification do.
- Long-running agent work is a distributed-systems problem: durable admission, idempotency, heartbeats, event replay, cancellation, artifact persistence, and terminal states all matter.

## 1. “Multi-agent” hides several architectures

People often use *multi-agent* for any system with more than one model loop. That hides the control boundary that matters most.

### Subagent as a function call

The coordinator delegates a bounded task, receives one result, and stays in control. This is a good fit for code review, source gathering, or a specialist analysis whose internal transcript does not belong in the main context.

The important property is not that the worker has a different persona. It is that the worker has a **clean context and a narrow input/output contract**.

### Handoff

Control moves to another agent. A support triage agent transferring a conversation to a billing agent is the canonical example. The destination now owns the next interaction; the first agent is no longer merely waiting on a helper return value.

### Teammates with mailboxes

Several independent sessions share a task system and can send each other messages. [Claude Code agent teams](https://code.claude.com/docs/en/agent-teams), for example, document a lead, teammates, a shared task list, and a mailbox. This is closer to a small organization than a function call: teammates can work, become idle, receive a follow-up, and coordinate without putting every intermediate token in the lead's context.

### External workers

An agent may own a worktree, container, browser session, graphical display, or remote machine. At this layer, “agent” describes a logical identity. It does **not** tell you whether execution is in-process, in another process, in another sandbox, or on another host.

This distinction matters. A routing flag that says “remote” is not proof of remote isolation. The reliable test is an identity probe: hostname, kernel or boot identity, process and mount namespaces, file visibility, and the actual execution directory.

## 2. A transcript is not a message bus

One of the most useful distinctions in the Codex collaboration model is between persisted history and live coordination.

The audit trail answers: *what happened?* A mailbox answers: *which live worker should receive this next?* Those are different systems.

A useful collaboration runtime needs at least:

1. **Addressing** - stable worker IDs or paths.
2. **Delivery** - queued messages with clear recipient semantics.
3. **Scheduling** - whether a message only arrives, wakes an idle worker, or creates a new turn.
4. **Lifecycle** - running, waiting, idle, completed, failed, or interrupted.
5. **Preemption** - a distinct operation for stopping in-flight work.
6. **Persistence** - independent histories for recovery and audit.

This is why “send a message” and “interrupt the agent” should never be synonyms. A normal message can become visible at a safe turn boundary without being spliced into the middle of a generated sentence or cancelling a running tool. If the product needs preemption, the control plane should say so explicitly.

OpenAI's Codex materials similarly separate asynchronous delegation, parallel work, isolated worktrees, and review in the surrounding harness rather than treating them as prompt conventions ([Codex app](https://openai.com/index/introducing-the-codex-app/), [Codex introduction](https://openai.com/index/introducing-codex/)).

## 3. The concurrency key is the resource

I tested two logical computer-use agents that presented separate desktops. At first glance, they looked isolated. A small causal probe showed a more precise picture.

| Probe | Observation in the tested environment | What it ruled in or out |
|---|---|---|
| Host and boot identity | Same | Not separate machines or VMs |
| User, PID, mount, and network namespaces | Same | Same OS security domain |
| Harmless nonce file and live PID | Visible across both | Shared filesystem and process view |
| Graphical display | Different | Separate GUI lanes |
| Timed actions on different displays | Progressed concurrently | Cross-lane parallelism |
| A second action stream on one busy display | Queued, then ran | Same-lane serialization in that test |

The result was not “two VMs.” It was closer to **one host with multiple routed graphical lanes**. Separate displays prevented ordinary pointer and window collisions, but they did not protect mutually untrusted workers from shared files, processes, sockets, or credentials.

That leads to a general scheduling rule:

```text
different independent resources  -> run concurrently
same mutable resource             -> lease or serialize
unknown resource ownership        -> do not guess; inspect first
```

The same rule applies far beyond desktops:

- Two workers can investigate different modules in parallel.
- Two workers should not edit the same file without an ownership protocol.
- Two browser tabs may load independently, but actions within one stateful form are ordered.
- Two job applications can be prepared in parallel, but one account submission needs an idempotent duplicate check.

Built-in worktrees are valuable for exactly this reason: they convert one shared checkout into independent writable lanes. The coordinator can then merge at a deliberate boundary instead of accepting accidental last-writer-wins behavior.

## 4. Code is the control plane; agents are semantic workers

I also traced a code-mode browser workflow with two execution levels:

```text
model
  -> ephemeral orchestration program
      -> persistent adapter runtime
          -> browser SDK
              -> local browser service
                  -> real browser state
```

The outer program was intentionally short-lived. It could fan out independent calls, branch on results, filter large outputs, and decide what evidence to return. The inner runtime kept expensive handles - a browser binding or tab handle - alive across steps.

This split is useful because **workflow state and operational state have different lifetimes**. A disposable control program limits stale local variables. A scoped persistent adapter avoids reconnecting to the browser on every action. The real page still lives in the browser, so a JavaScript handle is only a reference and can become stale.

A sanitized sketch looks like this:

```javascript
const result = await tools.statefulAdapter({
  code: `
    const tabs = await Promise.all([
      browser.tabs.new(),
      browser.tabs.new(),
    ]);

    try {
      await Promise.all(tabs.map(tab => tab.goto(target)));
      const observations = await Promise.all(
        tabs.map(async tab => ({
          id: tab.id,
          title: await tab.title(),
          url: await tab.url(),
        }))
      );
      runtime.write(observations);
    } finally {
      await Promise.all(tabs.map(tab => tab.close()));
    }
  `,
});

forwardToModel(result);
```

The model chooses the strategy. Code makes the fan-out, join, and cleanup semantics explicit.

This is also where MCP fits. MCP standardizes how a runtime discovers and calls external capabilities; it does not replace the scheduler or define who owns a resource. A tool changes the world, a skill teaches a method, and a protocol connects the runtime to capabilities. Keeping those layers separate makes permissioning and evaluation much easier.

## 5. Dynamic workflows should become typed programs

Some tasks are truly exploratory: the model should discover the next step. Others repeat the same coordination pattern every run. Leaving those stable mechanics inside a coordinator's context wastes tokens and makes replay harder.

The progression I find useful is:

```text
goal -> discovered plan -> typed workflow -> deterministic replay
```

The goal remains the human-facing specification. The workflow encodes what has become stable:

- which stages can run in parallel;
- which stages form a pipeline;
- where a global barrier is necessary;
- retry and cancellation boundaries;
- resource leases;
- the schema of each result;
- the evidence required to advance.

The model should still wake up for ambiguity, exceptions, interpretation, and synthesis. It does not need to rediscover a `for` loop, a semaphore, or a join condition on every run.

This resembles the progression described in OpenAI's [Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/): an early orchestrator can be a session polling tasks and spawning agents, but reliability comes from making lifecycle and proof-of-work explicit in the harness.

## 6. Evidence-bearing joins beat majority vote

More agents do not automatically improve coverage or correctness. They can duplicate the same mistake faster.

For evaluation work, I use a conflict-preserving pattern:

```text
fan out independent measurements
  -> join by case without hiding disagreements
  -> consolidate across cases
  -> run deliberately decorrelated critics
  -> adjudicate disagreements against cited evidence
```

Each worker returns a small schema:

```yaml
claim: what the worker believes
evidence: exact artifact location or observable state
confidence: calibrated, not rhetorical
falsifier: what would prove the claim wrong
```

The `falsifier` field is more valuable than it first appears. It turns disagreement into the next experiment instead of a debate over which answer sounds more confident.

Anthropic reports a related orchestrator-worker architecture for research, with parallel subagents, adaptive search, and a separate citation stage. Their engineering write-up also describes the failure modes: vague delegation caused duplicated work and gaps, while clearer task boundaries and two levels of parallelism materially reduced latency on complex queries ([multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)).

The broader lesson is:

> Delegation distributes work. It does not define the stopping condition.

Define a shared invariant first, then verify it independently. A census stage can tell every worker how many items should exist, but an incorrect census only makes the team consistently wrong.

## 7. Long-running agents are distributed systems

If a turn can outlive an HTTP request, terminal, laptop connection, or context window, the runtime needs familiar distributed-systems properties:

- **Durable admission:** acknowledge work only after it has been recorded.
- **Idempotency:** retrying one logical request should not create a second external side effect.
- **Ordered events:** clients should resume after a cursor instead of replaying the universe.
- **Heartbeats and leases:** distinguish slow work from abandoned ownership.
- **Cancellation:** record whether cancellation was requested, delivered, and acknowledged.
- **Artifact persistence:** preserve useful work even if the final conversational answer is lost.
- **Typed terminal states:** completed, failed, cancelled, or waiting for a specific intervention.

Human takeover is a good stress test. A safe design pauses at a known boundary, persists the continuation, transfers an exclusive control lease, and re-observes the environment when the agent resumes. A changed screenshot is not proof that a lower-level executor revoked its lease. Instrument both the policy boundary and the action executor before claiming preemption.

OpenAI's description of Codex safety uses the same separation: sandbox boundaries, approval policy, network controls, and telemetry are distinct layers ([Running Codex safely at OpenAI](https://openai.com/index/running-codex-safely/)).

## 8. When a team helps - and when it hurts

A multi-agent design is a strong fit when:

- work can be divided into independent, meaningful slices;
- each slice has a narrow contract;
- workers benefit from fresh context or different tools;
- results can be checked independently;
- wall-clock latency matters enough to pay coordination cost.

A single agent or deterministic workflow is usually better when:

- the task is sequential;
- several workers would edit the same mutable artifact;
- decomposition is harder than the work;
- the result is subjective and has no verifier;
- token and coordination overhead dominate.

Claude Code's own agent-team documentation makes the same tradeoff explicit: teams are useful for research, competing debugging hypotheses, and cross-layer work, but add token and coordination overhead and are weaker for sequential or same-file tasks ([agent teams](https://code.claude.com/docs/en/agent-teams)).

## 9. The reference architecture I would build

I would make the following pieces explicit:

```text
Goal + policy
  -> coordinator
      -> typed task graph
      -> worker registry
      -> mailbox and wake-up semantics
      -> leases keyed by mutable resource
      -> bounded parallel workers
      -> evidence-bearing result store
  -> verifier checks artifact and external state
  -> accept, reopen, or escalate
```

The coordinator should be small enough to reason about. Workers should own separate contexts and artifacts. The task graph should expose dependencies instead of hiding them in prose. The verifier should inspect the world, not trust “success” in a model message.

That is the core shift from a clever demo to a dependable system: **the model proposes and interprets; the runtime owns coordination; the environment supplies evidence.**

## Closing thought

The best multi-agent systems I have seen do not feel like a room full of chatbots. They feel like a disciplined runtime for concurrent work.

The number of agents is almost an implementation detail. The architecture lives in the boundaries: which context is isolated, which state is shared, which resource has a lease, which message wakes a worker, which action can be retried, and which observation proves completion.

Once those boundaries are explicit, adding another agent can increase useful throughput. Before that, it mostly increases the number of ways the system can be confidently unfinished.

## References

- [Introducing the Codex app - OpenAI](https://openai.com/index/introducing-the-codex-app/)
- [Introducing Codex - OpenAI](https://openai.com/index/introducing-codex/)
- [Open-source Codex orchestration: Symphony - OpenAI](https://openai.com/index/open-source-codex-orchestration-symphony/)
- [Running Codex safely at OpenAI - OpenAI](https://openai.com/index/running-codex-safely/)
- [Orchestrate teams of Claude Code sessions - Anthropic](https://code.claude.com/docs/en/agent-teams)
- [How we built our multi-agent research system - Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Effective context engineering for AI agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Grok multi-agent mode - xAI](https://x.ai/grok)
