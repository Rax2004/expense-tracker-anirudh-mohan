# Expense Tracker

A personal expense tracker that runs entirely in the browser. Transactions are recorded through a
simple form and stored in the browser's Local Storage, so the data survives a page refresh without
any backend or database.

## Features

Implemented so far:

- Dashboard summary of total income, total expenses and current balance
- Transaction list with a table layout on desktop and a stacked card layout on small screens
- Category options driven by the selected transaction type
- Local Storage persistence with safe handling of missing or malformed stored data
- Empty state when there are no transactions to show

Remaining work is tracked through the project checkpoints (add, edit, delete, filtering,
validation, responsive polish).

## Technologies

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript
- Browser Local Storage

## How to Run

Open `index.html` directly in a browser.

A local development server is recommended so the page runs on an `http://` origin, which keeps
Local Storage behaviour consistent across browsers:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Structure

```text
expense-tracker-anirudhmohan/
├── index.html        Page markup: summary cards, transaction form, filters, transaction table
├── css/
│   └── style.css     Custom styling on top of Bootstrap, including the responsive table layout
├── js/
│   └── script.js     Application logic: state, Local Storage, rendering, calculations
├── assets/
│   └── logo.svg      Application mark, also used as the favicon
└── README.md
```

## Future Improvements

- Export transactions to CSV
- Search transactions by description
- Monthly budget limits with warnings when a category is close to its limit
