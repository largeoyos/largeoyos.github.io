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

function hashString(text) {
    let hash = 0;

    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) % 1000003;
    }

    return hash;
}

function getFortuneValue(date) {
    const key = formatYmdKey(date);
    return hashString(key) % 101;
}

function getFortuneProfile(score) {
    if (score >= 90) {
        return ['大吉', '适合主动推进重要事项。'];
    }

    if (score >= 75) {
        return ['顺意', '今天适合学习、整理与执行。'];
    }

    if (score >= 60) {
        return ['稳健', '稳步推进，会有不错收获。'];
    }

    if (score >= 40) {
        return ['平衡', '按计划行事，保持节奏就好。'];
    }

    if (score >= 20) {
        return ['谨慎', '先处理细节，再做重要决定。'];
    }

    return ['蓄势', '适合复盘与休整，避免仓促出手。'];
}

function getMonthLabel(date) {
    const lunar = Solar.fromDate(date).getLunar();
    return `${date.getFullYear()}年${date.getMonth() + 1}月 · ${lunar.getYearInGanZhi()}年农历${lunar.getMonthInChinese()}月`;
}

function renderCalendar(viewDate) {
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

        const tagText = jieQi || (isToday ? '今天' : '');
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
}

function setFortuneForDate(date) {
    const grid = document.getElementById('calendar-grid');
    const buttons = grid.querySelectorAll('.calendar-day');
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const yearGz = lunar.getYearInGanZhi();
    const monthGz = lunar.getMonthInGanZhi();
    const dayGz = lunar.getDayInGanZhi();
    const score = getFortuneValue(date);
    const [fortuneTitle, fortuneText] = getFortuneProfile(score);
    const jieQi = lunar.getJieQi();
    const lunarText = (jieQi ? `${jieQi} · ` : '') + `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    const animal = lunar.getYearShengXiao();

    buttons.forEach(button => {
        button.classList.toggle('is-selected', button.dataset.date === formatYmdKey(date));
    });

    document.getElementById('today-lunar-summary').textContent = `(${animal}年) 农历${lunarText}`;
    document.getElementById('today-solar-summary').textContent = `${formatSolarDate(date)} ${weekdayNames[date.getDay()]}（第${getWeekNumber(date)}周）`;
    document.getElementById('today-ganzhi-summary').textContent = `${yearGz}年 ${monthGz}月 ${dayGz}日`;
    document.getElementById('fortune-score').textContent = `${formatSolarDate(date)} 运势值 ${score}/100`;
    document.getElementById('fortune-detail').textContent = `${fortuneTitle} · ${fortuneText}`;
    document.getElementById('fortune-extra').textContent = `${yearGz}年 农历${lunarText} · 干支 ${yearGz}年 ${monthGz}月 ${dayGz}日`;
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

function initCalendar() {
    if (!ensureLunarLibraryReady()) {
        document.getElementById('calendar-heading').textContent = '日历组件加载失败：缺少 lunar-javascript';
        return;
    }

    initLayoutSettings();

    const today = new Date();
    const lunar = Solar.fromDate(today).getLunar();

    document.getElementById('calendar-heading').textContent = getMonthLabel(today);
    document.getElementById('today-lunar-summary').textContent = `(${lunar.getYearShengXiao()}年) 农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    document.getElementById('today-solar-summary').textContent = `${formatSolarDate(today)} ${weekdayNames[today.getDay()]}（第${getWeekNumber(today)}周）`;
    document.getElementById('today-ganzhi-summary').textContent = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;

    renderCalendar(today);
    setFortuneForDate(today);
    updateClock();

    document.getElementById('calendar-grid').addEventListener('click', event => {
        const button = event.target.closest('.calendar-day');
        if (!button) {
            return;
        }

        setFortuneForDate(parseYmdKey(button.dataset.date));
    });

    window.setInterval(updateClock, 30000);
}

initCalendar();