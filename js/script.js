'use strict';

const STORAGE_KEY = 'expenseTrackerTransactions';

/* Add or rename categories here - the form and the filter both read from this object. */
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Business', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
};

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

let transactions = [];
let editingId = null;
const activeFilters = { type: 'all', category: 'all' };

const dom = {
  form: document.getElementById('transactionForm'),
  typeInputs: document.querySelectorAll('input[name="type"]'),
  amount: document.getElementById('amount'),
  category: document.getElementById('category'),
  date: document.getElementById('date'),
  description: document.getElementById('description'),
  submitBtn: document.getElementById('submitBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  formHeading: document.getElementById('form-heading'),
  editingBadge: document.getElementById('editingBadge'),
  totalIncome: document.getElementById('totalIncome'),
  totalExpense: document.getElementById('totalExpense'),
  currentBalance: document.getElementById('currentBalance'),
  table: document.getElementById('transactionTable'),
  tableBody: document.getElementById('transactionTableBody'),
  emptyState: document.getElementById('emptyState'),
  emptyStateHint: document.getElementById('emptyStateHint'),
  transactionCount: document.getElementById('transactionCount'),
  filterType: document.getElementById('filterType'),
  filterCategory: document.getElementById('filterCategory'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn')
};

function formatCurrency(amount) {
  return CURRENCY_FORMATTER.format(amount);
}

/* Builds the date from its parts so the displayed day never shifts with the time zone. */
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return DATE_FORMATTER.format(new Date(year, month - 1, day));
}

function getTodayAsInputValue() {
  const today = new Date();
  const localTime = today.getTime() - today.getTimezoneOffset() * 60000;
  return new Date(localTime).toISOString().slice(0, 10);
}

function isValidTransaction(record) {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const amount = Number(record.amount);
  const hasKnownType = record.type === 'income' || record.type === 'expense';
  const hasValidDate = typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date);

  return hasKnownType &&
    Number.isFinite(amount) && amount > 0 &&
    typeof record.category === 'string' && record.category.trim() !== '' &&
    hasValidDate &&
    typeof record.description === 'string' && record.description.trim() !== '';
}

function normalizeTransaction(record) {
  return {
    id: String(record.id),
    type: record.type,
    amount: Number(record.amount),
    category: record.category.trim(),
    date: record.date,
    description: record.description.trim(),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : ''
  };
}

function loadTransactions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Stored transactions were not a list, starting with an empty one.');
      return [];
    }

    return parsed.filter(isValidTransaction).map(normalizeTransaction);
  } catch (error) {
    console.error('Could not read saved transactions from local storage.', error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Could not save transactions to local storage.', error);
    return false;
  }
}

function calculateSummary() {
  const totals = transactions.reduce((accumulator, transaction) => {
    if (transaction.type === 'income') {
      accumulator.income += transaction.amount;
    } else {
      accumulator.expense += transaction.amount;
    }
    return accumulator;
  }, { income: 0, expense: 0 });

  return { ...totals, balance: totals.income - totals.expense };
}

function renderSummary() {
  const { income, expense, balance } = calculateSummary();

  dom.totalIncome.textContent = formatCurrency(income);
  dom.totalExpense.textContent = formatCurrency(expense);
  dom.currentBalance.textContent = formatCurrency(balance);
  dom.currentBalance.classList.toggle('is-negative', balance < 0);
}

function filterTransactions() {
  return transactions.filter((transaction) => {
    const matchesType = activeFilters.type === 'all' || transaction.type === activeFilters.type;
    const matchesCategory = activeFilters.category === 'all' || transaction.category === activeFilters.category;
    return matchesType && matchesCategory;
  });
}

function sortByNewestFirst(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function createCell(label, content, className) {
  const cell = document.createElement('td');
  cell.dataset.label = label;
  if (className) {
    cell.className = className;
  }

  if (content instanceof Node) {
    cell.appendChild(content);
  } else {
    cell.textContent = content;
  }

  return cell;
}

function createTransactionRow(transaction) {
  const row = document.createElement('tr');
  row.dataset.id = transaction.id;

  const categoryTag = document.createElement('span');
  categoryTag.className = 'category-tag';
  categoryTag.textContent = transaction.category;

  const typeBadge = document.createElement('span');
  typeBadge.className = `type-badge type-badge--${transaction.type}`;
  typeBadge.textContent = transaction.type === 'income' ? 'Income' : 'Expense';

  const sign = transaction.type === 'income' ? '+' : '−';
  const amountText = `${sign} ${formatCurrency(transaction.amount)}`;

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  actions.appendChild(createRowButton('Edit', 'edit', transaction));
  actions.appendChild(createRowButton('Delete', 'delete', transaction));

  row.appendChild(createCell('Description', transaction.description, 'transaction-description'));
  row.appendChild(createCell('Category', categoryTag));
  row.appendChild(createCell('Date', formatDate(transaction.date), 'transaction-date'));
  row.appendChild(createCell('Type', typeBadge));
  row.appendChild(createCell('Amount', amountText, `transaction-amount transaction-amount--${transaction.type} text-end`));
  row.appendChild(createCell('Actions', actions, 'text-end'));

  return row;
}

function createRowButton(text, action, transaction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = action === 'delete'
    ? 'btn btn-sm btn-outline-danger'
    : 'btn btn-sm btn-outline-secondary';
  button.dataset.action = action;
  button.dataset.id = transaction.id;
  button.textContent = text;
  button.setAttribute('aria-label', `${text} transaction: ${transaction.description}`);
  return button;
}

function renderTransactions() {
  const visible = sortByNewestFirst(filterTransactions());

  dom.tableBody.replaceChildren();
  visible.forEach((transaction) => {
    dom.tableBody.appendChild(createTransactionRow(transaction));
  });

  dom.table.classList.toggle('d-none', visible.length === 0);
  dom.emptyState.classList.toggle('d-none', visible.length > 0);
  dom.emptyStateHint.textContent = transactions.length === 0
    ? 'Add your first income or expense using the form.'
    : 'No transactions match the selected filters.';

  dom.transactionCount.textContent = visible.length === transactions.length
    ? `${transactions.length} ${transactions.length === 1 ? 'transaction' : 'transactions'}`
    : `${visible.length} of ${transactions.length} shown`;
}

function render() {
  renderSummary();
  renderTransactions();
}

function createOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function populateCategoryOptions(type) {
  const previousValue = dom.category.value;
  dom.category.replaceChildren();

  if (!type) {
    dom.category.appendChild(createOption('', 'Choose a type first'));
    return;
  }

  dom.category.appendChild(createOption('', 'Select a category'));
  CATEGORIES[type].forEach((category) => {
    dom.category.appendChild(createOption(category, category));
  });

  if (CATEGORIES[type].includes(previousValue)) {
    dom.category.value = previousValue;
  }
}

function getCategoriesForFilter() {
  if (activeFilters.type === 'all') {
    const unique = new Set([...CATEGORIES.income, ...CATEGORIES.expense]);
    return [...unique].sort((a, b) => a.localeCompare(b));
  }
  return CATEGORIES[activeFilters.type];
}

function populateFilterCategories() {
  dom.filterCategory.replaceChildren(createOption('all', 'All categories'));
  getCategoriesForFilter().forEach((category) => {
    dom.filterCategory.appendChild(createOption(category, category));
  });

  dom.filterCategory.value = activeFilters.category;
}

function getSelectedType() {
  const checked = [...dom.typeInputs].find((input) => input.checked);
  return checked ? checked.value : '';
}

function init() {
  transactions = loadTransactions();
  console.log(`Transactions loaded from local storage: ${transactions.length}`);

  dom.date.value = getTodayAsInputValue();
  populateCategoryOptions('');
  populateFilterCategories();

  dom.typeInputs.forEach((input) => {
    input.addEventListener('change', () => populateCategoryOptions(getSelectedType()));
  });

  render();
  console.log('Expense tracker initialized');
}

init();
