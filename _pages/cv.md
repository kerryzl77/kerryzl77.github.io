---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
classes: wide
toc: false
---

{% include base_path %}

**Zikai (Kerry) Liu**  
San Francisco, California · (650) 613-8398 · [liuzikai0216@gmail.com](mailto:liuzikai0216@gmail.com) · [Website](https://kerryzl77.github.io) · [LinkedIn](https://www.linkedin.com/in/ZikaiLiu) · [GitHub](https://github.com/kerryzl77)

## Focus

I build production AI agents and the infrastructure that makes them reliable: tool execution, retrieval, sandboxed computation, structured outputs, citations, tracing, evaluation, and cost/latency controls.

## Work experience

**FurtherAI (a16z, YC), San Francisco** - AI Engineer (Feb 2026 - Present)

- First agent-team hire; led the 0-to-1 development of a full-stack extraction agent across a TypeScript/React UI, Python runtime, tool use, and structured-output validation; adopted in roughly 95% of customer workflows and powering tens of thousands of monthly runs.
- Architected complexity-aware routing across one-shot, retrieval, and sandboxed file-system agents for PDFs, email, and spreadsheets, reducing inference cost 75-80% versus specialist vendors at comparable accuracy.
- Built sentence- and cell-level citations for multimodal outputs, with schema constraints and validation across UI, save-time, and runtime layers.
- Created a rigorous evaluation suite and led a 10-person FDE effort spanning document, schema, and semantic complexity; converted controlled trials into CI regression gates and live model/runtime routing.
- Co-developed a persistent sandbox SDK and tracing across two agent runtimes, enabling pause/resume sessions, headless extraction, multi-provider retries/timeouts, and versioned traces for more than one million monthly tool calls.

**Articul8 AI (Intel spinout), Santa Clara** - AI/ML Engineer (Jun 2025 - Feb 2026)

- First AI/ML engineering hire; built a reusable ReAct Text-to-SQL service that converted user intent into an intermediate representation and generated traceable SQL and query-linked charts, reused across 5-7 customer demonstrations and advancing the initial account toward a proof of concept.
- Benchmarked DuckDB and ClickHouse, connected SQL, MongoDB, Google Drive, Salesforce, and Parquet data, and partnered with infrastructure engineers to deploy the analytics microservice on Kubernetes.
- Led multimodal document understanding and co-developed a Ray ingestion pipeline processing roughly 20 PDFs per minute with multi-tenant connectors across Google Drive, SharePoint, Snowflake, and S3/Parquet.

**Amazon, London** - Business Analyst Intern (May 2023 - Sep 2023)

- Engineered a distributed LightGBM model on SageMaker predicting fulfillment-center shutdown volume drops (roughly 5% MAPE, +340 bps T3W test), directly informing staffing and shipment planning.

## Selected work

- [Agent Orchestration Is a Routing Problem, Not a Prompting Trick](/multi-agent-routing/) - worker topologies, mailboxes, dynamic workflows, leased computer sessions, and evidence-bearing joins.
- [The Agent Loop Explained: How Modern LLM Apps Orchestrate Tools](/agent-loop/) - tools, state, MCP, routing, delegation, tracing, and sandboxed coding agents, with runnable OpenAI and Claude SDK examples.
- [DeepBrief](https://github.com/kerryzl77/deepbrief) - an automated pipeline for source discovery, grounded analysis, verification, PDF reports, and feedback-driven prompt experiments.

## Education

**University of California, Berkeley** - MEng, Industrial Engineering & Operations Research (Aug 2024 - May 2025)
GPA 3.9/4.0 · Fung Scholarship · Natural Language Processing (TA) · Computer Vision (PhD)

**University of St Andrews** - MA (Honours), Mathematics (Sep 2020 - Jun 2024)
GPA 3.8/4.0 · Machine Learning · Bayesian Statistics · Stochastic Processes

## Technical skills

- **Languages and product:** Python, TypeScript/JavaScript, SQL, React, FastAPI
- **Agents and AI:** OpenAI and Claude Agent SDKs, MCP, tool calling, RAG, structured outputs, evaluation, Braintrust, PyTorch, Hugging Face
- **Systems:** Kubernetes, Docker, E2B, Ray, AWS, GCP, CI/CD, vector databases, DuckDB
