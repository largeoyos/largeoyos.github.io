import type { AngleMode, NumberFormat, ResultMode } from './calculator';

export type InputOutputMode = 'MathI/MathO' | 'MathI/DecimalO' | 'LineI/LineO' | 'LineI/DecimalO';
export type FractionResultMode = 'mixed' | 'improper';
export type ComplexResultMode = 'rectangular' | 'polar';
export type TableDisplayMode = 'f' | 'fg';
export type DecimalPointMode = 'dot' | 'comma';
export type MultilineFontMode = 'normal' | 'small';
export type CalculatorLanguage = 'zh' | 'en';
export type InputEditMode = 'insert' | 'overwrite';

export type CalculatorPreferences = {
  version: 4;
  inputOutput: InputOutputMode;
  angleMode: AngleMode;
  numberFormat: NumberFormat;
  engineeringSymbols: boolean;
  fractionResult: FractionResultMode;
  complexResult: ComplexResultMode;
  statisticsFrequency: boolean;
  equationComplexRoots: boolean;
  tableMode: TableDisplayMode;
  decimalPoint: DecimalPointMode;
  digitSeparator: boolean;
  multilineFont: MultilineFontMode;
  inputEditMode: InputEditMode;
  language: CalculatorLanguage;
  contrast: number;
  resultMode: ResultMode;
};

export const DEFAULT_PREFERENCES: CalculatorPreferences = {
  version: 4,
  inputOutput: 'MathI/MathO',
  angleMode: 'DEG',
  numberFormat: { kind: 'Norm1' },
  engineeringSymbols: false,
  fractionResult: 'improper',
  complexResult: 'rectangular',
  statisticsFrequency: false,
  equationComplexRoots: true,
  tableMode: 'fg',
  decimalPoint: 'dot',
  digitSeparator: false,
  multilineFont: 'normal',
  inputEditMode: 'insert',
  language: 'zh',
  contrast: 0,
  resultMode: 'exact',
};

const inputOutputModes = new Set<InputOutputMode>([
  'MathI/MathO',
  'MathI/DecimalO',
  'LineI/LineO',
  'LineI/DecimalO',
]);

function validNumberFormat(value: unknown): NumberFormat {
  if (!value || typeof value !== 'object') return DEFAULT_PREFERENCES.numberFormat;
  const candidate = value as Partial<NumberFormat>;
  if (candidate.kind === 'Norm1' || candidate.kind === 'Norm2') return { kind: candidate.kind };
  if (candidate.kind === 'Fix' && Number.isInteger(candidate.digits)) {
    return { kind: 'Fix', digits: Math.max(0, Math.min(9, Number(candidate.digits))) };
  }
  if (candidate.kind === 'Sci' && Number.isInteger(candidate.digits)) {
    return { kind: 'Sci', digits: Math.max(1, Math.min(10, Number(candidate.digits))) };
  }
  return DEFAULT_PREFERENCES.numberFormat;
}

export function parseCalculatorPreferences(raw: string | null | undefined): CalculatorPreferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    const value = JSON.parse(raw) as Partial<CalculatorPreferences>;
    const preferences: CalculatorPreferences = {
      ...DEFAULT_PREFERENCES,
      ...value,
      version: 4,
      numberFormat: validNumberFormat(value.numberFormat),
    };
    if (!inputOutputModes.has(preferences.inputOutput)) preferences.inputOutput = DEFAULT_PREFERENCES.inputOutput;
    if (!['DEG', 'RAD', 'GRAD'].includes(preferences.angleMode)) preferences.angleMode = 'DEG';
    if (!['mixed', 'improper'].includes(preferences.fractionResult)) preferences.fractionResult = 'improper';
    if (!['rectangular', 'polar'].includes(preferences.complexResult)) preferences.complexResult = 'rectangular';
    if (!['f', 'fg'].includes(preferences.tableMode)) preferences.tableMode = 'fg';
    if (!['dot', 'comma'].includes(preferences.decimalPoint)) preferences.decimalPoint = 'dot';
    if (!['normal', 'small'].includes(preferences.multilineFont)) preferences.multilineFont = 'normal';
    if (!['insert', 'overwrite'].includes(preferences.inputEditMode)) preferences.inputEditMode = 'insert';
    if (!['zh', 'en'].includes(preferences.language)) preferences.language = 'zh';
    if (!['exact', 'decimal'].includes(preferences.resultMode)) preferences.resultMode = 'exact';
    preferences.contrast = Math.max(-2, Math.min(2, Math.trunc(Number(preferences.contrast) || 0)));
    preferences.engineeringSymbols = Boolean(preferences.engineeringSymbols);
    preferences.statisticsFrequency = Boolean(preferences.statisticsFrequency);
    preferences.equationComplexRoots = preferences.equationComplexRoots !== false;
    preferences.digitSeparator = Boolean(preferences.digitSeparator);
    return preferences;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export type SetupPage =
  | 'root'
  | 'input-output'
  | 'angle'
  | 'number-format'
  | 'fix'
  | 'sci'
  | 'engineering-symbol'
  | 'fraction-result'
  | 'complex-result'
  | 'statistics-frequency'
  | 'equation-roots'
  | 'table-mode'
  | 'decimal-point'
  | 'digit-separator'
  | 'multiline-font'
  | 'input-edit-mode'
  | 'language'
  | 'contrast'
  | 'result-mode';

export const SETUP_ROOT_ITEMS: ReadonlyArray<{ page: Exclude<SetupPage, 'root' | 'fix' | 'sci'>; label: string }> = [
  { page: 'input-output', label: '输入/输出' },
  { page: 'angle', label: '角度单位' },
  { page: 'number-format', label: '数字格式' },
  { page: 'engineering-symbol', label: '工程符号' },
  { page: 'fraction-result', label: '分数结果' },
  { page: 'complex-result', label: '复数结果' },
  { page: 'statistics-frequency', label: '统计频数' },
  { page: 'equation-roots', label: '方程复根' },
  { page: 'table-mode', label: '表格模式' },
  { page: 'decimal-point', label: '小数点' },
  { page: 'digit-separator', label: '数字分隔符' },
  { page: 'multiline-font', label: '多行字体' },
  { page: 'input-edit-mode', label: '编辑模式' },
  { page: 'language', label: '语言' },
  { page: 'contrast', label: '对比度' },
  { page: 'result-mode', label: '默认结果' },
];

const EN_SETUP_LABELS: Record<string, string> = {
  'input-output': 'Input/Output',
  angle: 'Angle Unit',
  'number-format': 'Number Format',
  'engineering-symbol': 'Engineering Symbol',
  'fraction-result': 'Fraction Result',
  'complex-result': 'Complex Result',
  'statistics-frequency': 'Statistics Frequency',
  'equation-roots': 'Equation Roots',
  'table-mode': 'Table Mode',
  'decimal-point': 'Decimal Point',
  'digit-separator': 'Digit Separator',
  'multiline-font': 'MultiLine Font',
  'input-edit-mode': 'Input Mode',
  language: 'Language',
  contrast: 'Contrast',
  'result-mode': 'Result Display',
};

export function setupPageTitle(page: SetupPage, language: CalculatorLanguage = 'zh'): string {
  if (page === 'root') return language === 'zh' ? '设置' : 'Setup';
  if (page === 'fix') return language === 'zh' ? 'Fix 小数位' : 'Fix Digits';
  if (page === 'sci') return language === 'zh' ? 'Sci 有效位' : 'Sci Digits';
  if (language === 'en') return EN_SETUP_LABELS[page] ?? 'Setup';
  return SETUP_ROOT_ITEMS.find(item => item.page === page)?.label ?? '设置';
}

export function setupChoiceLabels(page: SetupPage, preferences: CalculatorPreferences): string[] {
  const mark = (active: boolean, label: string) => `${active ? '●' : '○'} ${label}`;
  const en = preferences.language === 'en';
  const on = en ? 'On' : '开';
  const off = en ? 'Off' : '关';
  if (page === 'root') return SETUP_ROOT_ITEMS.map(item => en ? EN_SETUP_LABELS[item.page] : item.label);
  if (page === 'input-output') return [
    mark(preferences.inputOutput === 'MathI/MathO', en ? 'Math Input/Math Output' : '数学输入/数学输出'),
    mark(preferences.inputOutput === 'MathI/DecimalO', en ? 'Math Input/Decimal Output' : '数学输入/小数输出'),
    mark(preferences.inputOutput === 'LineI/LineO', en ? 'Line Input/Line Output' : '线性输入/线性输出'),
    mark(preferences.inputOutput === 'LineI/DecimalO', en ? 'Line Input/Decimal Output' : '线性输入/小数输出'),
  ];
  if (page === 'angle') return ['DEG', 'RAD', 'GRAD'].map(value => mark(preferences.angleMode === value, value));
  if (page === 'number-format') return [
    mark(preferences.numberFormat.kind === 'Norm1', 'Norm 1'),
    mark(preferences.numberFormat.kind === 'Norm2', 'Norm 2'),
    mark(preferences.numberFormat.kind === 'Fix', 'Fix 0–9'),
    mark(preferences.numberFormat.kind === 'Sci', 'Sci 1–10'),
  ];
  if (page === 'fix') return Array.from({ length: 10 }, (_, index) => mark(preferences.numberFormat.kind === 'Fix' && preferences.numberFormat.digits === index, String(index)));
  if (page === 'sci') return Array.from({ length: 10 }, (_, index) => mark(preferences.numberFormat.kind === 'Sci' && preferences.numberFormat.digits === index + 1, String(index + 1)));
  if (page === 'engineering-symbol') return [mark(preferences.engineeringSymbols, on), mark(!preferences.engineeringSymbols, off)];
  if (page === 'fraction-result') return [mark(preferences.fractionResult === 'mixed', en ? 'Mixed Fraction' : '带分数'), mark(preferences.fractionResult === 'improper', en ? 'Improper Fraction' : '假分数')];
  if (page === 'complex-result') return [mark(preferences.complexResult === 'rectangular', 'a+bi'), mark(preferences.complexResult === 'polar', 'r∠θ')];
  if (page === 'statistics-frequency') return [mark(preferences.statisticsFrequency, on), mark(!preferences.statisticsFrequency, off)];
  if (page === 'equation-roots') return [mark(preferences.equationComplexRoots, en ? 'Complex Roots: On' : '复根：开'), mark(!preferences.equationComplexRoots, en ? 'Complex Roots: Off' : '复根：关')];
  if (page === 'table-mode') return [mark(preferences.tableMode === 'f', en ? 'f(x) only' : '仅 f(x)'), mark(preferences.tableMode === 'fg', 'f(x),g(x)')];
  if (page === 'decimal-point') return [mark(preferences.decimalPoint === 'dot', en ? 'Dot .' : '点 .'), mark(preferences.decimalPoint === 'comma', en ? 'Comma ,' : '逗号 ,')];
  if (page === 'digit-separator') return [mark(preferences.digitSeparator, on), mark(!preferences.digitSeparator, off)];
  if (page === 'multiline-font') return [mark(preferences.multilineFont === 'normal', en ? 'Normal Font' : '普通字体'), mark(preferences.multilineFont === 'small', en ? 'Small Font' : '小字体')];
  if (page === 'input-edit-mode') return [mark(preferences.inputEditMode === 'insert', en ? 'Insert' : '插入'), mark(preferences.inputEditMode === 'overwrite', en ? 'Overwrite' : '覆盖')];
  if (page === 'language') return [mark(preferences.language === 'zh', '中文'), mark(preferences.language === 'en', 'English')];
  if (page === 'contrast') return [-2, -1, 0, 1, 2].map(value => mark(preferences.contrast === value, `${en ? 'Level' : '等级'} ${value + 3}`));
  return [mark(preferences.resultMode === 'exact', en ? 'Standard/Exact' : '标准/精确'), mark(preferences.resultMode === 'decimal', en ? 'Decimal' : '小数')];
}
