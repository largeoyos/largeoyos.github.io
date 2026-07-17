const practiceTabs = [...document.querySelectorAll('.practice-tab')];
const practicePanels = [...document.querySelectorAll('[data-practice-panel]')];
const allProgressKeys = ['signal', 'position', 'bias'];
const progressStorageKey = 'largeoyos-quant-lab-progress-v1';

function readProgress() {
    try {
        return { signal: false, position: false, bias: false, ...JSON.parse(localStorage.getItem(progressStorageKey) || '{}') };
    } catch {
        return { signal: false, position: false, bias: false };
    }
}

let progress = readProgress();

function updateProgress() {
    const completed = allProgressKeys.filter((key) => progress[key]).length;
    document.getElementById('progress-label').textContent = `${completed} / ${allProgressKeys.length} 已完成`;
    document.getElementById('progress-fill').style.width = `${(completed / allProgressKeys.length) * 100}%`;
    localStorage.setItem(progressStorageKey, JSON.stringify(progress));
}

function completePractice(key) {
    if (!progress[key]) {
        progress[key] = true;
        updateProgress();
    }
}

function selectPractice(name) {
    practiceTabs.forEach((tab) => {
        const active = tab.dataset.practice === name;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
    });

    practicePanels.forEach((panel) => {
        const active = panel.dataset.practicePanel === name;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
    });
}

practiceTabs.forEach((tab) => tab.addEventListener('click', () => selectPractice(tab.dataset.practice)));

document.querySelectorAll('.node-button').forEach((button) => {
    button.addEventListener('click', () => {
        selectPractice(button.dataset.focus);
        document.getElementById('practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

document.querySelectorAll('#signal-answers button').forEach((button) => {
    button.addEventListener('click', () => {
        const correct = button.dataset.answer === 'long';
        document.querySelectorAll('#signal-answers button').forEach((item) => item.classList.remove('is-correct', 'is-wrong'));
        button.classList.add(correct ? 'is-correct' : 'is-wrong');

        const feedback = document.getElementById('signal-feedback');
        feedback.className = `answer-feedback ${correct ? 'is-success' : 'is-error'}`;
        feedback.textContent = correct
            ? '正确。信号在收盘后才完整确认；教学回测中通常应以下一根 K 线可交易的价格执行，并计入成本。'
            : '再想一步：此时只是 3 日均线上穿 5 日均线。若策略规则定义为趋势跟随，动作应发生在信号确认后的可交易时点。';

        if (correct) completePractice('signal');
    });
});

const capitalInput = document.getElementById('capital-input');
const riskInput = document.getElementById('risk-input');
const entryInput = document.getElementById('entry-input');
const stopInput = document.getElementById('stop-input');
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });

function updatePositionResult() {
    const capital = Number(capitalInput.value);
    const riskRate = Number(riskInput.value) / 100;
    const entry = Number(entryInput.value);
    const stop = Number(stopInput.value);
    const riskBudget = capital * riskRate;
    const perShareRisk = entry - stop;

    document.getElementById('capital-output').textContent = currency.format(capital);
    document.getElementById('risk-output').textContent = `${Number(riskInput.value).toFixed(2).replace(/\.00$/, '')}%`;
    document.getElementById('risk-budget').textContent = currency.format(riskBudget);

    if (!Number.isFinite(perShareRisk) || perShareRisk <= 0) {
        document.getElementById('per-share-risk').textContent = '需低于入场价';
        document.getElementById('share-count').textContent = '—';
        document.getElementById('position-value').textContent = '—';
        return false;
    }

    const shares = Math.floor(riskBudget / perShareRisk);
    document.getElementById('per-share-risk').textContent = `¥${perShareRisk.toFixed(2)}`;
    document.getElementById('share-count').textContent = `${shares.toLocaleString('zh-CN')} 股`;
    document.getElementById('position-value').textContent = currency.format(shares * entry);
    return true;
}

[capitalInput, riskInput, entryInput, stopInput].forEach((input) => input.addEventListener('input', updatePositionResult));

document.getElementById('check-position').addEventListener('click', () => {
    const valid = updatePositionResult();
    const feedback = document.getElementById('position-feedback');
    feedback.className = `position-feedback ${valid ? 'is-success' : 'is-error'}`;
    feedback.textContent = valid
        ? '核对完成：止损越远，每股风险越高，可持仓数量应越少。实际交易还需考虑整手、滑点与流动性。'
        : '止损价需要低于假设入场价，才能计算多头头寸的每股风险。';
    if (valid) completePractice('position');
});

document.querySelectorAll('#bias-answers button').forEach((button) => {
    button.addEventListener('click', () => {
        const correct = button.dataset.answer === 'lookahead';
        document.querySelectorAll('#bias-answers button').forEach((item) => item.classList.remove('is-correct', 'is-wrong'));
        button.classList.add(correct ? 'is-correct' : 'is-wrong');

        const feedback = document.getElementById('bias-feedback');
        feedback.classList.toggle('is-success', correct);
        feedback.querySelector('span').textContent = correct ? '正确 / LOOK-AHEAD BIAS' : '再检查时间线';
        feedback.querySelector('p').textContent = correct
            ? '正确。这是前视偏差：当天收盘价在收盘时才完整确定，不能同时假设用它完成当日收盘成交。应把执行放在下一可交易时点，或采用可验证的盘中规则。'
            : '这个问题确实也可能影响结果，但题干最直接的问题是：策略在信息完整出现前，就假设以同一时点成交。';

        if (correct) completePractice('bias');
    });
});

document.getElementById('reset-progress').addEventListener('click', () => {
    progress = { signal: false, position: false, bias: false };
    updateProgress();
});

updatePositionResult();
updateProgress();
