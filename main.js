// === Глобальное состояние ===
let currentType = "random"; // по умолчанию активен Random

// === Генерация пароля по текущему типу ===
window.generatePassword = function () {
  if (currentType === "random") {
    generateRandomPassword();
  } else if (currentType === "memorable") {
    generateMemorablePassword();
  } else if (currentType === "pin") {
    generatePinPassword();
  }
};

// === Копирование пароля в буфер обмена ===
window.copyPassword = function () {
  const passwordText = document.getElementById("password").textContent;
  if (!passwordText || passwordText === "Click \"Generate\"" || passwordText.includes("Select")) {
    alert("Нечего копировать.");
    return;
  }

  navigator.clipboard.writeText(passwordText).then(() => {
    alert("Пароль скопирован в буфер обмена!");
  }).catch(() => {
    alert("Не удалось скопировать пароль.");
  });
};

// === Генерация Random пароля ===
function generateRandomPassword() {
  const length = parseInt(document.getElementById("length").value);
  const useUppercase = document.getElementById("uppercase").checked;
  const useNumbers = document.getElementById("numbers").checked;
  const useSymbols = document.getElementById("symbols").checked;

  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  let allChars = lowercaseChars;
  if (useUppercase) allChars += uppercaseChars;
  if (useNumbers) allChars += numberChars;
  if (useSymbols) allChars += symbolChars;

  if (allChars.length === 0) {
    document.getElementById("password").textContent = "Select at least one option!";
    return;
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  document.getElementById("password").textContent = password;
  updateSliderBackground();
}

// === Генерация Memorable пароля ===
function generateMemorablePassword() {
  const length = parseInt(document.getElementById("length").value);
  const useCapitalize = document.getElementById("capitalize")?.checked;
  const useFullWords = document.getElementById("fullwords")?.checked;

  const fullWordsList = ["solar", "butter", "garden", "planet", "rocket", "silent", "zebra", "velvet", "orange", "widget"];
  const shortSyllables = ["ba", "po", "re", "tu", "ni", "zo", "ki", "ma", "lu", "da"];

  const words = [];

  for (let i = 0; i < length; i++) {
    let word;
    if (useFullWords) {
      word = fullWordsList[Math.floor(Math.random() * fullWordsList.length)];
    } else {
      word = shortSyllables[Math.floor(Math.random() * shortSyllables.length)] +
             shortSyllables[Math.floor(Math.random() * shortSyllables.length)];
    }

    if (useCapitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    words.push(word);
  }

  const password = words.join("-");
  document.getElementById("password").textContent = password;
  updateSliderBackground();
}

// === Генерация PIN-кода ===
function generatePinPassword() {
  const simplified = document.getElementById("simplifiedpin")?.checked;
  const length = parseInt(document.getElementById("length").value);

  if (simplified) {
    let pin = "";
    const patternType = Math.floor(Math.random() * 3);
    const A = randomDigit();
    const B = randomDigit();
    const C = randomDigit();

    if (patternType === 0 && length >= 4) {
      for (let i = 0; i < length; i++) {
        pin += i % 2 === 0 ? A : B;
      }
    } else if (patternType === 1 && length >= 4) {
      pin = A + A + B + B + C + C;
      pin = pin.slice(0, length);
    } else {
      const part = A + B + C;
      pin = (part + part).slice(0, length);
    }

    document.getElementById("password").textContent = pin;
  } else {
    const digits = "0123456789";
    let pin = "";
    for (let i = 0; i < length; i++) {
      pin += digits[Math.floor(Math.random() * digits.length)];
    }
    document.getElementById("password").textContent = pin;
  }

  updateSliderBackground();
}

function randomDigit() {
  return Math.floor(Math.random() * 10).toString();
}

function updateLengthDisplay() {
  const lengthInput = document.getElementById("length");
  document.getElementById("length-value").textContent = lengthInput.value;
}

function updateSliderBackground() {
  const slider = document.getElementById("length");
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.background = `linear-gradient(to right, #4a90e2 0%, #4a90e2 ${value}%, #ccc ${value}%, #ccc 100%)`;
}

const typeButtons = document.querySelectorAll('.type-btn');
typeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    typeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    let type = btn.textContent.trim().toLowerCase();
    if (type === "#pin") type = "pin";
    currentType = type;

    updateUIForType(type);
  });
});

function updateUIForType(type) {
  const uppercase = document.getElementById("uppercase").parentElement;
  const numbers = document.getElementById("numbers").parentElement;
  const symbols = document.getElementById("symbols").parentElement;

  uppercase.style.display = "flex";
  numbers.style.display = "flex";
  symbols.style.display = "flex";

  document.querySelectorAll(".memorable-extra").forEach(el => el.remove());

  const lengthSlider = document.getElementById("length");

  if (type === "memorable") {
    uppercase.style.display = "none";
    numbers.style.display = "none";
    symbols.style.display = "none";

    const controls = document.querySelector(".controls");
    const capitalize = createSwitchOption("capitalize", "Capitalize the first letter");
    const fullWords = createSwitchOption("fullwords", "Use full words");

    capitalize.classList.add("memorable-extra");
    fullWords.classList.add("memorable-extra");

    controls.appendChild(capitalize);
    controls.appendChild(fullWords);

    lengthSlider.min = 3;
    lengthSlider.max = 15;
    lengthSlider.value = 4;
  } else if (type === "pin") {
    uppercase.style.display = "none";
    numbers.style.display = "none";
    symbols.style.display = "none";

    const controls = document.querySelector(".controls");
    const simplified = createSwitchOption("simplifiedpin", "Simplified PIN");

    simplified.classList.add("memorable-extra");
    simplified.querySelector("input").checked = true;
    controls.appendChild(simplified);

    lengthSlider.min = 4;
    lengthSlider.max = 12;
    lengthSlider.value = 6;
  } else {
    lengthSlider.min = 4;
    lengthSlider.max = 64;
    if (lengthSlider.value < 4) lengthSlider.value = 4;
    if (lengthSlider.value > 64) lengthSlider.value = 64;
  }

  updateLengthDisplay();
  updateSliderBackground();
}

function createSwitchOption(id, labelText) {
  const wrapper = document.createElement("label");
  wrapper.className = "switch";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = id;

  const slider = document.createElement("span");
  slider.className = "slider";

  const label = document.createElement("span");
  label.className = "label-text";
  label.textContent = labelText;

  wrapper.appendChild(input);
  wrapper.appendChild(slider);
  wrapper.appendChild(label);

  return wrapper;
}

document.addEventListener("DOMContentLoaded", () => {
  const mainSlider = document.getElementById("length");
  if (mainSlider) {
    mainSlider.addEventListener("input", () => {
      updateLengthDisplay();
      updateSliderBackground();
    });

    updateLengthDisplay();
    updateSliderBackground();
  }
});

