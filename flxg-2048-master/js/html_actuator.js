function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.gridContainer    = document.querySelector(".grid-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");
  this.rootElement      = document.documentElement;
  this.gridSize         = 0;

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.syncGrid(grid.size);
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

HTMLActuator.prototype.syncGrid = function (size) {
  if (this.gridSize === size) {
    return;
  }

  this.gridSize = size;
  this.rootElement.style.setProperty("--board-size", String(size));
  this.renderGrid(size);
};

HTMLActuator.prototype.renderGrid = function (size) {
  this.clearContainer(this.gridContainer);

  for (var y = 0; y < size; y++) {
    var row = document.createElement("div");
    row.classList.add("grid-row");

    for (var x = 0; x < size; x++) {
      var cell = document.createElement("div");
      cell.classList.add("grid-cell");
      row.appendChild(cell);
    }

    this.gridContainer.appendChild(row);
  }
};

// Continues the game (both restart and keep playing)
// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};


HTMLActuator.prototype.addTile = function (tile) {
  var text = new Array();
  text[1] = "红专并进"
  text[2] = "理实交融"
  text[3] = "永恒东风"
  text[4] = "红过九重"
  text[5] = "科学高峰"
  text[6] = "高到无穷"
  text[7] = "某坑势力"
  text[8] = "信息安全"
  text[9] = "炸毁金矿"
  text[10] = "火山喷发"  
  text[11] = "也西东流"  
  text[12] = "废理兴工"
  text[13] = "太空校区"
  text[14] = "大成功"
  text[15] = "数学分析"
  text[16] = "线性代数"
  text[17] = "概率论"
  text[18] = "复变函数"
  text[19] = "数理方程"
  var self = this;
  var text2 = function (n) { var r = 0; while (n > 1) r++, n >>= 1; return r; }

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];
  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);
  this.applyPixelPosition(wrapper, position);

  inner.classList.add("tile-inner");
  inner.textContent = text[text2(tile.value)];

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
      self.applyPixelPosition(wrapper, { x: tile.x, y: tile.y });
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
  this.fitTileText(inner);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.applyPixelPosition = function (element, position) {
  var normalized = this.normalizePosition(position);
  var selector = ".grid-row:nth-child(" + normalized.y + ") .grid-cell:nth-child(" + normalized.x + ")";
  var targetCell = this.gridContainer.querySelector(selector);

  if (!targetCell) {
    return;
  }

  var x = targetCell.offsetLeft;
  var y = targetCell.offsetTop;
  var transform = "translate(" + x + "px, " + y + "px)";

  element.style.webkitTransform = transform;
  element.style.mozTransform = transform;
  element.style.transform = transform;
};

HTMLActuator.prototype.fitTileText = function (tileInner) {
  var cell = this.gridContainer.querySelector(".grid-cell");
  var minFont;
  var maxFont;

  if (!cell) {
    return;
  }

  // Derive font from the current cell size so text scales with board size.
  var tileSize = cell.clientWidth;
  var padding = Math.max(2, Math.floor(tileSize * 0.08));

  tileInner.style.boxSizing = "border-box";
  tileInner.style.padding = padding + "px";
  tileInner.style.display = "flex";
  tileInner.style.alignItems = "center";
  tileInner.style.justifyContent = "center";
  tileInner.style.whiteSpace = "normal";
  tileInner.style.overflow = "hidden";
  tileInner.style.lineHeight = "1.15";

  maxFont = Math.floor(tileSize * 0.36);
  minFont = Math.max(8, Math.floor(tileSize * 0.16));

  tileInner.style.fontSize = maxFont + "px";

  while (maxFont > minFont &&
         (tileInner.scrollWidth > tileInner.clientWidth || tileInner.scrollHeight > tileInner.clientHeight)) {
    maxFont -= 1;
    tileInner.style.fontSize = maxFont + "px";
  }
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "" + difference + "";

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = "" + bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "废理兴工大成功！（欢迎继续游戏）" : "废理兴工永不放弃！";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "aenonsun");
  tweet.setAttribute("data-url", "http://home.ustc.edu.cn/~hejiyan/flxg");
  tweet.setAttribute("data-counturl", "http://home.ustc.edu.cn/~hejiyan/flxg");
  tweet.textContent = "Tweet";

  var text = "我为某坑壮大工科势力分数 " + this.score + " ，这是坠好滴！！ ";
  tweet.setAttribute("data-text", text);

  return tweet;
};
