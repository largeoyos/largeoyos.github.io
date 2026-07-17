const chartHost = document.getElementById('advanced-chart');
const assetName = document.getElementById('selected-asset-name');
const assetLink = document.getElementById('selected-asset-link');

const allAssetButtons = [...document.querySelectorAll('.asset-chip')];
const knownAssets = new Map(
    allAssetButtons.map((button) => [button.dataset.symbol, button.dataset.name])
);

function tradingViewUrl(symbol) {
    const [exchange, ...tickerParts] = symbol.split(':');
    const ticker = tickerParts.join(':');
    return `https://www.tradingview.com/symbols/${encodeURIComponent(exchange)}-${encodeURIComponent(ticker)}/`;
}

function renderChart(symbol, name) {
    if (!chartHost) return;

    chartHost.replaceChildren();

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.height = '100%';
    container.style.width = '100%';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = 'calc(100% - 30px)';
    widget.style.width = '100%';

    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright';
    const creditLink = document.createElement('a');
    creditLink.href = tradingViewUrl(symbol);
    creditLink.rel = 'noopener nofollow';
    creditLink.target = '_blank';
    creditLink.textContent = `${name} 图表`;
    const trademark = document.createElement('span');
    trademark.className = 'trademark';
    trademark.textContent = ' by TradingView';
    copyright.append(creditLink, trademark);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.textContent = JSON.stringify({
        autosize: true,
        symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        backgroundColor: 'rgba(6, 14, 25, 1)',
        gridColor: 'rgba(126, 165, 193, 0.10)',
        style: '1',
        locale: 'zh_CN',
        allow_symbol_change: true,
        calendar: false,
        details: true,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_volume: false,
        hotlist: false,
        save_image: true,
        withdateranges: true,
        studies: ['STD;EMA']
    });

    container.append(widget, copyright, script);
    chartHost.append(container);

    if (assetName) assetName.textContent = name;
    if (assetLink) {
        assetLink.href = tradingViewUrl(symbol);
        assetLink.setAttribute('aria-label', `在 TradingView 打开 ${name} 完整行情`);
    }

    const url = new URL(window.location.href);
    url.searchParams.set('symbol', symbol);
    window.history.replaceState({}, '', url);
}

function selectAsset(button, updateChart = true) {
    allAssetButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    if (updateChart) renderChart(button.dataset.symbol, button.dataset.name);
}

document.querySelectorAll('.asset-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        const category = tab.dataset.category;

        document.querySelectorAll('.asset-tab').forEach((item) => {
            const active = item === tab;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', String(active));
        });

        document.querySelectorAll('[data-asset-list]').forEach((list) => {
            const active = list.dataset.assetList === category;
            list.hidden = !active;
            list.classList.toggle('is-active', active);
        });
    });
});

allAssetButtons.forEach((button) => {
    button.addEventListener('click', () => selectAsset(button));
});

function updateMarketClocks() {
    const now = new Date();
    document.querySelectorAll('[data-market-clock]').forEach((clock) => {
        clock.textContent = new Intl.DateTimeFormat('zh-CN', {
            timeZone: clock.dataset.marketClock,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now);
    });
}

const requestedSymbol = new URLSearchParams(window.location.search).get('symbol');
const initialSymbol = knownAssets.has(requestedSymbol) ? requestedSymbol : 'NASDAQ:AAPL';
const initialButton = allAssetButtons.find((button) => button.dataset.symbol === initialSymbol);

if (initialButton) {
    const list = initialButton.closest('[data-asset-list]');
    const category = list?.dataset.assetList;
    const tab = document.querySelector(`.asset-tab[data-category="${category}"]`);
    tab?.click();
    selectAsset(initialButton, false);
}

renderChart(initialSymbol, knownAssets.get(initialSymbol) || 'Apple 苹果');
updateMarketClocks();
window.setInterval(updateMarketClocks, 1000);
