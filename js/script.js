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

const formAlert = document.getElementById('formAlert');

// Places where the validation messages are shown
const typeError = document.getElementById('typeError');
const amountError = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');
const dateError = document.getElementById('dateError');
const descriptionError = document.getElementById('descriptionError');

// Summary elements
const totalIncomeBox = document.getElementById('totalIncome');
const totalExpenseBox = document.getElementById('totalExpense');
const currentBalanceBox = document.getElementById('currentBalance');
const incomeCountBox = document.getElementById('incomeCount');
const expenseCountBox = document.getElementById('expenseCount');

// Transaction list elements
const listHeading = document.getElementById('list-heading');
const transactionTable = document.getElementById('transactionTable');
const transactionTableBody = document.getElementById('transactionTableBody');
const emptyState = document.getElementById('emptyState');
const emptyStateHint = document.getElementById('emptyStateHint');
const transactionCount = document.getElementById('transactionCount');

// Monthly summary and chart elements
const currentMonthLabel = document.getElementById('currentMonthLabel');
const currentMonthExpense = document.getElementById('currentMonthExpense');
const previousMonthLabel = document.getElementById('previousMonthLabel');
const previousMonthExpense = document.getElementById('previousMonthExpense');
const monthComparison = document.getElementById('monthComparison');
const categoryChart = document.getElementById('categoryChart');
const chartEmpty = document.getElementById('chartEmpty');

// Filter elements
const filterTypeInputs = document.querySelectorAll('input[name="filterType"]');
const filterCategory = document.getElementById('filterCategory');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Delete confirmation elements
const deleteModalElement = document.getElementById('deleteModal');
const deleteModalName = document.getElementById('deleteModalName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

let deleteModal = null;
let idToDelete = null;
let deleteWasConfirmed = false;

// A negative balance reads better as -₹500.00 than ₹-500.00
function formatCurrency(amount) {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (amount < 0) {
    return '-₹' + formatted;
  }

  return '₹' + formatted;
}

// The date input gives a value like 2026-09-02, so the parts are read directly
function formatDate(dateValue) {
  const parts = dateValue.split('-');
  const year = parts[0];
  const monthName = MONTH_NAMES[Number(parts[1]) - 1];
  const day = parts[2];
  return day + ' ' + monthName + ' ' + year;
}

function padTwoDigits(value) {
  if (value < 10) {
    return '0' + value;
  }
  return String(value);
}

function getTodayAsInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = padTwoDigits(today.getMonth() + 1);
  const day = padTwoDigits(today.getDate());

  return year + '-' + month + '-' + day;
}

// Used when reading local storage, so broken records are never shown
function isValidTransaction(record) {
  if (record === null || typeof record !== 'object') {
    return false;
  }
  if (record.id === undefined || record.id === null || record.id === '') {
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
  // The date has to look like 2026-09-02, otherwise it cannot be displayed
  if (typeof record.date !== 'string' || /^\d{4}-\d{2}-\d{2}$/.test(record.date) === false) {
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
          createdAt: record.createdAt || ''
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

function getTransactionCountText(count) {
  if (count === 1) {
    return '1 transaction';
  }
  return count + ' transactions';
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
    transactionCount.textContent = getTransactionCountText(transactions.length);
  } else {
    transactionCount.textContent = visibleTransactions.length + ' of ' + transactions.length + ' shown';
  }
}

// A stored date looks like 2026-09-02, so the first seven characters are the month
function getMonthKey(dateValue) {
  return dateValue.slice(0, 7);
}

function getMonthLabel(monthKey) {
  const year = monthKey.split('-')[0];
  const month = Number(monthKey.split('-')[1]);
  return MONTH_NAMES[month - 1] + ' ' + year;
}

function getPreviousMonthKey(monthKey) {
  let year = Number(monthKey.split('-')[0]);
  let month = Number(monthKey.split('-')[1]);

  if (month === 1) {
    month = 12;
    year = year - 1;
  } else {
    month = month - 1;
  }

  return year + '-' + padTwoDigits(month);
}

function getExpenseTotalForMonth(monthKey) {
  let total = 0;

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    if (transaction.type === 'expense' && getMonthKey(transaction.date) === monthKey) {
      total = total + transaction.amount;
    }
  }

  return total;
}

function renderMonthlySummary() {
  const thisMonth = getMonthKey(getTodayAsInputValue());
  const lastMonth = getPreviousMonthKey(thisMonth);
  const thisMonthTotal = getExpenseTotalForMonth(thisMonth);
  const lastMonthTotal = getExpenseTotalForMonth(lastMonth);

  currentMonthLabel.textContent = getMonthLabel(thisMonth);
  previousMonthLabel.textContent = getMonthLabel(lastMonth);
  currentMonthExpense.textContent = formatCurrency(thisMonthTotal);
  previousMonthExpense.textContent = formatCurrency(lastMonthTotal);

  if (thisMonthTotal === 0 && lastMonthTotal === 0) {
    monthComparison.textContent = 'No expenses recorded for either month.';
  } else if (lastMonthTotal === 0) {
    monthComparison.textContent = 'Nothing recorded in ' + getMonthLabel(lastMonth) + ' to compare with.';
  } else if (thisMonthTotal > lastMonthTotal) {
    monthComparison.textContent = formatCurrency(thisMonthTotal - lastMonthTotal) + ' more than last month.';
  } else if (thisMonthTotal < lastMonthTotal) {
    monthComparison.textContent = formatCurrency(lastMonthTotal - thisMonthTotal) + ' less than last month.';
  } else {
    monthComparison.textContent = 'The same as last month.';
  }
}

// Adds up the expenses of each category, biggest first
function getExpenseTotalsByCategory() {
  const groups = [];

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    if (transaction.type === 'expense') {
      let group = null;

      for (let j = 0; j < groups.length; j++) {
        if (groups[j].category === transaction.category) {
          group = groups[j];
        }
      }

      if (group === null) {
        groups.push({ category: transaction.category, total: transaction.amount });
      } else {
        group.total = group.total + transaction.amount;
      }
    }
  }

  groups.sort(function (first, second) {
    return second.total - first.total;
  });

  return groups;
}

function createChartRow(group, shareOfTotal) {
  const row = document.createElement('li');
  row.className = 'chart__row';

  const name = document.createElement('span');
  name.className = 'chart__name';
  name.textContent = group.category;

  const value = document.createElement('span');
  value.className = 'chart__value';
  value.textContent = formatCurrency(group.total) + ' (' + shareOfTotal + '%)';

  const head = document.createElement('div');
  head.className = 'chart__head';
  head.appendChild(name);
  head.appendChild(value);

  const bar = document.createElement('div');
  bar.className = 'chart__bar';
  bar.style.width = shareOfTotal + '%';

  const track = document.createElement('div');
  track.className = 'chart__track';
  track.appendChild(bar);

  row.appendChild(head);
  row.appendChild(track);

  return row;
}

function renderCategoryChart() {
  const groups = getExpenseTotalsByCategory();

  categoryChart.innerHTML = '';

  if (groups.length === 0) {
    categoryChart.classList.add('d-none');
    chartEmpty.classList.remove('d-none');
    return;
  }

  categoryChart.classList.remove('d-none');
  chartEmpty.classList.add('d-none');

  let totalExpense = 0;
  for (let i = 0; i < groups.length; i++) {
    totalExpense = totalExpense + groups[i].total;
  }

  for (let i = 0; i < groups.length; i++) {
    const shareOfTotal = Math.round((groups[i].total / totalExpense) * 100);
    categoryChart.appendChild(createChartRow(groups[i], shareOfTotal));
  }
}

function render() {
  renderSummary();
  renderTransactions();
  renderMonthlySummary();
  renderCategoryChart();
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

  // The chosen category may not belong to the chosen type any more
  if (categoryList.indexOf(filterCategoryValue) === -1) {
    filterCategoryValue = 'all';
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

function showFormAlert(message) {
  formAlert.textContent = message;
  formAlert.classList.remove('d-none');
}

function hideFormAlert() {
  formAlert.textContent = '';
  formAlert.classList.add('d-none');
}

function clearFormErrors() {
  const errorBoxes = document.querySelectorAll('.form-error');
  for (let i = 0; i < errorBoxes.length; i++) {
    errorBoxes[i].textContent = '';
  }

  const inputs = [amountInput, categoryInput, dateInput, descriptionInput];
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].classList.remove('is-invalid');
    inputs[i].removeAttribute('aria-invalid');
  }
}

function showFieldError(errorBox, input, message) {
  errorBox.textContent = message;

  if (input !== null) {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
  }
}

// Checks every field and shows a message for each problem it finds
function validateForm() {
  clearFormErrors();

  let isValid = true;
  let firstInvalidField = null;

  if (getSelectedType() === '') {
    showFieldError(typeError, null, 'Please select a transaction type.');
    if (firstInvalidField === null) {
      firstInvalidField = typeInputs[0];
    }
    isValid = false;
  }

  const amountText = amountInput.value.trim();
  const amount = Number(amountText);
  let amountMessage = '';

  if (amountText === '') {
    amountMessage = 'Please enter an amount.';
  } else if (isNaN(amount)) {
    amountMessage = 'Please enter a valid number.';
  } else if (amount <= 0) {
    amountMessage = 'Amount must be greater than 0.';
  }

  if (amountMessage !== '') {
    showFieldError(amountError, amountInput, amountMessage);
    if (firstInvalidField === null) {
      firstInvalidField = amountInput;
    }
    isValid = false;
  }

  if (categoryInput.value === '') {
    showFieldError(categoryError, categoryInput, 'Please select a category.');
    if (firstInvalidField === null) {
      firstInvalidField = categoryInput;
    }
    isValid = false;
  }

  if (dateInput.value === '') {
    showFieldError(dateError, dateInput, 'Please select a date.');
    if (firstInvalidField === null) {
      firstInvalidField = dateInput;
    }
    isValid = false;
  }

  if (descriptionInput.value.trim() === '') {
    showFieldError(descriptionError, descriptionInput, 'Please enter a description.');
    if (firstInvalidField === null) {
      firstInvalidField = descriptionInput;
    }
    isValid = false;
  }

  if (firstInvalidField !== null) {
    firstInvalidField.focus();
  }

  return isValid;
}

function addTransaction() {
  const newTransaction = {
    id: Date.now().toString(),
    type: getSelectedType(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    description: descriptionInput.value.trim(),
    createdAt: new Date().toISOString()
  };

  transactions.push(newTransaction);
  saveTransactions();
  console.log('New transaction saved');
}

function findTransactionIndex(id) {
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].id === id) {
      return i;
    }
  }
  return -1;
}

// Changes the existing record instead of adding a second one
function updateTransaction() {
  const index = findTransactionIndex(editingId);

  if (index === -1) {
    showFormAlert('That transaction no longer exists. It may have been deleted.');
    return;
  }

  transactions[index].type = getSelectedType();
  transactions[index].amount = Number(amountInput.value);
  transactions[index].category = categoryInput.value;
  transactions[index].date = dateInput.value;
  transactions[index].description = descriptionInput.value.trim();

  saveTransactions();
  console.log('Transaction updated');
}

function startEdit(id) {
  const index = findTransactionIndex(id);

  if (index === -1) {
    showFormAlert('That transaction no longer exists. It may have been deleted.');
    render();
    return;
  }

  const transaction = transactions[index];
  editingId = id;

  hideFormAlert();
  clearFormErrors();

  for (let i = 0; i < typeInputs.length; i++) {
    if (typeInputs[i].value === transaction.type) {
      typeInputs[i].checked = true;
    } else {
      typeInputs[i].checked = false;
    }
  }

  populateCategoryOptions(transaction.type);
  categoryInput.value = transaction.category;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  descriptionInput.value = transaction.description;

  formHeading.textContent = 'Edit Transaction';
  submitBtn.textContent = 'Save Changes';
  cancelEditBtn.classList.remove('d-none');
  editingBadge.classList.remove('d-none');

  amountInput.focus();
}

function stopEditing() {
  editingId = null;
  formHeading.textContent = 'Add Transaction';
  submitBtn.textContent = 'Add Transaction';
  cancelEditBtn.classList.add('d-none');
  editingBadge.classList.add('d-none');
}

function askToDelete(id) {
  const index = findTransactionIndex(id);

  if (index === -1) {
    render();
    return;
  }

  idToDelete = id;
  deleteModalName.textContent = transactions[index].description;
  deleteModal.show();
}

function deleteTransaction(id) {
  const index = findTransactionIndex(id);

  if (index === -1) {
    return;
  }

  transactions.splice(index, 1);
  saveTransactions();
  console.log('Transaction deleted');

  if (editingId === id) {
    stopEditing();
    resetForm();
  }

  render();
}

// One listener on the table handles the buttons of every row
function handleTableClick(event) {
  const action = event.target.getAttribute('data-action');

  if (action === null) {
    return;
  }

  const id = event.target.getAttribute('data-id');

  if (action === 'edit') {
    startEdit(id);
  } else if (action === 'delete') {
    askToDelete(id);
  }
}

function getSelectedFilterType() {
  for (let i = 0; i < filterTypeInputs.length; i++) {
    if (filterTypeInputs[i].checked) {
      return filterTypeInputs[i].value;
    }
  }
  return 'all';
}

function handleFilterTypeChange() {
  filterTypeValue = getSelectedFilterType();
  populateFilterCategories();
  renderTransactions();
}

function handleFilterCategoryChange() {
  filterCategoryValue = filterCategory.value;
  renderTransactions();
}

function resetFilters() {
  filterTypeValue = 'all';
  filterCategoryValue = 'all';

  for (let i = 0; i < filterTypeInputs.length; i++) {
    if (filterTypeInputs[i].value === 'all') {
      filterTypeInputs[i].checked = true;
    }
  }

  populateFilterCategories();
  renderTransactions();
}

function resetForm() {
  transactionForm.reset();
  clearFormErrors();
  populateCategoryOptions('');
  dateInput.value = getTodayAsInputValue();
}

function handleFormSubmit(event) {
  event.preventDefault();
  hideFormAlert();

  if (validateForm() === false) {
    return;
  }

  if (editingId === null) {
    addTransaction();
  } else {
    updateTransaction();
  }

  stopEditing();
  resetForm();
  render();
}

function init() {
  transactions = loadTransactions();
  console.log('Loaded ' + getTransactionCountText(transactions.length) + ' from local storage');

  dateInput.value = getTodayAsInputValue();
  populateCategoryOptions('');
  populateFilterCategories();

  for (let i = 0; i < typeInputs.length; i++) {
    typeInputs[i].addEventListener('change', function () {
      populateCategoryOptions(getSelectedType());
    });
  }

  transactionForm.addEventListener('submit', handleFormSubmit);
  transactionTableBody.addEventListener('click', handleTableClick);

  cancelEditBtn.addEventListener('click', function () {
    stopEditing();
    resetForm();
    hideFormAlert();
  });

  deleteModal = new bootstrap.Modal(deleteModalElement);

  confirmDeleteBtn.addEventListener('click', function () {
    deleteWasConfirmed = true;
    deleteTransaction(idToDelete);
    idToDelete = null;
    deleteModal.hide();
  });

  // The deleted row and its buttons are gone, so keyboard focus needs a new home
  deleteModalElement.addEventListener('hidden.bs.modal', function () {
    if (deleteWasConfirmed) {
      deleteWasConfirmed = false;
      listHeading.focus();
    }
  });

  for (let i = 0; i < filterTypeInputs.length; i++) {
    filterTypeInputs[i].addEventListener('change', handleFilterTypeChange);
  }

  filterCategory.addEventListener('change', handleFilterCategoryChange);
  resetFiltersBtn.addEventListener('click', resetFilters);

  render();
  console.log('Spendly is up and running');
}

init();
