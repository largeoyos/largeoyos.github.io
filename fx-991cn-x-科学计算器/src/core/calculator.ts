// patch probe
export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export interface EvaluationContext {
  variables: Record<string, number>;
  ans: number;
  angleMode: AngleMode;
}

export interface EvalResult {
  success: boolean;
  value: number;
  displayText: string;
  errorType?: 'Math ERROR' | 'Syntax ERROR' | 'Argument ERROR' | 'Dimension ERROR' | 'Range ERROR' | 'Variable ERROR' | 'No Solution';
}

export interface SolveResult extends EvalResult {
  variable: string;
  roots?: number[];
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma'; value: ',' };

type Node =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'unary'; op: string; expr: Node }
  | { type: 'binary'; op: string; left: Node; right: Node }
  | { type: 'call'; name: string; args: Node[] }
  | { type: 'postfix'; op: string; expr: Node };

export interface ComplexValue {
  re: number;
  im: number;
}

export const SCIENTIFIC_CONSTANTS = [
  { key: '1', symbol: 'c', name: '真空中光速', value: 299792458 },
  { key: '2', symbol: 'h', name: '普朗克常量', value: 6.62607015e-34 },
  { key: '3', symbol: 'G', name: '万有引力常量', value: 6.6743e-11 },
  { key: '4', symbol: 'g', name: '标准重力加速度', value: 9.80665 },
  { key: '5', symbol: 'NA', name: '阿伏伽德罗常量', value: 6.02214076e23 },
  { key: '6', symbol: 'R', name: '摩尔气体常量', value: 8.314462618 },
  { key: '7', symbol: 'e', name: '元电荷', value: 1.602176634e-19 },
  { key: '8', symbol: 'me', name: '电子质量', value: 9.1093837015e-31 },
  { key: '9', symbol: 'mp', name: '质子质量', value: 1.67262192369e-27 },
  { key: '0', symbol: 'mn', name: '中子质量', value: 1.67492749804e-27 },
];

export const UNIT_CONVERSIONS = [
  { key: '1', name: 'in -> cm', factor: 2.54, offset: 0 },
  { key: '2', name: 'cm -> in', factor: 1 / 2.54, offset: 0 },
  { key: '3', name: 'kg -> lb', factor: 2.2046226218, offset: 0 },
  { key: '4', name: 'lb -> kg', factor: 0.45359237, offset: 0 },
  { key: '5', name: 'm -> ft', factor: 3.280839895, offset: 0 },
  { key: '6', name: 'ft -> m', factor: 0.3048, offset: 0 },
  { key: '7', name: 'km/h -> m/s', factor: 1 / 3.6, offset: 0 },
  { key: '8', name: 'm/s -> km/h', factor: 3.6, offset: 0 },
  { key: '9', name: 'C -> F', factor: 9 / 5, offset: 32 },
  { key: '0', name: 'F -> C', factor: 5 / 9, offset: -32 * 5 / 9 },
];

export const APP_CAPABILITIES = [
  'Calculate',
  'Statistics',
  'Distribution',
  'Spreadsheet',
  'Function Table',
  'Equation',
  'Inequality',
  'Complex',
  'Base-N',
  'Matrix',
  'Vector',
  'Ratio',
];

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sqrt', 'cbrt', 'root', 'log', 'ln', 'abs', 'fact', 'npr', 'ncr', 'rnd', 'ranint', 'pol', 'rec',
  'rand', 'd', 'dx', 'integral', 'sum', 'remainder', 'simplify', 'gcd', 'lcm', 'normalpdf', 'normalcdf',
  'binompdf', 'binomcdf', 'poissonpdf', 'poissoncdf', 'solve', 'ratio', 'mixed',
]);

function normalizeInput(input: string): string {
  return input
    .replace(/³√\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/g, 'cbrt($1)')
    .replace(/√\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/g, 'sqrt($1)')
    .replaceAll('÷R', ' remainder ')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('³√', 'cbrt')
    .replaceAll('√', 'sqrt')
    .replaceAll('π', 'pi')
    .replaceAll('Π', 'pi')
    .replaceAll('Σ', 'sum')
    .replaceAll('∫dx', 'integral')
    .replaceAll('∫', 'integral')
    .replaceAll('d/dx', 'd')
    .replaceAll('sin⁻¹', 'asin')
    .replaceAll('cos⁻¹', 'acos')
    .replaceAll('tan⁻¹', 'atan')
    .replaceAll('⁻¹', '^(-1)')
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')
    .replaceAll('■√■', 'root')
    .replaceAll('log□', 'log')
    .replaceAll('Rnd', 'rnd')
    .replaceAll('Ran#', 'rand()')
    .replaceAll('RanInt', 'ranint')
    .replaceAll('Abs', 'abs')
    .replaceAll('Pol', 'pol')
    .replaceAll('Rec', 'rec')
    .replace(/\bP\b/g, ' npr ')
    .replace(/\bC\b/g, ' ncr ');
}

function completeParentheses(input: string): string {
  let depth = 0;
  for (const char of input) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) throw new Error('Syntax ERROR');
  }
  return input + ')'.repeat(depth);
}

function tokenize(raw: string): Token[] {
  const input = normalizeInput(raw);
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/\d|\./.test(ch)) {
      const match = input.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (!match) throw new Error('Syntax ERROR');
      tokens.push({ type: 'number', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const match = input.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!match) throw new Error('Syntax ERROR');
      tokens.push({ type: 'identifier', value: match[0] });
      i += match[0].length;
      continue;
    }
    if ('+-*/^%=<>!°'.includes(ch)) {
      const two = input.slice(i, i + 2);
      if (['<=', '>=', '==', '!='].includes(two)) {
        tokens.push({ type: 'operator', value: two });
        i += 2;
      } else {
        tokens.push({ type: 'operator', value: ch });
        i++;
      }
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }
    throw new Error('Syntax ERROR');
  }
  return insertImplicitMultiplication(tokens);
}

function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    const prev = out[out.length - 1];
    if (prev && needsMultiply(prev, curr)) {
      out.push({ type: 'operator', value: '*' });
    }
    out.push(curr);
  }
  return out;
}

function needsMultiply(a: Token, b: Token): boolean {
  const left = a.type === 'number' || a.type === 'identifier' || (a.type === 'paren' && a.value === ')');
  const right = b.type === 'number' || (b.type === 'paren' && b.value === '(') || b.type === 'identifier';
  if (!left || !right) return false;
  if (a.type === 'number' && b.type === 'number') return false;
  if (a.type === 'identifier' && b.type === 'paren' && b.value === '(' && FUNCTIONS.has(a.value.toLowerCase())) return false;
  if (b.type === 'identifier' && ['remainder', 'npr', 'ncr'].includes(b.value.toLowerCase())) return false;
  if (a.type === 'identifier' && ['remainder', 'npr', 'ncr'].includes(a.value.toLowerCase())) return false;
  return true;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): Node {
    const expr = this.parseComparison();
    if (this.peek()) throw new Error('Syntax ERROR');
    return expr;
  }

  private parseComparison(): Node {
    let node = this.parseAddSub();
    while (this.matchOperator('=', '==', '!=', '<', '<=', '>', '>=')) {
      const op = String(this.previous().value).toLowerCase();
      node = { type: 'binary', op, left: node, right: this.parseAddSub() };
    }
    return node;
  }

  private parseAddSub(): Node {
    let node = this.parseMulDiv();
    while (this.matchOperator('+', '-')) {
      const op = String(this.previous().value).toLowerCase();
      node = { type: 'binary', op, left: node, right: this.parseMulDiv() };
    }
    return node;
  }

  private parseMulDiv(): Node {
    let node = this.parseUnary();
    while (this.matchOperator('*', '/', 'remainder', 'npr', 'ncr')) {
      const op = String(this.previous().value).toLowerCase();
      node = { type: 'binary', op, left: node, right: this.parseUnary() };
    }
    return node;
  }

  private parsePower(): Node {
    let node = this.parsePostfix();
    if (this.matchOperator('^')) {
      node = { type: 'binary', op: '^', left: node, right: this.parseUnary() };
    }
    return node;
  }

  private parseUnary(): Node {
    if (this.matchOperator('+', '-')) {
      const op = String(this.previous().value).toLowerCase();
      return { type: 'unary', op, expr: this.parseUnary() };
    }
    return this.parsePower();
  }

  private parsePostfix(): Node {
    let node = this.parsePrimary();
    while (this.matchOperator('!', '%', '°')) node = { type: 'postfix', op: String(this.previous().value), expr: node };
    return node;
  }

  private parsePrimary(): Node {
    const token = this.advance();
    if (!token) throw new Error('Syntax ERROR');
    if (token.type === 'number') return { type: 'number', value: token.value };
    if (token.type === 'identifier') {
      if (this.matchParen('(')) {
        const args: Node[] = [];
        if (!this.checkParen(')')) {
          do {
            args.push(this.parseComparison());
          } while (this.matchComma());
        }
        if (!this.matchParen(')')) throw new Error('Syntax ERROR');
        return { type: 'call', name: token.value, args };
      }
      return { type: 'variable', name: token.value };
    }
    if (token.type === 'paren' && token.value === '(') {
      const node = this.parseComparison();
      if (!this.matchParen(')')) throw new Error('Syntax ERROR');
      return node;
    }
    throw new Error('Syntax ERROR');
  }

  private matchOperator(...ops: string[]): boolean {
    const token = this.peek();
    if (!token) return false;
    if (token.type === 'identifier' && ops.includes(token.value.toLowerCase())) {
      this.pos++;
      return true;
    }
    if (token.type === 'operator' && ops.includes(token.value)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private matchParen(value: '(' | ')'): boolean {
    if (this.checkParen(value)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private checkParen(value: '(' | ')'): boolean {
    const token = this.peek();
    return !!token && token.type === 'paren' && token.value === value;
  }

  private matchComma(): boolean {
    const token = this.peek();
    if (token?.type === 'comma') {
      this.pos++;
      return true;
    }
    return false;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }

  private advance(): Token | undefined {
    return this.tokens[this.pos++];
  }
}

function evalNode(node: Node, ctx: EvaluationContext): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'variable':
      return readVariable(node.name, ctx);
    case 'unary': {
      const value = evalNode(node.expr, ctx);
      return node.op === '-' ? -value : value;
    }
    case 'postfix': {
      const value = evalNode(node.expr, ctx);
      if (node.op === '!') return factorial(value);
      if (node.op === '%') return value / 100;
      if (node.op === '°') return degreesToAngleUnit(value, ctx.angleMode);
      throw new Error('Syntax ERROR');
    }
    case 'binary': {
      const left = evalNode(node.left, ctx);
      if ((node.op === '+' || node.op === '-') && node.right.type === 'postfix' && node.right.op === '%') {
        const percentage = evalNode(node.right.expr, ctx) / 100;
        return node.op === '+' ? left + left * percentage : left - left * percentage;
      }
      return evalBinary(node.op, left, evalNode(node.right, ctx));
    }
    case 'call':
      if (['d', 'dx', 'integral', 'sum', 'solve'].includes(node.name.toLowerCase())) {
        return callSpecialFunction(node.name, node.args, ctx);
      }
      return callFunction(node.name, node.args.map(arg => evalNode(arg, ctx)), ctx);
  }
}

function readVariable(name: string, ctx: EvaluationContext): number {
  const key = name.toUpperCase();
  if (key === 'PI') return Math.PI;
  if (name === 'e') return Math.E;
  if (key === 'ANS') return ctx.ans;
  if (key === 'RAND') return Math.random();
  if (key in ctx.variables) return ctx.variables[key] || 0;
  throw new Error('Argument ERROR');
}

function evalBinary(op: string, left: number, right: number): number {
  switch (op) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/':
      if (right === 0) throw new Error('Math ERROR');
      return left / right;
    case '^': return Math.pow(left, right);
    case 'remainder':
      if (right === 0) throw new Error('Math ERROR');
      return left % right;
    case 'npr': return nPr(left, right);
    case 'ncr': return nCr(left, right);
    case '=':
    case '==': return nearlyEqual(left, right) ? 1 : 0;
    case '!=': return !nearlyEqual(left, right) ? 1 : 0;
    case '<': return left < right ? 1 : 0;
    case '<=': return left <= right || nearlyEqual(left, right) ? 1 : 0;
    case '>': return left > right ? 1 : 0;
    case '>=': return left >= right || nearlyEqual(left, right) ? 1 : 0;
    default: throw new Error('Syntax ERROR');
  }
}

function callFunction(name: string, args: number[], ctx: EvaluationContext): number {
  const fn = name.toLowerCase();
  const rad = toRadFactor(ctx.angleMode);
  const inv = fromRadFactor(ctx.angleMode);
  switch (fn) {
    case 'sin': return Math.sin(args[0] * rad);
    case 'cos': return Math.cos(args[0] * rad);
    case 'tan': {
      const angle = args[0] * rad;
      if (Math.abs(Math.cos(angle)) < 1e-12) throw new Error('Math ERROR');
      return Math.tan(angle);
    }
    case 'asin':
      if (args[0] < -1 || args[0] > 1) throw new Error('Math ERROR');
      return Math.asin(args[0]) * inv;
    case 'acos':
      if (args[0] < -1 || args[0] > 1) throw new Error('Math ERROR');
      return Math.acos(args[0]) * inv;
    case 'atan': return Math.atan(args[0]) * inv;
    case 'sinh': return Math.sinh(args[0]);
    case 'cosh': return Math.cosh(args[0]);
    case 'tanh': return Math.tanh(args[0]);
    case 'asinh': return Math.asinh(args[0]);
    case 'acosh':
      if (args[0] < 1) throw new Error('Math ERROR');
      return Math.acosh(args[0]);
    case 'atanh':
      if (Math.abs(args[0]) >= 1) throw new Error('Math ERROR');
      return Math.atanh(args[0]);
    case 'sqrt':
      if (args[0] < 0) throw new Error('Math ERROR');
      return Math.sqrt(args[0]);
    case 'cbrt': return Math.cbrt(args[0]);
    case 'root': return realRoot(args[0], args[1]);
    case 'log':
      if (args.length === 2) {
        if (args[0] <= 0 || args[0] === 1 || args[1] <= 0) throw new Error('Math ERROR');
        return Math.log(args[1]) / Math.log(args[0]);
      }
      if (args[0] <= 0) throw new Error('Math ERROR');
      return Math.log10(args[0]);
    case 'ln':
      if (args[0] <= 0) throw new Error('Math ERROR');
      return Math.log(args[0]);
    case 'abs': return Math.abs(args[0]);
    case 'fact': return factorial(args[0]);
    case 'npr': return nPr(args[0], args[1]);
    case 'ncr': return nCr(args[0], args[1]);
    case 'rnd': return roundCasio(args[0]);
    case 'rand': return Math.random();
    case 'ranint': return ranInt(args[0], args[1]);
    case 'pol': return Math.hypot(args[0], args[1]);
    case 'rec': return args[0] * Math.cos(args[1] * rad);
    case 'remainder': return evalBinary('remainder', args[0], args[1]);
    case 'gcd': return gcd(args[0], args[1]);
    case 'lcm': return Math.abs(args[0] * args[1]) / gcd(args[0], args[1]);
    case 'normalpdf': return normalPdf(args[0], args[1] ?? 0, args[2] ?? 1);
    case 'normalcdf': return normalCdf(args[0], args[1], args[2] ?? 0, args[3] ?? 1);
    case 'binompdf': return binomialPdf(args[0], args[1], args[2]);
    case 'binomcdf': return binomialCdf(args[0], args[1], args[2]);
    case 'poissonpdf': return poissonPdf(args[0], args[1]);
    case 'mixed': return args[0] < 0 ? args[0] - Math.abs(args[1] / args[2]) : args[0] + args[1] / args[2];
    case 'poissoncdf': return poissonCdf(args[0], args[1]);
    case 'ratio': return args[1] === 0 ? NaN : args[0] / args[1] * args[2];
    default: throw new Error('Argument ERROR');
  }
}

function realRoot(degree: number, value: number): number {
  if (!Number.isFinite(degree) || degree === 0) throw new Error('Math ERROR');
  if (value >= 0) return Math.pow(value, 1 / degree);
  if (!Number.isInteger(degree) || Math.abs(degree % 2) !== 1) throw new Error('Math ERROR');
  return -Math.pow(-value, 1 / degree);
}

function degreesToAngleUnit(value: number, mode: AngleMode): number {
  if (mode === 'RAD') return value * Math.PI / 180;
  if (mode === 'GRAD') return value * 10 / 9;
  return value;
}

function callSpecialFunction(name: string, args: Node[], ctx: EvaluationContext): number {
  const fn = name.toLowerCase();
  if (fn === 'd' || fn === 'dx') {
    if (args.length < 2) throw new Error('Argument ERROR');
    const x0 = evalNode(args[1], ctx);
    const h = Math.max(1e-5, Math.abs(x0) * 1e-6);
    return (evalWithX(args[0], x0 + h, ctx) - evalWithX(args[0], x0 - h, ctx)) / (2 * h);
  }
  if (fn === 'integral') {
    if (args.length < 3) throw new Error('Argument ERROR');
    const a = evalNode(args[1], ctx);
    const b = evalNode(args[2], ctx);
    const n = 512;
    const h = (b - a) / n;
    let sum = evalWithX(args[0], a, ctx) + evalWithX(args[0], b, ctx);
    for (let i = 1; i < n; i++) sum += evalWithX(args[0], a + i * h, ctx) * (i % 2 === 0 ? 2 : 4);
    return sum * h / 3;
  }
  if (fn === 'sum') {
    if (args.length < 3) throw new Error('Argument ERROR');
    const start = Math.trunc(evalNode(args[1], ctx));
    const end = Math.trunc(evalNode(args[2], ctx));
    let total = 0;
    for (let x = start; x <= end; x++) total += evalWithX(args[0], x, ctx);
    return total;
  }
  if (fn === 'solve') {
    if (args.length < 1) throw new Error('Argument ERROR');
    let x = args[1] ? evalNode(args[1], ctx) : 1;
    for (let i = 0; i < 60; i++) {
      const y = evalWithX(args[0], x, ctx);
      if (Math.abs(y) < 1e-10) return x;
      const h = Math.max(1e-6, Math.abs(x) * 1e-6);
      const slope = (evalWithX(args[0], x + h, ctx) - evalWithX(args[0], x - h, ctx)) / (2 * h);
      if (Math.abs(slope) < 1e-14) break;
      x -= y / slope;
    }
    return x;
  }
  throw new Error('Argument ERROR');
}

function evalWithX(node: Node, x: number, ctx: EvaluationContext): number {
  return evalNode(node, { ...ctx, variables: { ...ctx.variables, X: x } });
}

export function evaluateExpression(input: string, ctx: EvaluationContext): EvalResult {
  if (!input.trim()) return { success: true, value: 0, displayText: '0' };
  try {
    const statements = completeParentheses(input).split(':').map(part => part.trim()).filter(Boolean);
    let value = 0;
    let displayText = '';
    for (const statement of statements) {
      const normalized = normalizeInput(statement);
      if (/^pol\(/i.test(normalized)) {
        const args = evaluateArgs(normalized, ctx);
        const r = Math.hypot(args[0], args[1]);
        const theta = Math.atan2(args[1], args[0]) * fromRadFactor(ctx.angleMode);
        value = r;
        displayText = `r=${formatCasioValue(r)}, theta=${formatCasioValue(theta)}`;
        continue;
      }
      if (/^rec\(/i.test(normalized)) {
        const args = evaluateArgs(normalized, ctx);
        const theta = args[1] * toRadFactor(ctx.angleMode);
        const x = args[0] * Math.cos(theta);
        const y = args[0] * Math.sin(theta);
        value = x;
        displayText = `x=${formatCasioValue(x)}, y=${formatCasioValue(y)}`;
        continue;
      }
      if (/\bremainder\b/i.test(normalized)) {
        const [leftRaw, rightRaw] = normalized.split(/\bremainder\b/i);
        const left = evalNode(new Parser(tokenize(leftRaw)).parse(), ctx);
        const right = evalNode(new Parser(tokenize(rightRaw)).parse(), ctx);
        if (right === 0) throw new Error('Math ERROR');
        const quotient = Math.trunc(left / right);
        const remainder = left - quotient * right;
        value = remainder;
        displayText = `Q=${formatCasioValue(quotient)}, R=${formatCasioValue(remainder)}`;
        continue;
      }
      value = evalNode(new Parser(tokenize(statement)).parse(), ctx);
      displayText = formatCasioValue(value);
    }
    if (!Number.isFinite(value)) throw new Error('Math ERROR');
    if (displayText === '1' && /(?:=|==|!=|<|>|<=|>=)/.test(input)) displayText = 'True';
    if (displayText === '0' && /(?:=|==|!=|<|>|<=|>=)/.test(input)) displayText = 'False';
    return { success: true, value, displayText };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Syntax ERROR';
    const errorType = ['Math ERROR', 'Argument ERROR', 'Dimension ERROR', 'Range ERROR'].includes(message)
      ? message as EvalResult['errorType']
      : 'Syntax ERROR';
    return { success: false, value: 0, displayText: errorType || 'Syntax ERROR', errorType };
  }
}

export function solveForVariable(input: string, variable: string, ctx: EvaluationContext, guess?: number): SolveResult {
  const target = variable.toUpperCase();
  try {
    if (!new RegExp(`\\b${target}\\b`, 'i').test(input)) throw new Error('Variable ERROR');
    const equation = input.includes('=') ? input : `${input}=0`;
    const [left, ...rightParts] = equation.split('=');
    if (!left || rightParts.length !== 1 || !rightParts[0]) throw new Error('Syntax ERROR');
    const residual = `(${left})-(${rightParts[0]})`;
    const center = Number.isFinite(guess)
      ? Number(guess)
      : Number.isFinite(ctx.variables[target])
        ? ctx.variables[target]
        : Number.isFinite(ctx.ans)
          ? ctx.ans
          : 0;
    const roots: number[] = [];
    const addRoot = (root: number) => {
      if (!Number.isFinite(root)) return;
      const normalized = Math.abs(root) < 1e-12 ? 0 : root;
      if (!roots.some(existing => Math.abs(existing - normalized) <= 1e-7 * Math.max(1, Math.abs(existing)))) {
        roots.push(normalized);
      }
    };

    const samples = new Set<number>([center, 0]);
    for (const span of [1, 10, 100, 1000, 1e4, 1e6]) {
      const step = span / 32;
      for (let index = -32; index <= 32; index++) samples.add(center + index * step);
    }
    const sortedSamples = [...samples].sort((a, b) => a - b);
    let previousX: number | undefined;
    let previousY: number | undefined;
    for (const x of sortedSamples) {
      let y: number;
      try {
        y = evaluateWithVariable(residual, target, x, ctx);
      } catch {
        previousX = undefined;
        previousY = undefined;
        continue;
      }
      if (!Number.isFinite(y)) continue;
      if (Math.abs(y) < 1e-9) addRoot(x);
      if (previousX !== undefined && previousY !== undefined && y * previousY < 0) {
        addRoot(brentRoot(value => evaluateWithVariable(residual, target, value, ctx), previousX, x));
      }
      previousX = x;
      previousY = y;
    }

    for (const seed of sortedSamples) {
      const root = newtonRoot(value => evaluateWithVariable(residual, target, value, ctx), seed);
      if (root !== undefined) addRoot(root);
    }

    roots.sort((a, b) => a - b);
    if (roots.length === 0) throw new Error('No Solution');
    const first = roots[0];
    return {
      success: true,
      value: first,
      roots,
      displayText: roots.length > 1
        ? `${target}1=${formatCasioValue(first)} [1/${roots.length}]`
        : `${target}=${formatCasioValue(first)}`,
      variable: target,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Syntax ERROR';
    const errorType = ['Math ERROR', 'Argument ERROR', 'Dimension ERROR', 'Range ERROR', 'Variable ERROR', 'No Solution'].includes(message)
      ? message as EvalResult['errorType']
      : 'Syntax ERROR';
    return { success: false, value: 0, displayText: errorType || 'Syntax ERROR', errorType, variable: target };
  }
}

function newtonRoot(fn: (value: number) => number, seed: number): number | undefined {
  let x = seed;
  for (let iteration = 0; iteration < 80; iteration++) {
    const y = fn(x);
    if (!Number.isFinite(y)) return undefined;
    if (Math.abs(y) < 1e-10) return x;
    const h = Math.max(1e-6, Math.abs(x) * 1e-6);
    const slope = (fn(x + h) - fn(x - h)) / (2 * h);
    if (!Number.isFinite(slope) || Math.abs(slope) < 1e-14) return undefined;
    const next = x - y / slope;
    if (!Number.isFinite(next) || Math.abs(next) > 1e14) return undefined;
    if (Math.abs(next - x) < 1e-12 * Math.max(1, Math.abs(x))) return next;
    x = next;
  }
  return Math.abs(fn(x)) < 1e-8 ? x : undefined;
}

function brentRoot(fn: (value: number) => number, lower: number, upper: number): number {
  let a = lower;
  let b = upper;
  let fa = fn(a);
  let fb = fn(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) throw new Error('No Solution');
  for (let iteration = 0; iteration < 100; iteration++) {
    const middle = (a + b) / 2;
    const fm = fn(middle);
    if (Math.abs(fm) < 1e-11 || Math.abs(b - a) < 1e-12 * Math.max(1, Math.abs(middle))) return middle;
    if (fa * fm <= 0) {
      b = middle;
      fb = fm;
    } else {
      a = middle;
      fa = fm;
    }
  }
  return (a + b) / 2;
}
function evaluateWithVariable(input: string, variable: string, value: number, ctx: EvaluationContext): number {
  const result = evaluateExpression(input, {
    ...ctx,
    variables: { ...ctx.variables, [variable]: value },
  });
  if (!result.success) throw new Error(result.errorType || 'Syntax ERROR');
  return result.value;
}

function evaluateArgs(normalizedCall: string, ctx: EvaluationContext): number[] {
  const start = normalizedCall.indexOf('(');
  const end = normalizedCall.lastIndexOf(')');
  if (start < 0 || end < start) throw new Error('Syntax ERROR');
  return splitArgs(normalizedCall.slice(start + 1, end)).map(arg => evalNode(new Parser(tokenize(arg)).parse(), ctx));
}

function splitArgs(input: string): string[] {
  const out: string[] = [];
  let current = '';
  let depth = 0;
  for (const char of input) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

export function formatCasioValue(value: number): string {
  if (Object.is(value, -0)) return '0';
  if (!Number.isFinite(value)) return 'Math ERROR';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (Math.abs(value - Math.round(value)) < 1e-12 && abs < 1e15) return String(Math.round(value));
  if (abs >= 1e10 || abs < 1e-9) return value.toExponential(10).replace(/\.?0+e/, 'e');
  return Number(value.toPrecision(12)).toString();
}

function bigintGcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

function bigintModPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let value = base % modulus;
  let power = exponent;
  while (power > 0n) {
    if (power & 1n) result = (result * value) % modulus;
    value = (value * value) % modulus;
    power >>= 1n;
  }
  return result;
}

function isProbablePrime(value: bigint): boolean {
  if (value < 2n) return false;
  for (const prime of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (value === prime) return true;
    if (value % prime === 0n) return false;
  }
  let d = value - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  const bases = [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n];
  for (const base of bases) {
    if (base % value === 0n) continue;
    let x = bigintModPow(base, d, value);
    if (x === 1n || x === value - 1n) continue;
    let composite = true;
    for (let r = 1; r < s; r++) {
      x = (x * x) % value;
      if (x === value - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

function pollardRho(value: bigint): bigint {
  if (value % 2n === 0n) return 2n;
  if (value % 3n === 0n) return 3n;
  for (let c = 1n; c < 32n; c++) {
    let x = 2n;
    let y = 2n;
    let divisor = 1n;
    for (let iteration = 0; divisor === 1n && iteration < 200000; iteration++) {
      x = (x * x + c) % value;
      y = (y * y + c) % value;
      y = (y * y + c) % value;
      divisor = bigintGcd(x - y, value);
    }
    if (divisor > 1n && divisor < value) return divisor;
  }
  return value;
}

function collectPrimeFactors(value: bigint, factors: bigint[]) {
  if (value === 1n) return;
  if (isProbablePrime(value)) {
    factors.push(value);
    return;
  }
  const divisor = pollardRho(value);
  if (divisor === value) {
    factors.push(value);
    return;
  }
  collectPrimeFactors(divisor, factors);
  collectPrimeFactors(value / divisor, factors);
}

export function factorizeInteger(input: number | string): string {
  const normalized = String(input).trim().split('=')[0].replace(/\s+/g, '');
  if (!/^\d+$/.test(normalized)) return '';
  const value = BigInt(normalized);
  if (value <= 1n) return '';
  const rawFactors: bigint[] = [];
  collectPrimeFactors(value, rawFactors);
  rawFactors.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const grouped = new Map<bigint, number>();
  rawFactors.forEach(factor => grouped.set(factor, (grouped.get(factor) ?? 0) + 1));
  return [...grouped.entries()]
    .map(([prime, power]) => power === 1 ? String(prime) : `${prime}^${power}`)
    .join(' x ');
}

export function convertUnit(current: number, key: string): string | undefined {
  const item = UNIT_CONVERSIONS.find(entry => entry.key === key);
  if (!item) return undefined;
  return formatCasioValue(current * item.factor + item.offset);
}

export function toBaseN(value: number, base: 2 | 8 | 10 | 16): string {
  if (!Number.isInteger(value)) throw new Error('Math ERROR');
  return value.toString(base).toUpperCase();
}

export function complexAdd(a: ComplexValue, b: ComplexValue): ComplexValue {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexMul(a: ComplexValue, b: ComplexValue): ComplexValue {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function complexAbs(a: ComplexValue): number {
  return Math.hypot(a.re, a.im);
}

export function determinant(matrix: number[][]): number {
  if (matrix.length === 0 || matrix.some(row => row.length !== matrix.length)) throw new Error('Dimension ERROR');
  if (matrix.length === 1) return matrix[0][0];
  if (matrix.length === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  return matrix[0].reduce((sum, value, col) => {
    const minor = matrix.slice(1).map(row => row.filter((_, i) => i !== col));
    return sum + (col % 2 === 0 ? 1 : -1) * value * determinant(minor);
  }, 0);
}

export function transpose(matrix: number[][]): number[][] {
  if (!matrix.length) return [];
  return matrix[0].map((_, col) => matrix.map(row => row[col]));
}

export function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Dimension ERROR');
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[], sample = true): number {
  const avg = mean(values);
  const divisor = values.length - (sample ? 1 : 0);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / divisor);
}

function toRadFactor(mode: AngleMode): number {
  if (mode === 'RAD') return 1;
  if (mode === 'GRAD') return Math.PI / 200;
  return Math.PI / 180;
}

function fromRadFactor(mode: AngleMode): number {
  if (mode === 'RAD') return 1;
  if (mode === 'GRAD') return 200 / Math.PI;
  return 180 / Math.PI;
}

function factorial(value: number): number {
  if (value < 0 || !Number.isInteger(value) || value > 170) throw new Error('Math ERROR');
  let out = 1;
  for (let i = 2; i <= value; i++) out *= i;
  return out;
}

function nPr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
  return factorial(n) / factorial(n - r);
}

function nCr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function ranInt(a: number, b: number): number {
  const min = Math.ceil(Math.min(a, b));
  const max = Math.floor(Math.max(a, b));
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundCasio(value: number): number {
  return Number(value.toPrecision(10));
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x;
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b));
}

function normalPdf(x: number, meanValue: number, sd: number): number {
  if (sd <= 0) throw new Error('Math ERROR');
  const z = (x - meanValue) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

function normalCdf(lower: number, upper: number, meanValue: number, sd: number): number {
  if (sd <= 0) throw new Error('Math ERROR');
  return 0.5 * (erf((upper - meanValue) / (sd * Math.SQRT2)) - erf((lower - meanValue) / (sd * Math.SQRT2)));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return sign * y;
}

function binomialPdf(x: number, n: number, p: number): number {
  if (!Number.isInteger(x) || !Number.isInteger(n) || x < 0 || n < 0 || x > n || p < 0 || p > 1) throw new Error('Math ERROR');
  return nCr(n, x) * p ** x * (1 - p) ** (n - x);
}

function binomialCdf(x: number, n: number, p: number): number {
  let sum = 0;
  for (let k = 0; k <= Math.floor(x); k++) sum += binomialPdf(k, n, p);
  return sum;
}

function poissonPdf(x: number, lambda: number): number {
  if (!Number.isInteger(x) || x < 0 || lambda <= 0) throw new Error('Math ERROR');
  return Math.exp(-lambda) * lambda ** x / factorial(x);
}

function poissonCdf(x: number, lambda: number): number {
  let sum = 0;
  for (let k = 0; k <= Math.floor(x); k++) sum += poissonPdf(k, lambda);
  return sum;
}
