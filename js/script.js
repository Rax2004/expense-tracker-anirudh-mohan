// Key used to save the transactions inside the browser local storage
const STORAGE_KEY = 'expenseTrackerTransactions';

// Categories are kept here so new ones can be added in one place
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Business', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Application data
let transactions = [];
let editingId = null;
let filterTypeValue = 'all';
let filterCategoryValue = 'all';

// Form elements
const transactionForm = document.getElementById('transactionForm');
const typeInputs = document.querySelectorAll('input[name="type"]');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formHeading = document.getElementById('form-heading');
const editingBadge = document.getElementById('editingBadge');

// Summary elements
const totalIncomeBox = document.getElementById('totalIncome');
const totalExpenseBox = document.getElementById('totalExpense');
const currentBalanceBox = document.getElementById('currentBalance');
const incomeCountBox = document.getElementById('incomeCount');
const expenseCountBox = document.getElementById('expenseCount');

// Transaction list elements
const transactionTable = document.getElementById('transactionTable');
const transactionTableBody = document.getElementById('transactionTableBody');
const emptyState = document.getElementById('emptyState');
const emptyStateHint = document.getElementById('emptyStateHint');
const transactionCount = document.getElementById('transactionCount');

// Filter elements
const filterTypeInputs = document.querySelectorAll('input[name="filterType"]');
const filterCategory = document.getElementById('filterCategory');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// The date input gives a value like 2026-09-02, so the parts are read directly
function formatDate(dateValue) {
  const parts = dateValue.split('-');
  const year = parts[0];
  const monthName = MONTH_NAMES[Number(parts[1]) - 1];
  const day = parts[2];
  return day + ' ' + monthName + ' ' + year;
}

function getTodayAsInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();

  if (month < 10) {
    month = '0' + month;
  }
  if (day < 10) {
    day = '0' + day;
  }

  return year + '-' + month + '-' + day;
}

// Used when reading local storage, so broken records are never shown
function isValidTransaction(record) {
  if (record === null || typeof record !== 'object') {
    return false;
  }
  if (record.type !== 'income' && record.type !== 'expense') {
    return false;
  }

  const amount = Number(record.amount);
  if (isNaN(amount) || amount <= 0) {
    return false;
  }

  if (typeof record.category !== 'string' || record.category === '') {
    return false;
  }
  if (typeof record.date !== 'string' || record.date.length !== 10) {
    return false;
  }
  if (typeof record.description !== 'string' || record.description === '') {
    return false;
  }

  return true;
}

function loadTransactions() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData === null) {
    return [];
  }

  try {
    const savedList = JSON.parse(savedData);

    if (Array.isArray(savedList) === false) {
      return [];
    }

    const cleanList = [];
    for (let i = 0; i < savedList.length; i++) {
      if (isValidTransaction(savedList[i])) {
        const record = savedList[i];
        cleanList.push({
          id: String(record.id),
          type: record.type,
          amount: Number(record.amount),
          category: record.category,
          date: record.date,
          description: record.description,
          createdAt: record.createdAt
        });
      }
    }

    return cleanList;
  } catch (error) {
    console.error('Saved data could not be read, starting with an empty list.', error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Transactions could not be saved to local storage.', error);
  }
}

function calculateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeEntries = 0;
  let expenseEntries = 0;

  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === 'income') {
      totalIncome = totalIncome + transactions[i].amount;
      incomeEntries = incomeEntries + 1;
    } else {
      totalExpense = totalExpense + transactions[i].amount;
      expenseEntries = expenseEntries + 1;
    }
  }

  return {
    income: totalIncome,
    expense: totalExpense,
    balance: totalIncome - totalExpense,
    incomeEntries: incomeEntries,
    expenseEntries: expenseEntries
  };
}

function getEntryCountText(count) {
  if (count === 0) {
    return 'No entries yet';
  }
  if (count === 1) {
    return '1 entry';
  }
  return count + ' entries';
}

function renderSummary() {
  const summary = calculateSummary();

  totalIncomeBox.textContent = formatCurrency(summary.income);
  totalExpenseBox.textContent = formatCurrency(summary.expense);
  currentBalanceBox.textContent = formatCurrency(summary.balance);
  incomeCountBox.textContent = getEntryCountText(summary.incomeEntries);
  expenseCountBox.textContent = getEntryCountText(summary.expenseEntries);

  if (summary.balance < 0) {
    currentBalanceBox.classList.add('is-negative');
  } else {
    currentBalanceBox.classList.remove('is-negative');
  }
}

// Returns a new list, the original transactions array is never changed
function filterTransactions() {
  const result = [];

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    let keep = true;

    if (filterTypeValue !== 'all' && transaction.type !== filterTypeValue) {
      keep = false;
    }
    if (filterCategoryValue !== 'all' && transaction.category !== filterCategoryValue) {
      keep = false;
    }

    if (keep) {
      result.push(transaction);
    }
  }

  return result;
}

function sortByNewestFirst(list) {
  const sortedList = list.slice();

  sortedList.sort(function (first, second) {
    if (first.date < second.date) {
      return 1;
    }
    if (first.date > second.date) {
      return -1;
    }
    if (first.createdAt < second.createdAt) {
      return 1;
    }
    if (first.createdAt > second.createdAt) {
      return -1;
    }
    return 0;
  });

  return sortedList;
}

// data-label is used by the CSS to show a heading for each value on mobile
function createCell(label, content, className) {
  const cell = document.createElement('td');
  cell.setAttribute('data-label', label);

  if (className) {
    cell.className = className;
  }

  if (typeof content === 'string') {
    cell.textContent = content;
  } else {
    cell.appendChild(content);
  }

  return cell;
}

function createActionButton(text, action, transaction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('data-action', action);
  button.setAttribute('data-id', transaction.id);
  button.setAttribute('aria-label', text + ' transaction: ' + transaction.description);
  button.textContent = text;

  if (action === 'delete') {
    button.className = 'btn btn-sm btn-outline-danger';
  } else {
    button.className = 'btn btn-sm btn-outline-secondary';
  }

  return button;
}

function createTransactionRow(transaction) {
  const row = document.createElement('tr');
  row.className = 'transaction-row transaction-row--' + transaction.type;

  const categoryTag = document.createElement('span');
  categoryTag.className = 'category-tag';
  categoryTag.textContent = transaction.category;

  const typeBadge = document.createElement('span');
  let amountText = '';

  if (transaction.type === 'income') {
    typeBadge.className = 'type-badge type-badge--income';
    typeBadge.textContent = 'Income';
    amountText = '+ ' + formatCurrency(transaction.amount);
  } else {
    typeBadge.className = 'type-badge type-badge--expense';
    typeBadge.textContent = 'Expense';
    amountText = '- ' + formatCurrency(transaction.amount);
  }

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  actions.appendChild(createActionButton('Edit', 'edit', transaction));
  actions.appendChild(createActionButton('Delete', 'delete', transaction));

  row.appendChild(createCell('Description', transaction.description, 'transaction-description'));
  row.appendChild(createCell('Category', categoryTag));
  row.appendChild(createCell('Date', formatDate(transaction.date), 'transaction-date'));
  row.appendChild(createCell('Type', typeBadge));
  row.appendChild(createCell('Amount', amountText, 'transaction-amount transaction-amount--' + transaction.type + ' text-end'));
  row.appendChild(createCell('Actions', actions, 'text-end'));

  return row;
}

function renderTransactions() {
  const visibleTransactions = sortByNewestFirst(filterTransactions());

  transactionTableBody.innerHTML = '';

  for (let i = 0; i < visibleTransactions.length; i++) {
    transactionTableBody.appendChild(createTransactionRow(visibleTransactions[i]));
  }

  if (visibleTransactions.length === 0) {
    transactionTable.classList.add('d-none');
    emptyState.classList.remove('d-none');
  } else {
    transactionTable.classList.remove('d-none');
    emptyState.classList.add('d-none');
  }

  if (transactions.length === 0) {
    emptyStateHint.textContent = 'Add your first income or expense using the form.';
  } else {
    emptyStateHint.textContent = 'No transactions match the selected filters.';
  }

  if (visibleTransactions.length === transactions.length) {
    if (transactions.length === 1) {
      transactionCount.textContent = '1 transaction';
    } else {
      transactionCount.textContent = transactions.length + ' transactions';
    }
  } else {
    transactionCount.textContent = visibleTransactions.length + ' of ' + transactions.length + ' shown';
  }
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

// The category list depends on the selected type (income or expense)
function populateCategoryOptions(type) {
  const previousValue = categoryInput.value;
  categoryInput.innerHTML = '';

  if (type === '') {
    categoryInput.appendChild(createOption('', 'Choose a type first'));
    return;
  }

  categoryInput.appendChild(createOption('', 'Select a category'));

  const categoryList = CATEGORIES[type];
  for (let i = 0; i < categoryList.length; i++) {
    categoryInput.appendChild(createOption(categoryList[i], categoryList[i]));
  }

  if (categoryList.indexOf(previousValue) !== -1) {
    categoryInput.value = previousValue;
  }
}

function getCategoriesForFilter() {
  if (filterTypeValue !== 'all') {
    return CATEGORIES[filterTypeValue];
  }

  // Both lists contain "Other", so the same name is only added once
  const allCategories = [];
  const combined = CATEGORIES.income.concat(CATEGORIES.expense);

  for (let i = 0; i < combined.length; i++) {
    if (allCategories.indexOf(combined[i]) === -1) {
      allCategories.push(combined[i]);
    }
  }

  allCategories.sort();
  return allCategories;
}

function populateFilterCategories() {
  filterCategory.innerHTML = '';
  filterCategory.appendChild(createOption('all', 'All categories'));

  const categoryList = getCategoriesForFilter();
  for (let i = 0; i < categoryList.length; i++) {
    filterCategory.appendChild(createOption(categoryList[i], categoryList[i]));
  }

  filterCategory.value = filterCategoryValue;
}

function getSelectedType() {
  for (let i = 0; i < typeInputs.length; i++) {
    if (typeInputs[i].checked) {
      return typeInputs[i].value;
    }
  }
  return '';
}

function init() {
  transactions = loadTransactions();
  console.log('Transactions loaded from local storage: ' + transactions.length);

  dateInput.value = getTodayAsInputValue();
  populateCategoryOptions('');
  populateFilterCategories();

  for (let i = 0; i < typeInputs.length; i++) {
    typeInputs[i].addEventListener('change', function () {
      populateCategoryOptions(getSelectedType());
    });
  }

  render();
  console.log('Spendly initialized');
}

init();
