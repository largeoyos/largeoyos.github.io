const plan = [
  {
    title: "起步与第一次组会",
    dates: "09.20—09.27",
    goal: "能独立运行脚本，并留下第一份组会观察。",
    tasks: [
      ["确认组会安排", "核对时间、地点或会议号，以最新通知为准", 15],
      ["回顾图像识别流程", "用自己的话说出：图片 → 预处理 → 模型 → 预测", 30],
      ["旁听 iVC II 组会", "09 月 21 日周一 14:00—17:00，记录一个问题", 180],
      ["整理组会笔记", "只查最影响理解的 3 个词，写一段自己的理解", 30],
      ["数字统计小程序", "平均值、最大值、筛选高于平均值的数字", 60],
      ["文件读写小程序", "统计非空行，并把结果写入新文件", 60],
      ["图片读取与缩放", "打印尺寸、缩小图片并另存", 60]
    ]
  },
  {
    title: "跑通图像识别",
    dates: "09.28—10.04",
    goal: "完成第二章 2.1，并分清推理与训练。",
    tasks: [
      ["阅读第二章 2.1", "只抓住输入、预处理、模型和输出", 60],
      ["运行书中预训练模型", "使用 Windows Python 3.12 跑通案例", 75],
      ["换 3 张自己的图片", "保留预测结果，并观察错误案例", 60],
      ["打印中间结果", "查看图像尺寸、张量形状和 top-5 预测", 30],
      ["重写关键代码", "不看原文，重写读取图片到输出预测的一小段", 45],
      ["第二次旁听组会", "若本周正常开会，完成规定的第二次旁听", 180]
    ]
  },
  {
    title: "掌握张量",
    dates: "10.05—10.11",
    goal: "能预测常见张量操作之后的形状。",
    tasks: [
      ["阅读第三章张量基础", "理解 dtype、shape、device", 90],
      ["创建与检查张量", "从列表创建，打印形状、类型和设备", 60],
      ["索引与切片练习", "完成至少 8 个小例子", 75],
      ["reshape 与维度变换", "练习 reshape、unsqueeze、transpose", 90],
      ["张量运算小实验", "比较逐元素运算与矩阵运算", 75],
      ["一页形状笔记", "用自己的例子总结常见维度变化", 45]
    ]
  },
  {
    title: "理解图像数据",
    dates: "10.12—10.18",
    goal: "能解释图像张量的通道、高、宽和批量维度。",
    tasks: [
      ["阅读第四章图像部分", "其他数据类型暂按需选读", 90],
      ["图片转为张量", "检查通道顺序、形状和数值范围", 75],
      ["观察 RGB 通道", "分别显示或统计三个通道", 60],
      ["实现归一化", "观察归一化前后的均值和标准差", 75],
      ["组成一个小 batch", "将多张图片堆叠，解释每个维度", 90],
      ["复盘预处理流程", "回看第二章，解释模型为何需要固定预处理", 45]
    ]
  },
  {
    title: "理解模型怎样学习",
    dates: "10.19—10.25",
    goal: "说清损失、梯度、参数更新之间的关系。",
    tasks: [
      ["阅读第五章学习机制", "关注模型、损失、梯度和优化", 105],
      ["跑通拟合案例", "记录初始输出与最终输出", 90],
      ["改变学习率", "至少测试 3 个学习率，比较损失曲线", 75],
      ["检查梯度", "打印参数梯度，并说明它用于什么", 60],
      ["手写训练流程图", "数据 → 输出 → 损失 → 反传 → 更新", 45],
      ["实验小结", "解释一次失败或异常训练", 45]
    ]
  },
  {
    title: "训练简单神经网络",
    dates: "10.26—11.01",
    goal: "理解基本训练循环和验证集的作用。",
    tasks: [
      ["阅读第六章", "理解 nn.Module、层和激活函数", 105],
      ["跑通简单网络", "从数据到预测完整执行一次", 90],
      ["读懂训练循环", "给每一段代码写一句注释", 75],
      ["修改隐藏层规模", "比较参数量和训练表现", 75],
      ["加入验证过程", "分别记录训练和验证损失", 75],
      ["总结过拟合", "用本次实验的现象解释它", 45]
    ]
  },
  {
    title: "完成图像分类实验",
    dates: "11.02—11.08",
    goal: "独立完成训练、验证、保存和重新加载。",
    tasks: [
      ["阅读第七章", "关注 Dataset、DataLoader 与分类流程", 105],
      ["准备并检查数据", "可视化样本，确认标签和批量形状", 75],
      ["完成一次训练", "保存损失和准确率记录", 120],
      ["保存并加载模型", "重启脚本后仍能完成预测", 60],
      ["检查错误预测", "挑出至少 5 张，写下可能原因", 60],
      ["整理可复现实验", "写清运行命令、环境和主要结果", 45]
    ]
  },
  {
    title: "认识卷积与总结",
    dates: "11.09—11.15",
    goal: "解释卷积的基本作用，并总结八周成长。",
    tasks: [
      ["选读第八章", "理解卷积核、通道和感受野的直觉", 105],
      ["跑通卷积网络", "记录每一层输出形状", 90],
      ["比较简单网络与卷积网络", "从参数、表现和图像结构三个角度比较", 75],
      ["修改一个卷积设置", "改变核大小、通道数或层数并观察结果", 75],
      ["整理代码目录", "保留说明、运行入口和关键结果", 60],
      ["写一页学习报告", "我做了什么、学会什么、下一步想研究什么", 75]
    ]
  }
];

const STORAGE_KEY = "pytorch-field-notes-v1";
const statuses = {
  todo: "未开始",
  doing: "进行中",
  review: "待复习",
  done: "已完成"
};

const defaultState = () => ({
  tasks: Object.fromEntries(plan.flatMap((week, wi) => week.tasks.map((_, ti) => [`${wi}-${ti}`, { status: "todo", minutes: "" }]))),
  notes: {},
  theme: "light",
  updatedAt: null
});

let state = loadState();
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return defaultState();
    const fresh = defaultState();
    return {
      ...fresh,
      ...saved,
      tasks: { ...fresh.tasks, ...(saved.tasks || {}) },
      notes: saved.notes || {}
    };
  } catch {
    return defaultState();
  }
}

function saveState(message = "进度已保存") {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSummary();
  if (message) showToast(message);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderNav() {
  const nav = document.querySelector("#weekNav");
  nav.innerHTML = plan.map((_, i) => `<a href="#week-${i + 1}" data-week-link="${i}">第 ${i + 1} 周</a>`).join("");
}

function renderWeeks() {
  const container = document.querySelector("#weeksContainer");
  container.innerHTML = plan.map((week, wi) => {
    const taskRows = week.tasks.map((task, ti) => {
      const key = `${wi}-${ti}`;
      const item = state.tasks[key] || { status: "todo", minutes: "" };
      return `
        <li class="task-row" data-task="${key}" data-status="${item.status}">
          <button class="task-check" type="button" aria-label="将 ${escapeHtml(task[0])} 标记为${item.status === "done" ? "未开始" : "已完成"}">✓</button>
          <div class="task-copy">
            <span class="task-title">${escapeHtml(task[0])}</span>
            <small>${escapeHtml(task[1])} · 预计 ${formatMinutes(task[2])}</small>
          </div>
          <select class="status-select" aria-label="${escapeHtml(task[0])}的状态">
            ${Object.entries(statuses).map(([value, label]) => `<option value="${value}" ${value === item.status ? "selected" : ""}>${label}</option>`).join("")}
          </select>
          <div class="time-field">
            <input class="time-input" type="number" min="0" step="5" inputmode="numeric" value="${escapeHtml(item.minutes ?? "")}" aria-label="${escapeHtml(task[0])}实际用时，分钟" placeholder="实际" />
          </div>
        </li>`;
    }).join("");

    return `
      <article class="week-card" id="week-${wi + 1}" style="animation-delay:${wi * 45}ms">
        <aside class="week-aside" data-number="${String(wi + 1).padStart(2, "0")}">
          <span class="week-label">WEEK ${String(wi + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(week.title)}</h3>
          <time>${escapeHtml(week.dates)}</time>
          <p>${escapeHtml(week.goal)}</p>
        </aside>
        <div>
          <ul class="task-list">${taskRows}</ul>
          <div class="week-note">
            <label for="week-note-${wi}">本周记录 · 报错、发现与下一步</label>
            <textarea id="week-note-${wi}" data-note="week-${wi}" placeholder="写下一个具体发现，或一个尚未解决的问题。">${escapeHtml(state.notes[`week-${wi}`] || "")}</textarea>
          </div>
        </div>
      </article>`;
  }).join("");
}

function bindEvents() {
  document.querySelector("#weeksContainer").addEventListener("click", event => {
    const check = event.target.closest(".task-check");
    if (!check) return;
    const row = check.closest(".task-row");
    const key = row.dataset.task;
    const next = state.tasks[key].status === "done" ? "todo" : "done";
    setTaskStatus(row, key, next);
  });

  document.querySelector("#weeksContainer").addEventListener("change", event => {
    const row = event.target.closest(".task-row");
    if (!row) return;
    const key = row.dataset.task;
    if (event.target.matches(".status-select")) setTaskStatus(row, key, event.target.value);
    if (event.target.matches(".time-input")) {
      state.tasks[key].minutes = event.target.value;
      saveState("用时已保存");
    }
  });

  document.addEventListener("input", event => {
    const note = event.target.closest("[data-note]");
    if (!note) return;
    state.notes[note.dataset.note] = note.value;
    clearTimeout(note._saveTimer);
    note._saveTimer = setTimeout(() => saveState(""), 400);
  });

  document.querySelector("#themeButton").addEventListener("click", () => {
    state.theme = document.body.classList.toggle("dark") ? "dark" : "light";
    saveState("主题已切换");
  });

  document.querySelector("#exportButton").addEventListener("click", exportData);
  document.querySelector("#importInput").addEventListener("change", importData);
}

function setTaskStatus(row, key, status) {
  state.tasks[key].status = status;
  row.dataset.status = status;
  row.querySelector(".status-select").value = status;
  row.querySelector(".task-check").setAttribute("aria-label", `将任务标记为${status === "done" ? "未开始" : "已完成"}`);
  saveState(`已设为“${statuses[status]}”`);
}

function hydrateNotes() {
  document.querySelectorAll("[data-note]").forEach(field => {
    field.value = state.notes[field.dataset.note] || field.value || "";
  });
}

function updateSummary() {
  const entries = Object.values(state.tasks);
  const total = entries.length;
  const complete = entries.filter(task => task.status === "done").length;
  const percentage = total ? Math.round((complete / total) * 100) : 0;
  const actualMinutes = entries.reduce((sum, task) => sum + (Number(task.minutes) || 0), 0);
  const plannedMinutes = plan.flatMap(week => week.tasks).reduce((sum, task) => sum + task[2], 0);

  document.querySelector("#progressPercent").textContent = percentage;
  document.querySelector("#progressBar").style.width = `${percentage}%`;
  document.querySelector("#completedCount").textContent = complete;
  document.querySelector("#totalCount").textContent = total;
  document.querySelector("#actualHours").textContent = (actualMinutes / 60).toFixed(1);
  document.querySelector("#plannedHours").textContent = (plannedMinutes / 60).toFixed(1);

  const currentWeek = findCurrentWeek();
  document.querySelector("#currentPhase").textContent = currentWeek >= 0 ? `第 ${currentWeek + 1} 周` : "准备起步";
  document.querySelector("#todayText").textContent = nextActionText();
  document.querySelector("#lastSaved").textContent = state.updatedAt ? new Date(state.updatedAt).toLocaleString("zh-CN", { hour12: false }) : "尚未保存";

  plan.forEach((week, wi) => {
    const weekDone = week.tasks.every((_, ti) => state.tasks[`${wi}-${ti}`]?.status === "done");
    document.querySelector(`[data-week-link="${wi}"]`)?.classList.toggle("done", weekDone);
  });
}

function findCurrentWeek() {
  const now = new Date();
  const start = new Date("2026-09-21T00:00:00");
  const diff = Math.floor((now - start) / 604800000);
  return Math.min(7, Math.max(0, diff));
}

function nextActionText() {
  for (let wi = 0; wi < plan.length; wi += 1) {
    for (let ti = 0; ti < plan[wi].tasks.length; ti += 1) {
      const item = state.tasks[`${wi}-${ti}`];
      if (item?.status !== "done") return plan[wi].tasks[ti][0];
    }
  }
  return "八周计划已完成";
}

function exportData() {
  saveState("");
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pytorch-learning-progress-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("备份已导出");
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = parsed.state || parsed;
    if (!imported.tasks || typeof imported.tasks !== "object") throw new Error("invalid format");
    const fresh = defaultState();
    state = { ...fresh, ...imported, tasks: { ...fresh.tasks, ...imported.tasks }, notes: imported.notes || {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    applyTheme();
    renderWeeks();
    hydrateNotes();
    updateSummary();
    showToast("备份已导入");
  } catch {
    showToast("无法导入：文件格式不正确");
  } finally {
    event.target.value = "";
  }
}

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
}

function observeWeeks() {
  const links = [...document.querySelectorAll("[data-week-link]")];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
  }, { rootMargin: "-20% 0px -65%", threshold: [0, .2, .5] });
  document.querySelectorAll(".week-card").forEach(card => observer.observe(card));
}

function formatMinutes(minutes) {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ""}` : `${minutes} 分钟`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

applyTheme();
renderNav();
renderWeeks();
hydrateNotes();
bindEvents();
updateSummary();
observeWeeks();
