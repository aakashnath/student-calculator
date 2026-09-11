/* =========================================================
   STUDENT CALCULATOR — SCRIPT
   Plain vanilla JavaScript. No frameworks, no eval().
   ========================================================= */

/* ---------- 1. Grab the elements we need from the page ---------- */
const expressionEl = document.getElementById("expression");
const currentValueEl = document.getElementById("currentValue");
const historyListEl = document.getElementById("historyList");
const historyEmptyMsg = document.getElementById("historyEmptyMsg");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const allButtons = document.querySelectorAll(".btn");

/* ---------- 2. Calculator state ----------
   We keep track of everything the calculator "remembers"
   in a few simple variables instead of one big object.
   This makes it easy to explain step by step in an interview.
*/
let currentInput = "0";      // what the user is currently typing
let firstOperand = null;     // the number entered before the operator
let selectedOperator = null; // "+", "-", "*", "/", or "%"
let isResultShown = false;   // true right after pressing "="
let historyItems = [];       // stores past calculations as text

/* ---------- 3. Update what the user sees ---------- */
function updateDisplay() {
  currentValueEl.textContent = currentInput;

  if (selectedOperator && firstOperand !== null) {
    expressionEl.textContent = `${firstOperand} ${operatorSymbol(selectedOperator)}`;
  } else {
    expressionEl.textContent = "";
  }
}

// Converts the internal operator code into the symbol shown on screen
function operatorSymbol(op) {
  switch (op) {
    case "+": return "+";
    case "-": return "−";
    case "*": return "×";
    case "/": return "÷";
    default: return "";
  }
}

/* ---------- 4. Handle number button clicks ---------- */
function inputNumber(digit) {
  // If a result was just shown, typing a new digit should start fresh
  if (isResultShown) {
    currentInput = "0";
    isResultShown = false;
  }

  if (currentInput === "0") {
    currentInput = digit; // replace the leading zero
  } else {
    currentInput += digit;
  }

  updateDisplay();
}

/* ---------- 5. Handle the decimal point ---------- */
function inputDecimal() {
  if (isResultShown) {
    currentInput = "0";
    isResultShown = false;
  }

  // Only add a decimal point if one doesn't already exist
  if (!currentInput.includes(".")) {
    currentInput += ".";
  }

  updateDisplay();
}

/* ---------- 6. Handle operator buttons (+ − × ÷) ---------- */
function chooseOperator(operator) {
  // If the user already picked an operator and typed a second number,
  // calculate the result first (this allows chained calculations,
  // e.g. 5 + 3 + 2 =)
  if (selectedOperator !== null && firstOperand !== null && !isResultShown) {
    calculateResult();
  }

  firstOperand = parseFloat(currentInput);
  selectedOperator = operator;
  isResultShown = false;
  currentInput = "0";

  updateDisplay();
}

/* ---------- 7. The safe calculation logic (no eval!) ---------- */
function performCalculation(a, b, operator) {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) {
        // Division by zero is not allowed — throw a clear error instead
        throw new Error("Cannot divide by zero");
      }
      return a / b;
    default:
      throw new Error("Invalid operator");
  }
}

/* ---------- 8. Handle the "=" button ---------- */
function calculateResult() {
  // If there is nothing to calculate, do nothing
  if (selectedOperator === null || firstOperand === null) {
    return;
  }

  const secondOperand = parseFloat(currentInput);

  try {
    const result = performCalculation(firstOperand, secondOperand, selectedOperator);
    const roundedResult = roundResult(result);

    // Build a readable line for the history panel
    const historyLine = `${firstOperand} ${operatorSymbol(selectedOperator)} ${secondOperand} = ${roundedResult}`;
    addToHistory(historyLine);

    currentInput = String(roundedResult);
    firstOperand = null;
    selectedOperator = null;
    isResultShown = true;
  } catch (error) {
    // Handles division by zero and any other calculation error
    currentInput = "Error";
    firstOperand = null;
    selectedOperator = null;
    isResultShown = true;
  }

  updateDisplay();
}

// Avoids ugly floating point results like 0.1 + 0.2 = 0.30000000000000004
function roundResult(number) {
  return Math.round((number + Number.EPSILON) * 1e10) / 1e10;
}

/* ---------- 9. Percentage button ---------- */
function applyPercent() {
  const value = parseFloat(currentInput);

  if (isNaN(value)) {
    currentInput = "Error";
    updateDisplay();
    return;
  }

  // If we are in the middle of an operation (e.g. 200 + 10%),
  // treat the percentage as a share of the first operand.
  if (selectedOperator !== null && firstOperand !== null) {
    currentInput = String(roundResult((firstOperand * value) / 100));
  } else {
    currentInput = String(roundResult(value / 100));
  }

  updateDisplay();
}

/* ---------- 10. Clear (C) button ---------- */
function clearAll() {
  currentInput = "0";
  firstOperand = null;
  selectedOperator = null;
  isResultShown = false;
  updateDisplay();
}

/* ---------- 11. Backspace button ---------- */
function backspace() {
  if (isResultShown) {
    // Don't backspace into a finished result — clear instead
    clearAll();
    return;
  }

  if (currentInput.length <= 1 || currentInput === "Error") {
    currentInput = "0";
  } else {
    currentInput = currentInput.slice(0, -1);
  }

  updateDisplay();
}

/* ---------- 12. History panel ---------- */
function addToHistory(line) {
  historyItems.unshift(line); // newest calculation on top
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = "";

  if (historyItems.length === 0) {
    historyListEl.appendChild(historyEmptyMsg);
    return;
  }

  historyItems.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    historyListEl.appendChild(li);
  });
}

function clearHistory() {
  historyItems = [];
  renderHistory();
}

/* ---------- 13. Wire up button clicks ---------- */
allButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleButtonPress(button);
    flashButton(button);
  });
});

clearHistoryBtn.addEventListener("click", clearHistory);

// A short visual "pressed" animation for click feedback
function flashButton(button) {
  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 100);
}

// Reads the button's data attributes and calls the right function
function handleButtonPress(button) {
  const digit = button.dataset.number;
  const action = button.dataset.action;

  if (digit !== undefined) {
    inputNumber(digit);
    return;
  }

  switch (action) {
    case "clear":
      clearAll();
      break;
    case "backspace":
      backspace();
      break;
    case "decimal":
      inputDecimal();
      break;
    case "percent":
      applyPercent();
      break;
    case "add":
      chooseOperator("+");
      break;
    case "subtract":
      chooseOperator("-");
      break;
    case "multiply":
      chooseOperator("*");
      break;
    case "divide":
      chooseOperator("/");
      break;
    case "equals":
      calculateResult();
      break;
  }
}

/* ---------- 14. Keyboard support ---------- */
document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (key >= "0" && key <= "9") {
    inputNumber(key);
    return;
  }

  switch (key) {
    case ".":
      inputDecimal();
      break;
    case "+":
      chooseOperator("+");
      break;
    case "-":
      chooseOperator("-");
      break;
    case "*":
      chooseOperator("*");
      break;
    case "/":
      event.preventDefault(); // stops the browser's quick-find from opening
      chooseOperator("/");
      break;
    case "%":
      applyPercent();
      break;
    case "Enter":
    case "=":
      calculateResult();
      break;
    case "Backspace":
      backspace();
      break;
    case "Escape":
      clearAll();
      break;
  }
});

/* ---------- 15. First render when the page loads ---------- */
updateDisplay();