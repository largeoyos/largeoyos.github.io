export type ScientificConstantCategory =
  | '通用常数'
  | '电磁常数'
  | '原子与核常数'
  | '物理化学常数'
  | '采用值'
  | '其他';

export type ScientificConstant = {
  id: string;
  symbol: string;
  name: string;
  value: number;
  unit: string;
  category: ScientificConstantCategory;
  source: 'CODATA 2022' | 'adopted';
};

const constant = (
  id: string,
  symbol: string,
  name: string,
  value: number,
  unit: string,
  category: ScientificConstantCategory,
  source: ScientificConstant['source'] = 'CODATA 2022',
): ScientificConstant => ({ id, symbol, name, value, unit, category, source });

export const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  constant('h', 'h', '普朗克常数', 6.62607015e-34, 'J·s', '通用常数'),
  constant('hbar', 'ℏ', '约化普朗克常数', 1.054571817e-34, 'J·s', '通用常数'),
  constant('c', 'c', '真空光速', 299792458, 'm·s⁻¹', '通用常数'),
  constant('epsilon0', 'ε₀', '真空介电常数', 8.8541878188e-12, 'F·m⁻¹', '通用常数'),
  constant('mu0', 'μ₀', '真空磁导率', 1.25663706127e-6, 'N·A⁻²', '通用常数'),
  constant('z0', 'Z₀', '真空特性阻抗', 376.730313412, 'Ω', '通用常数'),
  constant('bigG', 'G', '万有引力常数', 6.67430e-11, 'm³·kg⁻¹·s⁻²', '通用常数'),
  constant('lp', 'lP', '普朗克长度', 1.616255e-35, 'm', '通用常数'),
  constant('tp', 'tP', '普朗克时间', 5.391247e-44, 's', '通用常数'),
  constant('muN', 'μN', '核磁子', 5.0507837393e-27, 'J·T⁻¹', '电磁常数'),
  constant('muB', 'μB', '玻尔磁子', 9.2740100657e-24, 'J·T⁻¹', '电磁常数'),
  constant('elementaryCharge', 'e', '元电荷', 1.602176634e-19, 'C', '电磁常数'),
  constant('phi0', 'Φ₀', '磁通量子', 2.067833848e-15, 'Wb', '电磁常数'),
  constant('g0', 'G₀', '电导量子', 7.748091729e-5, 'S', '电磁常数'),
  constant('kj', 'KJ', '约瑟夫森常数', 4.835978484e14, 'Hz·V⁻¹', '电磁常数'),
  constant('rk', 'RK', '冯·克里青常数', 25812.80745, 'Ω', '电磁常数'),
  constant('mp', 'mp', '质子质量', 1.67262192595e-27, 'kg', '原子与核常数'),
  constant('mn', 'mn', '中子质量', 1.67492750056e-27, 'kg', '原子与核常数'),
  constant('me', 'me', '电子质量', 9.1093837139e-31, 'kg', '原子与核常数'),
  constant('mmu', 'mμ', 'μ子质量', 1.883531627e-28, 'kg', '原子与核常数'),
  constant('a0', 'a₀', '玻尔半径', 5.29177210544e-11, 'm', '原子与核常数'),
  constant('alpha', 'α', '精细结构常数', 7.2973525643e-3, '', '原子与核常数'),
  constant('re', 're', '经典电子半径', 2.8179403205e-15, 'm', '原子与核常数'),
  constant('lambdaC', 'λC', '电子康普顿波长', 2.42631023538e-12, 'm', '原子与核常数'),
  constant('gammaP', 'γp', '质子旋磁比', 2.6752218708e8, 's⁻¹·T⁻¹', '原子与核常数'),
  constant('lambdaCp', 'λCp', '质子康普顿波长', 1.3214098536e-15, 'm', '原子与核常数'),
  constant('lambdaCn', 'λCn', '中子康普顿波长', 1.31959090382e-15, 'm', '原子与核常数'),
  constant('rInfinity', 'R∞', '里德伯常数', 10973731.568157, 'm⁻¹', '原子与核常数'),
  constant('mup', 'μp', '质子磁矩', 1.41060679545e-26, 'J·T⁻¹', '原子与核常数'),
  constant('mue', 'μe', '电子磁矩', -9.2847646917e-24, 'J·T⁻¹', '原子与核常数'),
  constant('mun', 'μn', '中子磁矩', -9.6623653e-27, 'J·T⁻¹', '原子与核常数'),
  constant('mumu', 'μμ', 'μ子磁矩', -4.49044830e-26, 'J·T⁻¹', '原子与核常数'),
  constant('mtau', 'mτ', 'τ子质量', 3.16754e-27, 'kg', '原子与核常数'),
  constant('muAtomic', 'mu', '原子质量常数', 1.66053906892e-27, 'kg', '物理化学常数'),
  constant('faraday', 'F', '法拉第常数', 96485.33212, 'C·mol⁻¹', '物理化学常数'),
  constant('na', 'NA', '阿伏伽德罗常数', 6.02214076e23, 'mol⁻¹', '物理化学常数'),
  constant('boltzmann', 'k', '玻尔兹曼常数', 1.380649e-23, 'J·K⁻¹', '物理化学常数'),
  constant('vm', 'Vm', '理想气体摩尔体积', 22.71095464e-3, 'm³·mol⁻¹', '物理化学常数'),
  constant('gasR', 'R', '摩尔气体常数', 8.31446261815324, 'J·mol⁻¹·K⁻¹', '物理化学常数'),
  constant('c1', 'c₁', '第一辐射常数', 3.741771852e-16, 'W·m²', '物理化学常数'),
  constant('c2', 'c₂', '第二辐射常数', 1.438776877e-2, 'm·K', '物理化学常数'),
  constant('sigma', 'σ', '斯忒藩-玻尔兹曼常数', 5.670374419e-8, 'W·m⁻²·K⁻⁴', '物理化学常数'),
  constant('gn', 'gn', '标准重力加速度', 9.80665, 'm·s⁻²', '采用值', 'adopted'),
  constant('atm', 'atm', '标准大气压', 101325, 'Pa', '采用值', 'adopted'),
  constant('rk90', 'RK-90', '常规冯·克里青常数', 25812.807, 'Ω', '采用值', 'adopted'),
  constant('kj90', 'KJ-90', '常规约瑟夫森常数', 4.835979e14, 'Hz·V⁻¹', '采用值', 'adopted'),
  constant('celsiusZero', 't', '摄氏温标零点', 273.15, 'K', '其他', 'adopted'),
];

export const SCIENTIFIC_CONSTANT_CATEGORIES: ScientificConstantCategory[] = [
  '通用常数', '电磁常数', '原子与核常数', '物理化学常数', '采用值', '其他',
];

export function scientificConstantById(id: string): ScientificConstant | undefined {
  return SCIENTIFIC_CONSTANTS.find(item => item.id === id);
}

export type UnitConversionCategory = '长度' | '面积' | '体积' | '质量' | '速度' | '压强' | '能量' | '功率' | '温度';

export type UnitConversion = {
  id: string;
  label: string;
  category: UnitConversionCategory;
  factor: number;
  offset: number;
};

const conversion = (
  id: string,
  label: string,
  category: UnitConversionCategory,
  factor: number,
  offset = 0,
): UnitConversion => ({ id, label, category, factor, offset });

export const UNIT_CONVERSIONS: UnitConversion[] = [
  conversion('in_cm', 'in→cm', '长度', 2.54), conversion('cm_in', 'cm→in', '长度', 1 / 2.54),
  conversion('ft_m', 'ft→m', '长度', 0.3048), conversion('m_ft', 'm→ft', '长度', 1 / 0.3048),
  conversion('yd_m', 'yd→m', '长度', 0.9144), conversion('m_yd', 'm→yd', '长度', 1 / 0.9144),
  conversion('mile_km', 'mile→km', '长度', 1.609344), conversion('km_mile', 'km→mile', '长度', 1 / 1.609344),
  conversion('nmi_m', 'n mile→m', '长度', 1852), conversion('m_nmi', 'm→n mile', '长度', 1 / 1852),
  conversion('pc_km', 'pc→km', '长度', 3.0856775814913673e13), conversion('km_pc', 'km→pc', '长度', 1 / 3.0856775814913673e13),
  conversion('acre_m2', 'acre→m²', '面积', 4046.8564224), conversion('m2_acre', 'm²→acre', '面积', 1 / 4046.8564224),
  conversion('usgal_l', 'US gal→L', '体积', 3.785411784), conversion('l_usgal', 'L→US gal', '体积', 1 / 3.785411784),
  conversion('ukgal_l', 'UK gal→L', '体积', 4.54609), conversion('l_ukgal', 'L→UK gal', '体积', 1 / 4.54609),
  conversion('oz_g', 'oz→g', '质量', 28.349523125), conversion('g_oz', 'g→oz', '质量', 1 / 28.349523125),
  conversion('lb_kg', 'lb→kg', '质量', 0.45359237), conversion('kg_lb', 'kg→lb', '质量', 1 / 0.45359237),
  conversion('kmh_ms', 'km/h→m/s', '速度', 1 / 3.6), conversion('ms_kmh', 'm/s→km/h', '速度', 3.6),
  conversion('atm_pa', 'atm→Pa', '压强', 101325), conversion('pa_atm', 'Pa→atm', '压强', 1 / 101325),
  conversion('mmhg_pa', 'mmHg→Pa', '压强', 133.322387415), conversion('pa_mmhg', 'Pa→mmHg', '压强', 1 / 133.322387415),
  conversion('kgfcm2_pa', 'kgf/cm²→Pa', '压强', 98066.5), conversion('pa_kgfcm2', 'Pa→kgf/cm²', '压强', 1 / 98066.5),
  conversion('psi_kpa', 'lbf/in²→kPa', '压强', 6.894757293168), conversion('kpa_psi', 'kPa→lbf/in²', '压强', 1 / 6.894757293168),
  conversion('kgfm_j', 'kgf·m→J', '能量', 9.80665), conversion('j_kgfm', 'J→kgf·m', '能量', 1 / 9.80665),
  conversion('j_cal15', 'J→cal₁₅', '能量', 1 / 4.1855), conversion('cal15_j', 'cal₁₅→J', '能量', 4.1855),
  conversion('hp_kw', 'hp→kW', '功率', 0.7456998715822702), conversion('kw_hp', 'kW→hp', '功率', 1 / 0.7456998715822702),
  conversion('f_c', '°F→°C', '温度', 5 / 9, -160 / 9), conversion('c_f', '°C→°F', '温度', 9 / 5, 32),
];

export const UNIT_CONVERSION_CATEGORIES: UnitConversionCategory[] = [
  '长度', '面积', '体积', '质量', '速度', '压强', '能量', '功率', '温度',
];

export function unitConversionById(id: string): UnitConversion | undefined {
  return UNIT_CONVERSIONS.find(item => item.id === id);
}

export function applyUnitConversion(value: number, id: string): number {
  const item = unitConversionById(id);
  if (!item) throw new Error('Argument ERROR');
  return value * item.factor + item.offset;
}

export type CatalogInsert = { label: string; insert: string };

export const ADVANCED_CATALOG: Array<{ label: string; items: CatalogInsert[] }> = [
  { label: '函数分析', items: [
    { label: '数值导数', insert: 'd/dx' }, { label: '定积分', insert: '∫dx' }, { label: '求和', insert: 'Σ' },
    { label: '任意底对数', insert: 'log□(' }, { label: '常用对数', insert: 'log(' }, { label: '自然对数', insert: 'ln(' },
  ] },
  { label: '概率', items: [
    { label: '百分数', insert: '%' }, { label: '阶乘', insert: '!' }, { label: '排列', insert: ' P ' },
    { label: '组合', insert: ' C ' }, { label: '随机数', insert: 'Ran#' }, { label: '随机整数', insert: 'RanInt(' },
  ] },
  { label: '数值计算', items: [
    { label: '最大公约数', insert: 'gcd(' }, { label: '最小公倍数', insert: 'lcm(' }, { label: '绝对值', insert: 'Abs(' },
    { label: '循环小数', insert: 'recur(' }, { label: '舍入', insert: 'Rnd(' },
  ] },
  { label: '角度与坐标', items: [
    { label: '度', insert: '°' }, { label: '弧度', insert: 'ʳ' }, { label: '百分度', insert: 'ᵍ' },
    { label: '直角转极坐标', insert: 'Pol(' }, { label: '极坐标转直角', insert: 'Rec(' },
    { label: '度分秒输入', insert: 'dms(' }, { label: '转度分秒', insert: 'todms(' },
  ] },
  { label: '双曲与三角', items: [
    { label: '正弦', insert: 'sin(' }, { label: '余弦', insert: 'cos(' }, { label: '正切', insert: 'tan(' },
    { label: '反正弦', insert: 'sin⁻¹(' }, { label: '反余弦', insert: 'cos⁻¹(' }, { label: '反正切', insert: 'tan⁻¹(' },
    { label: '双曲正弦', insert: 'sinh(' }, { label: '双曲余弦', insert: 'cosh(' }, { label: '双曲正切', insert: 'tanh(' },
    { label: '反双曲正弦', insert: 'asinh(' }, { label: '反双曲余弦', insert: 'acosh(' }, { label: '反双曲正切', insert: 'atanh(' },
  ] },
  { label: '其他', items: [
    { label: '上次结果', insert: 'Ans' }, { label: '圆周率', insert: 'π' }, { label: '自然常数', insert: 'e' },
    { label: '平方根', insert: '√(' }, { label: '任意次根', insert: '■√■' }, { label: '倒数', insert: '⁻¹' },
    { label: '平方', insert: '²' }, { label: '幂', insert: '^(' }, { label: '负号', insert: '-' },
    { label: '逗号', insert: ',' }, { label: '左括号', insert: '(' }, { label: '右括号', insert: ')' },
  ] },
];
