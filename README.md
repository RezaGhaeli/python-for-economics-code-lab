# Python for Economics Code Lab

**Created by [Reza Ghaeli](https://github.com/RezaGhaeli)**

▶ **Open the lab:** https://rezaghaeli.github.io/python-for-economics-code-lab/

An interactive, auto-graded practice lab that introduces Python to first-year Economics students.
Students write real Python in the browser (it runs locally with [Pyodide](https://pyodide.org), so
nothing needs installing), press Run to see their output and charts, answer three multiple-choice
questions, and submit to get a score, an explanation of every mistake, the right quiz answers, and
the proper code beside their own.

## The activities

The running case is a (fictional) student research group writing short economic briefs.
Figures are rounded and approximate, for practice.

| # | Topic | What students build |
|---|---|---|
| 1 | Variables, f-strings | GDP per capita and next year's GDP |
| 2 | Percentage change | Inflation from the CPI, real vs nominal wage growth |
| 3 | Functions | A midpoint price-elasticity calculator |
| 4 | if / elif / else | Elastic or inelastic; a progressive income tax (marginal vs average rate) |
| 5 | Lists, for loops | Year-by-year inflation |
| 6 | while loops | Years to double vs the Rule of 70; compound interest |
| 7 | Dictionaries | A CPI built from a basket of goods |
| 8 | NumPy | Market equilibrium, revenue-maximising price, shortage under a price ceiling |
| 9 | pandas | GDP per capita by province; population-weighted vs simple averages |
| 10 | matplotlib | A supply-and-demand chart with a demand shift |

Each activity ends with three multiple-choice questions (1 point each). Progress is saved in each
student's browser; the results page prints to PDF.

## Running it locally

It is a static site: serve the folder with any web server, e.g. `python3 -m http.server`, and open
http://localhost:8000.

---

© 2026 Reza Ghaeli · [github.com/RezaGhaeli](https://github.com/RezaGhaeli)
