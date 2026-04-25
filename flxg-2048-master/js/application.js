var MIN_BOARD_SIZE = 3;
var MAX_BOARD_SIZE = 8;
var DEFAULT_BOARD_SIZE = 5;
var BOARD_SIZE_KEY = "boardSize";

function clampBoardSize(size) {
  return Math.max(MIN_BOARD_SIZE, Math.min(MAX_BOARD_SIZE, size));
}

function loadBoardSize() {
  var raw;

  try {
    raw = parseInt(window.localStorage.getItem(BOARD_SIZE_KEY), 10);
  } catch (error) {
    return DEFAULT_BOARD_SIZE;
  }

  if (isNaN(raw)) {
    return DEFAULT_BOARD_SIZE;
  }

  return clampBoardSize(raw);
}

function saveBoardSize(size) {
  try {
    window.localStorage.setItem(BOARD_SIZE_KEY, size);
  } catch (error) {
    // Ignore storage failures and keep gameplay working.
  }
}

function updateBoardSizeLabel(size) {
  var label = document.querySelector(".board-size-value");
  if (label) {
    label.textContent = size + " x " + size;
  }
}

function bindBoardSizeControl(gameManager) {
  var slider = document.querySelector(".board-size-slider");
  if (!slider) {
    return;
  }

  slider.min = MIN_BOARD_SIZE;
  slider.max = MAX_BOARD_SIZE;
  slider.value = gameManager.size;
  updateBoardSizeLabel(gameManager.size);

  slider.addEventListener("input", function () {
    var previewSize = clampBoardSize(parseInt(slider.value, 10));
    updateBoardSizeLabel(previewSize);
  });

  slider.addEventListener("change", function () {
    var nextSize = clampBoardSize(parseInt(slider.value, 10));
    slider.value = nextSize;
    updateBoardSizeLabel(nextSize);

    if (nextSize === gameManager.size) {
      return;
    }

    saveBoardSize(nextSize);
    gameManager.setSize(nextSize);
  });
}

function bindAIControls(gameManager) {
  var trainButton = document.querySelector(".ai-train-button");
  var watchButton = document.querySelector(".ai-watch-button");
  var restartButton = document.querySelector(".ai-restart-button");
  var speedSelect = document.querySelector(".ai-speed-select");
  var statusLabel = document.querySelector(".ai-status");
  var boardSizeSlider = document.querySelector(".board-size-slider");
  var aiPlayer = new AIPlayer(gameManager);

  if (!trainButton || !watchButton || !restartButton || !speedSelect || !statusLabel) {
    return null;
  }

  function setStatus(text) {
    statusLabel.textContent = text;
  }

  function setTrainingUI(isTraining) {
    trainButton.textContent = isTraining ? "停止训练" : "开始训练";
    watchButton.disabled = isTraining;
    restartButton.disabled = isTraining || aiPlayer.watching;
  }

  function setWatchingUI(isWatching) {
    watchButton.textContent = isWatching ? "欣赏AI停止" : "欣赏AI开始";
    trainButton.disabled = isWatching;
    restartButton.disabled = isWatching || aiPlayer.training;
  }

  aiPlayer.onWatchEnded = function (payload) {
    setWatchingUI(false);
    if (payload && payload.reason === "terminated") {
      restartButton.disabled = false;
      setStatus("AI本局已结束，请点击 AI重新开始");
      return;
    }

    setStatus("AI待命");
  };

  aiPlayer.onWatchStats = function (stats) {
    if (!aiPlayer.watching) {
      return;
    }

    setStatus("AI游玩中: 目标 " + stats.targetSpeed + " | 实际 " + stats.actualSpeed + " 步/秒");
  };

  trainButton.addEventListener("click", function () {
    if (aiPlayer.training) {
      aiPlayer.stopTraining();
      setTrainingUI(false);
      if (boardSizeSlider) {
        boardSizeSlider.disabled = false;
      }
      setStatus("训练已停止并保存 | 边长 " + gameManager.size + " | 总训练局数 " + aiPlayer.episodes);
      return;
    }

    aiPlayer.stopWatching();
    setWatchingUI(false);
    setTrainingUI(true);
    if (boardSizeSlider) {
      boardSizeSlider.disabled = true;
    }

    aiPlayer.startContinuousTraining(function (progress) {
      if (progress.episodes % 20 === 0) {
        setStatus(
          "训练中(持续) | 边长 " + progress.size +
          " | 局数 " + progress.episodes +
          " | 最佳分 " + progress.bestScore +
          " | 胜场 " + progress.wins
        );
      }
    });

    setStatus(
      "开始持续训练 | 边长 " + gameManager.size +
      " | 再次点击按钮可停止"
    );
  });

  if (boardSizeSlider) {
    boardSizeSlider.addEventListener("change", function () {
      window.setTimeout(function () {
        aiPlayer.stopWatching();
        aiPlayer.stopTraining();
        setWatchingUI(false);
        setTrainingUI(false);
        aiPlayer.loadPersistentModel();
        boardSizeSlider.disabled = false;

        setStatus(
          "已切换到边长 " + gameManager.size +
          " | 已加载该边长训练数据(局数 " + aiPlayer.episodes + ")"
        );
      }, 0);
    });
  }

  watchButton.addEventListener("click", function () {
    var speed = parseInt(speedSelect.value, 10);

    if (aiPlayer.training) {
      setStatus("请先停止训练，再进入欣赏模式");
      return;
    }

    if (aiPlayer.watching) {
      aiPlayer.stopWatching();
      setWatchingUI(false);
      setStatus("AI待命");
      return;
    }

    aiPlayer.startWatching(speed);
    setWatchingUI(true);
    setStatus("AI游玩中: 目标 " + speed + " 步/秒");
  });

  restartButton.addEventListener("click", function () {
    aiPlayer.stopWatching();
    if (aiPlayer.training) {
      aiPlayer.stopTraining();
      setTrainingUI(false);
      setStatus(
        "训练已停止并保存 | 边长 " + gameManager.size + " | 总训练局数 " + aiPlayer.episodes
      );
    }
    gameManager.startNewGame(false);
    restartButton.disabled = false;
    setStatus("已重新开始，可点击 欣赏AI开始");
  });

  speedSelect.addEventListener("change", function () {
    var speed = parseInt(speedSelect.value, 10);
    if (aiPlayer.watching) {
      aiPlayer.startWatching(speed);
      setStatus("AI游玩中: 目标 " + speed + " 步/秒");
    }
  });

  setWatchingUI(false);
  setTrainingUI(false);
  setStatus("AI待命");

  return aiPlayer;
}

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var boardSize = loadBoardSize();
  var gameManager = new GameManager(boardSize, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  var aiPlayer = bindAIControls(gameManager);
  bindBoardSizeControl(gameManager);

  if (aiPlayer) {
    var slider = document.querySelector(".board-size-slider");
    if (slider) {
      slider.addEventListener("change", function () {
        aiPlayer.stopWatching();
      });
    }
  }
});
