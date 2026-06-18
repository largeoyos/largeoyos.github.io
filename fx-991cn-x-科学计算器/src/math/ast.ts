export type SequenceNode = {
  type: 'sequence';
  id: string;
  children: MathNode[];
};

export type GlyphNode = {
  type: 'glyph';
  value: string;
};

export type PlaceholderNode = {
  type: 'placeholder';
};

export type FractionNode = {
  type: 'fraction';
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

export type GroupNode = {
  type: 'group';
  body: SequenceNode;
};

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

export type MathNode =
  | SequenceNode
  | GlyphNode
  | PlaceholderNode
  | FractionNode
  | RootNode
  | PowerNode
  | FunctionNode
  | GroupNode
  | IntegralNode
  | DerivativeNode
  | SummationNode;

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

export function createSequence(children: MathNode[] = []): SequenceNode {
  sequenceCounter += 1;
  return { type: 'sequence', id: `seq-${sequenceCounter}`, children };
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
      callback(node.integrand, 'integrand');
      callback(node.lower, 'lower');
      callback(node.upper, 'upper');
      break;
    case 'derivative':
      callback(node.expression, 'expression');
      callback(node.at, 'at');
      break;
    case 'summation':
      callback(node.expression, 'expression');
      callback(node.lower, 'lower');
      callback(node.upper, 'upper');
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
  if (!sequence) return next;
  removePlaceholder(sequence);
  const offset = Math.min(next.cursor.offset, sequence.children.length);
  const glyphs = [...value].map(char => ({ type: 'glyph', value: char }) as GlyphNode);
  sequence.children.splice(offset, 0, ...glyphs);
  next.cursor = { sequenceId: sequence.id, offset: offset + glyphs.length };
  return next;
}

export function insertFraction(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  const numerator = placeholderSequence();
  const denominator = placeholderSequence();
  insertNode(next, { type: 'fraction', numerator, denominator });
  setCursorAtStart(next, numerator);
  return next;
}

export function insertRoot(document: FormulaDocument, withIndex = false): FormulaDocument {
  const next = cloneDocument(document);
  const index = withIndex ? placeholderSequence() : undefined;
  const radicand = placeholderSequence();
  insertNode(next, { type: 'root', index, radicand });
  setCursorAtStart(next, index ?? radicand);
  return next;
}

export function insertPower(document: FormulaDocument, fixedExponent?: string): FormulaDocument {
  const next = cloneDocument(document);
  const sequence = findSequence(next.root, next.cursor.sequenceId);
  if (!sequence) return next;
  removePlaceholder(sequence);
  const offset = Math.min(next.cursor.offset, sequence.children.length);
  const previous = offset > 0 ? sequence.children.splice(offset - 1, 1)[0] : undefined;
  const base = createSequence(previous ? [previous] : [{ type: 'placeholder' }]);
  const exponent = fixedExponent
    ? createSequence([...fixedExponent].map(value => ({ type: 'glyph', value } as GlyphNode)))
    : placeholderSequence();
  sequence.children.splice(Math.max(0, offset - 1), 0, { type: 'power', base, exponent });
  next.cursor = fixedExponent
    ? { sequenceId: sequence.id, offset: Math.max(0, offset - 1) + 1 }
    : { sequenceId: exponent.id, offset: 0 };
  return next;
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

function slotSibling(owner: MathNode, slot: string, direction: CursorDirection): SequenceNode | undefined {
  if (owner.type === 'fraction') {
    if (direction === 'down' && slot === 'numerator') return owner.denominator;
    if (direction === 'up' && slot === 'denominator') return owner.numerator;
  }
  if (owner.type === 'power') {
    if (direction === 'up' && slot === 'base') return owner.exponent;
    if (direction === 'down' && slot === 'exponent') return owner.base;
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

export function moveCursor(document: FormulaDocument, direction: CursorDirection): FormulaDocument {
  const next = cloneDocument(document);
  const sequences = collectSequences(next.root);
  const currentIndex = sequences.findIndex(item => item.sequence.id === next.cursor.sequenceId);
  const current = sequences[currentIndex];
  if (!current) return next;

  if ((direction === 'up' || direction === 'down') && current.owner && current.slot) {
    const sibling = slotSibling(current.owner, current.slot, direction);
    if (sibling) {
      next.cursor = {
        sequenceId: sibling.id,
        offset: Math.min(next.cursor.offset, sibling.children.length),
      };
      return next;
    }
  }

  if (direction === 'left') {
    if (next.cursor.offset > 0) {
      next.cursor.offset -= 1;
      return next;
    }
    if (current.owner && current.slot) {
      const sibling = slotSibling(current.owner, current.slot, direction);
      if (sibling) {
        next.cursor = { sequenceId: sibling.id, offset: sibling.children.length };
        return next;
      }
    }
    const previous = sequences[currentIndex - 1]?.sequence;
    if (previous) next.cursor = { sequenceId: previous.id, offset: previous.children.length };
  }

  if (direction === 'right') {
    if (next.cursor.offset < current.sequence.children.length) {
      next.cursor.offset += 1;
      return next;
    }
    if (current.owner && current.slot) {
      const sibling = slotSibling(current.owner, current.slot, direction);
      if (sibling) {
        next.cursor = { sequenceId: sibling.id, offset: 0 };
        return next;
      }
    }
    const following = sequences[currentIndex + 1]?.sequence;
    if (following) next.cursor = { sequenceId: following.id, offset: 0 };
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
    case 'fraction':
      return `((${serializeSequence(node.numerator)})/(${serializeSequence(node.denominator)}))`;
    case 'root':
      return node.index
        ? `root(${serializeSequence(node.index)},${serializeSequence(node.radicand)})`
        : `sqrt(${serializeSequence(node.radicand)})`;
    case 'power':
      return `((${serializeSequence(node.base)})^(${serializeSequence(node.exponent)}))`;
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
  const normalized = input
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('π', 'p');
  root.children = [...normalized].map(value => ({ type: 'glyph', value }));
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

export function normalizePlaceholders(document: FormulaDocument): FormulaDocument {
  const next = cloneDocument(document);
  collectSequences(next.root).forEach(item => {
    if (item.sequence !== next.root) ensurePlaceholder(item.sequence);
  });
  return next;
}
