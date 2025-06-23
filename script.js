
function generatePassword() {
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

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  document.getElementById("password").textContent = password;
  updateSliderBackground(); // Подсветка шкалы после генерации
}

function copyPassword() {
  const passwordText = document.getElementById("password").textContent;
  navigator.clipboard.writeText(passwordText).then(() => {
    alert("Пароль скопирован в буфер обмена!");
  });
}

function updateLengthDisplay() {
  document.getElementById("length-value").textContent = document.getElementById("length").value;
}

// === Подсветка шкалы слайдера по значению длины ===
function updateSliderBackground() {
  const slider = document.getElementById("length");
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.background = `linear-gradient(to right, #4a90e2 0%, #4a90e2 ${value}%, #ccc ${value}%, #ccc 100%)`;
}

document.getElementById("length").addEventListener("input", function () {
  updateLengthDisplay();
  updateSliderBackground();
});

/* Init */
updateLengthDisplay();
updateSliderBackground();

const range = document.getElementById('length');
function updateRangeProgress() {
  const val = (range.value - range.min) / (range.max - range.min) * 100;
  range.style.setProperty('--range-progress', `${val}%`);
}
range.addEventListener('input', updateRangeProgress);
updateRangeProgress();

const slider = document.getElementById('lengthSlider');
function updateSliderBackground(slider) {
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.setProperty('--slider-fill', `${value}%`);
}
slider.addEventListener('input', () => updateSliderBackground(slider));
updateSliderBackground(slider);




