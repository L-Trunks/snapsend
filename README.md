<div align="center">

# ⚡ SnapSend

**匿名临时文件与文本分享平台**

像快递柜一样简单 — 存件、拿码、取件

[问题反馈](https://github.com/L-Trunks/snapsend/issues) · [功能建议](https://github.com/L-Trunks/snapsend/issues)

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

</div>

---

## 目录

- [项目介绍](#项目介绍)
- [功能特性](#功能特性)
- [截图预览](#截图预览)
- [技术架构](#技术架构)
- [VPS 部署教程](#vps-部署教程)
  - [环境准备](#一环境准备)
  - [获取代码](#二获取代码)
  - [配置文件](#三配置文件)
  - [启动服务](#四启动服务)
  - [配置域名与 HTTPS](#五配置域名与-https)
  - [防火墙设置](#六防火墙设置)
  - [验证部署](#七验证部署)
  - [更新升级](#八更新升级)
  - [常用运维命令](#九常用运维命令)
- [本地开发](#本地开发)
- [配置参考](#配置参考)
- [API 文档](#api-文档)
- [数据目录结构](#数据目录结构)
- [隐私说明](#隐私说明)
- [开源协议](#开源协议)

---

## 项目介绍

**SnapSend** 是一个自托管的匿名临时文件与文本分享工具。核心理念为"无需登录，即传即取"：

1. 发送方上传文件或粘贴文本，系统生成 **6 位取件码**
2. 接收方在任意设备输入取件码，即可下载文件或复制文本
3. 内容到期后**自动从磁盘物理删除**，不留痕迹

适用场景：跨设备传文件、快速分享代码片段、临时传递敏感文档（到期自动销毁）、无法使用通讯软件时的快速传输。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 文件上传 | 拖拽/点击，支持所有格式，单文件最大 1GB，多文件共享一个取件码 |
| 分片上传 | 2MB 分片上传，大文件可靠传输，实时显示速度与剩余时间 |
| 文本分享 | 粘贴文本或代码片段，支持文件+文本混合分享 |
| 取件码 | 6 位大写字母/数字，排除易混淆字符（0/O/1/I） |
| 二维码 | 自动生成取件二维码，手机扫码直达取件页 |
| 直接链接 | 生成形如 `https://your.domain/A3K9X2` 的直链，一键复制 |
| 自动过期 | 1小时/6小时/1天/3天/7天可选，到期自动删除，不可恢复 |
| 取件密码 | 可选密码保护，防止他人偶然获取 |
| 取件次数 | 可限制最大取件次数（如仅允许下载 1 次） |
| 自定义取件码 | 可指定自定义码（如 `MYCODE`），未被占用则生效 |
| 主动删除 | 发送方持有 delete_token，可随时删除分享 |
| 打包下载 | 多文件支持逐个下载或一键 ZIP 打包下载 |
| 暗色/亮色模式 | 默认暗色，支持手动切换或跟随系统偏好 |
| 响应式设计 | 完全适配移动端，支持拍照直接上传 |
| 双语界面 | 中文/English 一键切换 |
| 防爆破保护 | 取件码连续错误 5 次后锁定 IP 10 分钟 |
| 上传限流 | 单 IP 每小时最多上传 20 次 |
| 管理后台 | 查看活跃分享数、存储用量、最近记录，支持手动触发清理 |
| 自动清理 | 后台定时任务每 10 分钟扫描删除过期内容 |
| API 文档 | 内置 Swagger UI，自动生成 OpenAPI 文档 |

---

## 截图预览

> 暗色模式（默认）

```
┌─────────────────────────────────────────┐
│   ⚡ SnapSend    无需登录，即传即取       │
│                                         │
│   [ 📤 发送 ]     [ 📥 取件 ]           │
│                                         │
│   ┌─ 拖拽文件至此，或点击选择 ─────────┐  │
│   │                                    │  │
│   │         ⬆  上传区域                │  │
│   │                                    │  │
│   └────────────────────────────────────┘  │
│   或者粘贴文本...                         │
│   有效期: [1小时] [6小时] [1天✓] [3天]   │
│                                         │
│   [ 生成取件码 ]                         │
└─────────────────────────────────────────┘
```

> 取件码展示

```
        您的取件码

        A 3 K 9 X 2

    [ 复制取件码 ]  [ 扫码取件 ]  [ 复制链接 ]

    https://your.domain/A3K9X2
    有效期至：2026-03-27 18:00
```

---

## 技术架构

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   浏览器     │───▶│    Nginx    │───▶│  Frontend   │
│  (用户端)    │    │  (反向代理)  │    │  Next.js 15 │
└─────────────┘    └──────┬──────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Backend   │───▶│   SQLite    │
                   │  FastAPI    │    │  数据库      │
                   └──────┬──────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  本地磁盘   │
                   │ /data/files │
                   └─────────────┘
```

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 + TailwindCSS + TypeScript |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy (async) |
| 数据库 | SQLite（via aiosqlite） |
| 文件存储 | 本地磁盘（bind mount） |
| 定时任务 | APScheduler |
| 部署 | Docker Compose + Nginx |

---

## VPS 部署教程

### 一、环境准备

**最低配置要求**

| 项目 | 最低要求 |
|------|----------|
| CPU | 1 核 |
| 内存 | 512 MB |
| 磁盘 | 10 GB（根据存储需求扩展） |
| 系统 | Ubuntu 20.04 / 22.04 / Debian 11+ |

**安装 Docker 与 Docker Compose**

```bash
# Ubuntu / Debian 一键安装 Docker
curl -fsSL https://get.docker.com | sh

# 将当前用户加入 docker 组（免 sudo 使用 docker）
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

> 如果 `get.docker.com` 访问受限，可使用国内镜像：
> ```bash
> curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
> # 或直接用宝塔面板安装 Docker
> ```

---

### 二、获取代码

**方式 A：Git 克隆（推荐）**

```bash
# 克隆到 /opt/snapsend
git clone https://github.com/L-Trunks/snapsend.git /opt/snapsend
cd /opt/snapsend
```

**方式 B：手动上传**

将项目文件夹通过 SFTP（FileZilla、WinSCP 等）上传至服务器，例如 `/opt/snapsend`。

```bash
cd /opt/snapsend
```

---

### 三、配置文件

**1. 创建 `.env` 文件**

```bash
cp .env.example .env
nano .env   # 或 vim .env
```

修改以下关键参数：

```env
# 将 your-domain.com 替换为你的真实域名或 IP
BASE_URL=https://your-domain.com

# 允许跨域的来源（通常与 BASE_URL 一致）
ALLOWED_ORIGINS=https://your-domain.com
```

**2. 修改 `config.yaml`**

```bash
nano config.yaml
```

关键配置项：

```yaml
server:
  base_url: https://your-domain.com  # ← 必须修改为你的域名

share:
  max_file_size: 1073741824  # 单文件最大 1GB，按需调整
  max_expire: 604800         # 最大有效期 7 天

storage:
  local_path: ./data/files   # 文件存储路径（容器内）
  cleanup_interval: 600      # 清理间隔 10 分钟

security:
  rate_limit_upload: 20      # 单 IP 每小时上传次数
  max_code_attempts: 5       # 取件码最大错误次数
```

**3. 创建数据目录并设置权限**

```bash
mkdir -p data/files data/tmp
chmod 755 data
```

---

### 四、启动服务

```bash
# 构建镜像并在后台启动所有服务
docker compose up -d --build

# 查看启动状态（所有服务应为 Up）
docker compose ps
```

预期输出：

```
NAME                IMAGE               STATUS
snapsend-backend    snapsend-backend    Up (healthy)
snapsend-frontend   snapsend-frontend   Up
snapsend-nginx      nginx:alpine        Up
```

> **首次构建**需要下载依赖，根据服务器网络情况可能需要 3–10 分钟。

```bash
# 实时查看启动日志
docker compose logs -f

# 只看后端日志
docker compose logs -f backend
```

---

### 五、配置域名与 HTTPS

强烈建议为生产环境配置 HTTPS，防止传输内容被中间人截取。

#### 方式 A：使用宿主机 Nginx + Certbot（推荐）

**第一步：停止容器内的 Nginx（改用宿主机 Nginx）**

修改 `docker-compose.yml`，将 nginx 服务的端口改为只监听本地：

```yaml
  nginx:
    ports:
      - "127.0.0.1:8888:80"   # 改为只监听本地 8888 端口
```

然后重启：

```bash
docker compose up -d
```

**第二步：安装宿主机 Nginx 和 Certbot**

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

**第三步：申请 SSL 证书**

```bash
sudo certbot --nginx -d your-domain.com
# 按提示输入邮箱，同意条款，选择自动重定向 HTTP → HTTPS
```

**第四步：配置宿主机 Nginx**

```bash
sudo nano /etc/nginx/sites-available/snapsend
```

写入以下内容（Certbot 会自动添加 SSL 配置）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    # Certbot 会自动添加 return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书（由 Certbot 自动填写）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 支持大文件上传（关键！）
    client_max_body_size 1G;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # 所有请求转发至容器内 Nginx
    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/snapsend /etc/nginx/sites-enabled/
sudo nginx -t    # 检查配置语法
sudo systemctl reload nginx
```

**第五步：设置证书自动续期**

```bash
# 测试自动续期
sudo certbot renew --dry-run

# Certbot 安装时已自动添加定时任务，无需手动配置
```

---

#### 方式 B：使用 Cloudflare（更简单）

1. 将域名 DNS 托管到 Cloudflare
2. 添加 A 记录指向你的服务器 IP，**开启橙色云朵（代理模式）**
3. Cloudflare 自动提供 HTTPS，无需服务器配置证书
4. 在 Cloudflare SSL/TLS 设置中选择 **Flexible** 或 **Full** 模式

> 注意：使用 Cloudflare 代理后，`nginx.conf` 中获取真实 IP 需要配置 Cloudflare IP 段的 `real_ip` 模块（可选）。

---

#### 方式 C：直接使用 IP 访问（仅测试）

不配置域名和 HTTPS，直接通过 `http://服务器IP` 访问。**不建议用于生产环境**，浏览器会提示不安全。

修改配置文件中的 `BASE_URL`：

```env
BASE_URL=http://123.456.789.000   # 替换为你的服务器公网 IP
```

---

### 六、防火墙设置

确保开放必要端口：

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp      # SSH（必须，防止锁死）
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

> 如果你直接暴露 Docker 端口（不使用宿主机 Nginx），还需要开放 8080 和 3000 端口，但**不推荐**此方式用于生产环境。

云服务器（阿里云/腾讯云/AWS 等）还需要在控制台**安全组**中开放 80 和 443 端口。

---

### 七、验证部署

```bash
# 1. 检查所有容器状态
docker compose ps

# 2. 测试后端健康接口
curl http://localhost:8080/api/health
# 预期：{"status":"ok","version":"1.0.0"}

# 3. 测试 API（创建一条文本分享）
curl -X POST http://localhost:8080/api/share \
  -H "Content-Type: application/json" \
  -d '{"text_content":"Hello SnapSend!","expire_seconds":3600,"max_downloads":0}'

# 4. 访问前端
curl -I http://localhost:3000
# 预期 HTTP 200

# 5. 通过域名访问（配置域名后）
curl -I https://your-domain.com
```

一切正常后，用浏览器打开 `https://your-domain.com` 即可开始使用。

---

### 八、更新升级

```bash
cd /opt/snapsend

# 拉取最新代码
git pull

# 重新构建并重启（数据不丢失）
docker compose up -d --build

# 查看是否全部恢复正常
docker compose ps
```

> `data/` 目录通过 bind mount 挂载在宿主机，更新不会影响已存储的文件和数据库。

---

### 九、常用运维命令

```bash
# 查看所有容器状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 只看某个服务的日志
docker compose logs -f backend
docker compose logs -f frontend

# 重启某个服务
docker compose restart backend

# 停止所有服务
docker compose down

# 停止并删除所有数据（慎用！）
docker compose down -v
rm -rf data/

# 手动触发清理过期分享
curl -X POST http://localhost:8080/api/admin/cleanup

# 查看存储占用和统计
curl http://localhost:8080/api/admin/stats

# 进入后端容器调试
docker exec -it snapsend-backend bash

# 备份数据库
cp data/snapsend.db data/snapsend.db.bak.$(date +%Y%m%d)

# 备份所有数据
tar -czf snapsend-backup-$(date +%Y%m%d).tar.gz data/
```

---

### 常见问题排查

**Q：容器启动失败，状态为 unhealthy**

```bash
# 查看详细错误
docker compose logs backend
# 检查健康检查结果
docker inspect snapsend-backend | grep -A 10 Health
```

**Q：上传大文件时报 413 错误**

确认 Nginx 配置了 `client_max_body_size 1G;`。项目自带的 `nginx.conf` 已包含此配置，宿主机 Nginx 需手动添加。

**Q：取件链接中的域名不正确（显示 localhost）**

修改 `config.yaml` 中的 `server.base_url` 和 `.env` 中的 `BASE_URL` 为你的实际域名，然后重启：

```bash
docker compose restart backend
```

**Q：前端无法访问后端 API（CORS 错误）**

确认 `.env` 中的 `ALLOWED_ORIGINS` 包含前端实际访问的域名：

```env
ALLOWED_ORIGINS=https://your-domain.com
```

**Q：磁盘空间不足**

```bash
# 查看磁盘使用
df -h
du -sh data/files/*  # 查看各分享占用

# 手动清理过期内容
curl -X POST http://localhost:8080/api/admin/cleanup
```

---

## 本地开发

**后端（Python 3.11+）**

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate      # Linux/macOS
# 或 venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 启动（带热重载）
CONFIG_PATH=../config.yaml uvicorn app.main:app --reload --port 8080
```

API 交互文档：http://localhost:8080/api/docs

**前端（Node.js 20+）**

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

前端地址：http://localhost:3000

**Windows 快速启动**

```powershell
.\start-dev.ps1
```

---

## 配置参考

编辑根目录 `config.yaml`（所有参数均可通过同名环境变量覆盖）：

```yaml
server:
  port: 8080
  host: 0.0.0.0
  base_url: https://your-domain.com   # ← 必填，影响取件链接和二维码

share:
  code_length: 6                      # 取件码长度
  code_charset: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 字符集（排除易混淆字符）
  max_file_size: 1073741824           # 单文件最大 1GB
  max_files_per_share: 10             # 每次分享最多文件数
  max_text_size: 5242880              # 文本最大 5MB
  default_expire: 86400               # 默认有效期 1 天
  max_expire: 604800                  # 最大有效期 7 天

storage:
  type: local                         # 存储类型（目前仅支持 local）
  local_path: ./data/files            # 文件存储路径
  cleanup_interval: 600               # 清理间隔（秒）

security:
  rate_limit_upload: 20               # 单 IP 每小时上传次数上限
  rate_limit_query: 60                # 单 IP 每分钟查询次数上限
  max_code_attempts: 5                # 取件码最大连续错误次数
  lockout_duration: 600               # IP 锁定时长（秒）
  enable_password: true               # 是否允许设置取件密码
  enable_custom_code: true            # 是否允许自定义取件码
```

---

## API 文档

启动后访问 Swagger UI：`http://your-domain.com/api/docs`

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/upload/init` | 初始化分片上传，返回 upload_id |
| `PUT` | `/api/upload/chunk/{id}/{n}` | 上传第 n 个分片（binary body） |
| `GET` | `/api/upload/status/{id}` | 查询上传进度 |
| `POST` | `/api/share` | 创建分享（传入 upload_ids + 配置） |
| `GET` | `/api/share/{code}` | 查询分享信息（不含文件内容） |
| `POST` | `/api/share/{code}/verify` | 验证取件密码 |
| `GET` | `/api/share/{code}/download/{fileId}` | 下载单个文件（流式） |
| `GET` | `/api/share/{code}/download-all` | 打包下载所有文件（ZIP 流式） |
| `DELETE` | `/api/share/{code}` | 删除分享（需 delete_token） |
| `GET` | `/api/admin/stats` | 获取系统统计数据 |
| `POST` | `/api/admin/cleanup` | 手动触发清理过期内容 |
| `GET` | `/api/health` | 健康检查 |

---

## 数据目录结构

```
data/
├── snapsend.db              SQLite 数据库（分享记录 + 文件元数据）
├── files/
│   ├── A3K9X2/              取件码即目录名
│   │   ├── report.pdf
│   │   └── photo.jpg
│   └── B7MX91/
│       └── notes.txt
└── tmp/
    └── {upload_id}/         分片上传临时目录（上传完成后自动清理）
        ├── meta.json        上传元数据（文件名、大小、分片数等）
        ├── chunk_000000     分片数据
        └── chunk_000001
```

> `data/` 目录通过 Docker bind mount 持久化到宿主机，容器重建不影响数据。

---

## 隐私说明

- **不收集任何用户个人信息**，无账号体系
- **不记录用户 IP 到数据库**，IP 仅用于运行时限流（重启后清零）
- 所有内容到期后**自动从磁盘物理删除**，不可恢复
- 取件码为唯一凭证，服务端不存储发送者身份
- 文件**不可被直接 URL 访问**，必须通过取件码接口下载
- 建议配置 HTTPS，防止传输过程中被中间人截取

---

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2026 SnapSend Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库：https://github.com/L-Trunks/snapsend
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

<div align="center">

如果这个项目对你有帮助，欢迎点个 Star ⭐

</div>
