const translations = {
      en: {
        title: "PassForge",
        description: "Generate strong, secure passwords with one click",
        generate: "Generate",
        copy: "Copy",
        defaultPassword: 'Click "Generate"',
        copied: "Password copied to clipboard!",
        langLabel: "RU",
        length: "Length",
        uppercase: "Uppercase Letters",
        numbers: "Numbers",
        symbols: "Symbols"
      },
      ru: {
        title: "PassForge",
        description: "Создавай крепкие, надёжные пароли одним нажатием",
        generate: "Сгенерировать",
        copy: "Скопировать",
        defaultPassword: 'Нажмите "Сгенерировать"',
        copied: "Пароль скопирован в буфер обмена!",
        langLabel: "EN",
        length: "Длина",
        uppercase: "Заглавные буквы",
        numbers: "Цифры",
        symbols: "Символы"
      }
    };

    let currentLang = localStorage.getItem('lang') || 'en';

    function applyLanguage(lang) {
      const t = translations[lang];
      document.getElementById("title").textContent = t.title;
      document.getElementById("description").textContent = t.description;
      document.getElementById("generate-btn").textContent = t.generate;
      document.getElementById("copy-btn").textContent = t.copy;
      document.getElementById("password").textContent = t.defaultPassword;
      document.getElementById("lang-label").textContent = t.langLabel;

      document.getElementById("length-label").childNodes[0].nodeValue = t.length + ": ";
      document.getElementById("label-uppercase").textContent = t.uppercase;
      document.getElementById("label-numbers").textContent = t.numbers;
      document.getElementById("label-symbols").textContent = t.symbols;
    }

    function toggleLanguage() {
      currentLang = currentLang === 'en' ? 'ru' : 'en';
      localStorage.setItem('lang', currentLang);
      applyLanguage(currentLang);
    }

    function updateLengthDisplay() {
      document.getElementById("length-value").textContent = document.getElementById("length").value;
    }

    function generatePassword() {
      const length = parseInt(document.getElementById("length").value, 10);
      const includeUppercase = document.getElementById("uppercase").checked;
      const includeNumbers = document.getElementById("numbers").checked;
      const includeSymbols = document.getElementById("symbols").checked;

      let charset = "abcdefghijklmnopqrstuvwxyz";
      if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (includeNumbers) charset += "0123456789";
      if (includeSymbols) charset += "!@#$%^&*()_+{}[]<>?";

      if (charset === "") {
        alert("Please select at least one character set!");
        return;
      }

      let password = "";
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      document.getElementById("password").textContent = password;
    }

    function copyPassword() {
      const passwordText = document.getElementById("password").textContent;
      navigator.clipboard.writeText(passwordText).then(() => {
        alert(translations[currentLang].copied);
      });
    }

    /* Init */
    updateLengthDisplay();
    applyLanguage(currentLang);