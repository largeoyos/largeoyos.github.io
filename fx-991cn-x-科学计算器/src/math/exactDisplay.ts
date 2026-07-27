import {
  bigintGcd,
  exactRealToNumber,
  rational,
  type ExactReal,
  type ExactValue,
  type Rational,
} from '../core/exact';
import {
  createSequence,
  type FormulaDocument,
  type MathNode,
  type SequenceNode,
} from './ast';

type DisplayTerm = {
  coefficient: Rational;
  radicand?: bigint;
  imaginary?: boolean;
};

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function lcm(left: bigint, right: bigint): bigint {
  return abs(left * right) / bigintGcd(left, right);
}

function glyphs(value: string): MathNode[] {
  return [...value].map(char => ({ type: 'glyph', value: char }));
}

function numberSequence(value: bigint): SequenceNode {
  return createSequence(glyphs(value.toString()), false);
}

function realTerms(value: ExactReal, imaginary = false): DisplayTerm[] {
  const terms: DisplayTerm[] = [];
  if (value.rational.numerator !== 0n) terms.push({ coefficient: value.rational, imaginary });
  if (value.radical.numerator !== 0n) {
    terms.push({ coefficient: value.radical, radicand: value.radicand, imaginary });
  }
  return terms;
}

function valueTerms(value: ExactValue): DisplayTerm[] {
  if (value.kind === 'exact-real') return realTerms(value);
  return [...realTerms(value.real), ...realTerms(value.imaginary, true)];
}

function appendTerm(nodes: MathNode[], coefficient: bigint, term: DisplayTerm, first: boolean) {
  const negative = coefficient < 0n;
  const magnitude = abs(coefficient);
  if (negative) nodes.push(...glyphs('-'));
  else if (!first) nodes.push(...glyphs('+'));

  const hasSymbol = term.radicand !== undefined || term.imaginary;
  if (!hasSymbol || magnitude !== 1n) nodes.push(...glyphs(magnitude.toString()));
  if (term.radicand !== undefined) {
    nodes.push({ type: 'root', radicand: numberSequence(term.radicand) });
  }
  if (term.imaginary) nodes.push(...glyphs('i'));
}

export function exactValueToFormulaDocument(
  value: ExactValue,
  fractionMode: 'mixed' | 'improper' = 'improper',
): FormulaDocument {
  if (
    fractionMode === 'mixed'
    && value.kind === 'exact-real'
    && value.radical.numerator === 0n
    && value.rational.denominator > 1n
    && abs(value.rational.numerator) > value.rational.denominator
  ) {
    const whole = value.rational.numerator / value.rational.denominator;
    const remainder = abs(value.rational.numerator % value.rational.denominator);
    if (whole !== 0n && remainder !== 0n) {
      const root = createSequence([{
        type: 'mixed-fraction',
        whole: numberSequence(whole),
        numerator: numberSequence(remainder),
        denominator: numberSequence(value.rational.denominator),
      }], false);
      return { root, cursor: { sequenceId: root.id, offset: root.children.length } };
    }
  }
  const terms = valueTerms(value);
  if (!terms.length) {
    const root = createSequence(glyphs('0'), false);
    return { root, cursor: { sequenceId: root.id, offset: root.children.length } };
  }
  let denominator = 1n;
  terms.forEach(term => { denominator = lcm(denominator, term.coefficient.denominator); });
  const scaled = terms.map(term => ({
    term,
    coefficient: term.coefficient.numerator * (denominator / term.coefficient.denominator),
  }));
  let divisor = denominator;
  scaled.forEach(item => { divisor = bigintGcd(divisor, item.coefficient); });
  if (divisor > 1n) {
    denominator /= divisor;
    scaled.forEach(item => { item.coefficient /= divisor; });
  }

  const numeratorNodes: MathNode[] = [];
  scaled.forEach((item, index) => appendTerm(numeratorNodes, item.coefficient, item.term, index === 0));
  const numerator = createSequence(numeratorNodes, false);
  const root = denominator === 1n
    ? createSequence(numeratorNodes, false)
    : createSequence([{
      type: 'fraction',
      numerator,
      denominator: numberSequence(denominator),
    }], false);
  return { root, cursor: { sequenceId: root.id, offset: root.children.length } };
}

export function exactValueDecimal(value: ExactValue): string {
  if (value.kind === 'exact-real') return String(Number(exactRealToNumber(value).toPrecision(12)));
  const real = Number(exactRealToNumber(value.real).toPrecision(12));
  const imaginary = Number(Math.abs(exactRealToNumber(value.imaginary)).toPrecision(12));
  const sign = exactRealToNumber(value.imaginary) < 0 ? '-' : '+';
  if (real === 0) return `${sign === '-' ? '-' : ''}${imaginary === 1 ? '' : imaginary}i`;
  return `${real}${sign}${imaginary === 1 ? '' : imaginary}i`;
}

export function rationalDocument(numerator: bigint, denominator = 1n): FormulaDocument {
  return exactValueToFormulaDocument({
    kind: 'exact-real',
    rational: rational(numerator, denominator),
    radical: rational(0n),
    radicand: 1n,
  });
}
