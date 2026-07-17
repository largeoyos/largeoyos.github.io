export type SequenceNode = {
  type: 'sequence';
  id: string;
  children: MathNode[];
  editable?: boolean;
};

export type GlyphNode = { type: 'glyph'; value: string };
export type PlaceholderNode = { type: 'placeholder' };

export type FractionNode = {
  type: 'fraction';
  numerator: SequenceNode;
  denominator: SequenceNode;
};

export type MixedFractionNode = {
  type: 'mixed-fraction';
  whole: SequenceNode;
  numerator: SequenceNode;
  denominator: SequenceNode;
};

export type RootNode = {
  type: 'root';
  index?: SequenceNode;
  radicand: SequenceNode;
};

export type PowerNode = {
  type: 'power';
  base: SequenceNode;
  exponent: SequenceNode;
};

export type FunctionNode = {
  type: 'function';
  name: string;
  args: SequenceNode[];
};

export type GroupNode = { type: 'group'; body: SequenceNode };

export type IntegralNode = {
  type: 'integral';
  integrand: SequenceNode;
  lower: SequenceNode;
  upper: SequenceNode;
};

export type DerivativeNode = {
  type: 'derivative';
  expression: SequenceNode;
  at: SequenceNode;
};

export type SummationNode = {
  type: 'summation';
  expression: SequenceNode;
  lower: SequenceNode;
  upper: SequenceNode;
};

export type ScientificConstantNode = {
  type: 'scientific-constant';
  id: string;
  symbol: string;
};

export type RecurringDecimalNode = {
  type: 'recurring-decimal';
  whole: SequenceNode;
  nonRepeating: SequenceNode;
  repeating: SequenceNode;
};

export type UnitConversionNode = {
  type: 'unit-conversion';
  id: string;
  label: string;
  operand: SequenceNode;
};

export type MathNode =
  | SequenceNode
  | GlyphNode
  | PlaceholderNode
  | FractionNode
  | MixedFractionNode
  | RootNode
  | PowerNode
  | FunctionNode
  | GroupNode
  | IntegralNode
  | DerivativeNode
  | SummationNode
  | ScientificConstantNode
  | RecurringDecimalNode
  | UnitConversionNode;

export type CursorDirection = 'left' | 'right' | 'up' | 'down';

export type FormulaCursor = {
  sequenceId: string;
  offset: number;
};

export type FormulaDocument = {
  root: SequenceNode;
  cursor: FormulaCursor;
};

type SequenceMeta = {
  sequence: SequenceNode;
  owner?: MathNode;
  slot?: string;
  parentSequence?: SequenceNode;
  ownerIndex?: number;
};

let sequenceCounter = 0;

export function createSequence(children: MathNode[] = [], editable = true): SequenceNode {
  sequenceCounter += 1;
  return { type: 'sequence', id: `seq-${sequenceCounter}`, children, editable };
}

export function placeholderSequence(): SequenceNode {
  return createSequence([{ type: 'placeholder' }]);
}

export function createEmptyDocument(): FormulaDocument {
  const root = createSequence();
  return { root, cursor: { sequenceId: root.id, offset: 0 } };
}

export function cloneDocument(document: FormulaDocument): FormulaDocument {
  return structuredClone(document);
}

function visitChildSequences(
  node: MathNode,
  callback: (sequence: SequenceNode, slot: string) => void,
) {
  switch (node.type) {
    case 'fraction':
      callback(node.numerator, 'numerator');
      callback(node.denominator, 'denominator');
      break;
    case 'mixed-fraction':
      callback(node.whole, 'whole');
      callback(node.numerator, 'numerator');
      callback(node.denominator, 'denominator');
      break;
    case 'root':
      if (node.index) callback(node.index, 'index');
      callback(node.radicand, 'radicand');
      break;
    case 'power':
      callback(node.base, 'base');
      callback(node.exponent, 'exponent');
      break;
    case 'function':
      node.args.forEach((arg, index) => callback(arg, `arg:${index}`));
      break;
    case 'group':
      callback(node.body, 'body');
      break;
    case 'integral':
      callback(node.lower, 'lower');
      callback(node.upper, 'upper');
      callback(node.integrand, 'integrand');
      break;
    case 'derivative':
      callback(node.expression, 'expression');
      callback(node.at, 'at');
      break;
    case 'summation':
      callback(node.lower, 'lower');
      callback(node.upper, 'upper');
      callback(node.expression, 'expression');
      break;
    case 'recurring-decimal':
      callback(node.whole, 'whole');
      callback(node.nonRepeating, 'nonRepeating');
      callback(node.repeating, 'repeating');
      break;
    case 'unit-conversion':
      callback(node.operand, 'operand');
      break;
  }
}

export function collectSequences(root: SequenceNode): SequenceMeta[] {
  const result: SequenceMeta[] = [];

  const walk = (
    sequence: SequenceNode,
    owner?: MathNode,
    slot?: string,
    parentSequence?: SequenceNode,
    ownerIndex?: number,
  ) => {
    result.push({ sequence, owner, slot, parentSequence, ownerIndex });
    sequence.children.forEach((node, index) => {
      visitChildSequences(node, (child, childSlot) => {
        walk(child, node, childSlot, sequence, index);
      });
    });
  };

  walk(root);
  return result;
}

export function findSequence(root: SequenceNode, id: string): SequenceNode | undefined {
  return collectSequences(root).find(item => item.sequence.id === id)?.sequence;
}

function removePlaceholder(sequence: SequenceNode) {
  if (sequence.children.length === 1 && sequence.children[0].type === 'placeholder') {
    sequence.children = [];
  }
}

function ensurePlaceholder(sequence: SequenceNode) {
  if (sequence.children.length === 0) sequence.children.push({ type: 'placeholder' });
}

function setCursorAtStart(document: FormulaDocument, sequence: SequenceNode) {
  document.cursor = { sequenceId: sequence.id, offset: 0 };
}

function insertNode(document: FormulaDocument, node: MathNode, target?: SequenceNode) {
  const sequence = target ?? findSequence(document.root, document.cursor.sequenceId);
  if (!sequence) return;
  removePlaceholder(sequence);
  const offset = Math.min(document.cursor.offset, sequence.children.length);
  sequence.children.splice(offset, 0, node);
  document.cursor = { sequenceId: sequence.id, offset: offset + 1 };
}

export function insertGlyph(document: FormulaDocument, value: string): FormulaDocument {
  const next = cloneDocument(document);
  const sequence = findSequence(next.root, next.cursor.sequenceId);
  if (!sequence || sequence.editable === false) return next;
  removePlaceholder(sequence);
  const offset = Math.min(next.cursor.offset, sequence.children.length);
  let input = value;
  if (input === '.') {
    const start = operandStart(sequence, offset);
    const token = sequence.children.slice(start, offset)
      .filter((node): node is GlyphNode => node.type === 'glyph')
      .map(node => node.value)
      .join('');
    if (token.includes('.')) return next;
    if (!/[0-9]$/.test(token)) input = '0.';
  }
  const glyphs = [...input].map(char => ({ type: 'glyph', value: char }) as GlyphNode);
  sequence.children.splice(offset, 0, ...glyphs);
  next.cursor = { sequenceId: sequence.id, offset: offset + glyphs.length };
  return next;
}

function operandStart(sequence: SequenceNode, offset: number): number {
  if (offset <= 0) return 0;
  const last = sequence.children[offset - 1];
  if (last.type !== 'glyph') return offset - 1;
  if (last.value === ')') {
    let depth = 0;
    for (let index = offset - 1; index >= 0; index--) {
      const node = sequence.children[index];
      if (node.type !== 'glyph') continue;
      if (node.value === ')') depth++;
      if (node.value === '(' && --depth === 0) return index;
    }
  }
  if (['!', '%', '°'].includes(last.value)) {
    return operandStart(sequence, offset - 1);
  }
  let start = offset;
  while (start > 0) {
    const node = sequence.children[start - 1];
    if (node.type !== 'glyph' || !/[A-Za-z0-9.π]/.test(node.value)) break;
    start--;
  }
  if (start > 1) {
    const sign = sequence.children[start - 1];
    const marker = sequence.children[start - 2];
    if (sign.type === 'glyph' && /^[+-]$/.test(sign.value)
      && marker.type === 'glyph' && /^[Ee]$/.test(marker.value)) {
      start = operandStart(sequence, start - 1);
    }
  }
  return Math.min(start, offset - 1);
}

export function insertFraction(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const numerator = placeholderSequence();
  const denominator = placeholderSequence();
  insertNode(next, { type: 'fraction', numerator, denominator });
  setCursorAtStart(next, numerator);
  return next;
}

export function insertRoot(
  document: FormulaDocument,
  withIndex = false,
  fixedIndex?: string,
): FormulaDocument {
  const next = cloneDocument(document);
  const index = fixedIndex
    ? createSequence([...fixedIndex].map(value => ({ type: 'glyph', value } as GlyphNode)), false)
    : withIndex
      ? placeholderSequence()
      : undefined;
  const radicand = placeholderSequence();
  insertNode(next, { type: 'root', index, radicand });
  setCursorAtStart(next, fixedIndex ? radicand : index ?? radicand);
  return next;
}

export function insertPower(
  document: FormulaDocument,
  fixedExponent?: string,
  fixedBase?: string,
): FormulaDocument {
  const next = cloneDocument(document);
  const sequence = findSequence(next.root, next.cursor.sequenceId);
  if (!sequence) return next;
  removePlaceholder(sequence);
  const offset = Math.min(next.cursor.offset, sequence.children.length);
  const start = fixedBase ? offset : operandStart(sequence, offset);
  const captured = fixedBase ? [] : sequence.children.splice(start, offset - start);
  const base = fixedBase
    ? createSequence([...fixedBase].map(value => ({ type: 'glyph', value } as GlyphNode)), false)
    : createSequence(captured.length ? captured : [{ type: 'placeholder' }]);
  const exponent = fixedExponent
    ? createSequence([...fixedExponent].map(value => ({ type: 'glyph', value } as GlyphNode)), false)
    : placeholderSequence();
  sequence.children.splice(start, 0, { type: 'power', base, exponent });
  next.cursor = fixedExponent
    ? { sequenceId: sequence.id, offset: start + 1 }
    : { sequenceId: exponent.id, offset: 0 };
  return next;
}

export function insertMixedFraction(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const whole = placeholderSequence();
  const numerator = placeholderSequence();
  const denominator = placeholderSequence();
  insertNode(next, { type: 'mixed-fraction', whole, numerator, denominator });
  setCursorAtStart(next, whole);
  return next;
}

export function insertGroup(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const body = placeholderSequence();
  insertNode(next, { type: 'group', body });
  setCursorAtStart(next, body);
  return next;
}

export function insertFixedBasePower(document: FormulaDocument, base: '10' | 'e'): FormulaDocument {
  return insertPower(document, undefined, base);
}

export function closeContainer(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  let meta = collectSequences(next.root).find(item => item.sequence.id === next.cursor.sequenceId);
  while (meta?.owner && meta.parentSequence && meta.ownerIndex !== undefined) {
    if (meta.owner.type === 'group' || meta.owner.type === 'function') {
      next.cursor = { sequenceId: meta.parentSequence.id, offset: meta.ownerIndex + 1 };
      return next;
    }
    meta = collectSequences(next.root).find(item => item.sequence.id === meta?.parentSequence?.id);
  }
  return insertGlyph(next, ')');
}

export function advanceArgument(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  let meta = collectSequences(next.root).find(item => item.sequence.id === next.cursor.sequenceId);
  while (meta?.owner && meta.parentSequence) {
    if (meta.owner.type === 'function' && meta.slot?.startsWith('arg:')) {
      const index = Number(meta.slot.slice(4));
      const target = meta.owner.args[index + 1];
      if (target) setCursorAtStart(next, target);
      return next;
    }
    meta = collectSequences(next.root).find(item => item.sequence.id === meta?.parentSequence?.id);
  }
  return insertGlyph(next, ',');
}

export function insertFunction(
  document: FormulaDocument,
  name: string,
  argumentCount = 1,
): FormulaDocument {
  const next = cloneDocument(document);
  const args = Array.from({ length: argumentCount }, () => placeholderSequence());
  insertNode(next, { type: 'function', name, args });
  setCursorAtStart(next, args[0]);
  return next;
}

export function insertIntegral(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const lower = placeholderSequence();
  const upper = placeholderSequence();
  const integrand = placeholderSequence();
  insertNode(next, { type: 'integral', integrand, lower, upper });
  setCursorAtStart(next, lower);
  return next;
}

export function insertDerivative(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const expression = placeholderSequence();
  const at = placeholderSequence();
  insertNode(next, { type: 'derivative', expression, at });
  setCursorAtStart(next, expression);
  return next;
}

export function insertSummation(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const lower = placeholderSequence();
  const upper = placeholderSequence();
  const expression = placeholderSequence();
  insertNode(next, { type: 'summation', expression, lower, upper });
  setCursorAtStart(next, lower);
  return next;
}

export function insertScientificConstant(
  document: FormulaDocument,
  id: string,
  symbol: string,
): FormulaDocument {
  const next = cloneDocument(document);
  insertNode(next, { type: 'scientific-constant', id, symbol });
  return next;
}

export function insertRecurringDecimal(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const whole = placeholderSequence();
  const nonRepeating = placeholderSequence();
  const repeating = placeholderSequence();
  insertNode(next, { type: 'recurring-decimal', whole, nonRepeating, repeating });
  setCursorAtStart(next, whole);
  return next;
}

export function insertUnitConversion(
  document: FormulaDocument,
  id: string,
  label: string,
): FormulaDocument {
  const next = cloneDocument(document);
  const sequence = findSequence(next.root, next.cursor.sequenceId);
  if (!sequence || sequence.editable === false) return next;
  removePlaceholder(sequence);
  const offset = Math.min(next.cursor.offset, sequence.children.length);
  const captured = sequence.children.splice(0, offset);
  const operand = createSequence(captured.length ? captured : [{ type: 'placeholder' }]);
  sequence.children.unshift({ type: 'unit-conversion', id, label, operand });
  next.cursor = { sequenceId: sequence.id, offset: 1 };
  return next;
}

const EXTRA_FUNCTION_INPUTS: Record<string, [string, number]> = {
  'gcd(': ['gcd', 2], 'lcm(': ['lcm', 2], 'recur(': ['recur', 3],
  'dms(': ['dms', 3], 'todms(': ['todms', 1],
  'sinh(': ['sinh', 1], 'cosh(': ['cosh', 1], 'tanh(': ['tanh', 1],
  'asinh(': ['asinh', 1], 'acosh(': ['acosh', 1], 'atanh(': ['atanh', 1],
};

export function insertFormulaInput(document: FormulaDocument, value: string): FormulaDocument {
  if (value === '/') return insertFraction(document);
  if (value === '■ ▭/▭') return insertMixedFraction(document);
  if (value === '√(' || value === '√') return insertRoot(document);
  if (value === '³√(' || value === '³√') return insertRoot(document, true, '3');
  if (value === '■√■') return insertRoot(document, true);
  if (value === '²') return insertPower(document, '2');
  if (value === '³') return insertPower(document, '3');
  if (value === '⁻¹') return insertPower(document, '-1');
  if (value === '^(') return insertPower(document);
  if (value === '10^') return insertFixedBasePower(document, '10');
  if (value === 'e^') return insertFixedBasePower(document, 'e');
  if (value === '(') return insertGroup(document);
  if (value === ')') return closeContainer(document);
  if (value.startsWith('const:')) {
    const [, id, symbol] = value.split(':');
    return insertScientificConstant(document, id, symbol);
  }
  if (value.startsWith('conv:')) {
    const [, id, label] = value.split(':');
    return insertUnitConversion(document, id, label);
  }
  if (value === ',') return advanceArgument(document);
  if (value === 'log□(') return insertFunction(document, 'log', 2);
  const extraFunction = EXTRA_FUNCTION_INPUTS[value];
  if (extraFunction) return insertFunction(document, extraFunction[0], extraFunction[1]);
  if (value === 'log(') return insertFunction(document, 'log');
  if (value === 'ln(') return insertFunction(document, 'ln');
  if (value === 'Rnd(') return insertFunction(document, 'rnd');
  if (value === 'sin(' || value === 'cos(' || value === 'tan(') {
    return insertFunction(document, value.slice(0, -1));
  }
  if (value === 'sin⁻¹(') return insertFunction(document, 'asin');
  if (value === 'cos⁻¹(') return insertFunction(document, 'acos');
  if (value === 'tan⁻¹(') return insertFunction(document, 'atan');
  if (value === 'Abs(') return insertFunction(document, 'abs');
  if (value === 'Pol(' || value === 'Rec(' || value === 'RanInt(') {
    return insertFunction(document, value.slice(0, -1), 2);
  }
  if (value === '∫dx') return insertIntegral(document);
  if (value === 'd/dx') return insertDerivative(document);
  if (value === 'Σ') return insertSummation(document);
  if (value === 'Ran#') return insertGlyph(document, 'rand()');
  return insertGlyph(document, value);
}

function slotSibling(owner: MathNode, slot: string, direction: CursorDirection): SequenceNode | undefined {
  if (owner.type === 'recurring-decimal') {
    if (direction === 'right' && slot === 'whole') return owner.nonRepeating;
    if (direction === 'left' && slot === 'nonRepeating') return owner.whole;
    if (direction === 'right' && slot === 'nonRepeating') return owner.repeating;
    if (direction === 'left' && slot === 'repeating') return owner.nonRepeating;
  }
  if (owner.type === 'fraction') {
    if (direction === 'down' && slot === 'numerator') return owner.denominator;
    if (direction === 'up' && slot === 'denominator') return owner.numerator;
  }
  if (owner.type === 'mixed-fraction') {
    if (direction === 'right' && slot === 'whole') return owner.numerator;
    if (direction === 'down' && slot === 'numerator') return owner.denominator;
    if (direction === 'up' && slot === 'denominator') return owner.numerator;
  }
  if (owner.type === 'power') {
    if (direction === 'up' && slot === 'base' && owner.exponent.editable !== false) return owner.exponent;
    if (direction === 'down' && slot === 'exponent' && owner.base.editable !== false) return owner.base;
  }
  if (owner.type === 'root' && owner.index) {
    if (direction === 'right' && slot === 'index') return owner.radicand;
    if (direction === 'left' && slot === 'radicand') return owner.index;
  }
  if (owner.type === 'integral' || owner.type === 'summation') {
    if (direction === 'down' && slot === 'upper') return owner.lower;
    if (direction === 'up' && slot === 'lower') return owner.upper;
    if (direction === 'right' && (slot === 'lower' || slot === 'upper')) {
      return owner.type === 'integral' ? owner.integrand : owner.expression;
    }
  }
  if (owner.type === 'function') {
    const index = Number(slot.split(':')[1]);
    if (direction === 'right' && index < owner.args.length - 1) return owner.args[index + 1];
    if (direction === 'left' && index > 0) return owner.args[index - 1];
  }
  if (owner.type === 'derivative' && direction === 'right' && slot === 'expression') return owner.at;
  if (owner.type === 'derivative' && direction === 'left' && slot === 'at') return owner.expression;
  return undefined;
}

function orderedChildSequences(node: MathNode): SequenceNode[] {
  const sequences: SequenceNode[] = [];
  visitChildSequences(node, sequence => {
    if (sequence.editable !== false) sequences.push(sequence);
  });
  return sequences;
}

function firstEditableSequence(node: MathNode): SequenceNode | undefined {
  const first = orderedChildSequences(node)[0];
  if (!first) return undefined;
  const nested = first.children[0] ? firstEditableSequence(first.children[0]) : undefined;
  return nested ?? first;
}

function lastEditableSequence(node: MathNode): SequenceNode | undefined {
  const children = orderedChildSequences(node);
  const last = children[children.length - 1];
  if (!last) return undefined;
  const tail = last.children[last.children.length - 1];
  const nested = tail ? lastEditableSequence(tail) : undefined;
  return nested ?? last;
}

function isEmptyPlaceholder(sequence: SequenceNode): boolean {
  return sequence.children.length === 1 && sequence.children[0].type === 'placeholder';
}

export function moveCursor(document: FormulaDocument, direction: CursorDirection): FormulaDocument {
  const next = cloneDocument(document);
  const sequences = collectSequences(next.root);
  const current = sequences.find(item => item.sequence.id === next.cursor.sequenceId);
  if (!current) return next;

  if ((direction === 'up' || direction === 'down') && current.owner && current.slot) {
    const sibling = slotSibling(current.owner, current.slot, direction);
    if (sibling) {
      next.cursor = {
        sequenceId: sibling.id,
        offset: isEmptyPlaceholder(sibling) ? 0 : Math.min(next.cursor.offset, sibling.children.length),
      };
    }
    return next;
  }

  if (direction === 'right') {
    if (isEmptyPlaceholder(current.sequence)) {
      next.cursor.offset = current.sequence.children.length;
    }
    if (next.cursor.offset < current.sequence.children.length) {
      const node = current.sequence.children[next.cursor.offset];
      const child = firstEditableSequence(node);
      if (child) {
        next.cursor = { sequenceId: child.id, offset: 0 };
      } else {
        next.cursor.offset += 1;
      }
      return next;
    }
    if (current.owner && current.parentSequence && current.ownerIndex !== undefined) {
      const slots = orderedChildSequences(current.owner);
      const slotIndex = slots.findIndex(sequence => sequence.id === current.sequence.id);
      const sibling = slots[slotIndex + 1];
      if (sibling) {
        next.cursor = { sequenceId: sibling.id, offset: 0 };
      } else {
        next.cursor = { sequenceId: current.parentSequence.id, offset: current.ownerIndex + 1 };
      }
      return next;
    }
    next.cursor = { sequenceId: next.root.id, offset: 0 };
    return next;
  }

  if (direction === 'left') {
    if (next.cursor.offset > 0) {
      const node = current.sequence.children[next.cursor.offset - 1];
      const child = lastEditableSequence(node);
      if (child) {
        next.cursor = { sequenceId: child.id, offset: child.children.length };
      } else {
        next.cursor.offset -= 1;
      }
      return next;
    }
    if (current.owner && current.parentSequence && current.ownerIndex !== undefined) {
      const slots = orderedChildSequences(current.owner);
      const slotIndex = slots.findIndex(sequence => sequence.id === current.sequence.id);
      const sibling = slots[slotIndex - 1];
      if (sibling) {
        next.cursor = { sequenceId: sibling.id, offset: sibling.children.length };
      } else {
        next.cursor = { sequenceId: current.parentSequence.id, offset: current.ownerIndex };
      }
    }
  }

  return next;
}
export function deleteBackward(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const sequences = collectSequences(next.root);
  const current = sequences.find(item => item.sequence.id === next.cursor.sequenceId);
  if (!current) return next;

  if (next.cursor.offset > 0) {
    current.sequence.children.splice(next.cursor.offset - 1, 1);
    next.cursor.offset -= 1;
    return next;
  }

  if (current.parentSequence && current.ownerIndex !== undefined) {
    current.parentSequence.children.splice(current.ownerIndex, 1);
    next.cursor = {
      sequenceId: current.parentSequence.id,
      offset: current.ownerIndex,
    };
  }
  return next;
}

function serializeSequence(sequence: SequenceNode): string {
  if (sequence.children.length === 0) return '0';
  return sequence.children.map(serializeNode).join('');
}

function serializeNode(node: MathNode): string {
  switch (node.type) {
    case 'glyph':
      return node.value;
    case 'placeholder':
      return '0';
    case 'sequence':
      return serializeSequence(node);
    case 'scientific-constant':
      return `const_${node.id}`;
    case 'recurring-decimal':
      return `recur(${serializeSequence(node.whole)},${serializeSequence(node.nonRepeating)},${serializeSequence(node.repeating)})`;
    case 'unit-conversion':
      return `conv_${node.id}(${serializeSequence(node.operand)})`;
    case 'fraction':
      return `((${serializeSequence(node.numerator)})/(${serializeSequence(node.denominator)}))`;
    case 'root':
      return node.index
        ? `root(${serializeSequence(node.index)},${serializeSequence(node.radicand)})`
        : `sqrt(${serializeSequence(node.radicand)})`;
    case 'power':
      return `((${serializeSequence(node.base)})^(${serializeSequence(node.exponent)}))`;
    case 'mixed-fraction':
      return `mixed(${serializeSequence(node.whole)},${serializeSequence(node.numerator)},${serializeSequence(node.denominator)})`;
    case 'function':
      return `${node.name}(${node.args.map(serializeSequence).join(',')})`;
    case 'group':
      return `(${serializeSequence(node.body)})`;
    case 'integral':
      return `integral(${serializeSequence(node.integrand)},${serializeSequence(node.lower)},${serializeSequence(node.upper)})`;
    case 'derivative':
      return `d(${serializeSequence(node.expression)},${serializeSequence(node.at)})`;
    case 'summation':
      return `sum(${serializeSequence(node.expression)},${serializeSequence(node.lower)},${serializeSequence(node.upper)})`;
  }
}

export function serializeExpression(document: FormulaDocument): string {
  if (document.root.children.length === 0) return '';
  return serializeSequence(document.root);
}

export function parseLegacyExpression(input: string): FormulaDocument {
  const root = createSequence();
  root.children = [...input].map(value => ({ type: 'glyph', value }));
  return { root, cursor: { sequenceId: root.id, offset: root.children.length } };
}

export function collectVariables(document: FormulaDocument): string[] {
  const found = new Set<string>();
  const walk = (node: MathNode) => {
    if (node.type === 'glyph' && /^[A-FXYM]$/.test(node.value)) found.add(node.value);
    if (node.type === 'sequence') node.children.forEach(walk);
    visitChildSequences(node, sequence => walk(sequence));
  };
  walk(document.root);
  return [...found];
}

export function repairDocumentCursor(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  try {
    const sequences = collectSequences(next.root);
    const current = sequences.find(item => item.sequence.id === next.cursor.sequenceId);
    if (current && current.sequence.editable !== false) {
      next.cursor.offset = Math.max(0, Math.min(next.cursor.offset, current.sequence.children.length));
      return next;
    }
    if (current?.parentSequence && current.ownerIndex !== undefined) {
      next.cursor = { sequenceId: current.parentSequence.id, offset: current.ownerIndex + 1 };
      return next;
    }
  } catch {
    // A legacy cursor must never make the editor fail to load.
  }
  next.cursor = { sequenceId: next.root.id, offset: next.root.children.length };
  return next;
}

export function normalizePlaceholders(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  collectSequences(next.root).forEach(item => {
    if (item.sequence !== next.root) ensurePlaceholder(item.sequence);
  });
  return next;
}
