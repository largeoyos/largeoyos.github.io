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
  insertDerivative,
  insertFraction,
  insertFunction,
  insertGlyph,
  insertIntegral,
  insertPower,
  insertRoot,
  insertSummation,
  moveCursor,
  normalizePlaceholders,
  parseLegacyExpression,
  serializeExpression,
  type CursorDirection,
  type FormulaDocument,
} from './ast';
import {
  bitmapTextWidth,
  drawBitmapText,
} from './bitmapFont';
import { drawFormula } from './layout';

export type LcdMenuItem = {
  mode: string;
  label: string;
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
  angleMode: 'DEG' | 'RAD';
  calcMode: string;
  activeMenu: string;
  menuIndex: number;
  menuItems: LcdMenuItem[];
  variables: Record<string, number>;
  onExpressionChange: (expression: string) => void;
};

const AST_STORAGE_KEY = 'fx991cnx-formula-ast-v1';
const LCD_LOGICAL_WIDTH = 192;
const LCD_LOGICAL_HEIGHT = 63;
const LCD_SCALE = 2;
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
      if (parsed?.root?.type === 'sequence' && parsed.cursor?.sequenceId) return parsed;
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
  if (activeMenu === 'SETUP') lines = ['1 DEG', '2 RAD', '3 DISPLAY'];
  if (activeMenu === 'OPTN') lines = ['1 D/DX', '2 INTEGRAL', '3 SUM', '4 NORMAL', '5 BINOM', '6 POISSON'];
  if (activeMenu === 'SOLVE') {
    lines = Object.entries(variables).slice(0, 6).map(([key, value], index) => `${index + 1} ${key}=${value}`);
  }
  if (activeMenu === 'CONST') lines = ['1 C', '2 H', '3 G', '4 g', '5 NA', '6 R'];
  if (activeMenu === 'CONV') lines = ['1 IN>CM', '2 CM>IN', '3 KG>LB', '4 LB>KG'];
  if (activeMenu === 'RECALL' || activeMenu === 'STORE') {
    lines = Object.entries(variables).slice(0, 9).map(([key, value]) => `${key}:${value}`);
  }

  lines.slice(0, 6).forEach((line, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawBitmapText(context, line, 4 + column * 95, 14 + row * 12, INK);
  });
}

function insertMapped(document: FormulaDocument, value: string): FormulaDocument {
  if (value === '/') return insertFraction(document);
  if (value === '√(') return insertRoot(document, false);
  if (value === '³√(' || value === '■√■') return insertRoot(document, true);
  if (value === '²') return insertPower(document, '2');
  if (value === '³') return insertPower(document, '3');
  if (value === '^(') return insertPower(document);
  if (value === 'log□(') return insertFunction(document, 'log', 2);
  if (value === 'log(') return insertFunction(document, 'log', 1);
  if (value === 'ln(') return insertFunction(document, 'ln', 1);
  if (value === 'sin(' || value === 'cos(' || value === 'tan(') {
    return insertFunction(document, value.slice(0, -1), 1);
  }
  if (value === 'sin⁻¹(') return insertFunction(document, 'asin', 1);
  if (value === 'cos⁻¹(') return insertFunction(document, 'acos', 1);
  if (value === 'tan⁻¹(') return insertFunction(document, 'atan', 1);
  if (value === 'Abs(') return insertFunction(document, 'abs', 1);
  if (value === 'Pol(' || value === 'Rec(' || value === 'RanInt(') {
    return insertFunction(document, value.slice(0, -1), 2);
  }
  if (value === '∫dx') return insertIntegral(document);
  if (value === 'd/dx') return insertDerivative(document);
  if (value === 'Σ') return insertSummation(document);
  return insertGlyph(document, value);
}

export const FormulaLcd = forwardRef<FormulaLcdHandle, FormulaLcdProps>(
  function FormulaLcd(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [document, setDocument] = useState<FormulaDocument>(() => safeLoadDocument(props.expression));
    const [resultOffset, setResultOffset] = useState(0);
    const resultMaxOffset = useRef(0);
    const lastSerialized = useRef(serializeExpression(document));
    const externalInitialized = useRef(false);

    const commit = (next: FormulaDocument) => {
      const normalized = normalizePlaceholders(next);
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
        commit(insertMapped(document, value));
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
        drawListMenu(context, props.activeMenu, props.variables);
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

    return (
      <canvas
        ref={canvasRef}
        width={LCD_WIDTH}
        height={LCD_HEIGHT}
        className="casio-lcd-canvas"
        aria-label="CASIO calculator LCD"
      />
    );
  },
);
