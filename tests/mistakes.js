/* Typical student mistakes: each must lose points (run by verify_lab.js). f = { py } of the proper code. */
const swap = (a, b) => f => ({ ...f, py: f.py.replace(a, b) });

const MISTAKES = {
  1: [
    ['growth rate as 1.2, not 0.012', swap('growth_rate = 0.012', 'growth_rate = 1.2')],
    ['floor division', swap('gdp_per_capita = gdp / population', 'gdp_per_capita = gdp // population')],
    ['no number format', swap('print(f"GDP per capita: ${gdp_per_capita:,.2f}")', 'print("GDP per capita:", gdp_per_capita)')]
  ],
  2: [
    ['divided by the new CPI', swap('inflation = (cpi_2023 - cpi_2022) / cpi_2022 * 100', 'inflation = (cpi_2023 - cpi_2022) / cpi_2023 * 100')],
    ['no brackets', swap('inflation = (cpi_2023 - cpi_2022) / cpi_2022 * 100', 'inflation = cpi_2023 - cpi_2022 / cpi_2022 * 100')],
    ['deflated the wrong way', swap('real_wage_2023 = wage_2023 * cpi_2022 / cpi_2023', 'real_wage_2023 = wage_2023 * cpi_2023 / cpi_2022')]
  ],
  3: [
    ['print instead of return', swap('def pct_change(old, new):\n    return (new - old) / old * 100', 'def pct_change(old, new):\n    print((new - old) / old * 100)')],
    ['no abs()', swap('return abs(midpoint_change(q1, q2) / midpoint_change(p1, p2))', 'return midpoint_change(q1, q2) / midpoint_change(p1, p2)')],
    ['ordinary % change, not midpoint', swap('return (new - old) / ((old + new) / 2) * 100', 'return (new - old) / old * 100')]
  ],
  4: [
    ['>= in classify', swap('    if e > 1:', '    if e >= 1:')],
    ['whole income at the bracket rate', swap('return 55000 * 0.15 + (income - 55000) * 0.205', 'return income * 0.205')],
    ['marginal rate instead of average', swap('avg_rate_80k = tax_80k / 80000 * 100', 'avg_rate_80k = 20.5')]
  ],
  5: [
    ['range starts at 0', swap('for i in range(1, len(cpi)):', 'for i in range(len(cpi)):')],
    ['year offset forgotten', swap('peak_year = years[inflation.index(peak) + 1]', 'peak_year = years[inflation.index(peak)]')]
  ],
  6: [
    ['counter starts at 1', swap('    years = 0\n', '    years = 1\n')],
    ['rule of 70 with a decimal rate', swap('rule70.append(70 / (r * 100))', 'rule70.append(70 / r)')],
    ['31 years of growth', swap('for year in range(30):', 'for year in range(31):')]
  ],
  7: [
    ['2020 prices in both', swap('cost_2024 = cost_2024 + qty * prices_2024[item]', 'cost_2024 = cost_2024 + qty * prices_2020[item]')],
    ['max compares names', swap('biggest = max(price_change, key=price_change.get)', 'biggest = max(price_change)')]
  ],
  8: [
    ['negative supply', swap('qs = np.maximum(-20 + 4 * prices, 0)', 'qs = -20 + 4 * prices')],
    ['argmax instead of argmin', swap('eq = np.argmin(np.abs(gap))', 'eq = np.argmax(np.abs(gap))')],
    ['arange stops at 49', swap('prices = np.arange(0, 51)', 'prices = np.arange(0, 50)')]
  ],
  9: [
    ['unweighted mean for the national figure', swap('national = df["gdp_millions"].sum() * 1_000_000 / df["population"].sum()', 'national = df["gdp_per_capita"].mean()')],
    ['sorted lowest first', swap('ranked = df.sort_values("gdp_per_capita", ascending=False)', 'ranked = df.sort_values("gdp_per_capita")')],
    ['GDP left in millions', swap('df["gdp_per_capita"] = df["gdp_millions"] * 1_000_000 / df["population"]', 'df["gdp_per_capita"] = df["gdp_millions"] / df["population"]')]
  ],
  10: [
    ['price on the x axis', f => ({ ...f, py: f.py.replace('ax.plot(qd, prices, label="Demand")', 'ax.plot(prices, qd, label="Demand")').replace('ax.plot(qs, prices, label="Supply")', 'ax.plot(prices, qs, label="Supply")') })],
    ['no legend', swap('ax.legend()\n', '\n')],
    ['solid new demand', swap('ax.plot(qd_new, prices, "--", label=', 'ax.plot(qd_new, prices, label=')]
  ]
};
