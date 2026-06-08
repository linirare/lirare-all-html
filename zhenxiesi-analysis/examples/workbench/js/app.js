const agents = [
  { id: "hermes", name: "Hermes", avatar: "assets/hermes.png", role: "快速协调与任务拆解",
    replies: ["我会先把目标拆成可执行步骤，再给你最短路径。", "当前信息足够推进。建议先固定接口，再并行处理实现和验证。", "我会保持上下文简洁，把关键结论同步给其他 Agent。"] },
  { id: "codex", name: "Codex", avatar: "assets/codex.png", role: "代码实现与验证",
    replies: ["我会先查询现有结构，复用已有接口后再改动。", "这个改动适合小步提交：实现、测试、再清理边界。", "我建议补一条可重复的验证路径，避免只靠界面观感判断。"] },
  { id: "openclaw", name: "OpenClaw", avatar: "assets/openclaw.png", role: "自动化、抓取与工具链",
    replies: ["我可以把重复操作收束成脚本，并保留清晰的日志输出。", "先确认权限和输入边界，再跑自动化会更稳。", "我会把异常分支显式暴露，避免后台静默失败。"] },
  { id: "claudecode", name: "ClaudeCode", avatar: "assets/claudecode.png", role: "架构审阅与长文本推理",
    replies: ["我会从架构约束开始看，确认这个方案不会破坏现有边界。", "这里的核心风险是状态同步。建议把来源和持久化规则写清楚。", "我倾向于保守重构，先减少重复，再决定是否抽象。"] }
];

const notes = [
  { title: "Agent Protocol Map", meta: "协议 / WebSocket / FastAPI" },
  { title: "Obsidian Memory Index", meta: "记忆库 / 双链 / 图谱" },
  { title: "Apple UI Reference", meta: "设计系统 / 留白 / 毛玻璃" },
  { title: "LocalStorage Chat State", meta: "前端状态 / 持久化" },
  { title: "Backend Mock Strategy", meta: "API / CORS / 流式聊天" }
];

const BACKEND_URL = `http://${location.hostname}:8765`;
const state = {
  activeAgent: agents[0],
  theme: localStorage.getItem("workbench-theme") || "light"
};

const agentGrid = document.querySelector("#agentGrid");
const messagesEl = document.querySelector("#messages");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const activeAvatar = document.querySelector("#activeAvatar");
const chatTitle = document.querySelector("#chatTitle");
const clearChat = document.querySelector("#clearChat");
const noteSearch = document.querySelector("#noteSearch");
const noteList = document.querySelector("#noteList");
const themeToggle = document.querySelector("#themeToggle");
const clock = document.querySelector("#clock");
const onlineCount = document.querySelector("#onlineCount");
const chart = document.querySelector("#memoryChart");
const backendBadge = document.querySelector("#backendBadge");

function storageKey(agentId) { return `agent-workbench-chat-${agentId}`; }
function readHistory(agentId) {
  try { return JSON.parse(localStorage.getItem(storageKey(agentId))) || []; }
  catch { return []; }
}
function writeHistory(agentId, history) {
  localStorage.setItem(storageKey(agentId), JSON.stringify(history));
}

function renderAgents() {
  agentGrid.innerHTML = agents.map(agent => `
    <button class="agent-card ${agent.id === state.activeAgent.id ? "active" : ""}" type="button" data-agent="${agent.id}">
      <span class="avatar-wrap">
        <img src="${agent.avatar}" alt="${agent.name} 头像">
        <span class="status-dot"></span>
      </span>
      <span>
        <span class="agent-name">${agent.name}</span>
        <span class="agent-desc">${agent.role}</span>
      </span>
    </button>
  `).join("");
  agentGrid.querySelectorAll(".agent-card").forEach(card => {
    card.addEventListener("click", () => selectAgent(card.dataset.agent));
  });
}

function selectAgent(agentId) {
  state.activeAgent = agents.find(agent => agent.id === agentId) || agents[0];
  activeAvatar.src = state.activeAgent.avatar;
  chatTitle.textContent = state.activeAgent.name;
  renderAgents();
  renderMessages();
}

function renderMessages(extra = "") {
  const history = readHistory(state.activeAgent.id);
  if (history.length === 0 && !extra) {
    messagesEl.innerHTML = `<div class="message agent">你好，我是 ${state.activeAgent.name}。选择一个任务，我们从明确目标和边界开始。</div>`;
    return;
  }
  messagesEl.innerHTML = history.map(item =>
    `<div class="message ${item.sender}">${escapeHtml(item.text)}</div>`
  ).join("") + extra;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
}

function mockReply(agent, text) {
  const seed = text.length + new Date().getSeconds();
  const base = agent.replies[seed % agent.replies.length];
  return `${base} 你刚才提到：“${text.slice(0, 48)}${text.length > 48 ? "..." : ""}”。`;
}

// === 真实后端通信 ===
let backendOnline = false;

async function checkBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    backendOnline = res.ok;
    if (backendBadge) backendBadge.textContent = backendOnline ? "后端在线" : "离线 (Mock)";
    return backendOnline;
  } catch {
    backendOnline = false;
    if (backendBadge) backendBadge.textContent = "离线 (Mock)";
    return false;
  }
}

async function sendToBackend(agentId, message) {
  const history = readHistory(agentId);
  history.push({ sender: "user", text: message });
  writeHistory(agentId, history);

  // Show typing indicator
  renderMessages(`<div class="message agent" id="typingBubble"><span class="typing"><i></i><i></i><i></i></span></div>`);

  try {
    if (await checkBackend()) {
      // Try real API
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentId, message }),
        signal: AbortSignal.timeout(120000)
      });
      if (res.ok) {
        const data = await res.json();
        history.push({ sender: "agent", text: data.reply || "(无回复)" });
        writeHistory(agentId, history);
        renderMessages();
        return;
      }
    }
  } catch (e) {
    // Fall through to mock
  }

  // Fallback: mock reply
  await new Promise(r => setTimeout(r, 800));
  const reply = mockReply(state.activeAgent, message);
  history.push({ sender: "agent", text: reply });
  writeHistory(agentId, history);
  renderMessages();
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = "";
  sendToBackend(state.activeAgent.id, text);
});

clearChat.addEventListener("click", () => {
  localStorage.removeItem(storageKey(state.activeAgent.id));
  renderMessages();
});

function renderNotes(filter = "") {
  const normalized = filter.trim().toLowerCase();
  const visible = notes.filter(note =>
    note.title.toLowerCase().includes(normalized) || note.meta.toLowerCase().includes(normalized)
  );
  noteList.innerHTML = visible.map(note =>
    `<li class="note-item"><strong>${note.title}</strong><span>${note.meta}</span></li>`
  ).join("");
}

noteSearch.addEventListener("input", event => renderNotes(event.target.value));

function drawChart() {
  const ctx = chart.getContext("2d");
  const rect = chart.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  chart.width = Math.floor(rect.width * dpr);
  chart.height = Math.floor(300 * dpr);
  ctx.scale(dpr, dpr);

  const values = [32, 46, 39, 58, 71, 63, 84];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const width = rect.width;
  const height = 300;
  const pad = 34;
  const barGap = 14;
  const barWidth = (width - pad * 2 - barGap * (values.length - 1)) / values.length;
  const max = Math.max(...values);

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = getCss("--line");
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = pad + i * 56;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  values.forEach((value, index) => {
    const x = pad + index * (barWidth + barGap);
    const barHeight = (height - pad * 2 - 24) * (value / max);
    const y = height - pad - 24 - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, "#0071e3");
    gradient.addColorStop(1, "#67b7ff");
    roundRect(ctx, x, y, barWidth, barHeight, 9, gradient);
    ctx.fillStyle = getCss("--muted");
    ctx.font = "13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[index], x + barWidth / 2, height - pad + 2);
  });
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y - height + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("workbench-theme", theme);
  window.setTimeout(drawChart, 50);
}

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
});

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit", minute: "2-digit", hour12: false
  }).format(new Date());
  onlineCount.textContent = `${agents.length} 在线`;
}

window.addEventListener("resize", drawChart);

applyTheme(state.theme);
renderAgents();
renderMessages();
renderNotes();
drawChart();
updateClock();
window.setInterval(updateClock, 1000);
checkBackend();
