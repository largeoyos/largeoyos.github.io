import type { CalcMode } from './modes';

export type KeyAction =
  | { type: 'command'; value: string }
  | { type: 'insert'; value: string }
  | { type: 'noop' };

export type PhysicalKey = {
  id: string;
  normal: KeyAction;
  shift?: KeyAction;
  alpha?: KeyAction;
  mode?: Partial<Record<CalcMode, KeyAction>>;
};

const command = (value: string): KeyAction => ({ type: 'command', value });
const insert = (value: string): KeyAction => ({ type: 'insert', value });

export const PHYSICAL_KEYS: PhysicalKey[] = [
  { id: 'shift', normal: command('shift') },
  { id: 'alpha', normal: command('alpha') },
  { id: 'left', normal: command('left') },
  { id: 'right', normal: command('right') },
  { id: 'up', normal: command('up') },
  { id: 'down', normal: command('down') },
  { id: 'menu', normal: command('menu'), shift: command('setup') },
  { id: 'on', normal: command('on') },
  { id: 'optn', normal: command('optn') },
  { id: 'calc', normal: command('calc'), shift: command('solve'), alpha: insert('=') },
  { id: 'integral', normal: insert('∫dx'), shift: insert('d/dx'), alpha: insert(':') },
  { id: 'variable-x', normal: insert('X'), shift: insert('Σ') },
  { id: 'fraction', normal: insert('/'), shift: insert('■ ▭/▭'), alpha: insert('÷R') },
  { id: 'root', normal: insert('√('), shift: insert('³√(') },
  { id: 'square', normal: insert('²'), shift: insert('³'), mode: { 'Base-N': command('base-dec') } },
  { id: 'power', normal: insert('^('), shift: insert('■√■'), mode: { 'Base-N': command('base-hex') } },
  { id: 'log', normal: insert('log□('), shift: insert('10^'), mode: { 'Base-N': command('base-bin') } },
  { id: 'ln', normal: insert('ln('), shift: insert('e^'), mode: { 'Base-N': command('base-oct') } },
  { id: 'negative', normal: insert('-'), shift: insert('log('), alpha: insert('A') },
  { id: 'dms', normal: insert('°'), shift: command('factor'), alpha: insert('B') },
  { id: 'reciprocal', normal: insert('⁻¹'), shift: insert('!'), alpha: insert('C') },
  { id: 'sin', normal: insert('sin('), shift: insert('sin⁻¹('), alpha: insert('D') },
  { id: 'cos', normal: insert('cos('), shift: insert('cos⁻¹('), alpha: insert('E') },
  { id: 'tan', normal: insert('tan('), shift: insert('tan⁻¹('), alpha: insert('F') },
  { id: 'sto', normal: command('store'), shift: command('recall') },
  { id: 'eng', normal: command('eng'), shift: command('eng-left'), alpha: insert('i'), mode: { Complex: insert('i') } },
  { id: 'left-paren', normal: insert('('), shift: insert('Abs(') },
  { id: 'right-paren', normal: insert(')'), shift: insert(','), alpha: insert('X') },
  { id: 'sd', normal: command('sd'), alpha: insert('Y') },
  { id: 'mplus', normal: command('mplus'), shift: command('mminus'), alpha: insert('M') },
  { id: 'digit-7', normal: insert('7'), shift: command('constants') },
  { id: 'digit-8', normal: insert('8'), shift: command('conversion') },
  { id: 'digit-9', normal: insert('9'), shift: command('reset') },
  { id: 'del', normal: command('delete') },
  { id: 'ac', normal: command('clear'), shift: command('off') },
  { id: 'digit-4', normal: insert('4') },
  { id: 'digit-5', normal: insert('5') },
  { id: 'digit-6', normal: insert('6') },
  { id: 'multiply', normal: insert('×'), shift: insert(' P ') },
  { id: 'divide', normal: insert('÷'), shift: insert(' C ') },
  { id: 'digit-1', normal: insert('1') },
  { id: 'digit-2', normal: insert('2') },
  { id: 'digit-3', normal: insert('3') },
  { id: 'plus', normal: insert('+'), shift: insert('Pol(') },
  { id: 'minus', normal: insert('-'), shift: insert('Rec(') },
  { id: 'digit-0', normal: insert('0'), shift: insert('Rnd(') },
  { id: 'decimal', normal: insert('.'), shift: insert('Ran#'), alpha: insert('RanInt(') },
  { id: 'scientific', normal: insert('E'), shift: insert('π'), alpha: insert('e') },
  { id: 'ans', normal: insert('Ans'), shift: insert('%') },
  { id: 'equals', normal: command('evaluate'), shift: command('approximate') },
];

export function resolveKeyAction(
  id: string,
  mode: CalcMode,
  layer: 'normal' | 'shift' | 'alpha' = 'normal',
): KeyAction {
  const key = PHYSICAL_KEYS.find(item => item.id === id);
  if (!key) return { type: 'noop' };
  if (layer === 'normal' && key.mode?.[mode]) return key.mode[mode] as KeyAction;
  return key[layer] ?? { type: 'noop' };
}
