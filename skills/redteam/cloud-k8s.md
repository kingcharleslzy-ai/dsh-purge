---
name: cloud-k8s
description: 【内网】云与 K8s 攻击面：metadata、AK/SK、K8s API/kubelet/etcd、容器逃逸、云控制面与对象存储（awscli/az/gcloud/kubectl）
whenToUse: 内网/云主机/容器里发现云凭证、metadata、K8s 集群、对象存储或云控制面，需要判断能否横向/提权时
role: internal
category: 内网
tags: [cloud, k8s, metadata, container]
enabled: true
---

# 云 / K8s 攻击面

> 先只读：列权限、读 metadata、查 API 是否未授权；**不要删资源、不要停实例、不要改 IAM**。所有写操作先备份/记录原值。

## 前置与工具

| 工具 | 用途 |
| --- | --- |
| `aws` / `az` / `gcloud` | 云 CLS 与凭证验证 |
| `kubectl` | K8s API / kubeconfig / token |
| `kube-hunter` / `kube-bench` | 集群暴露面与配置检查 |
| `curl` / `jq` | metadata、API、对象存储 |
| `docker` / `crictl` | 容器内枚举 |

未安装时用 `command -v` 确认；缺 CLI 就写 `needs`，不要手搓云签名。

## 先找凭证

- 环境变量：`AWS_*`、`AZURE_*`、`GOOGLE_*`、`KUBECONFIG`；
- 文件：`~/.aws/credentials`、`~/.azure/`、`~/.config/gcloud/`、`/var/run/secrets/kubernetes.io/serviceaccount/token`；
- CI/CD、容器 env、应用配置、备份、日志里的 AK/SK；
- 找到后先 `aws sts get-caller-identity` / `az account show` / `gcloud auth list` 确认身份与权限，**不要直接批量操作**。

## Metadata（只读）

```bash
# AWS
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>
# Azure（必须带 Metadata:true）
curl -s -H Metadata:true 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'
# GCP
curl -s -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
```

- 先证明能拿到 token/身份即可；不要为了“证明”去创建资源。
- 云上主机/容器按 `cloud-platform` 记分；AK/SK 批量控制默认只算节点分，除非能证明管理员权限。

## K8s

```bash
kubectl --token=<sa-token> --server=https://<api>:6443 --insecure-skip-tls-verify get nodes
kubectl auth can-i --list
# 常见暴露：6443 API、10250 kubelet、2379 etcd、dashboard、metrics
curl -k https://<api>:6443/version
curl -k https://<node>:10250/pods
```

- 关注：匿名/未授权 API、service account 权限、privileged/hostPath/hostNetwork Pod、挂载 docker.sock、可读 Secret；
- 容器逃逸优先只读证明（挂载、cap、hostPID），不要破坏宿主；
- K8s 控制面/节点按 `cloud-platform` / `server-host`；模型/算力集群按 `model-compute`。

## 对象存储 / 数据

- S3/OSS/MinIO：先 `list` 证明可读，再抽样 1–3 个对象；**不要全量下载**；
- 发现三要素/敏感数据时用 `redteam_data_proof` 记录字段/条数/样本；
- 文件存储/备份按 `file-storage`，数据量按 G2。

## 证据与记分

- 资产：`redteam_asset_add` / `redteam_batch kind=assets`（云主机、API、对象存储）；
- 凭证：`redteam_credential_add`（AK/SK、token、kubeconfig）；
- 得分：`cloud-platform`、`server-host`、`model-compute`、`file-storage`；命令/回显写进 `score_hit` 的 `command`/`result`；
- 边界：跨云/跨账号进入主防单位内网才考虑 `boundary-*`，按四问提供证据。

## OPSEC 与边界

- 不删实例/桶/Secret，不改 IAM，不停 Pod；
- API 限速，先 `get/list` 再考虑写；对象存储只抽样；
- 云凭证只从 env/文件读，禁止写进命令行/报告/会话输出；
- 清理自己创建的 token/文件/容器，登记 `redteam_cleanup`。

## 交接

回报：云厂商/账号/角色、K8s 权限、可达的云资源、数据字段与条数、未打通的卡点；`needs` 写清缺的 CLI/凭证/授权。
