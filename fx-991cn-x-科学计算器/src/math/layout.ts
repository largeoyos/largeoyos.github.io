import type {
  FormulaCursor,
  MathNode,
  SequenceNode,
} from './ast';
import {
  bitmapTextWidth,
  drawBitmapText,
  glyphWidth,
} from './bitmapFont';

export type CursorPoint = {
  x: number;
  top: number;
  bottom: number;
};

export function findNearestCursor(
  cursorPoints: ReadonlyMap<string, CursorPoint>,
  x: number,
  y: number,
): FormulaCursor | undefined {
  let nearestKey: string | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestHeight = Number.POSITIVE_INFINITY;

  cursorPoints.forEach((point, key) => {
    const horizontalDistance = point.x - x;
    const verticalDistance = y < point.top
      ? point.top - y
      : y > point.bottom
        ? y - point.bottom
        : 0;
    const distance = horizontalDistance ** 2 + (verticalDistance * 2) ** 2;
    const height = point.bottom - point.top;

    if (distance < nearestDistance || (distance === nearestDistance && height < nearestHeight)) {
      nearestKey = key;
      nearestDistance = distance;
      nearestHeight = height;
    }
  });

  if (!nearestKey) return undefined;
  const separator = nearestKey.lastIndexOf(':');
  const offset = Number(nearestKey.slice(separator + 1));
  if (separator < 1 || !Number.isInteger(offset)) return undefined;
  return {
    sequenceId: nearestKey.slice(0, separator),
    offset,
  };
}

export type DrawOptions = {
  color: string;
  placeholderColor: string;
  cursor: FormulaCursor;
  cursorPoints: Map<string, CursorPoint>;
};

export type LayoutBox = {
  width: number;
  height: number;
  baseline: number;
  draw: (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: DrawOptions,
  ) => void;
};

const GLYPH_HEIGHT = 7;
const GAP = 1;

function cursorKey(sequenceId: string, offset: number) {
  return `${sequenceId}:${offset}`;
}

function glyphBox(value: string): LayoutBox {
  const width = Math.max(1, bitmapTextWidth(value, 1, 1));
  return {
    width,
    height: GLYPH_HEIGHT,
    baseline: 6,
    draw(context, x, y, options) {
      drawBitmapText(context, value, x, y, options.color, 1, 1);
    },
  };
}

function placeholderBox(): LayoutBox {
  return {
    width: 6,
    height: 7,
    baseline: 6,
    draw(context, x, y, options) {
      context.strokeStyle = options.placeholderColor;
      context.lineWidth = 1;
      context.strokeRect(Math.round(x + 1) + 0.5, Math.round(y + 1) + 0.5, 4, 5);
    },
  };
}

function sequenceBox(sequence: SequenceNode): LayoutBox {
  const children = sequence.children.length
    ? sequence.children.map(layoutNode)
    : [placeholderBox()];
  const baseline = Math.max(...children.map(child => child.baseline));
  const descent = Math.max(...children.map(child => child.height - child.baseline));
  const height = baseline + descent;
  const width = Math.max(
    1,
    children.reduce((total, child) => total + child.width + GAP, -GAP),
  );

  return {
    width,
    height,
    baseline,
    draw(context, x, y, options) {
      let childX = x;
      const top = y;
      const bottom = y + height;
      if (sequence.editable !== false) {
        options.cursorPoints.set(cursorKey(sequence.id, 0), { x: childX, top, bottom });
      }
      children.forEach((child, index) => {
        const childY = y + baseline - child.baseline;
        child.draw(context, childX, childY, options);
        childX += child.width + GAP;
        if (sequence.editable !== false) {
          options.cursorPoints.set(
            cursorKey(sequence.id, index + 1),
            { x: Math.min(x + width, childX - GAP), top, bottom },
          );
        }
      });
    },
  };
}

function fractionBox(node: Extract<MathNode, { type: 'fraction' }>): LayoutBox {
  const numerator = sequenceBox(node.numerator);
  const denominator = sequenceBox(node.denominator);
  const width = Math.max(numerator.width, denominator.width) + 4;
  const baseline = numerator.height + 2;
  const height = numerator.height + denominator.height + 4;
  return {
    width,
    height,
    baseline,
    draw(context, x, y, options) {
      numerator.draw(context, x + Math.floor((width - numerator.width) / 2), y, options);
      const lineY = y + numerator.height + 1;
      context.fillStyle = options.color;
      context.fillRect(Math.round(x), Math.round(lineY), width, 1);
      denominator.draw(
        context,
        x + Math.floor((width - denominator.width) / 2),
        lineY + 2,
        options,
      );
    },
  };
}

function mixedFractionBox(node: Extract<MathNode, { type: 'mixed-fraction' }>): LayoutBox {
  const whole = sequenceBox(node.whole);
  const fraction = fractionBox({
    type: 'fraction',
    numerator: node.numerator,
    denominator: node.denominator,
  });
  const baseline = Math.max(whole.baseline, fraction.baseline);
  const height = baseline + Math.max(
    whole.height - whole.baseline,
    fraction.height - fraction.baseline,
  );
  return {
    width: whole.width + fraction.width + 1,
    height,
    baseline,
    draw(context, x, y, options) {
      whole.draw(context, x, y + baseline - whole.baseline, options);
      fraction.draw(
        context,
        x + whole.width + 1,
        y + baseline - fraction.baseline,
        options,
      );
    },
  };
}

function rootBox(node: Extract<MathNode, { type: 'root' }>): LayoutBox {
  const radicand = sequenceBox(node.radicand);
  const index = node.index ? sequenceBox(node.index) : undefined;
  const rootWidth = 5;
  const indexWidth = index ? Math.max(3, index.width) : 0;
  const width = indexWidth + rootWidth + radicand.width + 2;
  const topPad = 2;
  const height = Math.max(radicand.height + topPad, (index?.height ?? 0) + 3);
  const baseline = topPad + radicand.baseline;
  return {
    width,
    height,
    baseline,
    draw(context, x, y, options) {
      const rootX = x + indexWidth;
      const top = y + topPad - 1;
      context.fillStyle = options.color;
      context.fillRect(rootX + 1, top + 4, 1, 2);
      context.fillRect(rootX + 2, top + 6, 1, 2);
      context.fillRect(rootX + 3, top + 3, 1, 4);
      context.fillRect(rootX + 4, top + 1, 1, 3);
      context.fillRect(rootX + 4, top, radicand.width + 3, 1);
      if (index) index.draw(context, x, y, options);
      radicand.draw(context, rootX + rootWidth + 1, y + topPad, options);
    },
  };
}

function powerBox(node: Extract<MathNode, { type: 'power' }>): LayoutBox {
  const base = sequenceBox(node.base);
  const exponent = sequenceBox(node.exponent);
  const exponentScaleHeight = Math.max(4, exponent.height);
  const width = base.width + exponent.width + 1;
  const baseline = Math.max(base.baseline, exponentScaleHeight + 2);
  const height = Math.max(base.height + (baseline - base.baseline), exponent.height + 1);
  return {
    width,
    height,
    baseline,
    draw(context, x, y, options) {
      base.draw(context, x, y + baseline - base.baseline, options);
      exponent.draw(context, x + base.width + 1, y, options);
    },
  };
}

function functionBox(node: Extract<MathNode, { type: 'function' }>): LayoutBox {
  const name = glyphBox(node.name.toUpperCase());
  const args = node.args.map(sequenceBox);
  const argBaseline = Math.max(...args.map(arg => arg.baseline));
  const argDescent = Math.max(...args.map(arg => arg.height - arg.baseline));
  const baseline = Math.max(name.baseline, argBaseline);
  const height = baseline + Math.max(name.height - name.baseline, argDescent);
  const argsWidth = args.reduce((sum, arg) => sum + arg.width, 0)
    + Math.max(0, args.length - 1) * 3;
  const width = name.width + argsWidth + 5;
  return {
    width,
    height,
    baseline,
    draw(context, x, y, options) {
      name.draw(context, x, y + baseline - name.baseline, options);
      let cursor = x + name.width + 1;
      drawBitmapText(context, '(', cursor, y + baseline - 6, options.color);
      cursor += glyphWidth('(') + 1;
      args.forEach((arg, index) => {
        arg.draw(context, cursor, y + baseline - arg.baseline, options);
        cursor += arg.width;
        if (index < args.length - 1) {
          drawBitmapText(context, ',', cursor + 1, y + baseline - 6, options.color);
          cursor += 3;
        }
      });
      drawBitmapText(context, ')', cursor + 1, y + baseline - 6, options.color);
    },
  };
}

function largeOperatorBox(
  symbol: 'I' | 'D' | 'S',
  expression: SequenceNode,
  lower: SequenceNode,
  upper: SequenceNode,
): LayoutBox {
  const body = sequenceBox(expression);
  const low = sequenceBox(lower);
  const high = sequenceBox(upper);
  const opWidth = Math.max(7, low.width, high.width);
  const width = opWidth + body.width + 3;
  const baseline = Math.max(11, body.baseline + 4);
  const height = Math.max(20, baseline + (body.height - body.baseline));
  return {
    width,
    height,
    baseline,
    draw(context, x, y, options) {
      high.draw(context, x + Math.floor((opWidth - high.width) / 2), y, options);
      drawBitmapText(context, symbol, x + 1, y + 7, options.color);
      low.draw(context, x + Math.floor((opWidth - low.width) / 2), y + 14, options);
      body.draw(context, x + opWidth + 3, y + baseline - body.baseline, options);
    },
  };
}

function recurringDecimalBox(node: Extract<MathNode, { type: 'recurring-decimal' }>): LayoutBox {
  const whole = sequenceBox(node.whole);
  const nonRepeating = sequenceBox(node.nonRepeating);
  const repeating = sequenceBox(node.repeating);
  const dot = glyphBox('.');
  const baseline = 2 + Math.max(whole.baseline, nonRepeating.baseline, repeating.baseline);
  const height = baseline + Math.max(
    whole.height - whole.baseline,
    nonRepeating.height - nonRepeating.baseline,
    repeating.height - repeating.baseline,
  );
  return {
    width: whole.width + dot.width + nonRepeating.width + repeating.width + 3,
    height,
    baseline,
    draw(context, x, y, options) {
      let cursor = x;
      whole.draw(context, cursor, y + baseline - whole.baseline, options);
      cursor += whole.width + 1;
      dot.draw(context, cursor, y + baseline - dot.baseline, options);
      cursor += dot.width + 1;
      nonRepeating.draw(context, cursor, y + baseline - nonRepeating.baseline, options);
      cursor += nonRepeating.width + 1;
      context.fillStyle = options.color;
      context.fillRect(Math.round(cursor), Math.round(y), repeating.width, 1);
      repeating.draw(context, cursor, y + baseline - repeating.baseline, options);
    },
  };
}

function unitConversionBox(node: Extract<MathNode, { type: 'unit-conversion' }>): LayoutBox {
  const operand = sequenceBox(node.operand);
  const label = glyphBox(`>${node.label.split('→')[1] ?? node.label}`);
  const baseline = Math.max(operand.baseline, label.baseline);
  const height = baseline + Math.max(operand.height - operand.baseline, label.height - label.baseline);
  return {
    width: operand.width + label.width + 2,
    height,
    baseline,
    draw(context, x, y, options) {
      operand.draw(context, x, y + baseline - operand.baseline, options);
      label.draw(context, x + operand.width + 2, y + baseline - label.baseline, options);
    },
  };
}

export function layoutNode(node: MathNode): LayoutBox {
  switch (node.type) {
    case 'sequence':
      return sequenceBox(node);
    case 'glyph':
      return glyphBox(node.value === 'π' ? 'P' : node.value);
    case 'placeholder':
      return placeholderBox();
    case 'fraction':
      return fractionBox(node);
    case 'root':
      return rootBox(node);
    case 'power':
      return powerBox(node);
    case 'function':
      return functionBox(node);
    case 'group': {
      const body = sequenceBox(node.body);
      return functionBox({ type: 'function', name: '', args: [node.body] });
    }
    case 'integral':
      return largeOperatorBox('I', node.integrand, node.lower, node.upper);
    case 'derivative':
      return functionBox({ type: 'function', name: 'D', args: [node.expression, node.at] });
    case 'summation':
      return largeOperatorBox('S', node.expression, node.lower, node.upper);
    case 'mixed-fraction':
      return mixedFractionBox(node);
    case 'scientific-constant':
      return glyphBox(node.symbol);
    case 'recurring-decimal':
      return recurringDecimalBox(node);
    case 'unit-conversion':
      return unitConversionBox(node);
  }
}

export function drawFormula(
  context: CanvasRenderingContext2D,
  root: SequenceNode,
  cursor: FormulaCursor,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  color: string,
  showCursor = true,
  backgroundColor = '#dfe6d4',
  horizontalOffset = 0,
) {
  const box = sequenceBox(root);
  const cursorPoints = new Map<string, CursorPoint>();
  const cursorPointKey = cursorKey(cursor.sequenceId, cursor.offset);
  const drawOptions: DrawOptions = {
    color,
    placeholderColor: color,
    cursor,
    cursorPoints,
  };

  let offsetX = Math.max(0, horizontalOffset);
  context.save();
  context.beginPath();
  context.rect(x, y, maxWidth, maxHeight);
  context.clip();
  box.draw(context, x - offsetX, y + Math.max(0, Math.floor((maxHeight - box.height) / 2)), drawOptions);
  const point = cursorPoints.get(cursorPointKey);
  if (showCursor && point && point.x > x + maxWidth - 2) {
    offsetX += point.x - (x + maxWidth - 2);
  }

  if (offsetX > 0) {
    cursorPoints.clear();
    context.fillStyle = backgroundColor;
    context.fillRect(x, y, maxWidth, maxHeight);
    box.draw(
      context,
      x - offsetX,
      y + Math.max(0, Math.floor((maxHeight - box.height) / 2)),
      drawOptions,
    );
  }

  const finalPoint = cursorPoints.get(cursorPointKey);
  if (showCursor && finalPoint) {
    context.fillStyle = color;
    context.fillRect(
      Math.round(finalPoint.x),
      Math.round(finalPoint.top),
      1,
      Math.max(4, Math.round(finalPoint.bottom - finalPoint.top)),
    );
  }
  context.restore();

  return {
    box,
    cursorPoints,
    overflow: box.height > maxHeight,
    horizontalOverflow: Math.max(0, box.width - maxWidth),
    horizontalOffset: Math.min(offsetX, Math.max(0, box.width - maxWidth)),
  };
}
