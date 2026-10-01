---
layout: essay
title: "Multi-agent systems: How models and harnesses evolve together"
date: 2026-09-03
modified: 2026-10-01
permalink: /multi-agent-routing/
author_profile: false
writing: true
read_time: true
comments: false
share: false
excerpt: "How agents divide work, share context, and communicate—and how these designs change as models improve."
tags:
  - AI agents
  - multi-agent systems
  - orchestration
---

{% include essay-toc.html %}

“Multi-agent” can mean very different things. A billing agent handing a customer over to a refund agent is one version [\[1\]](#ref-1). A group of agents working in parallel on a code change or a research question is another [\[2\]](#ref-2). And then there are teams with more persistent roles—a product manager, an engineer, a designer—each carrying its own context and responsibilities [\[3\]](#ref-3).

The model generates responses and proposes actions; the harness manages the process around it. This includes assembling context, executing tool calls, maintaining state, and evaluating results. Together, these mechanisms allow the model to work through a task across multiple interactions with its environment. [\[5\]](#ref-5)

Will the model “eat the harness”? [\[4\]](#ref-4) I don’t have a settled answer. My take is that model capability and harness design evolve together. Increasingly, we can let the model decide how to divide work, whom to contact, and what context to share.

This post traces the evolution of multi-agent design through changes in model training, model behavior, and the systems built around them. It examines Claude Code and Codex alongside Grok Bot and Muse across coding, research, and tasks that require browser or computer interaction. Across these systems and use cases, the focus is on how agents divide work, share context, and communicate. The central question is how these designs reflect both the capabilities of their models and the assumptions of their developers—and how that balance changes as models improve.

## How we got here: a brief history of multi-agent design

In late 2025, coding workflows commonly began with reviewing and agreeing on a plan before moving to implementation. The plan became a Markdown document that could carry the task into the next stage. Cursor supported planning with one model and building with another; Claude Code also offered an option to clear the conversation context while retaining the approved plan for implementation. [\[6\]](#ref-6) [\[7\]](#ref-7) The saved plan carried the agreed scope and decisions into implementation, even when the model or conversation context changed.

Breaking a project into smaller tasks gave the agent a plan, but it still needed a working environment where it could execute that plan and keep track of its progress. In Anthropic’s long-running coding experiments, Sonnet 4.5 sometimes began wrapping up as it approached its perceived context limit—a behavior they called “context anxiety.” Compaction alone was insufficient, so the harness used fresh sessions with structured handoffs and progress files to carry the work forward. A task list guided the coding agent through one feature at a time. [\[8\]](#ref-8) Compaction reduces the conversation context needed to continue, while the workspace preserves the files and results the agent can return to. [\[23\]](#ref-23)

This pattern extended beyond coding. Workflow builders such as n8n let users connect agents, tools, and control flow visually. [\[12\]](#ref-12) A concrete example is a financial-research workflow that combines planning, search, specialist analysis, report writing, and verification. [\[11\]](#ref-11) Deep research illustrates another arrangement: a lead agent can divide a question among subagents that investigate different aspects in parallel, then combine their findings into a report. [\[9\]](#ref-9) [\[10\]](#ref-10)

Why did these workflows take hold? In 2025, model releases highlighted coding performance on benchmarks such as SWE-bench Verified, where an agent receives an existing repository and a GitHub issue, and its changes are tested to see whether they resolve that issue. [\[13\]](#ref-13) [\[14\]](#ref-14) That is a concrete task to delegate, but resolving an issue does not establish that an agent can manage an entire project. Harnesses helped bridge that gap, giving developers a way to push models toward larger projects without requiring them to manage every part reliably on their own. Terminal-Bench 4.0 gives agents a terminal environment in which to complete tasks. [\[17\]](#ref-17) GDPval-AA provides shell access and web browsing for professional work—for example, producing a touring band’s stage-layout PDF with equipment placement and input/output lists. [\[18\]](#ref-18) The agent works from a specification, using tools and a workspace to produce the finished deliverable.

Trajectories generated inside a harness can then become training material. [\[16\]](#ref-16) DeepSeek-V3.2 illustrates how learning from specialist demonstrations is followed by learning from the model’s own attempts. After pre-training, the team develops specialist teachers from a common base checkpoint, using reinforcement learning to improve their performance in mathematics, coding, search, and other domains. Those teachers generate demonstrations, including long reasoning traces, which train a shared student through supervised fine-tuning. This distillation brings the specialists’ capabilities into one model, though John Schulman emphasizes that the transfer depends on a broad range of realistic prompts. Matching a teacher on easily verified tasks can still leave gaps in handling coding requests with multiple objectives and back-and-forth with a user. [\[15\]](#ref-15) [\[19\]](#ref-19) [\[26\]](#ref-26) The student then undergoes reinforcement learning with Group Relative Policy Optimization (GRPO): it generates multiple attempts at the same task, receives rewards for their results, and uses each attempt’s reward relative to the group average to update its weights. The emphasis shifts from imitating demonstrations toward exploring solutions through online reinforcement learning with verifiable rewards (RLVR), where success is checked against verifiable outcomes such as passing tests or correct answers. [\[15\]](#ref-15)

Training models to explore solutions and learn from feedback changes what we can leave for them to decide. Rather than prescribe every step, the harness can provide an objective, tools, constraints, and feedback, while the model chooses and revises its approach. Loops and goals support this arrangement by keeping work moving toward an objective across attempts. [\[20\]](#ref-20) [\[21\]](#ref-21)

This idea culminates in Karpathy’s auto-research, where the objective is to improve a language model’s validation performance. The agent change the model architecture, hyper-parameters, and training code, and run experiments within the training budget. [\[22\]](#ref-22) RLVR trains models to explore solutions using verifiable feedback, while the harness evolves to provide the tools, runtime, and tests that support this way of working. The harness defines what success means and how to measure it; the model decides how to get there.

If one agent can keep working toward a goal, why do we still need multiple agents? In a coding project, tracing a failing test and checking an API contract can happen in parallel, while validating a code change depends on the implementation being ready. A recent paper found that multiple agents improved performance on financial research such as merger analysis, with separate agents examining regulatory news, company filings, and operational impact, but performed worse on Minecraft crafting tasks, where each action changes the materials available for the next. [\[24\]](#ref-24) [\[25\]](#ref-25) A project can contain both kinds of work. The plans and workflows described earlier encoded our judgment about how to divide it. As models become more capable, how much of that judgment should we leave to them?

## How agents coordinate

As we discussed earlier, long-running agents need to delegate focused work without losing track of the larger objective. Delegation begins with deciding what another agent needs to know. In a fixed workflow, we specify what passes from one step to the next; with subagents, the main agent can make that choice. For example, when creating a subagent in Codex, the main agent passes its assignment through `message`. The `fork_turns` parameter controls how much of the parent’s conversation history the child inherits: all of it, the most recent turns, or none. [\[27\]](#ref-27) The subagent has its own conversational context, while a shared filesystem lets the agents exchange files and work on the same project. The main agent can wait for the result before continuing, or keep working while the subagent runs in the background. Claude Code supports foreground and background execution, depending on the session configuration; Codex separates spawning from waiting. [\[28\]](#ref-28) [\[29\]](#ref-29) This brings decisions we previously encoded in a harness into the agent’s own work: what to delegate, what context to pass, and when to wait.

Once agents are working, they need a shared record of tasks, ownership, and progress. Claude Code provides `TaskCreate`, `TaskGet`, `TaskList`, and `TaskUpdate` for this purpose. [\[30\]](#ref-30) [\[31\]](#ref-31) Coordinating access to that record introduces familiar distributed-systems problems. Cursor encountered locking and ownership problems when agents claimed shared work, then moved toward planners that assigned tasks to workers. [\[32\]](#ref-32) Anthropic’s compiler experiment used Git-synchronized lock files to claim tasks, without a central orchestrator or separate messaging mechanism. Tests checked results, while files preserved progress across sessions. [\[33\]](#ref-33) These designs give agents a common way to see what needs doing and who is responsible.

As models and harnesses evolve together, how much coordination should we leave to the model? My take is that we can prescribe less of the job list in advance and let agents discuss findings, react to changes, and revise assignments as they work. In Claude Code, subagents can use `SendMessage`, while background results return through completion notifications; teammates can also message one another. [\[28\]](#ref-28) [\[31\]](#ref-31) Codex’s multi-agent V2 lets the main agent inspect a child’s state, send new instructions, interrupt its work, or start another turn. The distinction between `send_message` and `followup_task` matters: a message alone does not restart an idle agent, while a follow-up does. The parent can use `wait_agent` to wait for progress messages, automatic completion notifications, user steering, or a timeout. [\[34\]](#ref-34) The harness provides the tools, while the model decides whom to contact, when to intervene, and how to move the project forward.

**Codex collaboration tools**

| Tool | What the main agent uses it for |
| --- | --- |
| `spawn_agent` | Start a child with an assignment and selected conversation history. |
| `list_agents` | Discover agents and inspect their current state. |
| `send_message` | Send information or direction; does not start a new turn for an idle agent. |
| `followup_task` | Send further work; starts a new turn if the agent is idle. |
| `interrupt_agent` | Stop the current turn while keeping the agent available for later work. |
| `wait_agent` | Wait for mailbox activity, user steering, or a timeout. |

[\[34\]](#ref-34)

The agent can also write the workflow itself. In Claude Code’s dynamic workflows, Claude writes JavaScript that coordinates subagents; the script holds the branches, loops, and intermediate results. Several research tasks can run in parallel, their results can feed into a review stage, and the script can repeat a step when a check fails. [\[35\]](#ref-35) Codex’s code mode likewise lets the model compose eligible tool calls in a program, with nested calls dispatched through the harness’s tool runtime. [\[36\]](#ref-36)

An outer `functions.exec` program can invoke `node_repl.js`, where the agent runs JavaScript against browser and desktop SDKs. Within that persistent Node runtime, it can open several tabs, search them in parallel, collect results, and execute dependent actions in sequence. Variables and application handles remain available between calls, while selected text and screenshots return to the model for further decisions. This connects workflow construction with application control: the agent writes both the orchestration and the browser operations within it. OpenAI’s computer-use documentation also describes grouping application actions into code with loops and conditional logic. [\[37\]](#ref-37)

<figure class="original-figure">
<a href="{{ "/assets/images/multi-agent/computer-control-original.png" | relative_url }}" target="_blank" rel="noopener"><img src="{{ "/assets/images/multi-agent/computer-control-original.png" | relative_url }}" alt="How Codex controls the computer"></a>
</figure>

## What’s next? A higher level abstraction

As agents take on longer tasks that might take humans hours to complete, leaving the MacBook lid open starts to feel undesirable. [\[38\]](#ref-38) Everyone wants to move their work to the cloud. ChatGPT Work, for example, runs the Codex harness in a VM-backed cloud sandbox. But running the harness there doesn’t bring your computer with it: local files, browser sessions, and network connections do not automatically follow. [\[39\]](#ref-39) More questions arise as the work runs: what survives after compaction? What happens when the execution environment fails or another agent takes over unfinished work? What needs to survive so the task can resume?

Anthropic’s Managed Agents design separates the session, harness, and execution environment. Conversation history lives in a durable session log, independently of the loop calling the model and the sandbox executing its tools. After a restart, that loop can recover the recorded history and continue. A failed sandbox can be replaced without erasing the session, although restoring its working files is a separate concern. Compaction reduces the history included in a model call without deleting the underlying log. This allows context management and orchestration to change as models improve, while preserving the session history and managing execution resources separately. [\[40\]](#ref-40)

Muse and Grok Bot put this work in the cloud. Their VM and container boundaries determine which resources belong to a user, which agents share, and which services remain outside the agents’ execution environment. A VM provides a separate machine with its own kernel; containers and processes divide the work within it. An agent’s separate desktop therefore does not necessarily mean it has a separate computer.

```text
MUSE                                    GROK BOT
──────────────────────────────────      ──────────────────────────────────
Per-user Linux VM                       Per-user Linux VM (microVM)
│                                       │
├── Linux container                     └── Linux container
│   │                                       │
│   ├── Hatch harness                       ├── Grok harness / Bots
│   │   ├── Main agent session              │   ├── Bot A + desktop A
│   │   └── Helper sessions                 │   └── Bot B + desktop B
│   │                                       │
│   └── Tools and workspace                 └── Shared files and logins
│
└── Protected services
    Outside the agent container
    ├── Sentinel permissions
    └── Credential storage

```

Grok Bot gives each user a persistent VM shared by their Bots. [\[41\]](#ref-41) Each Bot has separate desktop and browser processes within the shared Linux environment. They can work on different pages while accessing the same filesystem and shared website logins. Browser state is divided more selectively: profile directories and local storage are separate, while cookie and login storage are shared. Each Bot can maintain its own conversation and task context without rebuilding the working environment or signing into every service again.

Muse runs its Hatch harness, workspace, and agent-executed programs inside a Linux container, with credential storage, permission checks, and privileged connector workers outside it. Browser use is exposed as a delegated task: the calling agent passes a browsing objective to a specialist worker, which handles page interactions through a controlled browser service. Delegation does not require passing the stored credentials into the worker’s context; the protected services can supply them when needed. [\[42\]](#ref-42)

Connector access follows a related separation. Code inside the container requests an action, a protected worker executes it, and a separate permission service decides whether it is allowed. The agent deciding what to do, the environment performing the work, and the services holding account access have different responsibilities. Meta’s Muse architecture shows how those responsibilities can be separated while still allowing the agents to work with shared resources. [\[42\]](#ref-42)

## What we learned and what comes next

Subagents are unsexy: the basic design looks much like it did six months ago. Yet the same patterns now support longer coding tasks and experiments that combine browser work, backend analysis, and validation.

**What we learned**

- A main agent manages the overall objective, interacts with the user, and delegates work.
- Heavy tasks or work requiring different context fit naturally into background agents.
- Messages coordinate the work, while shared files preserve findings and progress across sessions.
- Delegation is straightforward; getting agents to debate and agree on a good design without human steering remains unreliable.

**What we predict**

- Workers will discover each other’s state and coordinate directly, without the main agent directing every exchange.
- Agents will resolve more design disagreements through discussion and testing, with less human intervention.
- Dynamic workflows will move validation earlier: we establish test contracts, constraints, and approval boundaries, and agents write the coordination and checks that let them explore larger tasks.

## References

1. <span id="ref-1"></span>OpenAI. [Orchestration and handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration).
2. <span id="ref-2"></span>Kimi. [Kimi Agent Swarm: 100 Sub-Agents at Scale](https://www.kimi.ai/blog/agent-swarm).
3. <span id="ref-3"></span>Kevin Niparko. [Grok Bot for PMs](https://x.ai/bot/guides/grok-bot-for-pms).
4. <span id="ref-4"></span>Sequoia Capital. [Google DeepMind’s Logan Kilpatrick: Why the Model Eats the Harness](https://sequoiacap.com/podcast/google-deepminds-logan-kilpatrick-why-the-model-eats-the-harness).
5. <span id="ref-5"></span>Lilian Weng. [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/).
6. <span id="ref-6"></span>Cursor. [New Coding Model and Agent Interface](https://cursor.com/changelog/2-0).
7. <span id="ref-7"></span>Claude Code issue tracker. [Undocumented “Clear Context” transition options in Plan Mode](https://github.com/anthropics/claude-code/issues/19426).
8. <span id="ref-8"></span>Prithvi Rajasekaran. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps).
9. <span id="ref-9"></span>Anthropic. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
10. <span id="ref-10"></span>Kevin Alwell and Glory Jain. [Introduction to the Deep Research API with the Agents SDK](https://developers.openai.com/cookbook/examples/deep_research_api/introduction_to_deep_research_api_agents).
11. <span id="ref-11"></span>OpenAI. [Financial research agent example](https://github.com/openai/openai-agents-python/tree/main/examples/financial_research_agent).
12. <span id="ref-12"></span>n8n. [Documentation](https://docs.n8n.io/).
13. <span id="ref-13"></span>Anthropic. [Introducing Claude Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5).
14. <span id="ref-14"></span>SWE-bench team. [SWE-bench benchmarks and leaderboards](https://www.swebench.com/).
15. <span id="ref-15"></span>DeepSeek-AI. [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/html/2512.02556v1#S3).
16. <span id="ref-16"></span>Binfeng Xu et al. [Polar: Agentic RL on Any Harness at Scale](https://arxiv.org/html/2605.24220v1).
17. <span id="ref-17"></span>Harbor Hub. [Terminal-Bench 4.0](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=tasks).
18. <span id="ref-18"></span>Artificial Analysis. [GDPval-AA](https://artificialanalysis.ai/evaluations/gdpval-aa).
19. <span id="ref-19"></span>Nathan Lambert and Finbarr Timbers. [Frontier post-training recipe review with Finbarr Timbers](https://www.interconnects.ai/p/frontier-post-training-recipe-review).
20. <span id="ref-20"></span>Geoffrey Huntley. [Ralph](https://ghuntley.com/ralph/).
21. <span id="ref-21"></span>OpenAI. [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex).
22. <span id="ref-22"></span>Andrej Karpathy. [autoresearch](https://github.com/karpathy/autoresearch).
23. <span id="ref-23"></span>OpenAI. [Compaction](https://developers.openai.com/api/docs/guides/compaction).
24. <span id="ref-24"></span>Yubin Kim et al. [Towards a Science of Scaling Agent Systems](https://arxiv.org/html/2512.08296v2).
25. <span id="ref-25"></span>Gautier Dagan, Frank Keller, and Alex Lascarides. [Plancraft: an evaluation dataset for planning with LLM agents](https://arxiv.org/abs/2412.21033).
26. <span id="ref-26"></span>Dwarkesh Patel, John Schulman, Beren Millidge, and Charlie O’Neill. [AI researchers debate how close we are to recursive self-improvement](https://www.dwarkesh.com/p/john-beren-charlie).
27. <span id="ref-27"></span>OpenAI. [Codex source: spawn assignment and conversation-history parameters](https://github.com/openai/codex/blob/322d5b96cfa5c8fd52bd83ecfdb79cd9b330205f/codex-rs/core/src/tools/handlers/multi_agents_spec.rs#L631).
28. <span id="ref-28"></span>Anthropic. [Create custom subagents](https://code.claude.com/docs/en/sub-agents).
29. <span id="ref-29"></span>OpenAI. [Codex source: multi-agent V2 spawn implementation](https://github.com/openai/codex/blob/322d5b96cfa5c8fd52bd83ecfdb79cd9b330205f/codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs#L104).
30. <span id="ref-30"></span>Anthropic. [Track todos](https://code.claude.com/docs/en/agent-sdk/todo-tracking).
31. <span id="ref-31"></span>Anthropic. [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams).
32. <span id="ref-32"></span>Wilson Lin. [Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents).
33. <span id="ref-33"></span>Nicholas Carlini. [Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler).
34. <span id="ref-34"></span>OpenAI. [Codex source: collaboration-tool definitions](https://github.com/openai/codex/blob/322d5b96cfa5c8fd52bd83ecfdb79cd9b330205f/codex-rs/core/src/tools/handlers/multi_agents_spec.rs).
35. <span id="ref-35"></span>Anthropic. [Orchestrate subagents at scale with dynamic workflows](https://code.claude.com/docs/en/workflows).
36. <span id="ref-36"></span>OpenAI. [Codex source: nested tool dispatch in code mode](https://github.com/openai/codex/blob/322d5b96cfa5c8fd52bd83ecfdb79cd9b330205f/codex-rs/core/src/tools/code_mode/mod.rs#L293).
37. <span id="ref-37"></span>OpenAI. [Computer use](https://developers.openai.com/api/docs/guides/tools-computer-use).
38. <span id="ref-38"></span>METR. [Task-Completion Time Horizons of Frontier AI Models](https://metr.org/time-horizons/).
39. <span id="ref-39"></span>OpenAI. [ChatGPT Work cloud security](https://learn.chatgpt.com/docs/enterprise/chatgpt-work-cloud-security).
40. <span id="ref-40"></span>Anthropic. [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents).
41. <span id="ref-41"></span>SpaceXAI. [Grok Bot for teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises#architecture).
42. <span id="ref-42"></span>Meta. [How We Built Safety Into Muse](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse).
{: .reference-list}
