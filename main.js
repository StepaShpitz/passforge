// === Генерация пароля ===
window.generatePassword = function () {
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
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  document.getElementById("password").textContent = password;
  updateSliderBackground();
};

// === Копирование пароля ===
window.copyPassword = function () {
  const passwordText = document.getElementById("password").textContent;
  if (!passwordText || passwordText === "Click \"Generate\"" || passwordText === "Select at least one option!") {
    alert("Нечего копировать.");
    return;
  }

  navigator.clipboard.writeText(passwordText).then(() => {
    alert("Пароль скопирован в буфер обмена!");
  });
};

// === Обновление длины и ползунка ===
function updateLengthDisplay() {
  const lengthInput = document.getElementById("length");
  document.getElementById("length-value").textContent = lengthInput.value;
}

function updateSliderBackground() {
  const slider = document.getElementById("length");
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.background = `linear-gradient(to right, #4a90e2 0%, #4a90e2 ${value}%, #ccc ${value}%, #ccc 100%)`;
}

function updateRangeProgress() {
  const range = document.getElementById("length");
  const val = (range.value - range.min) / (range.max - range.min) * 100;
  range.style.setProperty('--range-progress', `${val}%`);
}

// === Поддержка второго слайдера (если он есть) ===
function updateSliderVisual(slider) {
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.setProperty('--slider-fill', `${value}%`);
}

// === Обработчики событий и инициализация ===
document.addEventListener("DOMContentLoaded", () => {
  const mainSlider = document.getElementById("length");
  if (mainSlider) {
    mainSlider.addEventListener("input", () => {
      updateLengthDisplay();
      updateSliderBackground();
      updateRangeProgress();
    });

    updateLengthDisplay();
    updateSliderBackground();
    updateRangeProgress();
  }

  const slider = document.getElementById("lengthSlider");
  if (slider) {
    slider.addEventListener("input", () => updateSliderVisual(slider));
    updateSliderVisual(slider);
  }
});
