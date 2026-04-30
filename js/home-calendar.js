const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const zhiStartHours = {
    子: 23,
    丑: 1,
    寅: 3,
    卯: 5,
    辰: 7,
    巳: 9,
    午: 11,
    未: 13,
    申: 15,
    酉: 17,
    戌: 19,
    亥: 21
};
const numberInChinese = ['一', '二', '三', '四', '五', '六', '七', '八'];

const modernTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

function ensureLunarLibraryReady() {
    return typeof Solar !== 'undefined' && Solar && typeof Solar.fromDate === 'function';
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function formatYmdKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatSolarDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function parseYmdKey(ymd) {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function getWeekNumber(date) {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    return Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
}

function getAncientTime(date) {
    const lunar = Solar.fromDate(date).getLunar();
    const zhi = lunar.getTimeZhi();
    const startHour = zhiStartHours[zhi];
    const hourOffset = (date.getHours() - startHour + 24) % 24;
    const minuteInShichen = hourOffset * 60 + date.getMinutes();
    const period = minuteInShichen < 60 ? '初' : '正';
    const quarterInHour = Math.floor(date.getMinutes() / 15) + 1;
    const quarterInShichen = Math.floor(minuteInShichen / 15) + 1;
    const hourQuarterLabel = numberInChinese[Math.max(0, Math.min(3, quarterInHour - 1))];
    const shichenQuarterLabel = numberInChinese[Math.max(0, Math.min(7, quarterInShichen - 1))];

    return {
        label: `${zhi}时${hourQuarterLabel}刻`,
        detail: `${zhi}${period} · ${period}${hourQuarterLabel}刻（时辰第${shichenQuarterLabel}刻）`
    };
}

function getMonthLabel(date) {
    const lunar = Solar.fromDate(date).getLunar();
    return `${date.getFullYear()}年${date.getMonth() + 1}月 · ${lunar.getYearInGanZhi()}年农历${lunar.getMonthInChinese()}月`;
}

// ====== 运势系统 ======

function hashString(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
    }
    return hash;
}

const todoList = [
    ['刷B站', '承包一天笑点'],
    ['在QQ群聊天', '遇见好朋友'],
    ['被撅', '哼哼哼啊啊啊啊啊'],
    ['写作业', '蒙的全对'],
    ['唱跳RAP篮球', '只因你太美'],
    ['打游戏', '杀疯了'],
    ['摸鱼', '摸鱼不被发现'],
    ['看番剧', '追到神作'],
    ['写代码', '一次编译通过零Bug'],
    ['逛GitHub', '发现宝藏开源项目'],
    ['熬夜', '灵感爆棚效率翻倍'],
    ['吃夜宵', '越吃越瘦'],
    ['睡懒觉', '梦到考试原题'],
    ['划水', '划出太平洋'],
    ['刷知乎', '涨了奇怪的知识'],
    ['折腾Linux', '一次配好再也不崩'],
];

const notTodoList = [
    ['刷B站', '视频无限缓冲'],
    ['在QQ群聊天', '被小鬼气到红温'],
    ['被撅', '休息一天养精蓄锐~'],
    ['写作业', '写的全错蒙的也全错'],
    ['唱跳RAP篮球', '被ikun人参公鸡'],
    ['打游戏', '连跪十把送人头'],
    ['摸鱼', '老板突然站你背后'],
    ['看番剧', '追到惊天烂尾作'],
    ['写代码', 'Bug越修越多最终回滚'],
    ['逛GitHub', 'Star了一堆再也没打开过'],
    ['熬夜', '第二天直接睡到中午十二点'],
    ['吃夜宵', '半夜肚子痛跑厕所'],
    ['睡懒觉', '辅导员突然查寝'],
    ['划水', '被当场抓获写入周报'],
    ['刷知乎', '刷了三小时啥也没记住'],
    ['折腾Linux', 'Grub炸了进不去系统'],
];

const tierPool = {
    tooLucky: ['大吉', '吉你太美'],
    lucky: ['小吉', '中吉', '上上签'],
    neutral: ['平', '中平', '万事靠自己'],
    unlucky: ['凶', '小凶', '下下签'],
    tooUnlucky: ['大凶', '寄'],
};

function seededPick(array, seed) {
    return array[Math.abs(seed) % array.length];
}

function getFortuneInfo(date) {
    const dateKey = formatYmdKey(date);
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    // ---- 多维度特征提取 ----
    const baseHash = hashString(dateKey);

    // 农历信息：年干支、月干支、日干支、生肖、节气
    const yearGz = lunar.getYearInGanZhi();
    const monthGz = lunar.getMonthInGanZhi();
    const dayGz = lunar.getDayInGanZhi();
    const animal = lunar.getYearShengXiao();
    const jieQi = lunar.getJieQi() || '';

    // 各维度分别哈希
    const hGz = hashString(yearGz + monthGz + dayGz);
    const hAnimal = hashString(animal);
    const hJieQi = hashString(jieQi);
    const hDayOfYear = hashString(String(date.getFullYear()) + String(date.getMonth() + 1) + String(date.getDate()));
    const hWeekday = hashString(String(date.getDay()));

    // ---- 混合 SHA-256 风格的轮函数 ----
    // MixRound: 对 (a, b, c) 做非线性混合，类似 SHA-256 的小轮
    function mixRound(a, b, c, round) {
        a = (a * 997 + round * 7919) % 1000003;
        b = (b * 4999 + (a & 0xFFF)) % 1000003;
        c = (c * 3119 + (b & 0xFFF) * 7) % 1000003;
        // ROTL 风格的位旋转（模拟）
        a = ((a << (round % 5 + 3)) | Math.floor(a / (1 << (round % 5 + 3)))) % 1000003;
        b = ((b << (round % 7 + 2)) | Math.floor(b / (1 << (round % 7 + 2)))) % 1000003;
        c = ((c << (round % 3 + 5)) | Math.floor(c / (1 << (round % 3 + 5)))) % 1000003;
        return [a, b, c];
    }

    // 将所有特征输入混合
    let a = baseHash;
    let b = (hGz + hAnimal * 7 + hJieQi * 13) % 1000003;
    let c = (hDayOfYear + hWeekday * 37) % 1000003;

    // 8 轮混合
    for (let r = 0; r < 8; r += 1) {
        [a, b, c] = mixRound(a, b, c, r);
    }

    // ---- 从混合结果中提取运势值 ----
    // 使用三个混合值生成分数，产生非均匀分布
    const raw = (a * 48271 + b * 16807 + c * 104729) % 1000003;
    const gaussian = ((raw % 1000) + (raw % 997) + (raw % 991)) / 3; // 近似正态分布
    const scoreBase = (gaussian / 1000) * 100; // 0-100 但趋向中心

    // 节气加成/削减：有节气时 ±5 左右的正弦调制
    const jieQiBoost = jieQi ? Math.sin(hJieQi % 628) * 5 : 0;

    // 周末轻微加分
    const weekendBoost = (date.getDay() === 0 || date.getDay() === 6) ? 3 : 0;

    // 农历初一/十五的额外波动
    const lunarDay = Number(lunar.getDay());
    const fullMoonBoost = (lunarDay === 1 || lunarDay === 15) ? Math.sin(baseHash % 314) * 4 : 0;

    // 最终分数，钳位 0-100
    let score = Math.round(scoreBase + jieQiBoost + weekendBoost + fullMoonBoost);
    score = Math.max(0, Math.min(100, score));

    // 分数钳位后再用 baseHash 微调种子保证同一天不变
    const hFinal = hashString(dateKey + 'fortune');

    // 用 hash 的不同位来选各项，保证同一天结果固定
    const tierSeed = Math.floor(hFinal / 101);
    const yiSeed = tierSeed + 7;
    const jiSeed = tierSeed + 13;
    const yiExtraSeed = tierSeed + 19;
    const jiExtraSeed = tierSeed + 23;

    let tierLabel;
    const yiItems = [];
    const jiItems = [];

    if (score >= 95) {
        // 极致好运
        tierLabel = seededPick([...tierPool.tooLucky], tierSeed);
        // 双宜
        yiItems.push(seededPick(todoList, yiSeed));
        yiItems.push(seededPick(todoList, yiExtraSeed));
        // 随机一忌但不严重
        jiItems.push(seededPick(notTodoList, jiSeed));
    } else if (score >= 75) {
        // 好运区间：从 lucky + tooLucky 混合池中选
        const pool = [...tierPool.lucky, ...tierPool.tooLucky];
        tierLabel = seededPick(pool, tierSeed);
        if (tierPool.tooLucky.indexOf(tierLabel) !== -1) {
            // 抽中了超幸运标签，给双宜
            yiItems.push(seededPick(todoList, yiSeed));
            yiItems.push(seededPick(todoList, yiExtraSeed));
        } else {
            yiItems.push(seededPick(todoList, yiSeed));
        }
        jiItems.push(seededPick(notTodoList, jiSeed));
    } else if (score >= 40) {
        // 中平
        tierLabel = seededPick(tierPool.neutral, tierSeed);
        yiItems.push(seededPick(todoList, yiSeed));
        jiItems.push(seededPick(notTodoList, jiSeed));
    } else if (score >= 20) {
        // 坏运区间：从 unlucky + tooUnlucky 混合池中选
        const pool = [...tierPool.unlucky, ...tierPool.tooUnlucky];
        tierLabel = seededPick(pool, tierSeed);
        if (tierPool.tooUnlucky.indexOf(tierLabel) !== -1) {
            // 抽中了超凶标签，给双忌
            yiItems.push(seededPick(todoList, yiSeed));
            jiItems.push(seededPick(notTodoList, jiSeed));
            jiItems.push(seededPick(notTodoList, jiExtraSeed));
        } else {
            yiItems.push(seededPick(todoList, yiSeed));
            jiItems.push(seededPick(notTodoList, jiSeed));
        }
    } else {
        // 极致坏运
        tierLabel = seededPick([...tierPool.tooUnlucky], tierSeed);
        // 双忌
        jiItems.push(seededPick(notTodoList, jiSeed));
        jiItems.push(seededPick(notTodoList, jiExtraSeed));
        // 随机一宜
        yiItems.push(seededPick(todoList, yiSeed));
    }

    return { score, tier: tierLabel, yi: yiItems, ji: jiItems };
}

let currentViewDate = new Date();
let shouldSuppressCalendarClick = false;

function shiftCalendarMonth(delta) {
    currentViewDate.setMonth(currentViewDate.getMonth() + delta);
    renderCalendar(currentViewDate);
}

function suppressCalendarClickTemporarily() {
    shouldSuppressCalendarClick = true;
    window.setTimeout(() => {
        shouldSuppressCalendarClick = false;
    }, 260);
}

function renderCalendar(viewDate) {
    currentViewDate = new Date(viewDate);
    const grid = document.getElementById('calendar-grid');
    const today = new Date();
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const leadingDays = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - leadingDays);
    const todayKey = formatYmdKey(today);

    grid.innerHTML = '';

    for (let offset = 0; offset < 42; offset += 1) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + offset);

        const lunar = Solar.fromDate(cellDate).getLunar();
        const jieQi = lunar.getJieQi();
        const isCurrentMonth = cellDate.getMonth() === viewDate.getMonth();
        const isToday = formatYmdKey(cellDate) === todayKey;
        const isFirstDayOfMonth = cellDate.getDate() === 1;

        const dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.className = 'calendar-day';
        dayButton.dataset.date = formatYmdKey(cellDate);

        if (!isCurrentMonth) {
            dayButton.classList.add('is-outside');
        }

        if (isToday) {
            dayButton.classList.add('is-today', 'is-selected');
        }

        let tagText = jieQi || (isToday ? '今天' : '');
        if (!tagText && isFirstDayOfMonth) {
            tagText = `${cellDate.getMonth() + 1}月`;
        }

        dayButton.innerHTML = `
            <span class="day-tag" style="${tagText ? '' : 'display:none'}">${tagText}</span>
            <span class="solar-day">${cellDate.getDate()}</span>
            <span class="lunar-day">${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}</span>
        `;

        if (jieQi) {
            dayButton.classList.add('has-jieqi');
        }

        grid.appendChild(dayButton);
    }

    // 更新导航选择器状态
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    if (yearSelect && monthSelect) {
        yearSelect.value = viewDate.getFullYear();
        monthSelect.value = viewDate.getMonth();
    }
    
    document.getElementById('calendar-heading').textContent = getMonthLabel(viewDate);
}

function renderFortune(date) {
    const info = getFortuneInfo(date);

    document.getElementById('fortune-score').textContent = `${formatSolarDate(date)} 运势值 ${info.score}/100`;
    document.getElementById('fortune-tier').textContent = info.tier;

    const yiEl = document.getElementById('fortune-yi');
    const jiEl = document.getElementById('fortune-ji');
    const detailGroup = document.getElementById('fortune-detail-group');

    detailGroup.style.display = 'block';

    const yiTexts = info.yi.map(item => `宜 ${item[0]} — ${item[1]}`);
    const jiTexts = info.ji.map(item => `忌 ${item[0]} — ${item[1]}`);

    yiEl.textContent = yiTexts.join(' ｜ ');
    jiEl.textContent = jiTexts.join(' ｜ ');
}

function updateSelectedDay(date) {
    const grid = document.getElementById('calendar-grid');
    const buttons = grid.querySelectorAll('.calendar-day');
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const yearGz = lunar.getYearInGanZhi();
    const monthGz = lunar.getMonthInGanZhi();
    const dayGz = lunar.getDayInGanZhi();
    const jieQi = lunar.getJieQi();
    const lunarText = (jieQi ? `${jieQi} · ` : '') + `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    const animal = lunar.getYearShengXiao();

    buttons.forEach(button => {
        button.classList.toggle('is-selected', button.dataset.date === formatYmdKey(date));
    });

    document.getElementById('today-lunar-summary').textContent = `(${animal}年) 农历${lunarText}`;
    document.getElementById('today-solar-summary').textContent = `${formatSolarDate(date)} ${weekdayNames[date.getDay()]}（第${getWeekNumber(date)}周）`;
    document.getElementById('today-ganzhi-summary').textContent = `${yearGz}年 ${monthGz}月 ${dayGz}日`;

    renderFortune(date);
}

function updateClock() {
    const now = new Date();
    const ancient = getAncientTime(now);

    document.getElementById('ancient-clock').textContent = ancient.label;
    document.getElementById('ancient-clock-detail').textContent = ancient.detail;
    document.getElementById('modern-clock').textContent = `现在是 ${modernTimeFormatter.format(now)}`;
}

function initLayoutSettings() {
    const toggleBtn = document.getElementById('layout-toggle-btn');
    const calendarSection = document.getElementById('calendar-section');
    const projectsSection = document.getElementById('projects-section');

    if (!toggleBtn || !calendarSection || !projectsSection) return;

    // 从 localStorage 读取设置
    const layoutOrder = localStorage.getItem('home-layout-order') || 'calendar-first';

    const applyLayout = (order) => {
        if (order === 'projects-first') {
            calendarSection.style.order = '2';
            projectsSection.style.order = '1';
            toggleBtn.textContent = '⚙️ 布局：项目优先';
        } else {
            calendarSection.style.order = '1';
            projectsSection.style.order = '2';
            toggleBtn.textContent = '⚙️ 布局：日历优先';
        }
    };

    // 初始化应用
    applyLayout(layoutOrder);

    toggleBtn.addEventListener('click', () => {
        const currentOrder = localStorage.getItem('home-layout-order') || 'calendar-first';
        const newOrder = currentOrder === 'calendar-first' ? 'projects-first' : 'calendar-first';
        localStorage.setItem('home-layout-order', newOrder);
        applyLayout(newOrder);
    });
}

function initCalendarNav() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const prevBtn = document.getElementById('prev-month-btn');
    const nextBtn = document.getElementById('next-month-btn');
    const todayBtn = document.getElementById('back-to-today-btn');

    if (!yearSelect || !monthSelect || !prevBtn || !nextBtn || !todayBtn) return;

    // 初始化年份选择器 (1900-2100)
    const currentYear = new Date().getFullYear();
    for (let y = 1900; y <= 2100; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = `${y}年`;
        yearSelect.appendChild(option);
    }

    // 初始化月份选择器
    for (let m = 0; m < 12; m++) {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = `${m + 1}月`;
        monthSelect.appendChild(option);
    }

    const updateView = () => {
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        renderCalendar(new Date(year, month, 1));
    };

    yearSelect.addEventListener('change', updateView);
    monthSelect.addEventListener('change', updateView);

    prevBtn.addEventListener('click', () => {
        shiftCalendarMonth(-1);
    });

    nextBtn.addEventListener('click', () => {
        shiftCalendarMonth(1);
    });

    todayBtn.addEventListener('click', () => {
        const today = new Date();
        renderCalendar(today);
        updateSelectedDay(today);
    });
}

function initCalendarSwipe() {
    const grid = document.getElementById('calendar-grid');
    const wrapper = document.querySelector('.calendar-shell');
    if (!grid || !wrapper) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false; // direction decided
    let isHorizontal = false;
    let lastTranslate = 0;
    const threshold = 36; // minimal movement to consider
    const completeRatio = 0.28; // fraction of width/height to complete slide

    const resetTransform = (animate = true) => {
        if (animate) wrapper.style.transition = 'transform 240ms cubic-bezier(.2,.8,.2,1)';
        else wrapper.style.transition = 'none';
        wrapper.style.transform = 'translate3d(0,0,0)';
        lastTranslate = 0;
    };

    const doShiftAndReset = (deltaMonth, axis, size) => {
        // animate out in direction
        wrapper.style.transition = 'transform 200ms cubic-bezier(.2,.8,.2,1)';
        if (axis === 'x') wrapper.style.transform = `translate3d(${deltaMonth > 0 ? -size : size}px,0,0)`;
        else wrapper.style.transform = `translate3d(0,${deltaMonth > 0 ? -size : size}px)`;

        const onEnd = () => {
            wrapper.removeEventListener('transitionend', onEnd);
            shiftCalendarMonth(deltaMonth);
            // reset without animation
            wrapper.style.transition = 'none';
            wrapper.style.transform = 'translate3d(0,0,0)';
            // small suppression to avoid accidental clicks
            suppressCalendarClickTemporarily();
        };

        wrapper.addEventListener('transitionend', onEnd);
    };

    const startTrack = (x, y) => {
        startX = x;
        startY = y;
        tracking = true;
        decided = false;
        isHorizontal = false;
        lastTranslate = 0;
        wrapper.style.transition = 'none';
    };

    const moveTrack = (x, y, ev) => {
        if (!tracking) return;
        const dx = x - startX;
        const dy = y - startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (!decided) {
            if (absX > absY && absX > 8) {
                decided = true;
                isHorizontal = true;
            } else if (absY > absX && absY > 8) {
                decided = true;
                isHorizontal = false;
            } else {
                return;
            }
        }

        // 当确定为水平滑动时阻止页面左右/上下滚动
        if (decided) {
            // Only prevent default for touch events when capturing gesture to avoid page scroll
            if (ev && ev.cancelable) ev.preventDefault();
        }

        if (isHorizontal) {
            lastTranslate = dx;
            wrapper.style.transform = `translate3d(${dx}px,0,0)`;
        } else {
            lastTranslate = dy;
            wrapper.style.transform = `translate3d(0,${dy}px,0)`;
        }
    };

    const endTrack = () => {
        if (!tracking) return;
        tracking = false;

        const abs = Math.abs(lastTranslate);
        const size = isHorizontal ? wrapper.clientWidth || window.innerWidth : wrapper.clientHeight || window.innerHeight;

        if (abs > Math.max(threshold, size * completeRatio)) {
            // determine direction
            const delta = (lastTranslate < 0) ? 1 : -1; // negative means move to next month
            doShiftAndReset(delta, isHorizontal ? 'x' : 'y', size);
        } else {
            // revert
            resetTransform(true);
        }
    };

    // Touch handlers (mobile)
    grid.addEventListener('touchstart', event => {
        const t = event.changedTouches[0];
        if (!t) return;
        startTrack(t.clientX, t.clientY);
    }, { passive: true });

    grid.addEventListener('touchmove', event => {
        const t = event.changedTouches[0];
        if (!t) return;
        // Use non-passive handler to prevent page scrolling when gesture recognized
        moveTrack(t.clientX, t.clientY, event);
    }, { passive: false });

    grid.addEventListener('touchend', event => {
        endTrack();
    }, { passive: true });

    // Mouse handlers (desktop)
    let mouseDown = false;
    grid.addEventListener('mousedown', event => {
        mouseDown = true;
        startTrack(event.clientX, event.clientY);
    });

    window.addEventListener('mousemove', event => {
        if (!mouseDown) return;
        moveTrack(event.clientX, event.clientY);
    });

    window.addEventListener('mouseup', event => {
        if (!mouseDown) return;
        mouseDown = false;
        endTrack();
    });
}

function initCalendar() {
    if (!ensureLunarLibraryReady()) {
        document.getElementById('calendar-heading').textContent = '日历组件加载失败：缺少 lunar-javascript';
        return;
    }

    initLayoutSettings();
    initCalendarNav();
    initCalendarSwipe();

    const today = new Date();
    const lunar = Solar.fromDate(today).getLunar();

    document.getElementById('today-lunar-summary').textContent = `(${lunar.getYearShengXiao()}年) 农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    document.getElementById('today-solar-summary').textContent = `${formatSolarDate(today)} ${weekdayNames[today.getDay()]}（第${getWeekNumber(today)}周）`;
    document.getElementById('today-ganzhi-summary').textContent = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;

    renderCalendar(today);
    updateSelectedDay(today);
    updateClock();

    document.getElementById('calendar-grid').addEventListener('click', event => {
        if (shouldSuppressCalendarClick) {
            return;
        }

        const button = event.target.closest('.calendar-day');
        if (!button) {
            return;
        }

        updateSelectedDay(parseYmdKey(button.dataset.date));
    });

    window.setInterval(updateClock, 1000);
}

initCalendar();