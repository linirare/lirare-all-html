# Agent Workbench

Apple 风格的多 Agent 工作台，包含 Agent 仪表盘、本地聊天记录、Obsidian 记忆库概览和可选 FastAPI 后端。

## 前端

直接打开 `index.html` 即可使用。聊天记录按 Agent 分开保存在浏览器 `localStorage`。

## 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

接口：

- `GET /api/agents`
- `POST /api/chat`
- `WebSocket /ws/chat/{agent}`

## 文件结构

```text
workbench/
├── index.html
├── css/style.css
├── js/app.js
├── backend/
│   ├── server.py
│   └── requirements.txt
├── assets/
└── README.md
```
