/*
   Python for Economics Code Lab: ten Python activities for first-year Economics students.
   Students write lab.py; it runs in the browser (Pyodide). Each check is a Python expression
   evaluated after the student's code ran, in the student's namespace, with trusted helpers in L
   (L.np, L.pd). Every activity ends with three multiple-choice questions (a.quiz), 1 point each.

   Running case: the Mont-Royal Economics Desk, a (fictional) student research group that writes
   short economic briefs for a Montreal newspaper. Figures are rounded and approximate, for practice.
*/

/* check helpers: py('python condition', 'python expression shown under "We found" when it fails') */
const py = (cond, found) => c => c.check(cond, found);
const printed = (re, label) => c => c.ok(re.test(c.out), c.out.trim() ? label + ': ' + c.out.trim().split('\n').slice(-3).join(' | ').slice(0, 200) : 'nothing was printed');
const close = (a, b) => `abs((${a}) - (${b})) < 1e-6`;

const ACTIVITIES = [

/* ================================================================== 1. variables */
{
  id: 1, module: 'Basics', topic: 'Variables, arithmetic, f-strings', edit: 'py', art: null,
  title: 'GDP per Capita',
  story: 'Welcome to the **Mont-Royal Economics Desk**, a student research group that writes short economic briefs for a Montreal newspaper. Your first brief compares living standards, and economists start with **GDP per capita**: total output divided by the number of people. Canada produced about **$2.98 trillion** of output last year, with about **40.1 million** people. (Figures in this lab are rounded, for practice.)',
  steps: [
    { text: 'Store the two numbers in variables. Underscores make long numbers readable; Python ignores them.', code: 'gdp = 2_980_000_000_000\npopulation = 40_100_000' },
    'Compute `gdp_per_capita` as `gdp` divided by `population`.',
    { text: 'Print it with an **f-string**: `:,.2f` adds thousands separators and two decimals.', code: 'print(f"GDP per capita: ${gdp_per_capita:,.2f}")' },
    'Store the growth forecast as a decimal: `growth_rate = 0.012` (that is 1.2%).',
    'Compute `next_gdp`, next year\'s GDP if the economy grows at `growth_rate`: multiply `gdp` by `(1 + growth_rate)`.',
    { text: 'Print it with commas and no decimals:', code: 'print(f"Next year\'s GDP: ${next_gdp:,.0f}")' }
  ],
  practise: ['variables', 'arithmetic', 'f-strings', 'number formats'],
  starter: { py: String.raw`# Activity 1: GDP per capita
# ---- your code ----
# 1. GDP (in dollars) and population


# 2. GDP per capita


# 3. Print it with commas and 2 decimals


# 4. The growth rate as a decimal


# 5. Next year's GDP


# 6. Print next year's GDP with commas, no decimals

` },
  solution: { py: String.raw`# Activity 1: GDP per capita
# ---- your code ----
# 1. GDP (in dollars) and population
gdp = 2_980_000_000_000
population = 40_100_000

# 2. GDP per capita
gdp_per_capita = gdp / population

# 3. Print it with commas and 2 decimals
print(f"GDP per capita: ${"$"}{gdp_per_capita:,.2f}")

# 4. The growth rate as a decimal
growth_rate = 0.012

# 5. Next year's GDP
next_gdp = gdp * (1 + growth_rate)

# 6. Print next year's GDP with commas, no decimals
print(f"Next year's GDP: ${"$"}{next_gdp:,.0f}")
` },
  checks: [
    { text: '`gdp` is 2.98 trillion and `population` is 40.1 million', pts: 2,
      test: py('gdp == 2_980_000_000_000 and population == 40_100_000', '"gdp = " + repr(gdp) + ", population = " + repr(population)'),
      explain: 'A variable is a name for a value. Count the zeros carefully: a trillion has 12. Writing `2_980_000_000_000` (or `2.98e12`) keeps big numbers readable.',
      fix: 'gdp = 2_980_000_000_000\npopulation = 40_100_000' },
    { text: '`gdp_per_capita` is `gdp / population`', pts: 2,
      test: py(close('gdp_per_capita', '2_980_000_000_000 / 40_100_000'), '"gdp_per_capita = " + repr(gdp_per_capita)'),
      explain: '`/` is true division and always gives a float. `//` would throw away the cents (floor division), which is not what a per-person average means.',
      fix: 'gdp_per_capita = gdp / population' },
    { text: 'Prints `GDP per capita: $74,314.21`', pts: 2,
      test: printed(/GDP per capita: \$74,314\.21/, 'printed'),
      explain: 'Inside an f-string, `{value:,.2f}` formats a number: `,` adds thousands separators and `.2f` rounds to 2 decimals. The `$` before the brace is just text.',
      fix: 'print(f"GDP per capita: ${gdp_per_capita:,.2f}")' },
    { text: '`growth_rate` is 0.012 (1.2% as a decimal)', pts: 1,
      test: py(close('growth_rate', '0.012'), '"growth_rate = " + repr(growth_rate)'),
      explain: 'Economists say "1.2%", but in calculations a rate is a decimal: 1.2% = 1.2 / 100 = 0.012.',
      fix: 'growth_rate = 0.012' },
    { text: '`next_gdp` is `gdp` grown by 1.2%', pts: 2,
      test: py('abs(next_gdp - 2_980_000_000_000 * 1.012) < 1', '"next_gdp = " + format(next_gdp, ",.0f")'),
      explain: 'Growing by a rate g multiplies by `(1 + g)`: the 1 keeps this year\'s GDP and the g adds the growth. `gdp * growth_rate` would be only the increase.',
      fix: 'next_gdp = gdp * (1 + growth_rate)' },
    { text: 'Prints `Next year\'s GDP: $3,015,760,000,000`', pts: 1,
      test: printed(/Next year's GDP: \$3,015,760,000,000/, 'printed'),
      explain: '`:,.0f` rounds to a whole number and adds commas, so even a 13-digit number is easy to read.',
      fix: 'print(f"Next year\'s GDP: ${next_gdp:,.0f}")' }
  ],
  quiz: [
    { q: 'What does `7 / 2` give in Python 3?', options: ['`3`', '`3.5`', '`3.0`', '`"3.5"` (a string)'], answer: 1,
      explain: '`/` is true division and always returns a float, so `7 / 2` is `3.5`. Floor division `7 // 2` would give `3`.' },
    { q: 'Which of these is a valid Python variable name?', options: ['`2024_gdp`', '`gdp-per-capita`', '`gdp per capita`', '`gdp_per_capita`'], answer: 3,
      explain: 'Names use letters, digits and underscores, and cannot start with a digit. A hyphen means minus and a space splits the name in two.' },
    { q: 'What does this line print?', code: 'print(f"{1234567.891:,.2f}")', options: ['`1,234,567.89`', '`1234567.89`', '`1,234,568`', '`$1,234,567.89`'], answer: 0,
      explain: '`,` adds thousands separators and `.2f` keeps two decimals (rounded). There is no `$` unless you type it in the text.' }
  ]
},

/* ================================================================== 2. inflation */
{
  id: 2, module: 'Basics', topic: 'Percentage change, real vs nominal', edit: 'py', art: null,
  title: 'Inflation and Real Wages',
  story: 'Readers keep asking whether their pay rise "beat inflation". Inflation is the **percentage change in the Consumer Price Index (CPI)**. The CPI was about **151.2** in 2022 and **157.1** in 2023. A barista\'s hourly wage went from **$30.00** to **$31.20**. Did their **real** wage (what the wage can buy) go up?',
  steps: [
    'Store `cpi_2022 = 151.2` and `cpi_2023 = 157.1`.',
    { text: 'Compute `inflation` in percent, then print it with 2 decimals. The brackets matter!', code: 'inflation = (cpi_2023 - cpi_2022) / cpi_2022 * 100\nprint(f"Inflation in 2023: {inflation:.2f}%")' },
    'Store `wage_2022 = 30.00` and `wage_2023 = 31.20`, and compute `wage_growth`, the percentage change of the nominal wage (same formula).',
    { text: 'Express the 2023 wage in **2022 dollars** (remove the price increase):', code: 'real_wage_2023 = wage_2023 * cpi_2022 / cpi_2023' },
    'Compute `real_wage_growth`, the percentage change from `wage_2022` to `real_wage_2023`.',
    { text: 'Print both growth rates with 2 decimals:', code: 'print(f"Nominal wage growth: {wage_growth:.2f}%")\nprint(f"Real wage growth: {real_wage_growth:.2f}%")' }
  ],
  practise: ['percentage change', 'brackets and order of operations', 'real vs nominal'],
  starter: { py: String.raw`# Activity 2: inflation and real wages
# ---- your code ----
# 1. CPI in 2022 and 2023


# 2. Inflation in percent, printed with 2 decimals


# 3. The wages and the nominal wage growth (%)


# 4. The 2023 wage in 2022 dollars


# 5. Real wage growth (%)


# 6. Print both growth rates

` },
  solution: { py: String.raw`# Activity 2: inflation and real wages
# ---- your code ----
# 1. CPI in 2022 and 2023
cpi_2022 = 151.2
cpi_2023 = 157.1

# 2. Inflation in percent, printed with 2 decimals
inflation = (cpi_2023 - cpi_2022) / cpi_2022 * 100
print(f"Inflation in 2023: {inflation:.2f}%")

# 3. The wages and the nominal wage growth (%)
wage_2022 = 30.00
wage_2023 = 31.20
wage_growth = (wage_2023 - wage_2022) / wage_2022 * 100

# 4. The 2023 wage in 2022 dollars
real_wage_2023 = wage_2023 * cpi_2022 / cpi_2023

# 5. Real wage growth (%)
real_wage_growth = (real_wage_2023 - wage_2022) / wage_2022 * 100

# 6. Print both growth rates
print(f"Nominal wage growth: {wage_growth:.2f}%")
print(f"Real wage growth: {real_wage_growth:.2f}%")
` },
  checks: [
    { text: '`inflation` is the percentage change in the CPI (about 3.90)', pts: 2,
      test: py(close('inflation', '(157.1 - 151.2) / 151.2 * 100'), '"inflation = " + repr(inflation)'),
      explain: 'Percentage change = (new − old) / old × 100. Divide by the **old** value (the starting point), and multiply by 100 to turn a fraction into a percent.',
      fix: 'inflation = (cpi_2023 - cpi_2022) / cpi_2022 * 100' },
    { text: 'Prints `Inflation in 2023: 3.90%`', pts: 1,
      test: printed(/Inflation in 2023: 3\.90%/, 'printed'),
      explain: '`{inflation:.2f}` shows exactly two decimals; the `%` after the brace is plain text.',
      fix: 'print(f"Inflation in 2023: {inflation:.2f}%")' },
    { text: '`wage_growth` is the nominal wage growth (4.0)', pts: 1,
      test: py(close('wage_growth', '4.0'), '"wage_growth = " + repr(wage_growth)'),
      explain: 'Same formula, new numbers: (31.20 − 30.00) / 30.00 × 100 = 4%.',
      fix: 'wage_growth = (wage_2023 - wage_2022) / wage_2022 * 100' },
    { text: '`real_wage_2023` is the 2023 wage in 2022 dollars (about 30.03)', pts: 2,
      test: py(close('real_wage_2023', '31.20 * 151.2 / 157.1'), '"real_wage_2023 = " + repr(real_wage_2023)'),
      explain: 'To deflate, multiply by (old CPI / new CPI). Prices rose by the factor 157.1/151.2, so a 2023 dollar buys less: divide that rise out.',
      fix: 'real_wage_2023 = wage_2023 * cpi_2022 / cpi_2023' },
    { text: '`real_wage_growth` is the percentage change from `wage_2022` to `real_wage_2023`', pts: 2,
      test: py(close('real_wage_growth', '(31.20 * 151.2 / 157.1 - 30) / 30 * 100'), '"real_wage_growth = " + repr(real_wage_growth)'),
      explain: 'Real growth compares like with like: both wages measured in 2022 dollars. It comes out near 0.09%: the 4% raise almost exactly matched inflation.',
      fix: 'real_wage_growth = (real_wage_2023 - wage_2022) / wage_2022 * 100' },
    { text: 'Prints `Nominal wage growth: 4.00%` and `Real wage growth: 0.09%`', pts: 1,
      test: printed(/Nominal wage growth: 4\.00%[\s\S]*Real wage growth: 0\.09%/, 'printed'),
      explain: 'Printing both side by side tells the story: a big nominal raise, almost no real gain.',
      fix: 'print(f"Nominal wage growth: {wage_growth:.2f}%")\nprint(f"Real wage growth: {real_wage_growth:.2f}%")' }
  ],
  quiz: [
    { q: 'The CPI rises from 120 to 126. What is the inflation rate?', options: ['6%', '4.8%', '5%', '126%'], answer: 2,
      explain: '(126 − 120) / 120 × 100 = 5%. Dividing by the new value (126) would give about 4.8%, which is the wrong base.' },
    { q: 'Without brackets, what does `126 - 120 / 120 * 100` give?', options: ['`5.0`', '`26.0`', '`0.05`', 'an error'], answer: 1,
      explain: 'Division and multiplication happen before subtraction: `120 / 120 * 100` is `100.0`, and `126 - 100.0` is `26.0`. Brackets force the subtraction first.' },
    { q: 'Your nominal wage rises 3% while prices rise 5%. Your real wage…', options: ['rises by about 2%', 'rises by about 8%', 'stays the same', 'falls by about 2%'], answer: 3,
      explain: 'Real wage growth ≈ nominal growth − inflation = 3% − 5% = −2%. You earn more dollars, but they buy less.' }
  ]
},

/* ================================================================== 3. functions */
{
  id: 3, module: 'Functions', topic: 'def, parameters, return', edit: 'py', art: null,
  title: 'An Elasticity Calculator',
  story: 'The Desk\'s next brief asks how sensitive buyers are to price. **Price elasticity of demand** is the percentage change in quantity divided by the percentage change in price. You will compute it many times, so write it **once** as a function. Economists use the **midpoint method**, which divides by the average of the old and new values so the answer is the same whether the price goes up or down.',
  steps: [
    { text: 'Write `pct_change(old, new)` that **returns** the ordinary percentage change:', code: 'def pct_change(old, new):\n    return (new - old) / old * 100' },
    'Write `midpoint_change(old, new)` that returns `(new - old)` divided by the average `(old + new) / 2`, times 100.',
    { text: 'Write `elasticity(p1, p2, q1, q2)`: the midpoint change in quantity divided by the midpoint change in price, as a positive number. Call your own function inside it:', code: 'def elasticity(p1, p2, q1, q2):\n    return abs(midpoint_change(q1, q2) / midpoint_change(p1, p2))' },
    'A café raised a latte from $4.00 to $5.00 and sales fell from 1200 to 1000 a week: `e_coffee = elasticity(4.00, 5.00, 1200, 1000)`.',
    'The transit agency raised a fare from $3.50 to $3.75 and daily riders fell from 50000 to 49000: store `e_transit` the same way.',
    'Print both with 2 decimals, e.g. `print(f"Coffee: {e_coffee:.2f}")` and `print(f"Transit: {e_transit:.2f}")`.'
  ],
  practise: ['def', 'parameters', 'return', 'calling a function', 'abs()'],
  starter: { py: String.raw`# Activity 3: an elasticity calculator
# ---- your code ----
# 1. pct_change(old, new)


# 2. midpoint_change(old, new)


# 3. elasticity(p1, p2, q1, q2), always positive


# 4. and 5. Use it for the latte and the bus fare


# 6. Print both with 2 decimals

` },
  solution: { py: String.raw`# Activity 3: an elasticity calculator
# ---- your code ----
# 1. pct_change(old, new)
def pct_change(old, new):
    return (new - old) / old * 100

# 2. midpoint_change(old, new)
def midpoint_change(old, new):
    return (new - old) / ((old + new) / 2) * 100

# 3. elasticity(p1, p2, q1, q2), always positive
def elasticity(p1, p2, q1, q2):
    return abs(midpoint_change(q1, q2) / midpoint_change(p1, p2))

# 4. and 5. Use it for the latte and the bus fare
e_coffee = elasticity(4.00, 5.00, 1200, 1000)
e_transit = elasticity(3.50, 3.75, 50000, 49000)

# 6. Print both with 2 decimals
print(f"Coffee: {e_coffee:.2f}")
print(f"Transit: {e_transit:.2f}")
` },
  checks: [
    { text: '`pct_change(120, 126)` returns 5.0', pts: 2,
      test: py('callable(pct_change) and pct_change(120, 126) is not None and ' + close('pct_change(120, 126)', '5.0'), '"pct_change(120, 126) returned " + repr(pct_change(120, 126))'),
      explain: 'A function hands its answer back with `return`. A function that only `print`s returns `None`, so its result cannot be stored or used in another calculation.',
      fix: 'def pct_change(old, new):\n    return (new - old) / old * 100' },
    { text: '`midpoint_change(4, 5)` returns about 22.22 (divides by the average)', pts: 2,
      test: py(close('midpoint_change(4, 5)', '100 / 4.5'), '"midpoint_change(4, 5) returned " + repr(midpoint_change(4, 5))'),
      explain: 'The midpoint method divides by the average of old and new (4.5 here), so going from 4 to 5 and from 5 to 4 give the same size of change.',
      fix: 'def midpoint_change(old, new):\n    return (new - old) / ((old + new) / 2) * 100' },
    { text: '`elasticity(10, 12, 100, 80)` returns about 1.22 (a positive number)', pts: 2,
      test: py(close('elasticity(10, 12, 100, 80)', '(20 / 90) / (2 / 11)'), '"elasticity(10, 12, 100, 80) returned " + repr(elasticity(10, 12, 100, 80))'),
      explain: 'Quantity falls when price rises, so the raw ratio is negative. Economists usually report the size, so `abs()` makes it positive. The function must use its parameters, not fixed numbers, to work for any good.',
      fix: 'def elasticity(p1, p2, q1, q2):\n    return abs(midpoint_change(q1, q2) / midpoint_change(p1, p2))' },
    { text: '`e_coffee` is the latte\'s elasticity (about 0.82)', pts: 1,
      test: py(close('e_coffee', '(200 / 1100) / (1 / 4.5)'), '"e_coffee = " + repr(e_coffee)'),
      explain: 'Call the function with the arguments in the order of its parameters: prices first (p1, p2), then quantities (q1, q2).',
      fix: 'e_coffee = elasticity(4.00, 5.00, 1200, 1000)' },
    { text: '`e_transit` is the bus fare\'s elasticity (about 0.29)', pts: 1,
      test: py(close('e_transit', '(1000 / 49500) / (0.25 / 3.625)'), '"e_transit = " + repr(e_transit)'),
      explain: 'The same function works for any good: that is the point of writing it once. Transit demand is far less sensitive to price than lattes.',
      fix: 'e_transit = elasticity(3.50, 3.75, 50000, 49000)' },
    { text: 'Prints `Coffee: 0.82` and `Transit: 0.29`', pts: 1,
      test: printed(/Coffee: 0\.82[\s\S]*Transit: 0\.29/, 'printed'),
      explain: 'Two decimals is plenty for an elasticity; more digits suggest a precision the data does not have.',
      fix: 'print(f"Coffee: {e_coffee:.2f}")\nprint(f"Transit: {e_transit:.2f}")' }
  ],
  quiz: [
    { q: 'What does this code print?', code: 'def double(x):\n    print(x * 2)\n\ny = double(5)\nprint(y)', options: ['`10` and then `10`', '`10` and then `None`', '`None` only', 'an error'], answer: 1,
      explain: '`double(5)` prints 10, but it has no `return`, so it gives back `None`, and `y` is `None`. Use `return` when the result is needed later.' },
    { q: 'A price rises 10% and the quantity demanded falls 20%. The price elasticity of demand (as a positive number) is…', options: ['0.5', '2.0', '−2.0', '30'], answer: 1,
      explain: 'Elasticity = %ΔQ / %ΔP = 20 / 10 = 2. Greater than 1, so demand is elastic.' },
    { q: 'In `def elasticity(p1, p2, q1, q2):`, what are `p1`, `p2`, `q1`, `q2`?', options: ['Global variables you must create first', 'Return values', 'Parameters: names for the values passed in each call', 'Keywords built into Python'], answer: 2,
      explain: 'Parameters are placeholders. Each call such as `elasticity(4, 5, 1200, 1000)` fills them with arguments, in order.' }
  ]
},

/* ================================================================== 4. conditionals */
{
  id: 4, module: 'Decisions', topic: 'if / elif / else', edit: 'py', art: null,
  title: 'Elastic or Not? Tax Brackets',
  story: 'Two decisions for the Desk. First, label an elasticity in words, so readers know whether a price rise will raise or lower a firm\'s revenue. Second, a reader asks how a **progressive income tax** works. In this simplified, made-up system, the first **$55,000** is taxed at **15%**, income from $55,000 to **$110,000** at **20.5%**, and everything above $110,000 at **26%**. Each rate applies only to the income **inside** its bracket.',
  steps: [
    { text: 'Write `classify(e)` that returns `"elastic"` when `e` is above 1, `"inelastic"` when below 1, and `"unit elastic"` otherwise:', code: 'def classify(e):\n    if e > 1:\n        return "elastic"\n    elif e < 1:\n        return "inelastic"\n    else:\n        return "unit elastic"' },
    'Write `income_tax(income)` with `if` / `elif` / `else` for the three brackets. Up to 55000: `income * 0.15`.',
    'From 55000 to 110000: the full first bracket (`55000 * 0.15`) **plus** `(income - 55000) * 0.205`.',
    'Above 110000: both full lower brackets (`55000 * 0.15 + 55000 * 0.205`) **plus** `(income - 110000) * 0.26`.',
    'Store `tax_80k = income_tax(80000)` and the **average tax rate** in percent: `avg_rate_80k = tax_80k / 80000 * 100`.',
    'Print `classify(0.82)`, then `tax_80k` and `avg_rate_80k` with an f-string, e.g. `Tax on $80,000: $13,375.00 (average rate 16.7%)`.'
  ],
  practise: ['if / elif / else', 'comparison operators', 'marginal vs average tax'],
  starter: { py: String.raw`# Activity 4: elastic or not? tax brackets
# ---- your code ----
# 1. classify(e)


# 2.–4. income_tax(income) with three brackets


# 5. Tax and average tax rate on $80,000


# 6. Print the results

` },
  solution: { py: String.raw`# Activity 4: elastic or not? tax brackets
# ---- your code ----
# 1. classify(e)
def classify(e):
    if e > 1:
        return "elastic"
    elif e < 1:
        return "inelastic"
    else:
        return "unit elastic"

# 2.–4. income_tax(income) with three brackets
def income_tax(income):
    if income <= 55000:
        return income * 0.15
    elif income <= 110000:
        return 55000 * 0.15 + (income - 55000) * 0.205
    else:
        return 55000 * 0.15 + 55000 * 0.205 + (income - 110000) * 0.26

# 5. Tax and average tax rate on $80,000
tax_80k = income_tax(80000)
avg_rate_80k = tax_80k / 80000 * 100

# 6. Print the results
print("A latte is", classify(0.82))
print(f"Tax on $80,000: ${"$"}{tax_80k:,.2f} (average rate {avg_rate_80k:.1f}%)")
` },
  checks: [
    { text: '`classify(1.8)` is `"elastic"` and `classify(0.4)` is `"inelastic"`', pts: 2,
      test: py('classify(1.8) == "elastic" and classify(0.4) == "inelastic"', '"classify(1.8) = " + repr(classify(1.8)) + ", classify(0.4) = " + repr(classify(0.4))'),
      explain: '`if` tests the first condition; `elif` is tested only when the ones before it were false. Return the exact text: `"Elastic"` and `"elastic"` are different strings.',
      fix: 'def classify(e):\n    if e > 1:\n        return "elastic"\n    elif e < 1:\n        return "inelastic"\n    else:\n        return "unit elastic"' },
    { text: '`classify(1.0)` is `"unit elastic"`', pts: 1,
      test: py('classify(1.0) == "unit elastic"', '"classify(1.0) = " + repr(classify(1.0))'),
      explain: 'Exactly 1 is neither above nor below 1, so it falls through to `else`. Using `>=` in the first test would wrongly call it elastic.',
      fix: '    else:\n        return "unit elastic"' },
    { text: '`income_tax(40000)` is 6000 (first bracket only)', pts: 1,
      test: py(close('income_tax(40000)', '6000'), '"income_tax(40000) = " + repr(income_tax(40000))'),
      explain: 'Income inside the first bracket is taxed at 15%: 40,000 × 0.15 = 6,000.',
      fix: '    if income <= 55000:\n        return income * 0.15' },
    { text: '`income_tax(80000)` is 13375 (only the part above 55000 pays 20.5%)', pts: 2,
      test: py(close('income_tax(80000)', '13375'), '"income_tax(80000) = " + repr(income_tax(80000))'),
      explain: 'A higher bracket taxes only the income **inside** it: 55,000 × 15% = 8,250, plus 25,000 × 20.5% = 5,125. Taxing all 80,000 at 20.5% is the most common misunderstanding of tax brackets.',
      fix: '    elif income <= 110000:\n        return 55000 * 0.15 + (income - 55000) * 0.205' },
    { text: '`income_tax(150000)` is 29925 and the boundaries 55000 and 110000 are right', pts: 2,
      test: py(close('income_tax(150000)', '29925') + ' and ' + close('income_tax(55000)', '8250') + ' and ' + close('income_tax(110000)', '19525'), '"income_tax(150000) = %r, income_tax(55000) = %r, income_tax(110000) = %r" % (income_tax(150000), income_tax(55000), income_tax(110000))'),
      explain: 'Above 110,000: 8,250 + 11,275 (the full middle bracket) + 40,000 × 26% = 29,925. A good tax function has no jumps at the bracket edges.',
      fix: '    else:\n        return 55000 * 0.15 + 55000 * 0.205 + (income - 110000) * 0.26' },
    { text: '`tax_80k` and `avg_rate_80k` (about 16.7%) are stored', pts: 1,
      test: py(close('tax_80k', '13375') + ' and ' + close('avg_rate_80k', '13375 / 80000 * 100'), '"tax_80k = %r, avg_rate_80k = %r" % (tax_80k, avg_rate_80k)'),
      explain: 'The **average** rate (tax ÷ income) is below the **marginal** rate (20.5%, the rate on the next dollar), because the first 55,000 is taxed at only 15%.',
      fix: 'tax_80k = income_tax(80000)\navg_rate_80k = tax_80k / 80000 * 100' },
    { text: 'Prints the tax on $80,000 as `$13,375.00`', pts: 1,
      test: printed(/\$13,375\.00/, 'printed'),
      explain: 'Format money with `:,.2f`: commas and cents.',
      fix: 'print(f"Tax on $80,000: ${tax_80k:,.2f} (average rate {avg_rate_80k:.1f}%)")' }
  ],
  quiz: [
    { q: 'What does this code print?', code: 'e = 1.0\nif e >= 1:\n    print("elastic")\nelif e == 1:\n    print("unit elastic")\nelse:\n    print("inelastic")', options: ['`elastic`', '`unit elastic`', '`inelastic`', 'both `elastic` and `unit elastic`'], answer: 0,
      explain: 'Python stops at the first true condition. `1.0 >= 1` is true, so the `elif` is never tested. Order and the choice of `>` vs `>=` matter.' },
    { q: 'In this lab\'s tax system, someone earning $56,000 gets a $1,000 raise. Their extra tax is…', options: ['$150', '$205', '20.5% of their whole income', '$260'], answer: 1,
      explain: 'The raise falls in the 20.5% bracket, so only that $1,000 is taxed at 20.5%: $205. Moving into a higher bracket never taxes the earlier income at the higher rate.' },
    { q: 'Demand for a good is **inelastic** (elasticity 0.4). If the firm raises the price, its total revenue…', options: ['falls', 'stays the same', 'rises', 'cannot be predicted'], answer: 2,
      explain: 'With inelastic demand, quantity falls by a smaller percentage than the price rises, so price × quantity goes up.' }
  ]
},

/* ================================================================== 5. lists and for loops */
{
  id: 5, module: 'Loops', topic: 'Lists, for loops, range', edit: 'py', art: null,
  title: 'Five Years of Inflation',
  story: 'The editor wants a year-by-year inflation table for 2021 to 2024. You have the CPI for five years in a **list**. Instead of copying the formula four times, a **for loop** walks through the list and computes each year\'s inflation from the year before it.',
  steps: [
    'The lists `years` and `cpi` are given. Make an empty list: `inflation = []`.',
    { text: 'Loop over the positions 1 to 4 (each year needs the one before it), compute the rate, add it to the list, and print it:', code: 'for i in range(1, len(cpi)):\n    rate = (cpi[i] - cpi[i - 1]) / cpi[i - 1] * 100\n    inflation.append(rate)\n    print(f"{years[i]}: {rate:.1f}%")' },
    'Compute `average_inflation`: the `sum` of the list divided by its `len`.',
    'Store `peak = max(inflation)`.',
    'Find `peak_year`, the year of the peak. `inflation.index(peak)` gives its position in `inflation`, which starts one year later than `years`, so add 1: `years[inflation.index(peak) + 1]`.',
    'Print the average (2 decimals) and the peak year.'
  ],
  practise: ['lists', 'indexing', 'for', 'range', 'append', 'sum / len / max'],
  starter: { py: String.raw`# Activity 5: five years of inflation
years = [2020, 2021, 2022, 2023, 2024]
cpi = [137.0, 141.6, 151.2, 157.1, 160.9]

# ---- your code ----
# 1. An empty list for the inflation rates


# 2. Loop from position 1, append and print each rate


# 3. The average inflation rate


# 4. and 5. The peak rate and its year


# 6. Print the average and the peak year

` },
  solution: { py: String.raw`# Activity 5: five years of inflation
years = [2020, 2021, 2022, 2023, 2024]
cpi = [137.0, 141.6, 151.2, 157.1, 160.9]

# ---- your code ----
# 1. An empty list for the inflation rates
inflation = []

# 2. Loop from position 1, append and print each rate
for i in range(1, len(cpi)):
    rate = (cpi[i] - cpi[i - 1]) / cpi[i - 1] * 100
    inflation.append(rate)
    print(f"{years[i]}: {rate:.1f}%")

# 3. The average inflation rate
average_inflation = sum(inflation) / len(inflation)

# 4. and 5. The peak rate and its year
peak = max(inflation)
peak_year = years[inflation.index(peak) + 1]

# 6. Print the average and the peak year
print(f"Average inflation: {average_inflation:.2f}%")
print("Highest inflation in", peak_year)
` },
  checks: [
    { text: '`inflation` is a list of 4 rates (2021 to 2024)', pts: 2,
      test: py('isinstance(inflation, list) and len(inflation) == 4', '"inflation has " + str(len(inflation)) + " values: " + str([round(x, 2) for x in inflation])'),
      explain: 'Five CPI values give four changes. `range(1, len(cpi))` is 1, 2, 3, 4. Starting at 0 would compare 2020 with `cpi[-1]`, the **last** item (negative indexes count from the end).',
      fix: 'inflation = []\nfor i in range(1, len(cpi)):\n    ...' },
    { text: 'Each rate is the change from the year before (3.4, 6.8, 3.9, 2.4)', pts: 2,
      test: py('len(inflation) == 4 and L.np.allclose(inflation, [(cpi[i] - cpi[i - 1]) / cpi[i - 1] * 100 for i in range(1, 5)])', 'str([round(x, 2) for x in inflation])'),
      explain: 'Inside the loop, `cpi[i]` is this year and `cpi[i - 1]` is last year, the base of the percentage change. `append` adds each result to the end of the list.',
      fix: '    rate = (cpi[i] - cpi[i - 1]) / cpi[i - 1] * 100\n    inflation.append(rate)' },
    { text: 'The loop prints one line per year, e.g. `2022: 6.8%`', pts: 1,
      test: printed(/2021: 3\.4%[\s\S]*2022: 6\.8%[\s\S]*2023: 3\.9%[\s\S]*2024: 2\.4%/, 'printed'),
      explain: 'A `print` indented inside the loop runs once per pass; `years[i]` is the year that matches `cpi[i]`.',
      fix: '    print(f"{years[i]}: {rate:.1f}%")' },
    { text: '`average_inflation` is the mean of the four rates (about 4.11)', pts: 2,
      test: py('abs(average_inflation - sum((cpi[i] - cpi[i - 1]) / cpi[i - 1] * 100 for i in range(1, 5)) / 4) < 1e-6', '"average_inflation = " + repr(average_inflation)'),
      explain: '`sum(list) / len(list)` is the mean. Using `len(list)` instead of typing 4 keeps the code right when more years are added.',
      fix: 'average_inflation = sum(inflation) / len(inflation)' },
    { text: '`peak` is the highest rate and `peak_year` is 2022', pts: 2,
      test: py(close('peak', 'max(inflation)') + ' and peak_year == 2022', '"peak = %r, peak_year = %r" % (peak, peak_year)'),
      explain: '`inflation[0]` is 2021 but `years[0]` is 2020: the lists are offset by one, so add 1 to the position before looking up the year.',
      fix: 'peak = max(inflation)\npeak_year = years[inflation.index(peak) + 1]' }
  ],
  quiz: [
    { q: 'With `cpi = [137.0, 141.6, 151.2, 157.1, 160.9]`, what is `cpi[-1]`?', options: ['`137.0`', 'an IndexError', '`157.1`', '`160.9`'], answer: 3,
      explain: 'Negative indexes count from the end: `-1` is the last item. That is why a loop starting at 0 silently compares the first year with the last.' },
    { q: 'What does `list(range(1, 5))` contain?', options: ['`[1, 2, 3, 4]`', '`[1, 2, 3, 4, 5]`', '`[0, 1, 2, 3, 4]`', '`[2, 3, 4, 5]`'], answer: 0,
      explain: '`range(start, stop)` includes the start and stops **before** the stop value.' },
    { q: 'Prices rise 10% one year and 10% the next. The total rise over two years is…', options: ['exactly 20%', '21%', '19%', '100%'], answer: 1,
      explain: 'Growth compounds: 1.10 × 1.10 = 1.21, a 21% rise. The second year\'s 10% applies to an already higher price level.' }
  ]
},

/* ================================================================== 6. while loops */
{
  id: 6, module: 'Loops', topic: 'while loops, compounding', edit: 'py', art: null,
  title: 'How Long to Double?',
  story: 'A reader asks how long it takes savings, or an economy, to **double**. Economists use the **Rule of 70**: at a growth rate of r%, doubling takes about 70 / r years. You will compute the exact answer with a **while loop** (repeat until the amount reaches 2) and see how good the shortcut is.',
  steps: [
    { text: 'Write `years_to_double(rate)` with a while loop. `rate` is a decimal such as 0.07.', code: 'def years_to_double(rate):\n    amount = 1.0\n    years = 0\n    while amount < 2:\n        amount = amount * (1 + rate)\n        years = years + 1\n    return years' },
    'The list `rates` is given. Make two empty lists, `exact` and `rule70`.',
    'Loop over `rates`: append `years_to_double(r)` to `exact` and the Rule-of-70 estimate `70 / (r * 100)` to `rule70`, and print both for each rate.',
    'Compound **$1,000 at 7% for 30 years** with a for loop: start with `balance = 1000` and multiply by `1.07` once per year, using `for year in range(30):`.',
    'Print the final `balance` with commas and 2 decimals.'
  ],
  practise: ['while', 'loop counters', 'compound growth', 'Rule of 70'],
  starter: { py: String.raw`# Activity 6: how long to double?
rates = [0.01, 0.02, 0.05, 0.07, 0.10]

# ---- your code ----
# 1. years_to_double(rate) with a while loop


# 2. and 3. exact years and Rule-of-70 estimates for each rate


# 4. $1,000 at 7% for 30 years


# 5. Print the balance

` },
  solution: { py: String.raw`# Activity 6: how long to double?
rates = [0.01, 0.02, 0.05, 0.07, 0.10]

# ---- your code ----
# 1. years_to_double(rate) with a while loop
def years_to_double(rate):
    amount = 1.0
    years = 0
    while amount < 2:
        amount = amount * (1 + rate)
        years = years + 1
    return years

# 2. and 3. exact years and Rule-of-70 estimates for each rate
exact = []
rule70 = []
for r in rates:
    exact.append(years_to_double(r))
    rule70.append(70 / (r * 100))
    print(f"{r * 100:.0f}%: {years_to_double(r)} years (Rule of 70: {70 / (r * 100):.1f})")

# 4. $1,000 at 7% for 30 years
balance = 1000
for year in range(30):
    balance = balance * 1.07

# 5. Print the balance
print(f"$1,000 at 7% for 30 years: ${"$"}{balance:,.2f}")
` },
  checks: [
    { text: '`years_to_double(0.07)` returns 11', pts: 2,
      test: py('years_to_double(0.07) == 11', '"years_to_double(0.07) returned " + repr(years_to_double(0.07))'),
      explain: 'A `while` loop repeats as long as its condition is true. Each pass is one year of growth; when the amount reaches 2, the loop stops and `years` holds the count.',
      fix: 'def years_to_double(rate):\n    amount = 1.0\n    years = 0\n    while amount < 2:\n        amount = amount * (1 + rate)\n        years = years + 1\n    return years' },
    { text: 'It works for other rates: 3% → 24 years, 10% → 8 years', pts: 2,
      test: py('years_to_double(0.03) == 24 and years_to_double(0.10) == 8', '"3%% gave %r, 10%% gave %r" % (years_to_double(0.03), years_to_double(0.10))'),
      explain: 'Start the counter at 0: no years have passed before the first pass. Starting at 1 makes every answer one year too long.',
      fix: '    years = 0' },
    { text: '`exact` holds the exact doubling time for each rate in `rates`', pts: 1,
      test: py('exact == [next(n for n in range(1, 500) if (1 + r) ** n >= 2) for r in rates]', '"exact = " + str(exact)'),
      explain: 'Calling your function inside a loop applies it to every rate, and `append` collects the answers in order.',
      fix: 'exact = []\nfor r in rates:\n    exact.append(years_to_double(r))' },
    { text: '`rule70` holds `70 / (r * 100)` for each rate (70, 35, 14, 10, 7)', pts: 2,
      test: py('len(rule70) == 5 and L.np.allclose(rule70, [70, 35, 14, 10, 7])', '"rule70 = " + str([round(x, 2) for x in rule70])'),
      explain: 'The Rule of 70 uses the rate in **percent** (7, not 0.07), so convert first. Compare the lists: the shortcut is within a year of the exact answer for normal growth rates.',
      fix: '    rule70.append(70 / (r * 100))' },
    { text: '`balance` is $1,000 grown at 7% for 30 years (about $7,612.26)', pts: 2,
      test: py('abs(balance - 1000 * 1.07 ** 30) < 0.01', '"balance = " + format(balance, ",.2f")'),
      explain: '`range(30)` runs exactly 30 times. Compounding turns $1,000 into more than $7,600, far more than 30 × $70 of simple interest.',
      fix: 'balance = 1000\nfor year in range(30):\n    balance = balance * 1.07' },
    { text: 'Prints the balance as `$7,612.26`', pts: 1,
      test: printed(/\$7,612\.26/, 'printed'),
      explain: '`:,.2f` formats money with commas and cents.',
      fix: 'print(f"$1,000 at 7% for 30 years: ${balance:,.2f}")' }
  ],
  quiz: [
    { q: 'What happens if you forget `amount = amount * (1 + rate)` inside the while loop?', options: ['The loop runs once', 'Python reports a SyntaxError', 'The loop never ends, because `amount` stays below 2', 'It returns 0'], answer: 2,
      explain: 'A while loop needs something inside it that eventually makes the condition false. Otherwise it repeats forever (here the lab stops it after a time limit).' },
    { q: 'By the Rule of 70, an economy growing 2% a year doubles its GDP in about…', options: ['140 years', '35 years', '20 years', '70 years'], answer: 1,
      explain: '70 / 2 = 35 years. Small differences in growth rates add up to large differences in living standards over a generation.' },
    { q: 'When is a `while` loop a better choice than a `for` loop?', options: ['When you do not know in advance how many repetitions you need', 'When you loop over a list', 'When you need exactly 30 repetitions', 'Never: they are the same'], answer: 0,
      explain: '`for` suits a known sequence (a list, `range(30)`). `while` suits "repeat until something happens", like reaching double the amount.' }
  ]
},

/* ================================================================== 7. dictionaries */
{
  id: 7, module: 'Data structures', topic: 'Dictionaries', edit: 'py', art: null,
  title: 'Build Your Own CPI',
  story: 'How is the CPI made? Statistical agencies price a fixed **basket** of goods in a base year and again later. The index is the basket\'s cost now divided by its cost in the base year, times 100. A **dictionary** is perfect for this: it maps each item name to a number, such as how many a student buys a year, or its price.',
  steps: [
    'The dictionaries `basket` (yearly quantities), `prices_2020`, and `prices_2024` are given.',
    { text: 'Loop over the basket to add up its cost in each year. `.items()` gives each key and its value:', code: 'cost_2020 = 0\ncost_2024 = 0\nfor item, qty in basket.items():\n    cost_2020 = cost_2020 + qty * prices_2020[item]\n    cost_2024 = cost_2024 + qty * prices_2024[item]' },
    'Compute the index: `cpi_2024 = cost_2024 / cost_2020 * 100` (2020 = 100).',
    'Make an empty dictionary `price_change = {}`. Loop over `basket` and store each item\'s percentage price change: `price_change[item] = …`.',
    'Find `biggest`, the **item name** with the largest price change: `max(price_change, key=price_change.get)` (plain `max(price_change)` compares the names alphabetically!).',
    'Print `cpi_2024` with 1 decimal and `biggest`.'
  ],
  practise: ['dictionaries', 'keys and values', '.items()', 'max with key'],
  starter: { py: String.raw`# Activity 7: build your own CPI
basket = {"bread": 52, "milk": 104, "coffee": 120, "bus pass": 12}
prices_2020 = {"bread": 3.00, "milk": 2.20, "coffee": 2.50, "bus pass": 88.50}
prices_2024 = {"bread": 3.80, "milk": 2.60, "coffee": 3.10, "bus pass": 97.00}

# ---- your code ----
# 1. The cost of the basket in 2020 and in 2024


# 2. The index (2020 = 100)


# 3. The percentage price change of each item


# 4. The item with the largest price change


# 5. Print the CPI and the biggest riser

` },
  solution: { py: String.raw`# Activity 7: build your own CPI
basket = {"bread": 52, "milk": 104, "coffee": 120, "bus pass": 12}
prices_2020 = {"bread": 3.00, "milk": 2.20, "coffee": 2.50, "bus pass": 88.50}
prices_2024 = {"bread": 3.80, "milk": 2.60, "coffee": 3.10, "bus pass": 97.00}

# ---- your code ----
# 1. The cost of the basket in 2020 and in 2024
cost_2020 = 0
cost_2024 = 0
for item, qty in basket.items():
    cost_2020 = cost_2020 + qty * prices_2020[item]
    cost_2024 = cost_2024 + qty * prices_2024[item]

# 2. The index (2020 = 100)
cpi_2024 = cost_2024 / cost_2020 * 100

# 3. The percentage price change of each item
price_change = {}
for item in basket:
    price_change[item] = (prices_2024[item] - prices_2020[item]) / prices_2020[item] * 100

# 4. The item with the largest price change
biggest = max(price_change, key=price_change.get)

# 5. Print the CPI and the biggest riser
print(f"Student CPI in 2024: {cpi_2024:.1f}")
print("Biggest price rise:", biggest)
` },
  checks: [
    { text: '`cost_2020` is the basket\'s cost at 2020 prices ($1,746.80)', pts: 2,
      test: py(close('cost_2020', '1746.8'), '"cost_2020 = " + repr(cost_2020)'),
      explain: 'Cost = Σ quantity × price. `prices_2020[item]` looks up the price by the item\'s name: the key links the two dictionaries.',
      fix: 'for item, qty in basket.items():\n    cost_2020 = cost_2020 + qty * prices_2020[item]' },
    { text: '`cost_2024` uses the **same** quantities at 2024 prices ($2,004.00)', pts: 2,
      test: py(close('cost_2024', '2004.0'), '"cost_2024 = " + repr(cost_2024)'),
      explain: 'A price index holds the basket fixed and changes only the prices, so any change in cost comes from prices, not from buying more.',
      fix: '    cost_2024 = cost_2024 + qty * prices_2024[item]' },
    { text: '`cpi_2024` is about 114.7 (2020 = 100)', pts: 2,
      test: py(close('cpi_2024', '2004.0 / 1746.8 * 100'), '"cpi_2024 = " + repr(cpi_2024)'),
      explain: 'Dividing by the base-year cost and multiplying by 100 sets the base year to 100. An index of 114.7 means prices rose 14.7% since 2020.',
      fix: 'cpi_2024 = cost_2024 / cost_2020 * 100' },
    { text: '`price_change` maps each item to its % change (bread 26.7, milk 18.2, …)', pts: 2,
      test: py('isinstance(price_change, dict) and set(price_change) == set(basket) and all(abs(price_change[k] - (prices_2024[k] - prices_2020[k]) / prices_2020[k] * 100) < 1e-6 for k in basket)', '{k: round(v, 1) for k, v in price_change.items()}'),
      explain: '`price_change[item] = value` adds a key (or replaces its value). Looping `for item in basket` goes through the keys.',
      fix: 'price_change = {}\nfor item in basket:\n    price_change[item] = (prices_2024[item] - prices_2020[item]) / prices_2020[item] * 100' },
    { text: '`biggest` is `"bread"`', pts: 1,
      test: py('biggest == "bread"', '"biggest = " + repr(biggest)'),
      explain: '`max` over a dictionary compares its **keys**; `key=price_change.get` tells it to compare the values instead and still return the key.',
      fix: 'biggest = max(price_change, key=price_change.get)' },
    { text: 'Prints `Student CPI in 2024: 114.7`', pts: 1,
      test: printed(/114\.7/, 'printed'),
      explain: 'One decimal is the usual precision for a published index.',
      fix: 'print(f"Student CPI in 2024: {cpi_2024:.1f}")' }
  ],
  quiz: [
    { q: 'With `prices = {"milk": 2.6, "bread": 3.8}`, what does `prices["bread"]` give?', options: ['`3.8`', '`1`', '`"bread"`', 'a KeyError'], answer: 0,
      explain: 'Square brackets with a key look up its value. A key that is not in the dictionary would raise a KeyError.' },
    { q: 'Why does a price index keep the basket of quantities fixed?', options: ['Because people never change what they buy', 'So that a change in cost reflects only the change in prices', 'Because Python dictionaries cannot be changed', 'To make the index rise faster'], answer: 1,
      explain: 'Fixing quantities isolates prices. (One known weakness: people switch away from goods that get dearer, so a fixed basket can overstate the rise in the cost of living.)' },
    { q: 'What does `max({"bread": 26.7, "milk": 18.2})` return?', options: ['`26.7`', '`"bread"`', '`"milk"`', 'an error'], answer: 2,
      explain: 'Without `key=`, `max` compares the keys, and "milk" comes after "bread" alphabetically. Use `key=d.get` to compare by value.' }
  ]
},

/* ================================================================== 8. NumPy */
{
  id: 8, module: 'NumPy', topic: 'Arrays, supply and demand', edit: 'py', art: null,
  title: 'Find the Market Equilibrium',
  story: 'The Desk covers the market for **concert tickets**. Demand is **Qd = 100 − 2P** and supply is **Qs = −20 + 4P** (never below 0). With **NumPy** you can evaluate both equations at every price from $0 to $50 at once, without a loop, then find where they meet.',
  steps: [
    { text: 'Import NumPy and make the prices 0, 1, …, 50 (`arange` stops before 51):', code: 'import numpy as np\nprices = np.arange(0, 51)' },
    'Compute `qd = 100 - 2 * prices`. One line works on the whole array.',
    'Compute `qs` = `-20 + 4 * prices`, but never negative: wrap it in `np.maximum(…, 0)`.',
    { text: 'The equilibrium is where the gap between demand and supply is smallest:', code: 'gap = qd - qs\neq = np.argmin(np.abs(gap))\np_star = prices[eq]\nq_star = qd[eq]' },
    'Compute `revenue = prices * qd` (what buyers spend at each price) and `p_best = prices[np.argmax(revenue)]`, the revenue-maximising price.',
    'A price ceiling of $10: store `shortage_at_10`, the gap at P = 10: `gap[prices == 10][0]`.',
    'Print `p_star`, `q_star`, `p_best`, and `shortage_at_10`.'
  ],
  practise: ['import numpy', 'np.arange', 'vectorised maths', 'argmin / argmax', 'boolean masks'],
  starter: { py: String.raw`# Activity 8: find the market equilibrium
# ---- your code ----
# 1. Import NumPy and make the prices 0..50


# 2. Quantity demanded


# 3. Quantity supplied (never below 0)


# 4. The equilibrium price and quantity


# 5. Revenue at each price and the revenue-maximising price


# 6. The shortage under a $10 price ceiling


# 7. Print the results

` },
  solution: { py: String.raw`# Activity 8: find the market equilibrium
# ---- your code ----
# 1. Import NumPy and make the prices 0..50
import numpy as np
prices = np.arange(0, 51)

# 2. Quantity demanded
qd = 100 - 2 * prices

# 3. Quantity supplied (never below 0)
qs = np.maximum(-20 + 4 * prices, 0)

# 4. The equilibrium price and quantity
gap = qd - qs
eq = np.argmin(np.abs(gap))
p_star = prices[eq]
q_star = qd[eq]

# 5. Revenue at each price and the revenue-maximising price
revenue = prices * qd
p_best = prices[np.argmax(revenue)]

# 6. The shortage under a $10 price ceiling
shortage_at_10 = gap[prices == 10][0]

# 7. Print the results
print("Equilibrium price:", p_star)
print("Equilibrium quantity:", q_star)
print("Revenue-maximising price:", p_best)
print("Shortage at $10:", shortage_at_10)
` },
  checks: [
    { text: '`prices` is a NumPy array 0, 1, …, 50 (51 values)', pts: 1,
      test: py('isinstance(prices, L.np.ndarray) and L.np.array_equal(prices, L.np.arange(51))', '"prices: type %s, %d values, from %s to %s" % (type(prices).__name__, len(prices), prices[0], prices[-1])'),
      explain: '`np.arange(start, stop)` stops **before** `stop`, like `range`. A NumPy array lets one formula act on every element at once.',
      fix: 'import numpy as np\nprices = np.arange(0, 51)' },
    { text: '`qd` is `100 - 2 * prices`', pts: 1,
      test: py('L.np.shape(qd) == (51,) and L.np.allclose(qd, 100 - 2 * L.np.arange(51))', '"qd starts " + str(list(qd[:4]))'),
      explain: 'Arithmetic on an array is done element by element, so `qd` has one quantity per price.',
      fix: 'qd = 100 - 2 * prices' },
    { text: '`qs` is `-20 + 4 * prices`, floored at 0', pts: 2,
      test: py('L.np.shape(qs) == (51,) and L.np.allclose(qs, L.np.maximum(-20 + 4 * L.np.arange(51), 0))', '"qs starts " + str(list(qs[:7]))'),
      explain: 'Below $5 the formula gives a negative quantity, which makes no sense: firms simply supply nothing. `np.maximum(array, 0)` replaces every negative value with 0.',
      fix: 'qs = np.maximum(-20 + 4 * prices, 0)' },
    { text: '`p_star` is 20 and `q_star` is 60', pts: 2,
      test: py('p_star == 20 and q_star == 60', '"p_star = %r, q_star = %r" % (p_star, q_star)'),
      explain: '`np.argmin(np.abs(gap))` gives the **position** where demand and supply are closest. Check by algebra: 100 − 2P = −20 + 4P → P = 20, Q = 60.',
      fix: 'gap = qd - qs\neq = np.argmin(np.abs(gap))\np_star = prices[eq]\nq_star = qd[eq]' },
    { text: '`revenue` is `prices * qd` and `p_best` is 25', pts: 2,
      test: py('L.np.shape(revenue) == (51,) and L.np.allclose(revenue, L.np.arange(51) * (100 - 2 * L.np.arange(51))) and p_best == 25', '"p_best = %r" % (p_best,)'),
      explain: '`argmax` finds the position of the largest revenue. Revenue peaks at $25, where demand is unit elastic: above it demand is elastic, below it inelastic.',
      fix: 'revenue = prices * qd\np_best = prices[np.argmax(revenue)]' },
    { text: '`shortage_at_10` is 60 (80 demanded, 20 supplied)', pts: 2,
      test: py('shortage_at_10 == 60', '"shortage_at_10 = %r" % (shortage_at_10,)'),
      explain: '`prices == 10` is a True/False array (a mask); `gap[mask]` keeps only the matching values. A ceiling below equilibrium creates a shortage: quantity demanded exceeds quantity supplied.',
      fix: 'shortage_at_10 = gap[prices == 10][0]' }
  ],
  quiz: [
    { q: 'What does this print?', code: 'import numpy as np\np = np.array([10, 20, 30])\nprint(p * 2)', options: ['`[10, 20, 30, 10, 20, 30]`', '`[20 40 60]`', '`120`', 'an error'], answer: 1,
      explain: 'NumPy multiplies element by element. (A plain Python **list** times 2 would repeat the list instead.)' },
    { q: 'A binding price **ceiling** set below the equilibrium price causes…', options: ['a surplus', 'no change', 'a higher equilibrium quantity', 'a shortage'], answer: 3,
      explain: 'At a price below equilibrium, buyers want more than sellers offer, so quantity demanded exceeds quantity supplied: a shortage.' },
    { q: 'What does `np.argmax(revenue)` return?', options: ['The position (index) of the largest value', 'The largest revenue', 'The price that maximises revenue', 'The sum of the array'], answer: 0,
      explain: '`argmax` returns an index. Use it to look up the matching price: `prices[np.argmax(revenue)]`. `np.max` would return the value itself.' }
  ]
},

/* ================================================================== 9. pandas */
{
  id: 9, module: 'pandas', topic: 'DataFrames, columns, filters', edit: 'py', art: null,
  title: 'Which Provinces Are Richest?',
  data: ['provinces.csv'],
  story: 'For a brief on regional inequality, the Desk has a file with each province\'s **population** and **GDP** (in millions of dollars; rounded, approximate figures). With **pandas** you can load the table, add a GDP-per-capita column, rank the provinces, and compare each one with the national figure.',
  steps: [
    { text: 'Load the file and look at it:', code: 'import pandas as pd\ndf = pd.read_csv("provinces.csv")\nprint(df.head())' },
    'Add a column `df["gdp_per_capita"]`: `gdp_millions` times 1,000,000, divided by `population`.',
    'Make `ranked`, the table sorted by `gdp_per_capita` from highest to lowest (`sort_values(…, ascending=False)`), and print its `province` and `gdp_per_capita` columns.',
    'Store `richest`, the province name in the first row of `ranked`: `ranked.iloc[0]["province"]`.',
    'Compute `national`, Canada\'s GDP per capita: the **total** GDP (× 1,000,000) divided by the **total** population. Use `.sum()` on each column.',
    'Make `above`, the rows of `df` whose `gdp_per_capita` is above `national`: `df[df["gdp_per_capita"] > national]`.',
    'Add `df["gdp_share"]`, each province\'s share of national GDP in percent.'
  ],
  practise: ['pd.read_csv', 'new columns', 'sort_values', 'iloc', 'filtering rows', 'weighted averages'],
  starter: { py: String.raw`# Activity 9: which provinces are richest?
# ---- your code ----
# 1. Load provinces.csv and look at it


# 2. GDP per capita column


# 3. Rank the provinces (highest first)


# 4. The richest province


# 5. National GDP per capita


# 6. Provinces above the national figure


# 7. Each province's share of national GDP (%)

` },
  solution: { py: String.raw`# Activity 9: which provinces are richest?
# ---- your code ----
# 1. Load provinces.csv and look at it
import pandas as pd
df = pd.read_csv("provinces.csv")
print(df.head())

# 2. GDP per capita column
df["gdp_per_capita"] = df["gdp_millions"] * 1_000_000 / df["population"]

# 3. Rank the provinces (highest first)
ranked = df.sort_values("gdp_per_capita", ascending=False)
print(ranked[["province", "gdp_per_capita"]])

# 4. The richest province
richest = ranked.iloc[0]["province"]

# 5. National GDP per capita
national = df["gdp_millions"].sum() * 1_000_000 / df["population"].sum()

# 6. Provinces above the national figure
above = df[df["gdp_per_capita"] > national]
print(above["province"])

# 7. Each province's share of national GDP (%)
df["gdp_share"] = df["gdp_millions"] / df["gdp_millions"].sum() * 100
` },
  checks: [
    { text: '`df` holds the file (10 provinces)', pts: 1,
      test: py('isinstance(df, L.pd.DataFrame) and len(df) == 10 and "population" in df.columns', '"df has shape " + str(df.shape)'),
      explain: '`pd.read_csv` reads a comma-separated file into a DataFrame: a table with named columns. The file sits next to `lab.py`, so its name is enough.',
      fix: 'import pandas as pd\ndf = pd.read_csv("provinces.csv")' },
    { text: '`df["gdp_per_capita"]` is GDP in dollars per person', pts: 2,
      test: py('"gdp_per_capita" in df.columns and L.np.allclose(df["gdp_per_capita"], df["gdp_millions"] * 1e6 / df["population"])', '("gdp_per_capita starts " + str([round(x) for x in df["gdp_per_capita"][:3]])) if "gdp_per_capita" in df.columns else "no gdp_per_capita column in df"'),
      explain: 'Column arithmetic works row by row, like NumPy. GDP is in **millions**, so multiply by 1,000,000 to get dollars per person (Ontario: about $71,600).',
      fix: 'df["gdp_per_capita"] = df["gdp_millions"] * 1_000_000 / df["population"]' },
    { text: '`ranked` is sorted from highest to lowest GDP per capita', pts: 2,
      test: py('len(ranked) == 10 and ranked["gdp_per_capita"].is_monotonic_decreasing', '"ranked starts with " + str(list(ranked["province"][:3]))'),
      explain: '`sort_values` sorts from low to high by default; `ascending=False` puts the richest first. It returns a new table and leaves `df` unchanged.',
      fix: 'ranked = df.sort_values("gdp_per_capita", ascending=False)' },
    { text: '`richest` is `"Alberta"`', pts: 1,
      test: py('richest == "Alberta"', '"richest = " + repr(richest)'),
      explain: '`iloc[0]` is the first row by position, and `["province"]` picks its name.',
      fix: 'richest = ranked.iloc[0]["province"]' },
    { text: '`national` is total GDP ÷ total population (about $74,499)', pts: 2,
      test: py('abs(national - df["gdp_millions"].sum() * 1e6 / df["population"].sum()) < 0.01', '"national = %.2f (the right figure is %.2f)" % (national, df["gdp_millions"].sum() * 1e6 / df["population"].sum())'),
      explain: 'The **mean of the ten provincial figures** (about $73,775) gives PEI as much weight as Ontario. The national figure must weight each province by its population, which total ÷ total does.',
      fix: 'national = df["gdp_millions"].sum() * 1_000_000 / df["population"].sum()' },
    { text: '`above` holds the 4 provinces above the national figure', pts: 1,
      test: py('sorted(above["province"]) == ["Alberta", "British Columbia", "Newfoundland and Labrador", "Saskatchewan"]', '"above = " + str(sorted(above["province"]))'),
      explain: 'A condition on a column gives True/False for each row; `df[condition]` keeps the True rows. Resource-rich provinces lead; Ontario and Quebec are just below.',
      fix: 'above = df[df["gdp_per_capita"] > national]' },
    { text: '`df["gdp_share"]` gives each province\'s % of national GDP (they add up to 100)', pts: 1,
      test: py('"gdp_share" in df.columns and L.np.allclose(df["gdp_share"], df["gdp_millions"] / df["gdp_millions"].sum() * 100)', '("gdp_share sums to %.2f" % df["gdp_share"].sum()) if "gdp_share" in df.columns else "no gdp_share column in df"'),
      explain: '`df["gdp_millions"].sum()` is a single number, and dividing a column by it gives each province\'s share.',
      fix: 'df["gdp_share"] = df["gdp_millions"] / df["gdp_millions"].sum() * 100' }
  ],
  quiz: [
    { q: 'Which line keeps only the rows where population is above 5 million?', options: ['`df["population" > 5_000_000]`', '`df[df["population"] > 5_000_000]`', '`df.population(> 5_000_000)`', '`df.sort_values(5_000_000)`'], answer: 1,
      explain: '`df["population"] > 5_000_000` makes a True/False column; putting it inside `df[…]` keeps the True rows.' },
    { q: 'Why is the mean of the provinces\' GDP-per-capita figures not Canada\'s GDP per capita?', options: ['pandas rounds the numbers', 'GDP per capita cannot be averaged at all', 'It gives each province equal weight regardless of population', 'It double-counts Ontario'], answer: 2,
      explain: 'A simple mean treats PEI (175,000 people) like Ontario (15.6 million). The national figure is a population-weighted average: total GDP ÷ total population.' },
    { q: 'What does `df.sort_values("gdp_per_capita")` do on its own?', options: ['Returns a new table sorted from lowest to highest', 'Sorts `df` in place, highest first', 'Returns only the gdp_per_capita column', 'Deletes the other columns'], answer: 0,
      explain: 'The default is ascending order, and it returns a new DataFrame. Store it (`ranked = …`) or nothing changes.' }
  ]
},

/* ================================================================== 10. matplotlib */
{
  id: 10, module: 'Charts', topic: 'matplotlib, a demand shift', edit: 'py', art: null,
  title: 'Draw Supply and Demand',
  story: 'The final brief needs a chart. Incomes rise, so concert-ticket demand shifts out to **Qd = 130 − 2P**. Draw the original demand, the supply, and the new demand on one chart, mark both equilibria, and label everything. Economists put **quantity on the horizontal axis and price on the vertical axis**, so plot `(quantity, price)`.',
  steps: [
    'The arrays from Activity 8 are given. Compute the new demand `qd_new = 130 - 2 * prices`.',
    'Find the new equilibrium the same way as before: `eq_new = np.argmin(np.abs(qd_new - qs))`, then `p_star_new = prices[eq_new]` and `q_star_new = qd_new[eq_new]`.',
    { text: 'Make the chart. Quantity goes first (x), price second (y). `"--"` draws a dashed line.', code: 'import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.plot(qd, prices, label="Demand")\nax.plot(qs, prices, label="Supply")\nax.plot(qd_new, prices, "--", label="Demand after income rises")' },
    'Mark both equilibria with one `ax.scatter([q_star, q_star_new], [p_star, p_star_new], color="black")`.',
    'Label the axes `"Quantity"` and `"Price ($)"` (`ax.set_xlabel`, `ax.set_ylabel`), give the chart a title with `ax.set_title`, and add `ax.legend()`.',
    'Print the old and new equilibrium price and quantity.'
  ],
  practise: ['matplotlib', 'fig, ax', 'labels and legend', 'demand shifts'],
  starter: { py: String.raw`# Activity 10: draw supply and demand
import numpy as np

# ---- given: the market from Activity 8 ----
prices = np.arange(0, 51)
qd = 100 - 2 * prices
qs = np.maximum(-20 + 4 * prices, 0)
eq = np.argmin(np.abs(qd - qs))
p_star = prices[eq]
q_star = qd[eq]

# ---- your code ----
# 1. The new demand after incomes rise


# 2. The new equilibrium


# 3. The chart: demand, supply, new demand (dashed)


# 4. Mark both equilibria


# 5. Labels, title, legend


# 6. Print the old and new equilibrium

` },
  solution: { py: String.raw`# Activity 10: draw supply and demand
import numpy as np

# ---- given: the market from Activity 8 ----
prices = np.arange(0, 51)
qd = 100 - 2 * prices
qs = np.maximum(-20 + 4 * prices, 0)
eq = np.argmin(np.abs(qd - qs))
p_star = prices[eq]
q_star = qd[eq]

# ---- your code ----
# 1. The new demand after incomes rise
qd_new = 130 - 2 * prices

# 2. The new equilibrium
eq_new = np.argmin(np.abs(qd_new - qs))
p_star_new = prices[eq_new]
q_star_new = qd_new[eq_new]

# 3. The chart: demand, supply, new demand (dashed)
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
ax.plot(qd, prices, label="Demand")
ax.plot(qs, prices, label="Supply")
ax.plot(qd_new, prices, "--", label="Demand after income rises")

# 4. Mark both equilibria
ax.scatter([q_star, q_star_new], [p_star, p_star_new], color="black")

# 5. Labels, title, legend
ax.set_xlabel("Quantity")
ax.set_ylabel("Price ($)")
ax.set_title("Concert tickets: demand shifts out")
ax.legend()
plt.show()

# 6. Print the old and new equilibrium
print("Before: P =", p_star, " Q =", q_star)
print("After:  P =", p_star_new, " Q =", q_star_new)
` },
  checks: [
    { text: '`qd_new` is `130 - 2 * prices`', pts: 1,
      test: py('L.np.shape(qd_new) == (51,) and L.np.allclose(qd_new, 130 - 2 * L.np.arange(51))', '"qd_new starts " + str(list(qd_new[:4]))'),
      explain: 'A rise in income (for a normal good) shifts the whole demand curve out: at every price, buyers want 30 more tickets.',
      fix: 'qd_new = 130 - 2 * prices' },
    { text: 'The new equilibrium is `p_star_new` = 25 and `q_star_new` = 80', pts: 2,
      test: py('p_star_new == 25 and q_star_new == 80', '"p_star_new = %r, q_star_new = %r" % (p_star_new, q_star_new)'),
      explain: '130 − 2P = −20 + 4P → P = 25, Q = 80. More demand raises both the price and the quantity traded.',
      fix: 'eq_new = np.argmin(np.abs(qd_new - qs))\np_star_new = prices[eq_new]\nq_star_new = qd_new[eq_new]' },
    { text: 'A chart is drawn with `fig, ax = plt.subplots()`', pts: 1,
      test: c => c.check('ax.figure is fig and ' + (c.figs || 0) + ' > 0', '"%d chart(s) drawn" % ' + (c.figs || 0)),
      explain: '`plt.subplots()` returns the figure (the whole picture) and the axes (the plot area). Drawing on `ax` keeps your code clear when there are several charts.',
      fix: 'import matplotlib.pyplot as plt\nfig, ax = plt.subplots()' },
    { text: 'Demand and supply are plotted with **quantity on x and price on y**', pts: 2,
      test: py('any(L.np.array_equal(l.get_xdata(), qd) and L.np.array_equal(l.get_ydata(), prices) for l in ax.get_lines()) and any(L.np.array_equal(l.get_xdata(), qs) and L.np.array_equal(l.get_ydata(), prices) for l in ax.get_lines())', '("%d line(s); prices are on the x axis: plot (quantity, price) instead" % len(ax.get_lines())) if any(L.np.array_equal(l.get_xdata(), prices) for l in ax.get_lines()) else "%d line(s) on the chart" % len(ax.get_lines())'),
      explain: '`ax.plot(x, y)`: the first array goes across, the second up. The economics convention puts price on the vertical axis, so write `ax.plot(qd, prices)`.',
      fix: 'ax.plot(qd, prices, label="Demand")\nax.plot(qs, prices, label="Supply")' },
    { text: 'The new demand is a **dashed** line', pts: 1,
      test: py('any(L.np.array_equal(l.get_xdata(), qd_new) and l.get_linestyle() == "--" for l in ax.get_lines())', '"line styles: " + str([l.get_linestyle() for l in ax.get_lines()])'),
      explain: 'A format string like `"--"` after the data sets the line style. Dashed lines are a common way to show "after the shift".',
      fix: 'ax.plot(qd_new, prices, "--", label="Demand after income rises")' },
    { text: 'Both equilibria (60, 20) and (80, 25) are marked with `scatter`', pts: 1,
      test: py('any(all(any(abs(o[0] - x) < 1e-9 and abs(o[1] - y) < 1e-9 for o in col.get_offsets()) for x, y in [(60, 20), (80, 25)]) for col in ax.collections)', '"points marked: " + str([[list(map(float, o)) for o in col.get_offsets()] for col in ax.collections])'),
      explain: '`ax.scatter(xs, ys)` draws a dot at each (x, y) pair, so pass the quantities first and the prices second, as for the lines.',
      fix: 'ax.scatter([q_star, q_star_new], [p_star, p_star_new], color="black")' },
    { text: 'Axis labels mention quantity and price, there is a title and a legend', pts: 2,
      test: py('"quantity" in ax.get_xlabel().lower() and "price" in ax.get_ylabel().lower() and ax.get_title() != "" and ax.get_legend() is not None', '"x label %r, y label %r, title %r, legend: %s" % (ax.get_xlabel(), ax.get_ylabel(), ax.get_title(), ax.get_legend() is not None)'),
      explain: 'A chart in a newspaper has to stand on its own: readers need to know what each axis and each line means. `ax.legend()` uses the `label=` of each line.',
      fix: 'ax.set_xlabel("Quantity")\nax.set_ylabel("Price ($)")\nax.set_title("Concert tickets: demand shifts out")\nax.legend()' }
  ],
  quiz: [
    { q: 'In `ax.plot(qd, prices)`, which variable is on the horizontal axis?', options: ['`prices`', 'both', '`qd`', 'neither: plot picks automatically'], answer: 2,
      explain: '`plot(x, y)`: the first argument is x (across). Writing quantity first gives the economist\'s layout, with price going up the side.' },
    { q: 'Incomes rise and the good is **normal**. In the market, what happens?', options: ['Demand shifts right: price and quantity both rise', 'Supply shifts right: price falls', 'We move along the demand curve; nothing shifts', 'Demand shifts left: price falls'], answer: 0,
      explain: 'For a normal good, higher income raises demand at every price, so the curve shifts right and the new equilibrium has a higher price and quantity (25 and 80 here).' },
    { q: 'What does `ax.legend()` need in order to show a name for each line?', options: ['A title', 'A `label=` on each plotted line', 'Axis labels', 'Nothing: it always names lines automatically'], answer: 1,
      explain: 'The legend lists the `label=` text of each line. Lines without a label are left out.' }
  ]
}
];
