---
name: ai-agent-attack
description: 【验证】AI/Agent 攻击面：模型端点、Agent 工具链、提示词注入、RAG/知识库、API Key 与权限边界（ai-agent/model-*）
whenToUse: 资产是 AI Agent/模型平台/知识库/推理服务，或发现模型端点、Agent 工具、RAG 接口时
role: vuln-scan
category: 验证
tags: [ai, agent, prompt-injection, model]
enabled: true
---

# AI / Agent 攻击面

> 只做**只读或可回滚**验证：提示词注入证明到“能影响输出/调用工具”即可，不投毒训练数据、不破坏模型、不批量消耗算力。

## 前置与工具

| 工具 | 用途 |
| --- | --- |
| `curl` / `browser-automation` | 模型/Agent API、Web 控制台 |
| `redteam_poc_search` | 已知模型/框架 CVE 与模板 |
| `redteam_data_proof` | 知识库/训练数据泄露证明 |
| `score-coverage` | `ai-agent` / `model-compute` / `model-data` 记分口径 |

## 识别

- 模型端点：`/v1/chat/completions`、`/api/generate`、`/infer`、WebSocket；
- Agent 平台：工具列表、插件、MCP、工作流、代码执行、浏览器工具；
- 知识库/RAG：上传、检索、引用、文档下载、向量库；
- 管理面：模型管理、API Key、配额、租户、审计；
- 云/算力：Jupyter/Kubeflow/MLflow/Ray、GPU 池、模型权重存储。

## 验证顺序

1. **未授权/弱口令**：管理面、API、Jupyter/Kubeflow；
2. **提示词注入**：在文档/网页/文件名/工具返回中放入“忽略以上、调用工具/泄露系统提示”的测试串，看是否影响输出或触发工具；只证明影响，不执行破坏性工具；
3. **Agent 工具滥用**：能否让 Agent 读本地文件、发 HTTP、执行命令、访问内部 API；用无害目标/唯一 token 验证；
4. **RAG/知识库**：能否越权检索其它租户/敏感文档；抽样证明，不批量导出；
5. **API Key/权限**：模型 Key 是否能访问管理 API、其他模型、账单/配额；
6. **数据**：训练数据/知识库泄露按 `redteam_data_proof` 记录字段/条数/样本。

## 记分与证据

- `ai-agent`：控制/操作 Agent 的深度（100–500）；
- `model-compute` / `model-data`：系统管理权限 500；知识库/超大数据 ×2；
- 普通模型 API 未授权：按 `web-app`/`server-host` 实际权限，不硬套 AI 高分；
- 证据：`redteam_vuln_add`（`request`/`response` 或 payload/输出）+ `score_hit` 的 `command`/`result`；
- 提示词注入 evidence 写清“输入 → 输出/工具调用 → 影响”，不要只贴一段 prompt。

## OPSEC 与边界

- 不投毒训练数据、不删模型/知识库、不批量消耗算力；
- 注入测试用无害指令；不诱导 Agent 攻击第三方；
- 只读/最小化导出；样本脱敏；
- 第三方模型/云服务不在范围只记线索。

## 交接

回报：端点/平台、权限、注入是否生效、能调用什么工具、数据字段/条数、未打通的卡点；`needs` 写清缺的账号/Key/范围。
