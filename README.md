# Spendly

Spendly is a small expense tracker I built for a coding assignment. You add what you earn and what
you spend, and it keeps a running balance for you. Everything lives in the browser's local storage,
so the data is still there the next time you open the page.

## What it does

- Add an entry as income or expense with an amount, category, date and an optional description
- Categories change depending on the type you pick (Salary, Freelance... for income, Food,
  Transport... for expenses)
- Totals for income, expenses and the balance, recalculated whenever the data changes
- Edit an entry in the same form, which updates the existing record instead of adding a second one
- Delete an entry, with a confirmation dialog naming the transaction first
- Filter by type or by category without touching the saved data
- Every field is validated in JavaScript, so an invalid entry never reaches local storage
- Transaction list as a table on desktop, and as stacked cards on phones so nothing gets squeezed
- A proper empty state instead of a blank box when there is nothing to show, including when a
  filter has no matches
- Broken or missing local storage data is ignored instead of crashing the page

A few extras on top of that:

- **Monthly expenses** - this month against last month, with the difference written out
- **Spending by category** - a bar chart of where the money went, built with plain HTML and CSS
  rather than a chart library, and redrawn whenever a transaction is added, edited or deleted
- **Balance trend** - a line chart of the balance with 1 day, 1 month, 6 month and 1 year views,
  drawn with a plain SVG path instead of a chart library. The 1 day view plots every entry made
  today by the time it was added. Green when the balance ended the period higher than it started,
  red when it ended lower
- **Dark mode** - a toggle in the header that follows your system setting by default and remembers
  your choice

## Built with

- HTML5 and CSS3
- Bootstrap 5 (grid, forms, buttons, the confirmation dialog) loaded from a CDN
- Plain JavaScript, no framework and no build step
- Local storage for saving the data

Amounts are shown in rupees. If you want a different currency, `formatCurrency()` in
`js/script.js` is the only place to change.

## Running it

Download or clone the folder and open `index.html` in any browser.

## Credits

The look of the app is based on the Expenzo Expense Tracker App UI Kit by RL Studio on UI8. I used it as a design reference only, for things like the balance headline, the paired summary cards and the bottom tab bar on phones. No files from the kit are used here, the HTML and CSS are written from scratch.

The Spendly name and the Spendly logo were created with the assistance of ChatGPT by OpenAI.

Fonts are Plus Jakarta Sans and Inter from Google Fonts.
