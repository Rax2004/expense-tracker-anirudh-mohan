# Spendly

Spendly is a small expense tracker I built for a coding assignment. You add what you earn and what
you spend, and it keeps a running balance for you. Everything lives in the browser's local storage,
so the data is still there the next time you open the page. No login, no server, no database.

Track · Control · Grow - Every Rupee Counts!

**Status:** the form, the transaction list, the totals and local storage are working. Edit, delete,
filtering and form validation are the next things I am wiring up.

## What it does

- Add an entry as income or expense with an amount, category, date and a short description
- Categories change depending on the type you pick (Salary, Freelance... for income, Food,
  Transport... for expenses)
- Totals for income, expenses and the balance, recalculated whenever the data changes
- Transaction list as a table on desktop, and as stacked cards on phones so nothing gets squeezed
- A proper empty state instead of a blank box when there is nothing to show
- Broken or missing local storage data is ignored instead of crashing the page

Coming with the next checkpoints: editing an entry, deleting with a confirmation, filtering by type
and category, and the form validation messages.

## Built with

- HTML5 and CSS3
- Bootstrap 5 (grid, forms, buttons) loaded from a CDN
- Plain JavaScript, no framework and no build step
- Local storage for saving the data

Amounts are shown in rupees. If you want a different currency, `formatCurrency()` in
`js/script.js` is the only place to change.

## Running it

Download or clone the folder and open `index.html` in any modern browser. That is enough.

If you prefer to serve it over http (closer to how it would actually run), any static server does
the job. With Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

```text
index.html      the whole page: summary cards, the form, the filters and the transaction table
css/style.css   my styling on top of Bootstrap, including the table to card switch for phones
js/script.js    all the logic: state, local storage, calculations, rendering
assets/         the Spendly mark, also used as the favicon
```

I kept the JavaScript in one file with small functions (`loadTransactions`, `saveTransactions`,
`calculateSummary`, `renderTransactions`, and so on) instead of splitting it into modules. For a
project this size it is easier to follow, and I can explain every part of it.

## How the data is saved

All transactions sit in one array. Every time it changes it gets written to local storage under the
key `expenseTrackerTransactions` using `JSON.stringify()`. On page load it is read back with
`JSON.parse()` inside a `try / catch`, and every record is checked before it is used, so a missing
key or edited/broken data just gives you an empty list instead of a broken page.

## What I would add next

- Export to CSV
- A search box for descriptions
- Monthly budget limits with a warning when a category gets close
- A simple category chart drawn on a canvas
