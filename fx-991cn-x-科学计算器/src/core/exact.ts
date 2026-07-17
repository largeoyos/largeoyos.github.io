export type Rational = {
  numerator: bigint;
  denominator: bigint;
};

export type ExactReal = {
  kind: 'exact-real';
  rational: Rational;
  radical: Rational;
  radicand: bigint;
};

export type ExactComplex = {
  kind: 'exact-complex';
  real: ExactReal;
  imaginary: ExactReal;
};

export type ExactValue = ExactReal | ExactComplex;

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function bigintGcd(left: bigint, right: bigint): bigint {
  let a = absBigInt(left);
  let b = absBigInt(right);
  while (b !== 0n) [a, b] = [b, a % b];
  return a || 1n;
}

export function rational(numerator: bigint | number, denominator: bigint | number = 1n): Rational {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new Error('Math ERROR');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const divisor = bigintGcd(n, d);
  return { numerator: n / divisor, denominator: d / divisor };
}

export function rationalFromDecimal(raw: string): Rational | undefined {
  const normalized = raw.trim();
  const match = normalized.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
  if (!match) return undefined;
  const sign = match[1] === '-' ? -1n : 1n;
  const decimals = match[3] ?? '';
  const exponent = Number(match[4] ?? 0) - decimals.length;
  const digits = BigInt(`${match[2]}${decimals}` || '0') * sign;
  if (exponent >= 0) return rational(digits * 10n ** BigInt(exponent));
  return rational(digits, 10n ** BigInt(-exponent));
}

export function addRational(left: Rational, right: Rational): Rational {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function subtractRational(left: Rational, right: Rational): Rational {
  return addRational(left, rational(-right.numerator, right.denominator));
}

export function multiplyRational(left: Rational, right: Rational): Rational {
  return rational(left.numerator * right.numerator, left.denominator * right.denominator);
}

export function divideRational(left: Rational, right: Rational): Rational {
  if (right.numerator === 0n) throw new Error('Math ERROR');
  return rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

export function negateRational(value: Rational): Rational {
  return rational(-value.numerator, value.denominator);
}

export function rationalToNumber(value: Rational): number {
  return Number(value.numerator) / Number(value.denominator);
}

export function isIntegerRational(value: Rational): boolean {
  return value.denominator === 1n;
}

export function exactRational(value: Rational): ExactReal {
  return { kind: 'exact-real', rational: value, radical: rational(0n), radicand: 1n };
}

function integerSquareRoot(value: bigint): bigint {
  if (value < 0n) throw new Error('Math ERROR');
  if (value < 2n) return value;
  let x = 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  let next = (x + value / x) >> 1n;
  while (next < x) {
    x = next;
    next = (x + value / x) >> 1n;
  }
  return x;
}

function extractSquareFactor(value: bigint): { outside: bigint; inside: bigint } {
  if (value === 0n) return { outside: 0n, inside: 1n };
  const root = integerSquareRoot(value);
  if (root * root === value) return { outside: root, inside: 1n };
  let remaining = value;
  let outside = 1n;
  for (let factor = 2n; factor * factor <= remaining; factor += factor === 2n ? 1n : 2n) {
    let count = 0;
    while (remaining % factor === 0n) {
      remaining /= factor;
      count++;
    }
    if (count >= 2) outside *= factor ** BigInt(Math.floor(count / 2));
    if (count % 2 === 1) remaining *= factor;
  }
  const inside = value / (outside * outside);
  return { outside, inside };
}

export function sqrtRational(value: Rational): ExactReal | undefined {
  if (value.numerator < 0n) return undefined;
  if (value.numerator === 0n) return exactRational(rational(0n));
  const combined = value.numerator * value.denominator;
  const { outside, inside } = extractSquareFactor(combined);
  if (inside === 1n) return exactRational(rational(outside, value.denominator));
  return normalizeReal({
    kind: 'exact-real',
    rational: rational(0n),
    radical: rational(outside, value.denominator),
    radicand: inside,
  });
}

function normalizeReal(value: ExactReal): ExactReal {
  if (value.radical.numerator === 0n || value.radicand === 1n) {
    const folded = value.radicand === 1n
      ? addRational(value.rational, value.radical)
      : value.rational;
    return exactRational(folded);
  }
  return value;
}

function compatibleRadicand(left: ExactReal, right: ExactReal): bigint | undefined {
  if (left.radical.numerator === 0n) return right.radicand;
  if (right.radical.numerator === 0n) return left.radicand;
  return left.radicand === right.radicand ? left.radicand : undefined;
}

export function addExactReal(left: ExactReal, right: ExactReal): ExactReal | undefined {
  const radicand = compatibleRadicand(left, right);
  if (radicand === undefined) return undefined;
  return normalizeReal({
    kind: 'exact-real',
    rational: addRational(left.rational, right.rational),
    radical: addRational(left.radical, right.radical),
    radicand,
  });
}

export function negateExactReal(value: ExactReal): ExactReal {
  return {
    kind: 'exact-real',
    rational: negateRational(value.rational),
    radical: negateRational(value.radical),
    radicand: value.radicand,
  };
}

export function subtractExactReal(left: ExactReal, right: ExactReal): ExactReal | undefined {
  return addExactReal(left, negateExactReal(right));
}

export function multiplyExactReal(left: ExactReal, right: ExactReal): ExactReal | undefined {
  const radicand = compatibleRadicand(left, right);
  if (radicand === undefined) return undefined;
  const rationalPart = addRational(
    multiplyRational(left.rational, right.rational),
    multiplyRational(multiplyRational(left.radical, right.radical), rational(radicand)),
  );
  const radicalPart = addRational(
    multiplyRational(left.rational, right.radical),
    multiplyRational(left.radical, right.rational),
  );
  return normalizeReal({ kind: 'exact-real', rational: rationalPart, radical: radicalPart, radicand });
}

export function divideExactReal(left: ExactReal, right: ExactReal): ExactReal | undefined {
  if (right.radical.numerator === 0n) {
    return normalizeReal({
      kind: 'exact-real',
      rational: divideRational(left.rational, right.rational),
      radical: divideRational(left.radical, right.rational),
      radicand: left.radicand,
    });
  }
  const radicand = compatibleRadicand(left, right);
  if (radicand === undefined) return undefined;
  const denominator = subtractRational(
    multiplyRational(right.rational, right.rational),
    multiplyRational(multiplyRational(right.radical, right.radical), rational(radicand)),
  );
  if (denominator.numerator === 0n) return undefined;
  const conjugate = { ...right, radical: negateRational(right.radical) };
  const numerator = multiplyExactReal(left, conjugate);
  if (!numerator) return undefined;
  return normalizeReal({
    kind: 'exact-real',
    rational: divideRational(numerator.rational, denominator),
    radical: divideRational(numerator.radical, denominator),
    radicand,
  });
}

export function exactRealToNumber(value: ExactReal): number {
  return rationalToNumber(value.rational)
    + rationalToNumber(value.radical) * Math.sqrt(Number(value.radicand));
}

export function exactValueToNumber(value: ExactValue): number {
  return value.kind === 'exact-real' ? exactRealToNumber(value) : exactRealToNumber(value.real);
}

export function rationalFromExact(value: ExactValue | undefined): Rational | undefined {
  if (!value || value.kind !== 'exact-real' || value.radical.numerator !== 0n) return undefined;
  return value.rational;
}

export function exactPower(base: ExactReal, exponent: number): ExactReal | undefined {
  if (!Number.isInteger(exponent) || Math.abs(exponent) > 1000) return undefined;
  if (exponent === 0) return exactRational(rational(1n));
  const positive = Math.abs(exponent);
  let result = exactRational(rational(1n));
  let factor = base;
  let power = positive;
  while (power > 0) {
    if (power % 2 === 1) {
      const multiplied = multiplyExactReal(result, factor);
      if (!multiplied) return undefined;
      result = multiplied;
    }
    power = Math.floor(power / 2);
    if (power > 0) {
      const squared = multiplyExactReal(factor, factor);
      if (!squared) return undefined;
      factor = squared;
    }
  }
  return exponent < 0 ? divideExactReal(exactRational(rational(1n)), result) : result;
}

export function quadraticExactRoots(coefficients: [Rational, Rational, Rational]): ExactValue[] {
  const [a, b, c] = coefficients;
  if (a.numerator === 0n) {
    if (b.numerator === 0n) throw new Error('Argument ERROR');
    return [exactRational(divideRational(negateRational(c), b))];
  }
  const discriminant = subtractRational(
    multiplyRational(b, b),
    multiplyRational(rational(4n), multiplyRational(a, c)),
  );
  const denominator = multiplyRational(rational(2n), a);
  const realPart = exactRational(divideRational(negateRational(b), denominator));
  if (discriminant.numerator === 0n) return [realPart];
  const negative = discriminant.numerator < 0n;
  const absoluteDiscriminant = negative
    ? rational(-discriminant.numerator, discriminant.denominator)
    : discriminant;
  const squareRoot = sqrtRational(absoluteDiscriminant);
  if (!squareRoot) throw new Error('Math ERROR');
  const scaledRoot = divideExactReal(squareRoot, exactRational(denominator));
  if (!scaledRoot) throw new Error('Math ERROR');
  if (negative) {
    return [
      { kind: 'exact-complex', real: realPart, imaginary: negateExactReal(scaledRoot) },
      { kind: 'exact-complex', real: realPart, imaginary: scaledRoot },
    ];
  }
  const minus = subtractExactReal(realPart, scaledRoot);
  const plus = addExactReal(realPart, scaledRoot);
  if (!minus || !plus) throw new Error('Math ERROR');
  return [minus, plus];
}

export function solveLinearSystemExact(
  matrix: Rational[][],
  vector: Rational[],
): { status: 'unique'; values: Rational[] } | { status: 'none' | 'infinite' } {
  const rows = matrix.length;
  if (!rows || matrix.some(row => row.length !== rows) || vector.length !== rows) {
    throw new Error('Dimension ERROR');
  }
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  let pivotRow = 0;
  for (let column = 0; column < rows && pivotRow < rows; column++) {
    const candidate = augmented.findIndex((row, index) => index >= pivotRow && row[column].numerator !== 0n);
    if (candidate < 0) continue;
    [augmented[pivotRow], augmented[candidate]] = [augmented[candidate], augmented[pivotRow]];
    const pivot = augmented[pivotRow][column];
    augmented[pivotRow] = augmented[pivotRow].map(value => divideRational(value, pivot));
    for (let row = 0; row < rows; row++) {
      if (row === pivotRow || augmented[row][column].numerator === 0n) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) =>
        subtractRational(value, multiplyRational(factor, augmented[pivotRow][index])));
    }
    pivotRow++;
  }
  const inconsistent = augmented.some(row =>
    row.slice(0, rows).every(value => value.numerator === 0n) && row[rows].numerator !== 0n);
  if (inconsistent) return { status: 'none' };
  if (pivotRow < rows) return { status: 'infinite' };
  return { status: 'unique', values: augmented.map(row => row[rows]) };
}

export function formatRational(value: Rational): string {
  return value.denominator === 1n
    ? value.numerator.toString()
    : `${value.numerator}/${value.denominator}`;
}

export function formatExactValue(value: ExactValue): string {
  if (value.kind === 'exact-complex') {
    const real = formatExactValue(value.real);
    const imaginary = formatExactValue({ ...value.imaginary, rational: rational(0n) });
    const sign = exactRealToNumber(value.imaginary) < 0 ? '-' : '+';
    const imagBody = imaginary.replace(/^-/, '') === '1' ? '' : imaginary.replace(/^-/, '');
    return value.real.rational.numerator === 0n && value.real.radical.numerator === 0n
      ? `${sign === '-' ? '-' : ''}${imagBody}i`
      : `${real}${sign}${imagBody}i`;
  }
  const { rational: plain, radical, radicand } = value;
  if (radical.numerator === 0n) return formatRational(plain);
  const sign = radical.numerator < 0n ? '-' : '+';
  const absolute = rational(absBigInt(radical.numerator), radical.denominator);
  const radicalText = `${absolute.numerator === absolute.denominator ? '' : formatRational(absolute)}√${radicand}`;
  if (plain.numerator === 0n) return `${sign === '-' ? '-' : ''}${radicalText}`;
  return `${formatRational(plain)}${sign}${radicalText}`;
}
