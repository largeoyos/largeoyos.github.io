/**
 * 投资观察 — 实盘行情仪表盘
 * 支持：建行黄金积存 | 英伟达NVDA | 纳斯达克NASDAQ
 * 周期：分时线 / 日线 / 周线 / 月线
 */

(function () {
    'use strict';

    // ==================== 状态管理 ====================
    const state = {
        asset: 'gold',       // gold | nvda | nasdaq
        period: 'day',       // intraday | day | week | month
        chartInstance: null,
        rawData: { gold: {}, nvda: {}, nasdaq: {} },
        cache: {}            // 缓存已加载数据
    };

    // ==================== DOM 引用 ====================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const mainChart = $('#main-chart');
    const dataSourceNote = $('#data-source-note');

    // 快照元素
    const snapPrice = $('#snap-price');
    const snapChange = $('#snap-change');
    const snapChangePct = $('#snap-change-pct');
    const snapHigh = $('#snap-high');
    const snapLow = $('#snap-low');
    const snapTime = $('#snap-time');

    // ==================== 工具函数 ====================
    function formatPrice(v, asset) {
        if (v == null || isNaN(v)) return '--';
        if (asset === 'gold') return v.toFixed(2);
        return v.toFixed(2);
    }

    function formatChange(v, asset) {
        if (v == null || isNaN(v)) return '--';
        const sign = v >= 0 ? '+' : '';
        if (asset === 'gold') return sign + v.toFixed(2);
        return sign + v.toFixed(2);
    }

    function formatChangePct(v) {
        if (v == null || isNaN(v)) return '--';
        const sign = v >= 0 ? '+' : '';
        return sign + v.toFixed(2) + '%';
    }

    function getColorClass(v) {
        if (v == null) return '';
        return v >= 0 ? 'up' : 'down';
    }

    function parseDate(str) {
        // CCB format: "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
        if (!str) return null;
        const parts = str.split(/[- :]/);
        if (parts.length >= 3) {
            return new Date(
                parseInt(parts[0]),
                parseInt(parts[1]) - 1,
                parseInt(parts[2]),
                parseInt(parts[3]) || 0,
                parseInt(parts[4]) || 0
            );
        }
        return null;
    }

    // ==================== 数据获取 ====================

    /**
     * 获取建行黄金数据
     * API端点（参考建行页面源码）：
     *   ／分时线 → /cn/home/news/trendchart/chartdata/888888/888888.js
     *   ／日线   → /cn/home/news/trendchart/day/888888.js
     *   ／周线   → /cn/home/news/trendchart/week/888888.js
     *   ／月线   → /cn/home/news/trendchart/month/888888.js
     */
    const CCB_BASE = 'https://www.ccb.com';

    function getCcbUrl(period) {
        const map = {
            intraday: '/cn/home/news/trendchart/chartdata/888888/888888.js',
            day: '/cn/home/news/trendchart/day/888888.js',
            week: '/cn/home/news/trendchart/week/888888.js',
            month: '/cn/home/news/trendchart/month/888888.js'
        };
        return CCB_BASE + map[period];
    }

    async function fetchCcbGold(period) {
        const url = getCcbUrl(period);
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const text = await resp.text();
            // CCB 返回的是纯JSON数组（有时带 var xxx = 前缀的旧格式）
            let jsonStr = text.trim();
            // 移除可能的 JS 变量赋值前缀
            if (jsonStr.startsWith('var ')) {
                jsonStr = jsonStr.substring(jsonStr.indexOf('=') + 1).trim();
                if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
            }
            const data = JSON.parse(jsonStr);
            if (!Array.isArray(data)) {
                throw new Error('数据格式错误：期望数组');
            }
            return data;
        } catch (e) {
            console.warn('CCB API 请求失败（跨域限制），尝试加载本地样本数据:', e.message);
            // 跨域拦截时回退到本地样本数据（仅日线有样本，其余周期聚合展示）
            try {
                const fallbackResp = await fetch('data/ccb_gold_sample.json');
                if (!fallbackResp.ok) throw new Error('样本文件加载失败');
                const raw = await fallbackResp.json();
                if (!Array.isArray(raw) || raw.length === 0) throw new Error('样本数据为空');
                dataSourceNote.textContent = '数据来源：本地样本（网络受限，实时数据不可用）';
                if (period === 'intraday' || period === 'day') return raw;
                // 周线/月线：按自然周/月聚合
                return aggregateCcbData(raw, period);
            } catch (e2) {
                console.warn('本地样本数据加载失败:', e2.message);
                return null;
            }
        }
    }

    function aggregateCcbData(daily, period) {
        const buckets = {};
        for (const d of daily) {
            const date = new Date(d.time);
            let key;
            if (period === 'week') {
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay() + 1);
                key = startOfWeek.toISOString().slice(0, 10);
            } else {
                key = d.time.slice(0, 7); // YYYY-MM
            }
            if (!buckets[key]) {
                buckets[key] = { time: key, open: d.open, high: d.high, low: d.low, close: d.close, valueS: 0, count: 1 };
            } else {
                const b = buckets[key];
                b.high = Math.max(b.high, d.high);
                b.low = Math.min(b.low, d.low);
                b.close = d.close;
                b.valueS += d.valueS || 0;
                b.count++;
            }
        }
        return Object.values(buckets).map(b => ({
            time: b.time, open: b.open, high: b.high, low: b.low, close: b.close,
            valueS: parseFloat((b.valueS / b.count).toFixed(2)), CURR_COD: '156'
        }));
    }

    /**
     * 获取美股数据 (NVDA / NASDAQ)
     * 使用 Yahoo Finance v8 API（支持CORS）
     */
    function getYahooSymbol(asset, period) {
        const baseSymbol = asset === 'nvda' ? 'NVDA' : '^IXIC';
        const intervalMap = {
            intraday: '5m',
            day: '1d',
            week: '1wk',
            month: '1mo'
        };
        const rangeMap = {
            intraday: '5d',
            day: '6mo',
            week: '2y',
            month: '5y'
        };
        return {
            symbol: baseSymbol,
            interval: intervalMap[period] || '1d',
            range: rangeMap[period] || '6mo'
        };
    }

    async function fetchYahooData(asset, period) {
        const { symbol, interval, range } = getYahooSymbol(asset, period);
        try {
            // Yahoo Finance v8 chart API
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Yahoo HTTP ' + resp.status);
            const json = await resp.json();
            const result = json.chart?.result?.[0];
            if (!result) throw new Error('Yahoo 无数据');

            const timestamps = result.timestamp || [];
            const quote = result.indicators?.quote?.[0] || {};
            const opens = quote.open || [];
            const highs = quote.high || [];
            const lows = quote.low || [];
            const closes = quote.close || [];

            // 转换为统一格式
            const data = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (closes[i] == null) continue;
                const d = new Date(timestamps[i] * 1000);
                let timeStr;
                if (period === 'intraday') {
                    timeStr = d.toISOString().slice(0, 16).replace('T', ' '); // "YYYY-MM-DD HH:mm"
                } else {
                    timeStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
                }
                data.push({
                    time: timeStr,
                    open: opens[i] != null ? parseFloat(opens[i].toFixed(2)) : null,
                    high: highs[i] != null ? parseFloat(highs[i].toFixed(2)) : null,
                    low: lows[i] != null ? parseFloat(lows[i].toFixed(2)) : null,
                    close: parseFloat(closes[i].toFixed(2)),
                    valueS: null,
                    CURR_COD: 'USD'
                });
            }
            return data;
        } catch (e) {
            console.warn('Yahoo Finance API 请求失败:', e.message);
            return null;
        }
    }

    /**
     * 统一数据获取入口
     */
    async function fetchData(asset, period, forceRefresh) {
        const cacheKey = `${asset}_${period}`;

        // 如果有缓存且不强制刷新，使用缓存
        if (!forceRefresh && state.cache[cacheKey] && state.cache[cacheKey].length > 0) {
            return state.cache[cacheKey];
        }

        let data = null;

        if (asset === 'gold') {
            data = await fetchCcbGold(period);
            if (data) {
                dataSourceNote.textContent = '数据来源：中国建设银行';
            }
        } else {
            data = await fetchYahooData(asset, period);
            if (data) {
                dataSourceNote.textContent = '数据来源：Yahoo Finance';
            }
        }

        if (data && data.length > 0) {
            state.cache[cacheKey] = data;
            // 也存入rawData
            if (!state.rawData[asset]) state.rawData[asset] = {};
            state.rawData[asset][period] = data;
        }

        return data;
    }

    // ==================== 图表渲染 (ECharts) ====================

    function initChart() {
        if (state.chartInstance) {
            state.chartInstance.dispose();
        }
        state.chartInstance = echarts.init(mainChart);
        // 响应式
        window.addEventListener('resize', () => {
            if (state.chartInstance) state.chartInstance.resize();
        });
    }

    function buildChartOption(rawData, asset, period) {
        if (!rawData || rawData.length === 0) {
            return null;
        }

        const isIntraday = period === 'intraday';
        const dates = rawData.map(d => d.time);
        const ohlcData = rawData.map(d => [d.open, d.close, d.low, d.high]);
        const volumes = rawData.map((d, i) => {
            // CCB 数据有 valueS 字段（涨跌幅%），美股数据没有
            return d.valueS != null ? [i, parseFloat(d.valueS)] : [i, d.close];
        });

        // 计算颜色
        const upColor = '#e15241';
        const downColor = '#22ab5b';
        const upBorderColor = '#c04331';
        const downBorderColor = '#1b8c4a';

        // 移动平均线 (MA5, MA10, MA20)
        const calculateMA = (dayCount, data) => {
            const result = [];
            for (let i = 0; i < data.length; i++) {
                if (i < dayCount - 1) {
                    result.push(null);
                    continue;
                }
                let sum = 0;
                let count = 0;
                for (let j = Math.max(0, i - dayCount + 1); j <= i; j++) {
                    if (data[j].close != null) {
                        sum += data[j].close;
                        count++;
                    }
                }
                result.push(count > 0 ? +(sum / count).toFixed(2) : null);
            }
            return result;
        };

        const ma5 = isIntraday ? [] : calculateMA(5, rawData);
        const ma10 = isIntraday ? [] : calculateMA(10, rawData);
        const ma20 = isIntraday ? [] : calculateMA(20, rawData);

        // 成交量颜色
        const volColors = rawData.map((d, i) => {
            if (i === 0) return upColor;
            return d.close >= rawData[i - 1].close ? upColor : downColor;
        });

        const series = [
            {
                name: 'K线',
                type: 'candlestick',
                data: ohlcData,
                itemStyle: {
                    color: upColor,
                    color0: downColor,
                    borderColor: upBorderColor,
                    borderColor0: downBorderColor
                },
                markPoint: {
                    data: [
                        {
                            name: '最高',
                            type: 'max',
                            valueDim: 'highest',
                            symbolSize: 40,
                            label: { fontSize: 11 }
                        },
                        {
                            name: '最低',
                            type: 'min',
                            valueDim: 'lowest',
                            symbolSize: 40,
                            label: { fontSize: 11 }
                        }
                    ]
                }
            }
        ];

        // 非分时线添加移动平均线
        if (!isIntraday) {
            series.push(
                {
                    name: 'MA5',
                    type: 'line',
                    data: ma5,
                    smooth: true,
                    lineStyle: { width: 1, color: '#f5a623' },
                    symbol: 'none',
                    emphasis: { disabled: true }
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: ma10,
                    smooth: true,
                    lineStyle: { width: 1, color: '#5b8ff9' },
                    symbol: 'none',
                    emphasis: { disabled: true }
                },
                {
                    name: 'MA20',
                    type: 'line',
                    data: ma20,
                    smooth: true,
                    lineStyle: { width: 1, color: '#e66497' },
                    symbol: 'none',
                    emphasis: { disabled: true }
                }
            );
        }

        // 成交量图
        if (!isIntraday) {
            series.push({
                name: '成交量/涨跌幅',
                type: 'bar',
                yAxisIndex: 1,
                data: rawData.map((d, i) => {
                    const val = d.valueS != null ? parseFloat(d.valueS) : (d.close - rawData[Math.max(0, i - 1)].close);
                    return val;
                }),
                itemStyle: {
                    color: (params) => {
                        const i = params.dataIndex;
                        if (i === 0) return upColor;
                        return rawData[i].close >= rawData[i - 1].close ? upColor : downColor;
                    }
                }
            });
        }

        // 构建网格
        const grid = isIntraday
            ? [{ left: '8%', right: '5%', top: '5%', bottom: '8%' }]
            : [
                { left: '8%', right: '5%', top: '5%', height: '65%' },
                { left: '8%', right: '5%', top: '75%', height: '15%' }
            ];

        const yAxis = isIntraday
            ? [{
                type: 'value',
                scale: true,
                splitLine: { lineStyle: { color: '#e8e8e8', type: 'dashed' } },
                axisLabel: { fontSize: 11 }
            }]
            : [
                {
                    type: 'value',
                    scale: true,
                    splitLine: { lineStyle: { color: '#e8e8e8', type: 'dashed' } },
                    axisLabel: { fontSize: 11 }
                },
                {
                    type: 'value',
                    gridIndex: 1,
                    splitLine: { show: false },
                    axisLabel: { fontSize: 10 },
                    axisLine: { show: false },
                    axisTick: { show: false }
                }
            ];

        const xAxis = [{
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: '#bbb' } },
            axisLabel: {
                fontSize: 11,
                rotate: rawData.length > 60 ? 45 : 0,
                formatter: (val) => {
                    if (isIntraday) {
                        // 显示时间部分
                        const parts = val.split(' ');
                        return parts.length > 1 ? parts[1] : val;
                    }
                    // 日/周/月线显示月-日
                    if (val.length >= 10) {
                        return val.slice(5); // MM-DD
                    }
                    return val;
                }
            },
            splitLine: { show: false }
        }];

        const option = {
            backgroundColor: 'transparent',
            animation: true,
            animationDuration: 500,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params) => {
                    if (!params || params.length === 0) return '';
                    const dateStr = params[0].axisValue;
                    let html = `<strong>${dateStr}</strong><br/>`;
                    for (const p of params) {
                        if (p.seriesName === '成交量/涨跌幅') {
                            const v = p.data;
                            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:4px;"></span>`;
                            html += `${p.seriesName}: ${v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) : '--'}<br/>`;
                        } else if (p.seriesName === 'K线') {
                            const ohlc = p.data;
                            html += `开: ${ohlc[0] != null ? ohlc[0] : '--'}&nbsp;&nbsp;`;
                            html += `收: ${ohlc[1] != null ? ohlc[1] : '--'}&nbsp;&nbsp;`;
                            html += `低: ${ohlc[2] != null ? ohlc[2] : '--'}&nbsp;&nbsp;`;
                            html += `高: ${ohlc[3] != null ? ohlc[3] : '--'}<br/>`;
                        } else {
                            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:4px;"></span>`;
                            html += `${p.seriesName}: ${p.data != null ? p.data : '--'}<br/>`;
                        }
                    }
                    return html;
                }
            },
            legend: {
                data: isIntraday ? ['K线'] : ['K线', 'MA5', 'MA10', 'MA20', '成交量/涨跌幅'],
                top: 0,
                left: 'center',
                textStyle: { fontSize: 11 }
            },
            grid: grid,
            xAxis: xAxis,
            yAxis: yAxis,
            series: series,
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    zoomOnMouseWheel: true,
                    moveOnMouseMove: true,
                    moveOnMouseWheel: false
                },
                {
                    type: 'slider',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    height: 26,
                    bottom: 2,
                    borderColor: '#ddd',
                    fillerColor: 'rgba(43, 95, 195, 0.15)',
                    handleStyle: { color: '#2b5fc3' }
                }
            ]
        };

        return option;
    }

    async function renderChart(asset, period) {
        if (!state.chartInstance) {
            initChart();
        }

        // 显示加载中
        state.chartInstance.showLoading({
            text: '加载行情数据...',
            color: '#2b5fc3',
            textColor: '#999',
            maskColor: 'rgba(255,255,255,0.7)',
            zlevel: 0
        });

        try {
            const data = await fetchData(asset, period);
            state.chartInstance.hideLoading();

            if (!data || data.length === 0) {
                state.chartInstance.clear();
                showError(asset, period);
                updateSnapshot(null, asset);
                return;
            }

            const option = buildChartOption(data, asset, period);
            if (option) {
                state.chartInstance.setOption(option, true);
            }

            // 更新快照
            updateSnapshot(data, asset);

        } catch (e) {
            console.error('渲染图表出错:', e);
            state.chartInstance.hideLoading();
            state.chartInstance.clear();
            showError(asset, period);
            updateSnapshot(null, asset);
        }
    }

    function showError(asset, period) {
        // 尝试使用内存缓存数据
        const cacheKey = `${asset}_${period}`;
        const cached = state.cache[cacheKey];
        if (cached && cached.length > 0) {
            const option = buildChartOption(cached, asset, period);
            if (option && state.chartInstance) {
                state.chartInstance.setOption(option, true);
                updateSnapshot(cached, asset);
                dataSourceNote.textContent += '（使用缓存数据）';
                return;
            }
        }
        // 无数据时在图表区域显示提示
        if (state.chartInstance) {
            state.chartInstance.setOption({
                graphic: [{
                    type: 'text',
                    left: 'center',
                    top: 'middle',
                    style: {
                        text: '数据加载失败\n网络受限或接口暂不可用',
                        font: '16px sans-serif',
                        fill: '#999',
                        textAlign: 'center'
                    }
                }]
            }, true);
        }
        dataSourceNote.textContent = '数据加载失败，请稍后刷新重试';
    }

    /**
     * 更新行情快照卡片
     */
    function updateSnapshot(data, asset) {
        if (!data || data.length === 0) {
            snapPrice.textContent = '--';
            snapPrice.className = 'snapshot-value';
            snapChange.textContent = '--';
            snapChange.className = 'snapshot-value';
            snapChangePct.textContent = '--';
            snapChangePct.className = 'snapshot-value';
            snapHigh.textContent = '--';
            snapHigh.className = 'snapshot-value';
            snapLow.textContent = '--';
            snapLow.className = 'snapshot-value';
            snapTime.textContent = '--';
            snapTime.className = 'snapshot-value';
            return;
        }

        const last = data[data.length - 1];
        const prev = data.length >= 2 ? data[data.length - 2] : last;

        // 最新价
        const price = last.close;
        snapPrice.textContent = formatPrice(price, asset);

        // 涨跌额
        const change = price - prev.close;
        snapChange.textContent = formatChange(change, asset);
        snapChange.className = 'snapshot-value ' + getColorClass(change);

        // 涨跌幅
        const changePct = prev.close !== 0 ? ((price - prev.close) / prev.close) * 100 : 0;
        snapChangePct.textContent = formatChangePct(changePct);
        snapChangePct.className = 'snapshot-value ' + getColorClass(changePct);

        // 最高/最低
        const highs = data.map(d => d.high).filter(v => v != null);
        const lows = data.map(d => d.low).filter(v => v != null);
        const maxHigh = highs.length > 0 ? Math.max(...highs) : null;
        const minLow = lows.length > 0 ? Math.min(...lows) : null;

        // 对于当前视图显示最近60个数据点的最高最低
        const visibleSlice = data.slice(-60);
        const visibleHighs = visibleSlice.map(d => d.high).filter(v => v != null);
        const visibleLows = visibleSlice.map(d => d.low).filter(v => v != null);
        const visibleMaxHigh = visibleHighs.length > 0 ? Math.max(...visibleHighs) : maxHigh;
        const visibleMinLow = visibleLows.length > 0 ? Math.min(...visibleLows) : minLow;

        snapHigh.textContent = formatPrice(visibleMaxHigh, asset);
        snapHigh.className = 'snapshot-value up';
        snapLow.textContent = formatPrice(visibleMinLow, asset);
        snapLow.className = 'snapshot-value down';

        // 时间
        snapTime.textContent = last.time;
        snapTime.className = 'snapshot-value';

        // 颜色
        snapPrice.className = 'snapshot-value ' + getColorClass(change);
    }

    // ==================== 标签切换逻辑 ====================

    function switchAsset(asset) {
        if (state.asset === asset) return;
        state.asset = asset;

        // 更新UI
        $$('.asset-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.asset === asset);
        });

        // 重置周期（如果当前周期不适用）
        renderChart(asset, state.period);
    }

    function switchPeriod(period) {
        if (state.period === period) return;
        state.period = period;

        // 更新UI
        $$('.period-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.period === period);
        });

        renderChart(state.asset, period);
    }

    // ==================== 事件绑定 ====================

    function bindEvents() {
        // 资产切换
        $$('.asset-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const asset = tab.dataset.asset;
                if (asset) switchAsset(asset);
            });
        });

        // 周期切换
        $$('.period-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const period = tab.dataset.period;
                if (period) switchPeriod(period);
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case '1':
                    switchAsset('gold');
                    break;
                case '2':
                    switchAsset('nvda');
                    break;
                case '3':
                    switchAsset('nasdaq');
                    break;
            }
        });

        // 窗口大小变化时重绘
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (state.chartInstance) state.chartInstance.resize();
            }, 200);
        });
    }

    // ==================== 导航与页脚注入 ====================

    function injectNavigation() {
        // 注入导航栏（复用主站导航结构）
        const navbar = $('#navbar');
        if (navbar) {
            navbar.innerHTML = `
                <div class="nav-inner">
                    <a href="../index.html" class="nav-brand">largeoyo</a>
                    <div class="nav-links">
                        <a href="../index.html">首页</a>
                        <a href="../blog/index.html">博客</a>
                        <a href="../ai-tutorials/index.html">AI教程</a>
                        <a href="../games/index.html">小游戏</a>
                        <a href="../invest/index.html" class="active">投资观察</a>
                        <a href="../quick-nav/index.html">速查</a>
                    </div>
                </div>
            `;
        }

        // 注入页脚
        const footer = $('#footer');
        if (footer) {
            footer.innerHTML = `
                <div class="footer-content">
                    <p>© 2026 largeoyos.github.io — 投资观察 v1.1.0</p>
                    <p style="font-size:0.75rem;color:#999;">行情数据仅供参考，不构成投资建议</p>
                </div>
            `;
        }
    }

    // ==================== 初始化 ====================

    async function init() {
        injectNavigation();
        initChart();
        bindEvents();

        // 加载默认视图 (建行黄金 日线)
        await renderChart('gold', 'day');
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();