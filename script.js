/* =========================================================
   STUDENT CALCULATOR
   BODMAS / MULTI-OPERATION ENGINE
   Vanilla JavaScript — No eval()
   ========================================================= */

/* ---------- DOM Elements ---------- */

const expressionEl = document.getElementById("expression");
const currentValueEl = document.getElementById("currentValue");
const historyListEl = document.getElementById("historyList");
const historyEmptyMsg = document.getElementById("historyEmptyMsg");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const allButtons = document.querySelectorAll(".btn");


/* ---------- Calculator State ---------- */

let expression = "";
let isResultShown = false;
let historyItems = [];


/* =========================================================
   1. DISPLAY
   ========================================================= */

function updateDisplay() {

    if (expression === "") {
        expressionEl.textContent = "";
        currentValueEl.textContent = "0";
        return;
    }

    expressionEl.textContent = expression;

    /*
       Show the last number/operator area in the main display.
       If expression ends with an operator, show 0.
    */

    const match = expression.match(/(\d*\.?\d+)%?$/);

    if (match) {
        currentValueEl.textContent = match[0];
    } else {
        currentValueEl.textContent = "0";
    }
}


/* =========================================================
   2. NUMBER INPUT
   ========================================================= */

function inputNumber(digit) {

    if (isResultShown) {
        expression = "";
        isResultShown = false;
    }

    /*
       Prevent unnecessary leading zeros.
    */

    if (expression === "0") {
        expression = digit;
    } else {
        expression += digit;
    }

    updateDisplay();
}


/* =========================================================
   3. DECIMAL INPUT
   ========================================================= */

function inputDecimal() {

    if (isResultShown) {
        expression = "";
        isResultShown = false;
    }

    /*
       Find the current number after the last operator.
    */

    const lastNumber = expression.split(/[+\-×÷*/]/).pop();

    /*
       Don't allow two decimal points
       inside the same number.
    */

    if (lastNumber.includes(".")) {
        return;
    }

    /*
       If decimal is pressed at the beginning
       or after an operator, create 0.
    */

    if (
        expression === "" ||
        /[+\-×÷*/]$/.test(expression)
    ) {
        expression += "0.";
    } else {
        expression += ".";
    }

    updateDisplay();
}


/* =========================================================
   4. OPERATOR INPUT
   ========================================================= */

function inputOperator(operator) {

    if (expression === "") {
        return;
    }

    /*
       If result is already displayed,
       continue calculation from that result.
    */

    if (isResultShown) {
        isResultShown = false;
    }

    /*
       Don't allow two operators together.
       Example:
       20 + ×
       
       becomes:
       20 ×
    */

    if (/[+\-×÷*/]$/.test(expression)) {

        expression = expression.slice(0, -1);
    }

    expression += operator;

    updateDisplay();
}


/* =========================================================
   5. PERCENTAGE
   ========================================================= */

function applyPercent() {

    if (expression === "") {
        return;
    }

    /*
       Find the last number.
    */

    const match = expression.match(/(\d*\.?\d+)$/);

    if (!match) {
        return;
    }

    const number = parseFloat(match[1]);

    const percentage = roundResult(number / 100);

    expression =
        expression.slice(0, -match[1].length) +
        percentage;

    isResultShown = false;

    updateDisplay();
}


/* =========================================================
   6. BODMAS CALCULATION ENGINE
   ========================================================= */

/*
   This calculator does NOT use eval().

   Order of calculation:

   1. Multiplication ×
   2. Division ÷
   3. Addition +
   4. Subtraction −

   This gives normal BODMAS-style precedence.
*/


function calculateExpression(input) {

    /*
       Remove spaces.
    */

    input = input.replace(/\s+/g, "");

    /*
       Convert display operators to internal operators.
    */

    input = input
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");


    /*
       Validate expression.
    */

    if (!/^[0-9+\-*/.%]+$/.test(input)) {
        throw new Error("Invalid expression");
    }


    /*
       Tokenize numbers and operators.
    */

    const tokens = [];

    let number = "";

    for (let i = 0; i < input.length; i++) {

        const char = input[i];

        /*
           Number / decimal
        */

        if (
            (char >= "0" && char <= "9") ||
            char === "."
        ) {

            number += char;

        } else {

            /*
               Save current number.
            */

            if (number !== "") {

                const parsedNumber = parseFloat(number);

                if (Number.isNaN(parsedNumber)) {
                    throw new Error("Invalid number");
                }

                tokens.push(parsedNumber);

                number = "";
            }

            /*
               Save operator.
            */

            tokens.push(char);
        }
    }


    /*
       Save final number.
    */

    if (number !== "") {

        const parsedNumber = parseFloat(number);

        if (Number.isNaN(parsedNumber)) {
            throw new Error("Invalid number");
        }

        tokens.push(parsedNumber);
    }


    /*
       Basic validation.
    */

    if (tokens.length === 0) {
        throw new Error("Empty expression");
    }

    if (typeof tokens[0] !== "number") {
        throw new Error("Invalid expression");
    }

    if (
        typeof tokens[tokens.length - 1] !== "number"
    ) {
        throw new Error("Incomplete expression");
    }


    /* =====================================================
       STEP 1 — MULTIPLICATION & DIVISION
       ===================================================== */

    const firstPass = [];

    let currentNumber = tokens[0];

    for (let i = 1; i < tokens.length; i += 2) {

        const operator = tokens[i];
        const nextNumber = tokens[i + 1];

        if (operator === "*") {

            currentNumber *= nextNumber;

        } else if (operator === "/") {

            if (nextNumber === 0) {
                throw new Error("Cannot divide by zero");
            }

            currentNumber /= nextNumber;

        } else {

            /*
               + or -
               Save previous result and operator.
            */

            firstPass.push(currentNumber);
            firstPass.push(operator);

            currentNumber = nextNumber;
        }
    }

    /*
       Save final number.
    */

    firstPass.push(currentNumber);


    /* =====================================================
       STEP 2 — ADDITION & SUBTRACTION
       ===================================================== */

    let result = firstPass[0];

    for (let i = 1; i < firstPass.length; i += 2) {

        const operator = firstPass[i];
        const nextNumber = firstPass[i + 1];

        if (operator === "+") {

            result += nextNumber;

        } else if (operator === "-") {

            result -= nextNumber;
        }
    }


    return roundResult(result);
}


/* =========================================================
   7. EQUALS
   ========================================================= */

function calculateResult() {

    if (expression === "") {
        return;
    }

    /*
       Don't calculate if expression ends with operator.
    */

    if (/[+\-×÷*/]$/.test(expression)) {
        return;
    }

    try {

        const originalExpression = expression;

        const result = calculateExpression(expression);

        /*
           Add calculation to history.
        */

        const historyLine =
            `${formatExpression(originalExpression)} = ${formatNumber(result)}`;

        addToHistory(historyLine);


        /*
           Show result.
        */

        expression = String(result);

        isResultShown = true;

        expressionEl.textContent =
            formatExpression(originalExpression);

        currentValueEl.textContent =
            formatNumber(result);

    } catch (error) {

        expressionEl.textContent = expression;
        currentValueEl.textContent = "Error";

        isResultShown = true;
    }
}


/* =========================================================
   8. ROUNDING
   ========================================================= */

function roundResult(number) {

    return Math.round(
        (number + Number.EPSILON) * 1e10
    ) / 1e10;
}


/* =========================================================
   9. FORMAT EXPRESSION
   ========================================================= */

function formatExpression(value) {

    return value
        .replace(/\*/g, "×")
        .replace(/\//g, "÷")
        .replace(/-/g, "−");
}


/* =========================================================
   10. FORMAT NUMBER
   ========================================================= */

function formatNumber(number) {

    if (!Number.isFinite(number)) {
        return "Error";
    }

    return String(roundResult(number));
}


/* =========================================================
   11. CLEAR
   ========================================================= */

function clearAll() {

    expression = "";
    isResultShown = false;

    updateDisplay();
}


/* =========================================================
   12. BACKSPACE
   ========================================================= */

function backspace() {

    if (isResultShown) {

        clearAll();

        return;
    }

    if (expression.length > 0) {

        expression =
            expression.slice(0, -1);
    }

    updateDisplay();
}


/* =========================================================
   13. HISTORY
   ========================================================= */

function addToHistory(line) {

    historyItems.unshift(line);

    /*
       Keep only latest 20 calculations.
    */

    if (historyItems.length > 20) {

        historyItems.pop();
    }

    renderHistory();
}


function renderHistory() {

    historyListEl.innerHTML = "";

    if (historyItems.length === 0) {

        historyListEl.appendChild(historyEmptyMsg);

        return;
    }

    historyItems.forEach((line) => {

        const li =
            document.createElement("li");

        li.textContent = line;

        historyListEl.appendChild(li);
    });
}


function clearHistory() {

    historyItems = [];

    renderHistory();
}


/* =========================================================
   14. BUTTON CLICK EVENTS
   ========================================================= */

allButtons.forEach((button) => {

    button.addEventListener("click", () => {

        handleButtonPress(button);

        flashButton(button);
    });
});


clearHistoryBtn.addEventListener(
    "click",
    clearHistory
);


/* =========================================================
   15. BUTTON PRESS ANIMATION
   ========================================================= */

function flashButton(button) {

    button.classList.add("pressed");

    setTimeout(() => {

        button.classList.remove("pressed");

    }, 100);
}


/* =========================================================
   16. BUTTON HANDLER
   ========================================================= */

function handleButtonPress(button) {

    const digit =
        button.dataset.number;

    const action =
        button.dataset.action;


    /*
       Number button
    */

    if (digit !== undefined) {

        inputNumber(digit);

        return;
    }


    /*
       Action buttons
    */

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

            inputOperator("+");

            break;


        case "subtract":

            inputOperator("-");

            break;


        case "multiply":

            inputOperator("×");

            break;


        case "divide":

            inputOperator("÷");

            break;


        case "equals":

            calculateResult();

            break;
    }
}


/* =========================================================
   17. KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        const key = event.key;


        /*
           Numbers
        */

        if (key >= "0" && key <= "9") {

            inputNumber(key);

            return;
        }


        /*
           Decimal
        */

        if (key === ".") {

            inputDecimal();

            return;
        }


        /*
           Operators
        */

        switch (key) {

            case "+":

                inputOperator("+");

                break;


            case "-":

                inputOperator("-");

                break;


            case "*":

                inputOperator("×");

                break;


            case "/":

                event.preventDefault();

                inputOperator("÷");

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
    }
);


/* =========================================================
   18. INITIAL DISPLAY
   ========================================================= */

updateDisplay();
