"""Agent Workbench Backend — 真实 CLI 接入"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import subprocess
import asyncio
import json
import os
import time

app = FastAPI(title="Agent Workbench API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# === Agent 配置 ===
AGENTS = {
    "hermes": {
        "id": "hermes", "name": "Hermes", "role": "快速协调与任务拆解",
        "online": True, "type": "hermes",
        "avatar": "../assets/hermes.png",
        "replies": [
            "我会先把目标拆成可执行步骤，再给你最短路径。",
            "当前信息足够推进。建议先固定接口，再并行处理实现和验证。",
            "我会保持上下文简洁，把关键结论同步给其他 Agent。"
        ]
    },
    "codex": {
        "id": "codex", "name": "Codex", "role": "代码实现与验证",
        "online": True, "type": "codex",
        "avatar": "../assets/codex.png",
        "replies": [
            "我会先查询现有结构，复用已有接口后再改动。",
            "这个改动适合小步提交：实现、测试、再清理边界。",
            "我建议补一条可重复的验证路径，避免只靠界面观感判断。"
        ]
    },
    "openclaw": {
        "id": "openclaw", "name": "OpenClaw", "role": "自动化、抓取与工具链",
        "online": False, "type": "mock",
        "avatar": "../assets/openclaw.png",
        "replies": [
            "我可以把重复操作收束成脚本，并保留清晰的日志输出。",
            "先确认权限和输入边界，再跑自动化会更稳。",
            "这条命令涉及敏感操作，已记录日志待人工确认。"
        ]
    },
    "claudecode": {
        "id": "claudecode", "name": "ClaudeCode", "role": "架构审阅与长文本推理",
        "online": False, "type": "mock",
        "avatar": "../assets/claudecode.png",
        "replies": [
            "我会从架构约束开始看，确认这个方案不会破坏现有边界。",
            "这里的核心风险是状态同步。建议把来源和持久化规则写清楚。",
            "这个调用链有三层深，建议先收敛接口再往下推。"
        ]
    }
}

HERMES_HOME = os.path.expanduser("~/.hermes")
CODEX_SCRIPT = os.path.expanduser("~/.hermes/scripts/codex_delegate.py")

def get_reply_mock(agent_id: str, message: str) -> str:
    """Fallback mock reply when agent is offline"""
    agent = AGENTS.get(agent_id, AGENTS["hermes"])
    replies = agent["replies"]
    idx = hash(message + str(time.time())) % len(replies)
    return replies[idx]


async def call_hermes_cli(message: str) -> str:
    """Call Hermes CLI for a one-shot response"""
    cmd = [
        "hermes", "chat", "-q", message,
        "--quiet", "-Q",
        "--skills", "proactive-agent",
        "--source", "workbench"
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=HERMES_HOME,
            env={**os.environ, "HERMES_HOME": HERMES_HOME}
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        reply = stdout.decode().strip()
        if not reply and stderr:
            reply = f"[Hermes 返回空，stderr: {stderr.decode()[:200]}]"
        return reply or "(无回复)"
    except asyncio.TimeoutError:
        return "[Hermes 响应超时，请稍后再试]"
    except Exception as e:
        return f"[Hermes 调用失败: {str(e)}]"


async def call_codex_cli(message: str) -> str:
    """Call Codex CLI via delegate script"""
    cmd = [
        "python3", CODEX_SCRIPT,
        "--sandbox", "read-only",
        "--timeout", "180",
        message
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(CODEX_SCRIPT)
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=200)
        reply = stdout.decode().strip()
        # Strip noisy output, keep just the reply
        lines = [l for l in reply.split("\n") if l.strip() and not l.startswith("[Codex")]
        return "\n".join(lines[-5:]) if lines else "(Codex 无回复)"
    except asyncio.TimeoutError:
        return "[Codex 响应超时，请稍后再试]"
    except Exception as e:
        return f"[Codex 调用失败: {str(e)}]"


async def get_agent_reply(agent_id: str, message: str) -> str:
    """Route to real CLI or mock depending on agent type"""
    agent = AGENTS.get(agent_id, AGENTS["hermes"])
    if agent["type"] == "hermes":
        return await call_hermes_cli(message)
    elif agent["type"] == "codex":
        return await call_codex_cli(message)
    else:
        return get_reply_mock(agent_id, message)


# === REST API ===

class ChatRequest(BaseModel):
    agent: str
    message: str

@app.get("/api/agents")
async def list_agents():
    return {"agents": list(AGENTS.values())}

@app.post("/api/chat")
async def chat(payload: ChatRequest):
    reply = await get_agent_reply(payload.agent, payload.message)
    return {
        "agent": payload.agent,
        "message": payload.message,
        "reply": reply,
    }

@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest):
    """Streaming reply via SSE"""
    async def generate():
        reply = await get_agent_reply(payload.agent, payload.message)
        # Simulate streaming by yielding chunks
        chunk_size = 10
        for i in range(0, len(reply), chunk_size):
            yield f"data: {json.dumps({'chunk': reply[i:i+chunk_size], 'done': False})}\n\n"
            await asyncio.sleep(0.02)
        yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")


# === WebSocket ===

@app.websocket("/ws/chat/{agent}")
async def websocket_chat(websocket: WebSocket, agent: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data) if data.startswith("{") else {"message": data}
            user_msg = msg.get("message", data)

            # Send typing indicator
            await websocket.send_json({"type": "typing", "agent": agent})

            # Get real reply
            reply = await get_agent_reply(agent, user_msg)

            await websocket.send_json({
                "type": "reply",
                "agent": agent,
                "message": user_msg,
                "reply": reply,
            })

            # Send done signal
            await websocket.send_json({"type": "done", "agent": agent})

    except WebSocketDisconnect:
        return


# === Health Check ===

@app.get("/api/health")
async def health():
    return {"status": "ok", "agents": {k: v["type"] for k, v in AGENTS.items()}}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Agent Workbench Backend")
    print(f"   Hermes: 真实 CLI (hermes chat -q)")
    print(f"   Codex:  真实 CLI (codex_delegate.py)")
    print(f"   OpenClaw/ClaudeCode: Mock")
    print(f"   WebSocket: ws://127.0.0.1:8765/ws/chat/{'{agent}'}")
    print(f"   REST:     http://127.0.0.1:8765/api/chat")
    print()
    uvicorn.run(app, host="127.0.0.1", port=8765)
