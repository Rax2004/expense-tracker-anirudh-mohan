# Spendly

Spendly is a small expense tracker I built for a coding assignment. You add what you earn and what
you spend, and it keeps a running balance for you. Everything lives in the browser's local storage,
so the data is still there the next time you open the page. No login, no server, no database.

Track · Control · Grow - Every Rupee Counts!

## What it does

- Add an entry as income or expense with an amount, category, date and a short description
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

Two extras on top of that:

- **Monthly expenses** - this month against last month, with the difference written out
- **Spending by category** - a bar chart of where the money went, built with plain HTML and CSS
  rather than a chart library, and redrawn whenever a transaction is added, edited or deleted

## Built with

- HTML5 and CSS3
- Bootstrap 5 (grid, forms, buttons, the confirmation dialog) loaded from a CDN
- Plain JavaScript, no framework and no build step
- Local storage for saving the data

Amounts are shown in rupees. If you want a different currency, `formatCurrency()` in
`js/script.js` is the only place to change.

## Running it

Download or clone the folder and open `index.html` in any browser. There is nothing to install.

## How the data is saved

All transactions sit in one array. Every time it changes it gets written to local storage under the
key `expenseTrackerTransactions` using `JSON.stringify()`. On page load it is read back with
`JSON.parse()` inside a `try / catch`, and every record is checked before it is used, so a missing
key or edited/broken data just gives you an empty list instead of a broken page.

Each transaction looks like this:

```json
{
  "id": "1788369588254",
  "type": "expense",
  "amount": 1250.5,
  "category": "Food",
  "date": "2026-09-02",
  "description": "Groceries for the week",
  "createdAt": "2026-09-02T17:19:48.254Z"
}
```

## Accessibility

Labels on every field, buttons with real text, a visible focus ring, a skip link, and the totals sit
in polite live regions so a screen reader hears them change. Income and expense are not told apart
by colour alone - each row also carries a text badge and a + or - in front of the amount.
