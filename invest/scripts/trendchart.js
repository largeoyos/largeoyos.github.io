
// 解析URL参数
var uArgs = (function () {
	console.log('uArgs');
	var args = new Object();
	var query = location.search.substring(1);
	var pairs = query.split("&");
	for (var i = 0; i < pairs.length; i++) {
		var pos = pairs[i].indexOf("=");
		if (pos == -1) continue;
		var argname = pairs[i].substring(0, pos);
		var argvalue = pairs[i].substring(pos + 1);
		// argvalue = decodeURIComponent(value);
		args[argname] = argvalue;
	}
	return args;
})();


/** 获取图表对象[日线图|周线图|月线图]
chartData: 用于画图的原始数据
*/
function getChart2Obj(chartData) {
	console.log('chartData:' + chartData);
	//图表对象
	var iChart = new AmCharts.AmSerialChart();
	// iChart.pathToImages = "images/";
	iChart.pathToImages = "/uiFramework/commonResource/zip/cn/cn/gold_new/images/";
	iChart.dataProvider = chartData;
	iChart.categoryField = "PRI_DATE";
	iChart.columnWidth = 0.2; //柱宽
	iChart.autoMargins = false;
	iChart.marginRight = 35;
	iChart.marginLeft = 70;
	iChart.zoomOutOnDataUpdate = false;
	iChart.zoomOutText = "显示全部";
	iChart.addListener('zoomed', handleZoom);

	// iChart.fontSize = "12"; // 标题大小

	//横轴
	var horizontalAxis = iChart.categoryAxis;
	horizontalAxis.dashLength = 1;
	horizontalAxis.tickLength = 0;
	horizontalAxis.labelFrequency = 2;
	horizontalAxis.inside = false;
	horizontalAxis.autoGridCount = false;
	horizontalAxis.gridCount = 6;
	horizontalAxis.autoWrap = true; // x轴宽度自适应

	//纵轴
	var verticalAxis = new AmCharts.ValueAxis();
	verticalAxis.axisAlpha = 1;
	verticalAxis.dashLength = 0.5;
	verticalAxis.inside = false;
	iChart.addValueAxis(verticalAxis);
	//提示气泡
	var iBalloon = iChart.balloon;
	iBalloon.adjustBorderColor = true;
	iBalloon.cornerRadius = 5;
	iBalloon.fillAlpha = 0.8; //气泡的透明度
	iBalloon.borderThickness = 0.5; //气泡线粗
	iBalloon.borderAlpha = 0.1;
	//蜡烛图
	// var candleGraph = new AmCharts.AmGraph();
	// candleGraph.visibleInLegend = false;
	// candleGraph.title = "Price:";
	// candleGraph.type = "candlestick";
	// candleGraph.lineColor = "#db4c3c";
	// candleGraph.fillColors = "#db4c3c";
	// candleGraph.negativeLineColor = "#007500";
	// candleGraph.negativeFillColors = "#007500";
	// candleGraph.fillAlphas = 1;
	// candleGraph.openField = "OPE_QUO";
	// candleGraph.closeField = "CLO_QUO";
	// candleGraph.highField = "HIG_PRI";
	// candleGraph.lowField = "LOW_PRI";
	// candleGraph.descriptionField = "CLO_QUO";
	// candleGraph.valueField = "CLO_QUO";
	// candleGraph.balloonText = "开盘:[[OPE_QUO]] 收盘:[[CLO_QUO]]\n最高:[[HIG_PRI]] 最低:[[LOW_PRI]] 涨跌幅:[[PRI_CHG]]%";
	// candleGraph.cursorBulletAlpha = 0.1;
	// candleGraph.valueAxis = verticalAxis;
	// iChart.addGraph(candleGraph);
	//MA5
	var ma5Graph = new AmCharts.AmGraph();
	ma5Graph.visibleInLegend = true;
	// ma5Graph.visibleInLegend = false;
	ma5Graph.title = "个人黄金积存价格(元/克)";
	ma5Graph.valueField = "CLO_QUO";
	ma5Graph.type = "line";
	ma5Graph.valueAxis = verticalAxis; // indicate which axis should be used
	ma5Graph.lineThickness = 1;
	ma5Graph.bullet = "";
	ma5Graph.lineColor = "#2962ff";   //线条颜色
	// ma5Graph.fillColors = "#d43487"; //balloonText背景色;  lineColor如果设置了，这个值设置无效
	//ma5Graph.balloonColor = "#000000";
	ma5Graph.balloonText = "价格:[[CLO_QUO]]";
	iChart.addGraph(ma5Graph);
	// //MA10
	// var ma10Graph = new AmCharts.AmGraph();
	// ma10Graph.visibleInLegend = true;
	// ma10Graph.title = "MA10";
	// ma10Graph.valueField = "AVG10";
	// ma10Graph.type = "line";
	// ma10Graph.valueAxis = verticalAxis; // indicate which axis should be used
	// ma10Graph.lineColor = "#d43487";   //线条颜色
	// ma10Graph.balloonText = "";
	// ma10Graph.lineThickness = 1;
	// ma10Graph.bullet = "";
	// ma10Graph.fillColors = "#d43487";   //balloonText背景色;  lineColor如果设置了，这个值设置无效
	// ma10Graph.balloonColor = "#000000";
	// iChart.addGraph(ma10Graph);
	// //MA20
	// var ma20Graph = new AmCharts.AmGraph();
	// ma20Graph.visibleInLegend = true;
	// ma20Graph.title = "MA20";
	// ma20Graph.valueField = "AVG20";
	// ma20Graph.type = "line";
	// ma20Graph.valueAxis = verticalAxis; // indicate which axis should be used
	// ma20Graph.balloonText = "";
	// ma20Graph.lineThickness = 1;
	// ma20Graph.bullet = "";
	// ma20Graph.fillColors = "#d43487";
	// ma20Graph.balloonColor = "#000000";
	// iChart.addGraph(ma20Graph);
	//图例
	var iLegend = new AmCharts.AmLegend();
	iLegend.autoMargins = false;
	iLegend.markerSize = 10;
	iLegend.maxColumns = 4;
	iLegend.bulletType = "round";
	iLegend.equalWidths = false;
	iLegend.valueWidth = 50;
	iLegend.color = "#000000";
	iLegend.marginTop = 0;
	iChart.addLegend(iLegend);
	//游标
	var iCursor = new AmCharts.ChartCursor();
	iCursor.cursorAlpha = 0.5; //线条大小
	iCursor.cursorPosition = "middle";
	iChart.addChartCursor(iCursor);

	// // 设置滚动条
	// var chartScrollbar = new AmCharts.ChartScrollbar();
	// chartMonth.addChartScrollbar(chartScrollbar);

	return iChart;
}

/** 图表事件(区间放大)的关联函数：更新图表下方时间范围信息 */
function handleZoom(ievent) {
	console.log('handleZoom:' + ievent);
	var startValue, endValue;
	if (ievent.startDate && ievent.endDate) {
		var dateFormatStr = "JJ:NN:SS";
		startValue = AmCharts.formatDate(ievent.startDate, dateFormatStr);
		endValue = AmCharts.formatDate(ievent.endDate, dateFormatStr);
	} else {
		startValue = ievent.startValue;
		endValue = ievent.endValue;
	}
	var idx = $("#img_box li").index(ievent.chart.div.parentElement);
	var $timeTip = $("span.chartTip").eq(idx).html("&nbsp;&nbsp;&nbsp;");
	var timeReg = /(\d{4}\-\d{2}\-\d{2})|(\d{2}\:\d{2}\:\d{2})/;
	if (timeReg.test(startValue) && timeReg.test(endValue)) {
		$timeTip.html("时间范围:&nbsp;" + startValue + "&nbsp;至&nbsp;" + endValue);
	}
}

// 取数，然后画图
function main() {
	console.log('start main');
	$.ajax({
		async: true,
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 2000,
		//	url:"019995.js",//测试挡板
		url: "/cn/home/news/trendchart/day/888888.js",
		data: {
			sec_code: uArgs.productCode
		},
		success: function (data, textStatus, jqXHR) {
			$.each(data, function (k, v) {
				//兼容旧接口
				if (null == v.OPE_QUO) v.OPE_QUO = v.open;
				if (null == v.CLO_QUO) v.CLO_QUO = v.close;
				if (null == v.HIG_PRI) v.HIG_PRI = v.high;
				if (null == v.LOW_PRI) v.LOW_PRI = v.low;
				if (null == v.PRI_CHG) v.PRI_CHG = v.valueS;
				if (null == v.AVG05) v.AVG05 = v.FIVEDAYAVG;
				if (null == v.AVG10) v.AVG10 = v.TENDAYAVG;
				if (null == v.AVG20) v.AVG20 = v.TWENDAYAVG;
				if (null == v.PRI_DATE) v.PRI_DATE = v.time;

				v.OPE_QUO = Number(v.OPE_QUO).toFixed(2);
				v.CLO_QUO = Number(v.CLO_QUO).toFixed(2);
				v.HIG_PRI = Number(v.HIG_PRI).toFixed(2);
				v.LOW_PRI = Number(v.LOW_PRI).toFixed(2);
				v.PRI_CHG = Number(v.PRI_CHG).toFixed(2);
				v.AVG05 = (v.AVG05 == 0) ? 'none' : Number(v.AVG05).toFixed(2);
				v.AVG10 = (v.AVG10 == 0) ? 'none' : Number(v.AVG10).toFixed(2);
				v.AVG20 = (v.AVG20 == 0) ? 'none' : Number(v.AVG20).toFixed(2);
			});

			//画图
			var chart = getChart2Obj(data);
			chart.write("chart");
			// $("#chart").css("height", "auto").append(
			// 	"<div>行情走势图中的价格为定期积存价，仅供参考，请以交易时报价为准。</div>"
			// )

			// 调整日线x轴字体样式
			$("#chart > div:nth-child(1) > svg > g:nth-child(8) > g:nth-child(1) > text").css("font-size", "12px");

			// 调整日线y轴字体样式
			$("#chart > div:nth-child(1) > svg > g:nth-child(8) > g:nth-child(2) > text").css("font-size", "12px");
	
			console.log('chart finish');
		}
	});
}
main();