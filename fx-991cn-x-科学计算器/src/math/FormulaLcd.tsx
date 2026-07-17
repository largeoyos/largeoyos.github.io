import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  collectVariables,
  createEmptyDocument,
  deleteBackward,
  insertFormulaInput,
  moveCursor,
  normalizePlaceholders,
  parseLegacyExpression,
  repairDocumentCursor,
  serializeExpression,
  type CursorDirection,
  type FormulaDocument,
} from './ast';
import {
  bitmapTextWidth,
  drawBitmapText,
} from './bitmapFont';
import {
  drawFormula,
  findNearestCursor,
  type CursorPoint,
} from './layout';

export type LcdMenuItem = {
  mode: string;
  label: string;
};

export type LcdModeScreen = {
  title: string;
  lines?: string[];
  selectedIndex?: number;
  table?: string[][];
  graph?: Array<{ x: number; f?: number; g?: number }>;
};

export type FormulaLcdHandle = {
  insertInput: (value: string) => void;
  move: (direction: CursorDirection) => boolean;
  moveResult: (direction: 'left' | 'right') => boolean;
  deleteBackward: () => void;
  clear: () => void;
  loadExpression: (expression: string) => void;
  loadDocument: (document: FormulaDocument) => void;
  getExpression: () => string;
  getVariables: () => string[];
  getDocument: () => FormulaDocument;
};

type FormulaLcdProps = {
  expression: string;
  result: string;
  powerActive: boolean;
  shiftActive: boolean;
  alphaActive: boolean;
  angleMode: 'DEG' | 'RAD' | 'GRAD';
  calcMode: string;
  activeMenu: string;
  menuIndex: number;
  menuItems: LcdMenuItem[];
  optionItems?: string[];
  modeScreen?: LcdModeScreen;
  variables: Record<string, number>;
  onExpressionChange: (expression: string) => void;
};

const AST_STORAGE_KEY = 'fx991cnx-formula-ast-v2';
const LCD_LOGICAL_WIDTH = 192;
const LCD_LOGICAL_HEIGHT = 63;
const LCD_SCALE = 8;
export const LCD_WIDTH = LCD_LOGICAL_WIDTH * LCD_SCALE;
export const LCD_HEIGHT = LCD_LOGICAL_HEIGHT * LCD_SCALE;
const BACKGROUND = '#dfe6d4';
const INK = '#18291d';
const BLUE = '#284d9d';
const GREEN = '#0a7955';

function safeLoadDocument(expression: string): FormulaDocument {
  try {
    const raw = window.localStorage.getItem(AST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FormulaDocument;
      if (parsed?.root?.type === 'sequence' && parsed.cursor?.sequenceId) {
        return repairDocumentCursor(parsed);
      }
    }
  } catch {
    // Ignore malformed or unavailable local storage.
  }
  return expression ? parseLegacyExpression(expression) : createEmptyDocument();
}

function drawStatus(
  context: CanvasRenderingContext2D,
  props: Pick<
    FormulaLcdProps,
    'shiftActive' | 'alphaActive' | 'angleMode' | 'calcMode'
  >,
) {
  if (props.shiftActive) drawBitmapText(context, 'S', 2, 1, INK);
  if (props.alphaActive) drawBitmapText(context, 'A', 9, 1, INK);
  drawBitmapText(context, props.angleMode, 128, 1, INK);
  const shortMode = props.calcMode.slice(0, 4).toUpperCase();
  drawBitmapText(context, shortMode, 153, 1, INK);
  context.fillStyle = INK;
  context.fillRect(0, 9, LCD_LOGICAL_WIDTH, 1);
}

function drawMenuIcon(
  context: CanvasRenderingContext2D,
  mode: string,
  x: number,
  y: number,
  selected: boolean,
) {
  const color = selected ? BACKGROUND : BLUE;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1;

  if (mode === 'Calculate') {
    drawBitmapText(context, '*/', x + 13, y + 1, color);
    drawBitmapText(context, '+-', x + 13, y + 9, color);
  } else if (mode === 'Complex') {
    drawBitmapText(context, 'I', x + 20, y + 5, color, 1);
  } else if (mode === 'Base-N') {
    drawBitmapText(context, '2 8', x + 9, y + 1, color);
    drawBitmapText(context, '1016', x + 7, y + 9, color);
  } else if (mode === 'Matrix') {
    context.strokeRect(x + 12.5, y + 2.5, 23, 13);
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        context.strokeRect(x + 17.5 + column * 8, y + 5.5 + row * 6, 3, 3);
      }
    }
  } else if (mode === 'Vector') {
    context.fillRect(x + 13, y + 2, 1, 14);
    context.fillRect(x + 13, y + 2, 4, 1);
    context.fillRect(x + 13, y + 15, 17, 1);
    context.fillRect(x + 29, y + 12, 1, 4);
    for (let point = 0; point < 10; point++) {
      context.fillRect(x + 16 + point, y + 12 - Math.floor(point / 2), 1, 1);
    }
  } else if (mode === 'Statistics') {
    context.fillRect(x + 10, y + 15, 27, 1);
    context.fillRect(x + 10, y + 1, 1, 15);
    [5, 10, 14, 8].forEach((height, index) => {
      context.strokeRect(x + 14 + index * 6 + 0.5, y + 15 - height + 0.5, 3, height);
    });
  } else if (mode === 'Spreadsheet') {
    context.strokeRect(x + 11.5, y + 2.5, 25, 13);
    context.fillRect(x + 24, y + 3, 1, 12);
    context.fillRect(x + 12, y + 9, 24, 1);
  } else if (mode === 'Equation') {
    drawBitmapText(context, 'Y=', x + 5, y + 1, color);
    context.fillRect(x + 19, y + 2, 18, 1);
    drawBitmapText(context, 'X=0', x + 12, y + 9, color);
  } else if (mode === 'Inequality') {
    drawBitmapText(context, 'X>0', x + 9, y + 1, color);
    drawBitmapText(context, 'X<0', x + 9, y + 9, color);
  } else {
    context.strokeRect(x + 10.5, y + 4.5, 7, 7);
    drawBitmapText(context, ':', x + 22, y + 4, color);
    context.strokeRect(x + 30.5, y + 4.5, 7, 7);
  }
}

function drawMainMenu(
  context: CanvasRenderingContext2D,
  items: LcdMenuItem[],
  selectedIndex: number,
) {
  const cellWidth = 48;
  const cellHeight = 17;
  items.forEach((item, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = column * cellWidth;
    const y = row * cellHeight;
    const selected = index === selectedIndex;
    if (selected) {
      context.fillStyle = GREEN;
      context.fillRect(x, y, cellWidth, cellHeight);
    }
    context.strokeStyle = BLUE;
    context.strokeRect(x + 0.5, y + 0.5, cellWidth, cellHeight);
    drawMenuIcon(context, item.mode, x, y, selected);
    context.fillStyle = selected ? BACKGROUND : BLUE;
    context.fillRect(x + cellWidth - 9, y + cellHeight - 7, 9, 7);
    drawBitmapText(
      context,
      String(index + 1),
      x + cellWidth - 7,
      y + cellHeight - 6,
      selected ? BLUE : BACKGROUND,
    );
  });
  for (let index = items.length; index < 12; index++) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    context.strokeStyle = BLUE;
    context.strokeRect(
      column * cellWidth + 0.5,
      row * cellHeight + 0.5,
      cellWidth,
      cellHeight,
    );
  }

  const selected = items[selectedIndex] ?? items[0];
  context.fillStyle = BACKGROUND;
  context.fillRect(0, 51, LCD_LOGICAL_WIDTH, 12);
  context.strokeStyle = BLUE;
  context.fillStyle = BLUE;
  context.fillRect(0, 51, LCD_LOGICAL_WIDTH, 1);
  drawBitmapText(context, `${selectedIndex + 1}:`, 3, 54, BLUE);
  drawBitmapText(context, selected?.label ?? '', 18, 53, BLUE);
}

function drawListMenu(
  context: CanvasRenderingContext2D,
  activeMenu: string,
  variables: Record<string, number>,
  optionItems: string[] = [],
) {
  const titles: Record<string, string> = {
    SETUP: 'SETUP',
    OPTN: 'OPTION',
    SOLVE: 'SOLVE',
    CONST: 'CONST',
    CONV: 'CONVERT',
    RECALL: 'RECALL',
    STORE: 'STORE',
  };
  drawBitmapText(context, titles[activeMenu] ?? activeMenu, 3, 2, INK);
  context.fillStyle = INK;
  context.fillRect(0, 10, LCD_LOGICAL_WIDTH, 1);

  let lines: string[] = [];
  if (activeMenu === 'SETUP') lines = ['1 DEG', '2 RAD', '3 GRAD', '4 DISPLAY'];
  if (activeMenu === 'OPTN') lines = optionItems.length ? optionItems : ['1 HYPER', '2 ANGLE', '3 ENG'];
  if (activeMenu === 'SOLVE') {
    lines = Object.entries(variables).slice(0, 6).map(([key, value], index) => `${index + 1} ${key}=${value}`);
  }
  if (activeMenu === 'CONST') lines = ['1 C', '2 H', '3 G', '4 g', '5 NA', '6 R'];
  if (activeMenu === 'CONV') lines = ['1 IN>CM', '2 CM>IN', '3 KG>LB', '4 LB>KG'];
  if (activeMenu === 'RECALL' || activeMenu === 'STORE') {
    lines = Object.entries(variables).slice(0, 9).map(([key, value]) => `${key}:${value}`);
  }

  lines.slice(0, 9).forEach((line, index) => {
    const singleColumn = activeMenu === 'OPTN';
    const column = singleColumn ? 0 : index % 2;
    const row = singleColumn ? index : Math.floor(index / 2);
    drawBitmapText(context, line, 4 + column * 95, 14 + row * (singleColumn ? 10 : 12), INK);
  });
}

function drawModeScreen(context: CanvasRenderingContext2D, screen: LcdModeScreen) {
  drawBitmapText(context, screen.title, 3, 2, INK);
  context.fillStyle = INK;
  context.fillRect(0, 10, LCD_LOGICAL_WIDTH, 1);
  if (screen.graph?.length) {
    const plot = screen.graph.filter(point => Number.isFinite(point.x) && (Number.isFinite(point.f) || Number.isFinite(point.g)));
    if (!plot.length) return;
    const xs = plot.map(point => point.x);
    const ys = plot.flatMap(point => [point.f, point.g]).filter(Number.isFinite) as number[];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const mapX = (value: number) => 4 + Math.round((value - minX) / Math.max(1e-12, maxX - minX) * 183);
    const mapY = (value: number) => 60 - Math.round((value - minY) / Math.max(1e-12, maxY - minY) * 46);
    context.strokeStyle = INK;
    context.fillStyle = INK;
    if (minY <= 0 && maxY >= 0) context.fillRect(3, mapY(0), 185, 1);
    if (minX <= 0 && maxX >= 0) context.fillRect(mapX(0), 12, 1, 48);
    const drawSeries = (key: 'f' | 'g', dashed: boolean) => {
      context.setLineDash(dashed ? [2, 2] : []);
      context.beginPath();
      let started = false;
      plot.forEach(point => {
        const value = point[key];
        if (!Number.isFinite(value)) { started = false; return; }
        const x = mapX(point.x);
        const y = mapY(value as number);
        if (!started) context.moveTo(x, y); else context.lineTo(x, y);
        started = true;
      });
      context.stroke();
    };
    drawSeries('f', false);
    drawSeries('g', true);
    context.setLineDash([]);
    return;
  }
  if (screen.table?.length) {
    screen.table.slice(0, 5).forEach((row, rowIndex) => {
      row.slice(0, 4).forEach((cell, columnIndex) => drawBitmapText(context, cell, 3 + columnIndex * 47, 14 + rowIndex * 10, INK));
    });
    return;
  }
  (screen.lines ?? []).slice(0, 5).forEach((line, index) => {
    if (screen.selectedIndex === index) {
      context.fillStyle = INK;
      context.fillRect(1, 12 + index * 10, 190, 9);
      drawBitmapText(context, line, 4, 13 + index * 10, BACKGROUND);
    } else {
      drawBitmapText(context, line, 4, 13 + index * 10, INK);
    }
  });
}

export const FormulaLcd = forwardRef<FormulaLcdHandle, FormulaLcdProps>(
  function FormulaLcd(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [document, setDocument] = useState<FormulaDocument>(() => safeLoadDocument(props.expression));
    const [resultOffset, setResultOffset] = useState(0);
    const resultMaxOffset = useRef(0);
    const formulaCursorPoints = useRef<ReadonlyMap<string, CursorPoint>>(new Map());
    const pointerStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);
    const lastSerialized = useRef(serializeExpression(document));
    const externalInitialized = useRef(false);

    const commit = (next: FormulaDocument) => {
      const normalized = repairDocumentCursor(normalizePlaceholders(next));
      setDocument(normalized);
      const expression = serializeExpression(normalized);
      lastSerialized.current = expression;
      props.onExpressionChange(expression);
      try {
        window.localStorage.setItem(AST_STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // Ignore storage failures.
      }
    };

    useImperativeHandle(ref, () => ({
      insertInput(value) {
        commit(insertFormulaInput(document, value));
      },
      move(direction) {
        const next = moveCursor(document, direction);
        const changed = next.cursor.sequenceId !== document.cursor.sequenceId
          || next.cursor.offset !== document.cursor.offset;
        if (changed) setDocument(next);
        return changed;
      },
      moveResult(direction) {
        if (resultMaxOffset.current <= 0) return false;
        if (direction === 'left' && resultOffset === 0) return false;
        if (direction === 'right' && resultOffset >= resultMaxOffset.current) return false;
        setResultOffset(current => {
          const delta = direction === 'right' ? 18 : -18;
          return Math.max(0, Math.min(resultMaxOffset.current, current + delta));
        });
        return true;
      },
      deleteBackward() {
        commit(deleteBackward(document));
      },
      clear() {
        const empty = createEmptyDocument();
        commit(empty);
      },
      loadExpression(expression) {
        commit(parseLegacyExpression(expression));
      },
      loadDocument(nextDocument) {
        commit(structuredClone(nextDocument));
      },
      getExpression() {
        return serializeExpression(document);
      },
      getVariables() {
        return collectVariables(document);
      },
      getDocument() {
        return document;
      },
    }), [document, resultOffset]);

    useEffect(() => {
      setResultOffset(0);
    }, [props.result]);

    useEffect(() => {
      if (!externalInitialized.current) {
        externalInitialized.current = true;
        if (!props.expression && lastSerialized.current) {
          props.onExpressionChange(lastSerialized.current);
          return;
        }
      }
      if (props.expression === lastSerialized.current) return;
      const parsed = parseLegacyExpression(props.expression);
      lastSerialized.current = props.expression;
      setDocument(parsed);
    }, [props.expression]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.imageSmoothingEnabled = false;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
      context.fillStyle = BACKGROUND;
      context.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
      context.setTransform(LCD_SCALE, 0, 0, LCD_SCALE, 0, 0);

      if (!props.powerActive) return;

      if (props.activeMenu === 'MAIN') {
        drawMainMenu(context, props.menuItems, props.menuIndex);
        return;
      }

      if (props.activeMenu !== 'NONE') {
        drawListMenu(context, props.activeMenu, props.variables, props.optionItems);
        return;
      }

      if (props.modeScreen) {
        drawModeScreen(context, props.modeScreen);
        return;
      }

      drawStatus(context, props);
      const formulaResult = drawFormula(
        context,
        document.root,
        document.cursor,
        2,
        11,
        188,
        31,
        INK,
        true,
      );
      formulaCursorPoints.current = formulaResult.cursorPoints;
      if (formulaResult.overflow) drawBitmapText(context, 'RANGE', 152, 12, INK);

      const resultDocument = parseLegacyExpression(props.result);
      const resultLayout = drawFormula(
        context,
        resultDocument.root,
        resultDocument.cursor,
        4,
        47,
        184,
        14,
        INK,
        false,
        BACKGROUND,
        resultOffset,
      );
      resultMaxOffset.current = resultLayout.horizontalOverflow;
      if (resultLayout.horizontalOverflow > 0) {
        if (resultOffset > 0) drawBitmapText(context, '<', 0, 52, INK);
        if (resultOffset < resultLayout.horizontalOverflow) drawBitmapText(context, '>', 187, 52, INK);
      }
    }, [document, props, resultOffset]);

    const placeCursorAtPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!props.powerActive || props.activeMenu !== 'NONE' || props.modeScreen) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = (event.clientX - rect.left) / rect.width * LCD_LOGICAL_WIDTH;
      const y = (event.clientY - rect.top) / rect.height * LCD_LOGICAL_HEIGHT;
      if (x < 2 || x > 190 || y < 11 || y > 42) return;

      const cursor = findNearestCursor(formulaCursorPoints.current, x, y);
      if (!cursor) return;
      setDocument(current => ({ ...current, cursor }));
    };

    return (
      <canvas
        ref={canvasRef}
        width={LCD_WIDTH}
        height={LCD_HEIGHT}
        className="casio-lcd-canvas"
        role="textbox"
        aria-label="CASIO calculator formula screen; tap the formula to move the cursor"
        aria-readonly="false"
        onPointerDown={event => {
          pointerStart.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onPointerUp={event => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (!start || start.pointerId !== event.pointerId) return;
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
          placeCursorAtPointer(event);
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      />
    );
  },
);
