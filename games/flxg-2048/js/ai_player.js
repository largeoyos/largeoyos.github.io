function AIPlayer(gameManager) {
  this.gameManager = gameManager;

  this.qTable = {};
  this.alpha = 0.12;
  this.gamma = 0.92;
  this.epsilon = 0.28;
  this.epsilonMin = 0.05;
  this.epsilonDecay = 0.995;

  this.training = false;
  this.watching = false;
  this.watchTimer = null;
  this.onWatchEnded = null;
  this.onWatchStats = null;

  this.episodes = 0;
  this.wins = 0;
  this.bestScore = 0;

  this.qWeight = 12;
  this.orderHeuristicWeight = 1;
  this.futureLookaheadWeight = 0.55;
  this.expectimaxMaxDepth = 4;
  this.chanceNodeSampleCap = 8;
  this.expectimaxCache = {};

  this.watchSpeed = 0;
  this.watchAccumulator = 0;
  this.watchTickHz = 60;
  this.watchMoveCounter = 0;
  this.watchLastStatsTime = 0;

  this.modelStoragePrefix = "aiModel:size:";

  this.loadPersistentModel();
}

AIPlayer.prototype.getModelStorageKey = function () {
  return this.modelStoragePrefix + this.gameManager.size;
};

AIPlayer.prototype.resetModel = function () {
  this.qTable = {};
  this.episodes = 0;
  this.wins = 0;
  this.bestScore = 0;
  this.epsilon = 0.28;
};

AIPlayer.prototype.loadPersistentModel = function () {
  var raw;
  var parsed;

  this.resetModel();

  try {
    raw = window.localStorage.getItem(this.getModelStorageKey());
  } catch (error) {
    return false;
  }

  if (!raw) {
    return false;
  }

  try {
    parsed = JSON.parse(raw);
  } catch (error2) {
    return false;
  }

  if (parsed.qTable && typeof parsed.qTable === "object") {
    this.qTable = parsed.qTable;
  }

  this.episodes = parsed.episodes || 0;
  this.wins = parsed.wins || 0;
  this.bestScore = parsed.bestScore || 0;
  this.epsilon = Math.max(this.epsilonMin, parsed.epsilon || this.epsilon);

  return true;
};

AIPlayer.prototype.savePersistentModel = function () {
  var payload = {
    qTable: this.qTable,
    episodes: this.episodes,
    wins: this.wins,
    bestScore: this.bestScore,
    epsilon: this.epsilon,
    size: this.gameManager.size,
    updatedAt: Date.now()
  };

  try {
    window.localStorage.setItem(this.getModelStorageKey(), JSON.stringify(payload));
    return true;
  } catch (error) {
    return false;
  }
};

AIPlayer.prototype.getStateKey = function () {
  var cells = [];

  for (var y = 0; y < this.gameManager.size; y++) {
    for (var x = 0; x < this.gameManager.size; x++) {
      var tile = this.gameManager.grid.cells[x][y];
      cells.push(tile ? tile.value : 0);
    }
  }

  return this.gameManager.size + "|" + cells.join(",");
};

AIPlayer.prototype.getQ = function (stateKey, action) {
  var key = stateKey + "|" + action;
  return this.qTable[key] || 0;
};

AIPlayer.prototype.setQ = function (stateKey, action, value) {
  var key = stateKey + "|" + action;
  this.qTable[key] = value;
};

AIPlayer.prototype.maxNextQ = function (stateKey) {
  var maxQ = this.getQ(stateKey, 0);

  for (var action = 1; action < 4; action++) {
    var q = this.getQ(stateKey, action);
    if (q > maxQ) {
      maxQ = q;
    }
  }

  return maxQ;
};

AIPlayer.prototype.chooseAction = function (stateKey, explore) {
  if (explore && Math.random() < this.epsilon) {
    return Math.floor(Math.random() * 4);
  }

  var bestActions = [];
  var bestQ = -Infinity;

  for (var action = 0; action < 4; action++) {
    var q = this.getQ(stateKey, action);
    if (q > bestQ) {
      bestQ = q;
      bestActions = [action];
    } else if (q === bestQ) {
      bestActions.push(action);
    }
  }

  return bestActions[Math.floor(Math.random() * bestActions.length)];
};

AIPlayer.prototype.rewardFromResult = function (result) {
  var reward = result.scoreDelta;

  if (!result.moved) {
    reward -= 4;
  }

  if (result.won) {
    reward += 100;
  }

  if (result.over) {
    reward -= 80;
  }

  var currentValues = this.cloneGridValues();
  var currentHeuristic = this.evaluateBoardHeuristic(currentValues, this.gameManager.size, 0);
  var futurePotential = this.evaluateFuturePotential(currentValues, this.gameManager.size);

  reward += currentHeuristic * 0.02;
  reward += futurePotential * 0.008;

  return reward;
};

AIPlayer.prototype.cloneGridValues = function () {
  var values = [];

  for (var x = 0; x < this.gameManager.size; x++) {
    values[x] = [];
    for (var y = 0; y < this.gameManager.size; y++) {
      var tile = this.gameManager.grid.cells[x][y];
      values[x][y] = tile ? tile.value : 0;
    }
  }

  return values;
};

AIPlayer.prototype.cloneValues = function (values, size) {
  var cloned = [];

  for (var x = 0; x < size; x++) {
    cloned[x] = [];
    for (var y = 0; y < size; y++) {
      cloned[x][y] = values[x][y];
    }
  }

  return cloned;
};

AIPlayer.prototype.simulateAction = function (values, size, action) {
  var grid = this.cloneValues(values, size);
  var merged = [];
  var moved = false;
  var scoreGain = 0;

  for (var mx = 0; mx < size; mx++) {
    merged[mx] = [];
    for (var my = 0; my < size; my++) {
      merged[mx][my] = false;
    }
  }

  function vectorFor(direction) {
    var map = {
      0: { x: 0, y: -1 },
      1: { x: 1, y: 0 },
      2: { x: 0, y: 1 },
      3: { x: -1, y: 0 }
    };
    return map[direction];
  }

  function withinBounds(cell) {
    return cell.x >= 0 && cell.x < size && cell.y >= 0 && cell.y < size;
  }

  var vector = vectorFor(action);
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  if (vector.x === 1) traversals.x.reverse();
  if (vector.y === 1) traversals.y.reverse();

  for (var xi = 0; xi < traversals.x.length; xi++) {
    var x = traversals.x[xi];

    for (var yi = 0; yi < traversals.y.length; yi++) {
      var y = traversals.y[yi];
      var value = grid[x][y];

      if (!value) {
        continue;
      }

      var cell = { x: x, y: y };
      var previous;

      do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
      } while (withinBounds(cell) && grid[cell.x][cell.y] === 0);

      var next = cell;
      var destination = previous;

      if (withinBounds(next) && grid[next.x][next.y] === value && !merged[next.x][next.y]) {
        grid[next.x][next.y] = value * 2;
        grid[x][y] = 0;
        merged[next.x][next.y] = true;
        scoreGain += value * 2;

        if (next.x !== x || next.y !== y) {
          moved = true;
        }
      } else if (destination.x !== x || destination.y !== y) {
        grid[destination.x][destination.y] = value;
        grid[x][y] = 0;
        moved = true;
      }
    }
  }

  return {
    moved: moved,
    scoreGain: scoreGain,
    values: grid
  };
};

AIPlayer.prototype.evaluateBoardHeuristic = function (values, size, scoreGain) {
  var empty = 0;
  var maxTile = 0;
  var maxInTop = false;
  var topRow = [];
  var topSortedPairs = 0;
  var topRowWeighted = 0;
  var belowTopPenalty = 0;
  var cornerAnchor = 0;
  var moveCount = this.countAvailableMoves(values, size);
  var mergePairs = this.countPotentialMerges(values, size);
  var smoothness = this.calculateSmoothness(values, size);
  var monotonicity = this.calculateMonotonicity(values, size);

  for (var x = 0; x < size; x++) {
    var topValue = values[x][0];
    topRow.push(topValue);
    topRowWeighted += topValue * (size - x);
  }

  for (var tx = 0; tx < size - 1; tx++) {
    if (topRow[tx] >= topRow[tx + 1]) {
      topSortedPairs += 1;
    }
  }

  for (var xx = 0; xx < size; xx++) {
    for (var yy = 0; yy < size; yy++) {
      var v = values[xx][yy];

      if (v === 0) {
        empty += 1;
        continue;
      }

      if (v > maxTile) {
        maxTile = v;
      }

      if (yy > 0) {
        belowTopPenalty += v;
      }
    }
  }

  for (var i = 0; i < size; i++) {
    if (topRow[i] === maxTile && maxTile > 0) {
      maxInTop = true;
      break;
    }
  }

  // Strongly prefer anchoring the largest tile in top-left corner.
  if (values[0][0] === maxTile && maxTile > 0) {
    cornerAnchor = 1;
  }

  return (
    empty * 120 +
    scoreGain * 1.6 +
    topSortedPairs * 220 +
    topRowWeighted * 0.25 +
    moveCount * 180 +
    mergePairs * 95 +
    smoothness * 22 +
    monotonicity * 26 +
    cornerAnchor * 900 +
    (maxInTop ? 550 : -450) -
    belowTopPenalty * 0.08
  );
};

AIPlayer.prototype.countAvailableMoves = function (values, size) {
  var moves = 0;

  for (var action = 0; action < 4; action++) {
    if (this.simulateAction(values, size, action).moved) {
      moves += 1;
    }
  }

  return moves;
};

AIPlayer.prototype.countPotentialMerges = function (values, size) {
  var pairs = 0;

  for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
      var value = values[x][y];

      if (!value) {
        continue;
      }

      if (x + 1 < size && values[x + 1][y] === value) {
        pairs += 1;
      }

      if (y + 1 < size && values[x][y + 1] === value) {
        pairs += 1;
      }
    }
  }

  return pairs;
};

AIPlayer.prototype.calculateSmoothness = function (values, size) {
  var smooth = 0;

  function log2(value) {
    var result = 0;
    var n = value;

    while (n > 1) {
      n = n >> 1;
      result += 1;
    }

    return result;
  }

  for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
      var current = values[x][y];
      if (!current) {
        continue;
      }

      var currentLog = log2(current);

      if (x + 1 < size && values[x + 1][y]) {
        smooth -= Math.abs(currentLog - log2(values[x + 1][y]));
      }

      if (y + 1 < size && values[x][y + 1]) {
        smooth -= Math.abs(currentLog - log2(values[x][y + 1]));
      }
    }
  }

  return smooth;
};

AIPlayer.prototype.calculateMonotonicity = function (values, size) {
  var score = 0;

  // Encourage non-increasing values from left to right in top rows.
  var rowsToCheck = Math.min(2, size);

  for (var y = 0; y < rowsToCheck; y++) {
    for (var x = 0; x < size - 1; x++) {
      if (values[x][y] >= values[x + 1][y]) {
        score += 1;
      } else {
        score -= 1;
      }
    }
  }

  // Encourage top-heavy structure to reduce bottom clutter.
  for (var yy = 0; yy < size - 1; yy++) {
    for (var xx = 0; xx < size; xx++) {
      if (values[xx][yy] >= values[xx][yy + 1]) {
        score += 0.5;
      }
    }
  }

  return score;
};

AIPlayer.prototype.evaluateFuturePotential = function (values, size) {
  var best = -Infinity;

  for (var action = 0; action < 4; action++) {
    var sim = this.simulateAction(values, size, action);
    if (!sim.moved) {
      continue;
    }

    var moveCount = this.countAvailableMoves(sim.values, size);
    var heuristic = this.evaluateBoardHeuristic(sim.values, size, sim.scoreGain);

    // Heavy penalty for likely dead-end states.
    if (moveCount <= 1) {
      heuristic -= 900;
    }

    if (heuristic > best) {
      best = heuristic;
    }
  }

  if (best === -Infinity) {
    return -1600;
  }

  return best;
};

AIPlayer.prototype.getEmptyCells = function (values, size) {
  var cells = [];

  for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
      if (values[x][y] === 0) {
        cells.push({ x: x, y: y });
      }
    }
  }

  return cells;
};

AIPlayer.prototype.getSearchDepth = function (values, size) {
  var empty = this.getEmptyCells(values, size).length;
  var depth = this.expectimaxMaxDepth;

  if (size >= 6) {
    depth = 2;
  } else if (size >= 5) {
    depth = 3;
  }

  if (empty <= Math.max(2, Math.floor(size / 2))) {
    depth += 1;
  }

  if (empty >= size * 2) {
    depth -= 1;
  }

  return Math.max(2, Math.min(5, depth));
};

AIPlayer.prototype.serializeValues = function (values, size) {
  var flat = [];

  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      flat.push(values[x][y]);
    }
  }

  return flat.join(",");
};

AIPlayer.prototype.sampleChanceCells = function (emptyCells) {
  if (emptyCells.length <= this.chanceNodeSampleCap) {
    return emptyCells;
  }

  var sampled = [];
  var stride = emptyCells.length / this.chanceNodeSampleCap;

  for (var i = 0; i < this.chanceNodeSampleCap; i++) {
    sampled.push(emptyCells[Math.floor(i * stride)]);
  }

  return sampled;
};

AIPlayer.prototype.staticEvaluate = function (values, size) {
  var moveCount = this.countAvailableMoves(values, size);
  var heuristic = this.evaluateBoardHeuristic(values, size, 0);

  // Heavy terminal penalty to avoid dead-end branches in expectimax search.
  if (moveCount === 0) {
    return heuristic - 3200;
  }

  if (moveCount === 1) {
    return heuristic - 900;
  }

  return heuristic;
};

AIPlayer.prototype.expectimaxValue = function (values, size, depth, isChanceNode, cache) {
  var key = this.serializeValues(values, size) + "|" + depth + "|" + (isChanceNode ? "C" : "P");

  if (cache[key] !== undefined) {
    return cache[key];
  }

  if (depth <= 0) {
    cache[key] = this.staticEvaluate(values, size);
    return cache[key];
  }

  if (!isChanceNode) {
    var best = -Infinity;

    for (var action = 0; action < 4; action++) {
      var sim = this.simulateAction(values, size, action);
      if (!sim.moved) {
        continue;
      }

      var score = sim.scoreGain * 1.35 +
                  this.expectimaxValue(sim.values, size, depth - 1, true, cache);

      if (score > best) {
        best = score;
      }
    }

    if (best === -Infinity) {
      best = this.staticEvaluate(values, size) - 2500;
    }

    cache[key] = best;
    return best;
  }

  var emptyCells = this.getEmptyCells(values, size);
  if (!emptyCells.length) {
    cache[key] = this.expectimaxValue(values, size, depth - 1, false, cache);
    return cache[key];
  }

  var sampledCells = this.sampleChanceCells(emptyCells);
  var cellProbability = 1 / sampledCells.length;
  var expected = 0;

  for (var i = 0; i < sampledCells.length; i++) {
    var cell = sampledCells[i];

    var addTwo = this.cloneValues(values, size);
    addTwo[cell.x][cell.y] = 2;

    var addFour = this.cloneValues(values, size);
    addFour[cell.x][cell.y] = 4;

    expected += cellProbability * (
      0.9 * this.expectimaxValue(addTwo, size, depth - 1, false, cache) +
      0.1 * this.expectimaxValue(addFour, size, depth - 1, false, cache)
    );
  }

  cache[key] = expected;
  return expected;
};

AIPlayer.prototype.evaluateActionExpectimax = function (values, size, action, depth, cache) {
  var sim = this.simulateAction(values, size, action);

  if (!sim.moved) {
    return -Infinity;
  }

  var immediate = this.evaluateBoardHeuristic(sim.values, size, sim.scoreGain) + sim.scoreGain * 1.25;
  var future = this.expectimaxValue(sim.values, size, depth - 1, true, cache);

  return immediate + future;
};

AIPlayer.prototype.chooseBlendedAction = function (stateKey) {
  var baseValues = this.cloneGridValues();
  var size = this.gameManager.size;
  var bestAction = 0;
  var bestScore = -Infinity;
  var depth = this.getSearchDepth(baseValues, size);
  var cache = {};

  for (var action = 0; action < 4; action++) {
    var q = this.getQ(stateKey, action);
    var expectimaxScore = this.evaluateActionExpectimax(baseValues, size, action, depth, cache);
    var blended = expectimaxScore * this.orderHeuristicWeight + q * this.qWeight;

    if (blended > bestScore) {
      bestScore = blended;
      bestAction = action;
    }
  }

  return bestAction;
};

AIPlayer.prototype.trainOneEpisode = function (maxSteps) {
  var stepLimit = maxSteps || 1800;
  this.gameManager.startNewGame(true);

  for (var step = 0; step < stepLimit; step++) {
    var state = this.getStateKey();
    var action = this.chooseAction(state, true);
    var result = this.gameManager.move(action, { suppressActuate: true });
    var reward = this.rewardFromResult(result);
    var nextState = this.getStateKey();

    var oldQ = this.getQ(state, action);
    var target = reward + this.gamma * this.maxNextQ(nextState);
    var updatedQ = oldQ + this.alpha * (target - oldQ);
    this.setQ(state, action, updatedQ);

    if (result.terminated) {
      break;
    }
  }

  this.episodes += 1;
  if (this.gameManager.won) {
    this.wins += 1;
  }
  if (this.gameManager.score > this.bestScore) {
    this.bestScore = this.gameManager.score;
  }

  this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);

  return {
    episode: this.episodes,
    score: this.gameManager.score,
    won: this.gameManager.won,
    epsilon: this.epsilon,
    wins: this.wins,
    bestScore: this.bestScore
  };
};

AIPlayer.prototype.train = function (episodes, onProgress, onComplete) {
  var self = this;
  var total = episodes || 200;
  var done = 0;
  var batchSize = 10;

  if (this.training) {
    return;
  }

  this.stopWatching();
  this.training = true;

  function runBatch() {
    if (!self.training) {
      return;
    }

    var count = Math.min(batchSize, total - done);
    var latest;

    for (var i = 0; i < count; i++) {
      latest = self.trainOneEpisode(1800);
      done += 1;
    }

    if (onProgress && latest) {
      onProgress({
        done: done,
        total: total,
        latest: latest
      });
    }

    if (done >= total) {
      self.training = false;
      self.savePersistentModel();
      self.gameManager.startNewGame(false);

      if (onComplete) {
        onComplete({
          done: done,
          total: total,
          latest: latest
        });
      }
      return;
    }

    if (done % 20 === 0) {
      self.savePersistentModel();
    }

    window.setTimeout(runBatch, 0);
  }

  runBatch();
};

AIPlayer.prototype.startContinuousTraining = function (onProgress) {
  var self = this;
  var batchSize = 20;

  if (this.training) {
    return;
  }

  this.stopWatching();
  this.training = true;

  function runBatch() {
    var latest;

    if (!self.training) {
      return;
    }

    for (var i = 0; i < batchSize; i++) {
      latest = self.trainOneEpisode(1800);
    }

    self.savePersistentModel();

    if (onProgress && latest) {
      onProgress({
        latest: latest,
        episodes: self.episodes,
        wins: self.wins,
        bestScore: self.bestScore,
        size: self.gameManager.size
      });
    }

    window.setTimeout(runBatch, 0);
  }

  runBatch();
};

AIPlayer.prototype.stopTraining = function () {
  this.training = false;
  this.savePersistentModel();
};

AIPlayer.prototype.playBestAction = function (options) {
  options = options || {};
  var suppressActuate = !!options.suppressActuate;
  var size = this.gameManager.size;
  var liveValues;
  var hasMoves;

  // Continue after reaching the win tile; only stop when truly out of moves.
  if (this.gameManager.won && !this.gameManager.keepPlaying) {
    this.gameManager.keepPlaying = true;
    if (this.gameManager.actuator && this.gameManager.actuator.continueGame) {
      this.gameManager.actuator.continueGame();
    }
  }

  if (this.gameManager.over) {
    liveValues = this.cloneGridValues();
    hasMoves = this.countAvailableMoves(liveValues, size) > 0;

    // Guard against stale over flags: recover and keep searching moves.
    if (hasMoves) {
      this.gameManager.over = false;
    } else {
      this.stopWatching();
      if (this.onWatchEnded) {
        this.onWatchEnded({ reason: "terminated" });
      }
      return { moved: false, terminated: true };
    }
  }

  var state = this.getStateKey();
  var action = this.chooseBlendedAction(state);
  var result = this.gameManager.move(action, { suppressActuate: suppressActuate });

  if (result && result.moved) {
    return { moved: true, terminated: !!this.gameManager.over };
  }

  // Fallback to avoid stalling on untrained states.
  var directions = [0, 1, 2, 3];
  for (var i = directions.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = directions[i];
    directions[i] = directions[j];
    directions[j] = tmp;
  }

  for (var k = 0; k < directions.length; k++) {
    var fallback = this.gameManager.move(directions[k], { suppressActuate: suppressActuate });
    if (fallback && fallback.moved) {
      return { moved: true, terminated: !!this.gameManager.over };
    }
  }

  liveValues = this.cloneGridValues();
  hasMoves = this.countAvailableMoves(liveValues, size) > 0;

  if (!hasMoves) {
    this.gameManager.over = true;
    this.stopWatching();
    if (this.onWatchEnded) {
      this.onWatchEnded({ reason: "terminated" });
    }
    return { moved: false, terminated: true };
  }

  return { moved: false, terminated: false };
};

AIPlayer.prototype.runWatchBatch = function (steps) {
  var movedInBatch = false;

  for (var i = 0; i < steps; i++) {
    var step = this.playBestAction({ suppressActuate: true });

    if (step.terminated) {
      // Force one final render so the user can see the last board and retry overlay.
      this.gameManager.actuate();
      return { moved: movedInBatch, terminated: true };
    }

    if (step.moved) {
      movedInBatch = true;
      this.watchMoveCounter += 1;
    }
  }

  if (movedInBatch) {
    this.gameManager.actuate();
  }

  return { moved: movedInBatch, terminated: false };
};

AIPlayer.prototype.emitWatchStats = function () {
  var now = Date.now();

  if (!this.watchLastStatsTime) {
    this.watchLastStatsTime = now;
    return;
  }

  var elapsed = now - this.watchLastStatsTime;
  if (elapsed < 500) {
    return;
  }

  if (this.onWatchStats) {
    this.onWatchStats({
      targetSpeed: this.watchSpeed,
      actualSpeed: Math.round(this.watchMoveCounter * 1000 / elapsed)
    });
  }

  this.watchMoveCounter = 0;
  this.watchLastStatsTime = now;
};

AIPlayer.prototype.startWatching = function (movesPerSecond) {
  var self = this;
  var speed = Math.max(1, movesPerSecond || 5);
  var tickHz = this.watchTickHz;
  var interval = Math.max(1, Math.floor(1000 / tickHz));
  var initialValues;

  this.stopWatching();
  this.stopTraining();
  this.watching = true;
  this.watchSpeed = speed;
  this.watchAccumulator = 0;
  this.watchMoveCounter = 0;
  this.watchLastStatsTime = Date.now();

  if (this.gameManager.won && !this.gameManager.keepPlaying) {
    this.gameManager.keepPlaying = true;
    if (this.gameManager.actuator && this.gameManager.actuator.continueGame) {
      this.gameManager.actuator.continueGame();
    }
  }

  initialValues = this.cloneGridValues();
  if (this.countAvailableMoves(initialValues, this.gameManager.size) === 0) {
    this.gameManager.over = true;
    this.gameManager.actuate();
    this.stopWatching();
    if (this.onWatchEnded) {
      this.onWatchEnded({ reason: "terminated" });
    }
    return;
  }

  this.watchTimer = window.setInterval(function () {
    self.watchAccumulator += self.watchSpeed / tickHz;

    var steps = Math.floor(self.watchAccumulator);
    if (steps <= 0) {
      self.emitWatchStats();
      return;
    }

    self.watchAccumulator -= steps;
    self.runWatchBatch(steps);
    self.emitWatchStats();
  }, interval);
};

AIPlayer.prototype.stopWatching = function () {
  this.watching = false;

  if (this.watchTimer) {
    window.clearInterval(this.watchTimer);
    this.watchTimer = null;
  }
};
