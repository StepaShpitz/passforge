/* =====================================================================
   PassForge — main.js
   Переписанная версия. Ключевые изменения против прежней:
     1. CSPRNG (crypto.getRandomValues) + rejection sampling вместо Math.random()
     2. Гарантия присутствия каждого выбранного класса символов
     3. Осмысленный словарь для memorable + честный подсчёт энтропии
     4. Тип пароля берётся из data-type, а не из подписи кнопки (чинит RU-режим)
     5. Полная локализация, включая динамически созданные тумблеры
     6. Копирование без alert(), с автоочисткой буфера
     7. "Simplified PIN" выключен по умолчанию и помечен как небезопасный

   Требует правок в index.html — см. сопроводительный файл index-notes.md
   ===================================================================== */

'use strict';

/* ---------------------------------------------------------------------
   1. КРИПТОСТОЙКАЯ СЛУЧАЙНОСТЬ

   Math.random() в V8 — это xorshift128+, не CSPRNG: внутреннее состояние
   восстанавливается из нескольких подряд выданных значений, после чего
   вычисляется вся последовательность. Для генератора паролей неприменимо.

   Ниже — равномерная выборка без modulo bias (rejection sampling).
   ------------------------------------------------------------------- */

function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError('max must be a positive integer');
  if (max === 1) return 0;

  // Наибольшее кратное max, помещающееся в 32 бита. Всё, что выше, отбрасываем:
  // иначе младшие значения выпадали бы чаще.
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

function securePick(arrayLike) {
  return arrayLike[secureRandomInt(arrayLike.length)];
}

// Перемешивание Фишера–Йетса на криптостойком источнике.
function secureShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------------------------------------------------------------
   2. НАБОРЫ СИМВОЛОВ
   ------------------------------------------------------------------- */

const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers:   '0123456789',
  symbols:   '!@#$%^&*()_+-=[]{}|;:,.<>?~'
};

// Символы, которые путаются при чтении и ручном вводе.
const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|', '5', 'S', '2', 'Z', '8', 'B']);

const stripAmbiguous = (s) => [...s].filter((c) => !AMBIGUOUS.has(c)).join('');

/* ---------------------------------------------------------------------
   3. СЛОВАРЬ ДЛЯ MEMORABLE

   Этот список даёт log2(N) бит на слово. Полный EFF large wordlist
   (7776 слов) даёт 12.9 бит/слово — его стоит подгружать отдельным
   JSON-файлом и подставлять сюда. Источник: eff.org/dice

   Требования к списку: только a-z, не короче 3 букв, без пар,
   различающихся одной буквой.
   ------------------------------------------------------------------- */

const WORDLIST = [
  'anchor','amber','apron','arrow','autumn','bacon','badge','bagel','bamboo','banjo',
  'barrel','basil','beacon','beetle','bishop','bison','blanket','blossom','bonus','border',
  'bottle','boulder','bracket','branch','bridge','bronze','bubble','bucket','buffalo','bundle',
  'burrow','cabin','cactus','camera','candle','canyon','carbon','cargo','carpet','cascade',
  'castle','cavern','cedar','cement','census','chapel','cheese','cherry','chimney','chisel',
  'cinder','circus','citrus','clamp','clover','cobalt','cocoa','collar','column','comet',
  'compass','copper','coral','cotton','cougar','crater','crayon','cricket','crimson','crystal',
  'cuckoo','cupboard','curtain','cushion','cymbal','dagger','dahlia','daisy','damper','dazzle',
  'decoy','denim','desert','diamond','digest','dolphin','domino','donkey','dragon','drawer',
  'drifter','dungeon','eagle','eclipse','elbow','ember','emerald','engine','envelope','escort',
  'ethanol','exhaust','fabric','falcon','fathom','feather','fender','fennel','ferret','fiddle',
  'filter','flannel','flask','flint','floral','flute','forest','fossil','fountain','fragment',
  'freckle','frost','funnel','furnace','gadget','galaxy','gallon','garlic','gazelle','geyser',
  'ginger','glacier','glider','glimmer','gopher','granite','gravel','griffin','grotto','gutter',
  'gypsum','hamlet','hammer','hamster','harbor','harvest','hazard','heather','helmet','hermit',
  'hickory','hollow','honey','hornet','hurdle','iceberg','igloo','indigo','ingot','insect',
  'ivory','jacket','jaguar','jasmine','jester','jigsaw','jockey','journal','jungle','juniper',
  'kayak','kennel','kernel','kettle','keyhole','kitten','koala','ladder','lagoon','lantern',
  'lattice','lavender','ledger','legend','lemon','leopard','lettuce','lichen','lilac','limber',
  'linen','lizard','lobster','locket','lotus','lumber','lunar','lyric','magnet','mahogany',
  'mammoth','mandolin','mango','maple','marble','margin','marmot','mascot','meadow','mercury',
  'mermaid','meteor','mildew','mimic','mineral','minnow','mirror','mitten','molten','monarch',
  'mosaic','mustang','mustard','nebula','nectar','needle','nickel','nomad','nougat','nutmeg',
  'oasis','obsidian','octave','olive','orbit','orchard','orchid','origami','osprey','otter',
  'oxygen','oyster','paddle','pantry','papaya','paprika','parcel','parrot','pasture','pebble',
  'pelican','penguin','pepper','pewter','phantom','pheasant','pigment','pillar','pilot','pioneer',
  'piston','pixel','plasma','platter','plaza','plumage','pocket','pollen','pontoon','poplar',
  'portal','possum','pottery','prairie','pretzel','prism','pudding','pumpkin','puzzle','pyramid',
  'quarry','quartz','quiver','rabbit','raccoon','radish','rafter','rainbow','ranger','rapids',
  'raven','ravine','reactor','reagent','recess','reptile','rhubarb','ribbon','rifle','ripple',
  'risotto','roster','rubble','rudder','ruffle','rustic','saddle','saffron','salmon','sandal',
  'sapphire','sardine','satchel','scallop','scarlet','scepter','scooter','scorpion','scribble','seagull',
  'seaweed','sequoia','shadow','shamrock','shelter','sherbet','shingle','shovel','shrapnel','shutter',
  'signal','silver','siren','skillet','skylark','sliver','smolder','snorkel','socket','solar',
  'sonnet','soprano','sparrow','spatula','spindle','spiral','sponge','spruce','squash','squirrel',
  'stallion','stencil','stirrup','stucco','sulfur','summit','sunset','surfer','swallow','sweater',
  'sycamore','syrup','tabby','tackle','talon','tandem','tangerine','tapestry','tavern','teapot',
  'tempest','tender','tendril','termite','textile','thicket','thimble','thistle','thunder','ticket',
  'tiger','timber','tinsel','toaster','tobacco','toffee','tomato','topaz','torrent','toucan',
  'tractor','trapeze','treble','trellis','triangle','trickle','trident','trolley','trophy','truffle',
  'trumpet','tulip','tundra','tunnel','turbine','turnip','turtle','tuxedo','twilight','ukulele',
  'umbrella','uranium','vacuum','valley','vanilla','vault','velvet','vendor','venison','vertigo',
  'vessel','vinegar','violet','viper','vulture','waffle','wagon','walnut','walrus','wander',
  'warden','wasabi','waterfall','weasel','weaver','welder','whisker','whistle','widget','wigwam',
  'willow','windmill','wisdom','wisteria','wombat','wonder','wrangler','wreath','wrench','yacht',
  'yarrow','yellow','yodel','yogurt','zebra','zenith','zephyr','zigzag','zinnia','zipper',
  'zodiac','zucchini'
];

const SEPARATORS = ['-', '.', '_', '+', '=', '~'];

/* ---------------------------------------------------------------------
   4. ЛОКАЛИЗАЦИЯ
   ------------------------------------------------------------------- */

const translations = {
  en: {
    htmlLang: 'en',
    title: 'PassForge',
    description: 'Generate strong, secure passwords with one click',
    lengthLabel: 'Length',
    wordsLabel: 'Words',
    digitsLabel: 'Digits',
    uppercase: 'Uppercase Letters',
    numbers: 'Numbers',
    symbols: 'Symbols',
    excludeAmbiguous: 'Exclude look-alike characters (0/O, 1/l)',
    capitalize: 'Capitalize first letters',
    addNumber: 'Add a number',
    randomSeparator: 'Random separator',
    simplifiedPin: 'Easy-to-remember pattern (not secure)',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    nothingToCopy: 'Generate one first',
    selectOption: 'Select at least one character type',
    type_random: 'Random',
    type_memorable: 'Memorable',
    type_pin: '#PIN',
    headline: 'Strong and secure password for Everyone',
    introLine1: 'Create unique, strong, and human-friendly passwords instantly with PassForge.',
    introLine2: 'Fully private. Always local. No signups.',
    introLine3: 'Fast. Free. Flexible.',
    articleTitle: 'Why Strong Passwords Matter',
    passwordPlaceholder: 'Click "Generate"',
    entropyLabel: 'Strength',
    crackLabel: 'Time to crack',
    instantly: 'instantly',
    strength: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'],
    units: { second: 'seconds', minute: 'minutes', hour: 'hours', day: 'days', year: 'years', century: 'centuries' },
    articleText: [
      'In today\u2019s digital world, your online security starts with a strong password. Weak or reused passwords are a leading cause of data breaches and account compromises.',
      'A secure password protects your personal information, prevents unauthorized access, and keeps your accounts safe from hackers.',
      'Tools like PassForge help you create unique, complex, and human-friendly passwords \u2014 generated locally in your browser and never sent anywhere.'
    ]
  },
  ru: {
    htmlLang: 'ru',
    title: 'PassForge',
    description: 'Генерируйте надёжные и безопасные пароли в один клик',
    lengthLabel: 'Длина',
    wordsLabel: 'Слов',
    digitsLabel: 'Цифр',
    uppercase: 'Заглавные буквы',
    numbers: 'Цифры',
    symbols: 'Символы',
    excludeAmbiguous: 'Исключить похожие символы (0/O, 1/l)',
    capitalize: 'Заглавная первая буква',
    addNumber: 'Добавить цифру',
    randomSeparator: 'Случайный разделитель',
    simplifiedPin: 'Легко запоминающийся шаблон (небезопасно)',
    generate: 'Сгенерировать',
    copy: 'Копировать',
    copied: 'Скопировано',
    copyFailed: 'Не удалось скопировать',
    nothingToCopy: 'Сначала сгенерируйте',
    selectOption: 'Выберите хотя бы один тип символов',
    type_random: 'Случайный',
    type_memorable: 'Запоминаемый',
    type_pin: 'ПИН',
    headline: 'Надёжные и удобные пароли для всех',
    introLine1: 'Создавайте уникальные, надёжные и удобные пароли с PassForge.',
    introLine2: 'Полная конфиденциальность. Всё работает локально. Без регистрации.',
    introLine3: 'Быстро. Бесплатно. Удобно.',
    articleTitle: 'Почему важно использовать надёжные пароли',
    passwordPlaceholder: 'Нажмите «Сгенерировать»',
    entropyLabel: 'Стойкость',
    crackLabel: 'Время подбора',
    instantly: 'мгновенно',
    strength: ['Очень слабый', 'Слабый', 'Средний', 'Надёжный', 'Очень надёжный'],
    units: { second: 'сек.', minute: 'мин.', hour: 'ч.', day: 'дн.', year: 'лет', century: 'веков' },
    articleText: [
      'В современном цифровом мире ваша безопасность начинается с пароля. Слабые и повторяющиеся пароли — одна из главных причин взломов и утечек данных.',
      'Надёжный пароль защищает личную информацию, предотвращает несанкционированный доступ и обеспечивает безопасность ваших аккаунтов.',
      'PassForge помогает создавать уникальные, сложные и при этом удобные пароли — генерация идёт локально в браузере, данные никуда не отправляются.'
    ]
  }
};

/* Язык определяется разметкой страницы (/ -> en, /ru/ -> ru), а не JS-состоянием.
   Раньше перевод жил только в памяти и отдельного URL не существовало, поэтому
   поисковики видели сайт одноязычным, а русские запросы проходили мимо. */
const LANG_PATHS = { en: '/', ru: '/ru/' };

let currentLang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
let currentType = 'random';
let lastEntropy = 0;

/* Длина запоминается отдельно для каждого типа.
   Раньше значение просто клампилось к минимуму текущего режима: после PIN (6)
   возврат на Random давал 8 символов и «Weak» вместо дефолтных 16. */
const lastLength = { random: 16, memorable: 5, pin: 6 };

const clampLength = (v, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v, 10) || lo));

const t = () => translations[currentLang];
const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------------
   5. ГЕНЕРАТОРЫ
   ------------------------------------------------------------------- */

function generateRandomPassword() {
  const length = parseInt($('length').value, 10);
  const noAmbiguous = $('exclude-ambiguous')?.checked;

  // Каждый включённый класс — отдельный пул, чтобы гарантировать его наличие
  // в результате. Раньше пароль с включёнными символами мог не содержать
  // ни одного символа, что ломало сайты с обязательными требованиями.
  const pools = [CHARSETS.lowercase];
  if ($('uppercase').checked) pools.push(CHARSETS.uppercase);
  if ($('numbers').checked)   pools.push(CHARSETS.numbers);
  if ($('symbols').checked)   pools.push(CHARSETS.symbols);

  const usable = pools
    .map((p) => (noAmbiguous ? stripAmbiguous(p) : p))
    .filter((p) => p.length > 0);

  if (usable.length === 0) return showMessage(t().selectOption);

  const combined = usable.join('');

  const chars = usable.slice(0, Math.min(usable.length, length)).map((pool) => securePick(pool));
  while (chars.length < length) chars.push(securePick(combined));
  secureShuffle(chars);

  // Энтропия по общему пулу. Принудительное включение классов формально
  // снижает её на доли бита — здесь округляем вниз, это консервативно.
  showPassword(chars.join(''), length * Math.log2(combined.length));
}

function generateMemorablePassword() {
  const wordCount = parseInt($('length').value, 10);
  const capitalize = $('capitalize')?.checked;
  const addNumber  = $('addnumber')?.checked;
  const randomSep  = $('randomsep')?.checked;

  const words = [];
  for (let i = 0; i < wordCount; i++) {
    let w = securePick(WORDLIST);
    if (capitalize) w = w[0].toUpperCase() + w.slice(1);
    words.push(w);
  }

  const sep = randomSep ? securePick(SEPARATORS) : '-';
  let password = words.join(sep);

  // Заглавная первая буква — детерминированное преобразование, 0 бит.
  let entropy = wordCount * Math.log2(WORDLIST.length);
  if (randomSep) entropy += Math.log2(SEPARATORS.length);

  if (addNumber) {
    const num = String(10 + secureRandomInt(90));
    const pos = secureRandomInt(wordCount + 1);
    const parts = password.split(sep);
    parts.splice(pos, 0, num);
    password = parts.join(sep);
    entropy += Math.log2(90) + Math.log2(wordCount + 1);
  }

  showPassword(password, entropy);
}

function generatePinPassword() {
  const length = parseInt($('length').value, 10);
  const simplified = $('simplifiedpin')?.checked;

  if (simplified) {
    // Намеренно слабый режим: повторяющийся шаблон из 2–3 уникальных цифр.
    // Оставлен только по явному выбору пользователя и с предупреждением
    // в подписи. По умолчанию выключен.
    const pattern = secureRandomInt(3);
    const a = secureRandomInt(10), b = secureRandomInt(10), c = secureRandomInt(10);

    let unit;
    if (pattern === 0)      unit = `${a}${b}`;           // ABAB...
    else if (pattern === 1) unit = `${a}${a}${b}${b}`;   // AABB...
    else                    unit = `${a}${b}${c}`;       // ABCABC...

    // Цикл вместо прежнего slice(0, length) по строке фиксированной длины —
    // раньше 12-значный "ПИН" возвращался длиной 6.
    let pin = '';
    while (pin.length < length) pin += unit;
    pin = pin.slice(0, length);

    const uniqueDigits = pattern === 2 ? 3 : 2;
    showPassword(pin, Math.log2(3) + uniqueDigits * Math.log2(10));
    return;
  }

  let pin = '';
  for (let i = 0; i < length; i++) pin += secureRandomInt(10);
  showPassword(pin, length * Math.log2(10));
}

window.generatePassword = function () {
  if (currentType === 'random')         generateRandomPassword();
  else if (currentType === 'memorable') generateMemorablePassword();
  else if (currentType === 'pin')       generatePinPassword();
};

/* ---------------------------------------------------------------------
   6. ВЫВОД И ОЦЕНКА СТОЙКОСТИ
   ------------------------------------------------------------------- */

function showPassword(password, entropyBits) {
  lastEntropy = entropyBits;
  const el = $('password');
  el.textContent = password;
  el.dataset.empty = 'false';
  renderStrength(entropyBits);
  updateSliderBackground();
}

function showMessage(msg) {
  const el = $('password');
  el.textContent = msg;
  el.dataset.empty = 'true';
  lastEntropy = 0;
  renderStrength(null);
}

// Консервативная модель: офлайновый перебор быстрого хэша, 1e11 попыток/сек.
// В среднем требуется половина пространства ключей — отсюда 2^(bits-1).
const GUESSES_PER_SECOND = 1e11;

function formatCrackTime(entropyBits) {
  const seconds = Math.pow(2, entropyBits - 1) / GUESSES_PER_SECOND;
  const u = t().units;
  if (seconds < 1)        return t().instantly;
  if (seconds < 60)       return `${Math.round(seconds)} ${u.second}`;
  if (seconds < 3600)     return `${Math.round(seconds / 60)} ${u.minute}`;
  if (seconds < 86400)    return `${Math.round(seconds / 3600)} ${u.hour}`;
  if (seconds < 31557600) return `${Math.round(seconds / 86400)} ${u.day}`;

  const years = seconds / 31557600;
  if (years < 1e6) return `${Math.round(years).toLocaleString(currentLang)} ${u.year}`;
  return `10^${Math.round(Math.log10(years))} ${u.year}`;
}

function strengthTier(bits) {
  if (bits < 40)  return 0;
  if (bits < 60)  return 1;
  if (bits < 80)  return 2;
  if (bits < 100) return 3;
  return 4;
}

function renderStrength(bits) {
  const box = $('strength-meter');
  if (!box) return;

  if (bits === null || bits === 0) { box.hidden = true; return; }
  box.hidden = false;

  const tier = strengthTier(bits);
  box.dataset.tier = String(tier);

  const bar = $('strength-bar');
  if (bar) bar.style.width = `${Math.min(100, (bits / 128) * 100)}%`;

  const label = $('strength-text');
  if (label) {
    label.textContent =
      `${t().entropyLabel}: ${Math.floor(bits)} bit — ${t().strength[tier]} · ` +
      `${t().crackLabel}: ${formatCrackTime(bits)}`;
  }
}

/* ---------------------------------------------------------------------
   7. КОПИРОВАНИЕ
   ------------------------------------------------------------------- */

let clipboardTimer = null;

window.copyPassword = async function () {
  const el = $('password');
  const text = el.textContent;

  if (!text || el.dataset.empty === 'true') {
    flashButton('copy-btn', t().nothingToCopy);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    flashButton('copy-btn', t().copied);

    // Буфер обмена — общесистемный ресурс, доступный другим приложениям.
    // Чистим через 60 секунд, если пользователь сам ничего туда не положил.
    clearTimeout(clipboardTimer);
    clipboardTimer = setTimeout(async () => {
      try {
        const still = await navigator.clipboard.readText();
        if (still === text) await navigator.clipboard.writeText('');
      } catch { /* нет разрешения на чтение — тихо пропускаем */ }
    }, 60000);
  } catch {
    flashButton('copy-btn', t().copyFailed);
  }
};

function flashButton(id, message) {
  const btn = $(id);
  if (!btn) return;
  const original = t().copy;
  btn.textContent = message;
  btn.disabled = true;
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1400);
}

/* ---------------------------------------------------------------------
   8. UI: ПЕРЕКЛЮЧЕНИЕ ТИПОВ

   Тип читается из data-type, а не из подписи кнопки. Раньше сравнение шло
   по textContent, поэтому после перевода интерфейса на русский
   ("Случайный") переключатель переставал работать вовсе.
   ------------------------------------------------------------------- */

function createSwitchOption(id, i18nKey, checked = false) {
  const wrapper = document.createElement('label');
  wrapper.className = 'switch dynamic-option';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;

  const slider = document.createElement('span');
  slider.className = 'slider';

  const label = document.createElement('span');
  label.className = 'label-text';
  label.setAttribute('data-i18n', i18nKey);   // теперь переводится
  label.textContent = t()[i18nKey];

  wrapper.append(input, slider, label);
  return wrapper;
}

function updateUIForType(type) {
  const controls = document.querySelector('.controls');
  const lengthSlider = $('length');

  const toggle = (id, show) => {
    const node = $(id)?.closest('.switch');
    if (node) node.style.display = show ? 'flex' : 'none';
  };

  document.querySelectorAll('.dynamic-option').forEach((el) => el.remove());

  if (type === 'memorable') {
    toggle('uppercase', false); toggle('numbers', false); toggle('symbols', false);
    toggle('exclude-ambiguous', false);
    controls.append(
      createSwitchOption('capitalize', 'capitalize', true),
      createSwitchOption('addnumber', 'addNumber', false),
      createSwitchOption('randomsep', 'randomSeparator', false)
    );
    lengthSlider.min = 3; lengthSlider.max = 10;
    lengthSlider.value = clampLength(lastLength.memorable, 3, 10);
    setLengthCaption(t().wordsLabel);

  } else if (type === 'pin') {
    toggle('uppercase', false); toggle('numbers', false); toggle('symbols', false);
    toggle('exclude-ambiguous', false);
    // По умолчанию ВЫКЛЮЧЕН. Прежняя версия включала его молча, что резало
    // 6-значный ПИН с 10^6 примерно до 3·10^3 вариантов.
    controls.append(createSwitchOption('simplifiedpin', 'simplifiedPin', false));
    lengthSlider.min = 4; lengthSlider.max = 12;
    lengthSlider.value = clampLength(lastLength.pin, 4, 12);
    setLengthCaption(t().digitsLabel);

  } else {
    toggle('uppercase', true); toggle('numbers', true); toggle('symbols', true);
    toggle('exclude-ambiguous', true);
    lengthSlider.min = 8; lengthSlider.max = 64;
    lengthSlider.value = clampLength(lastLength.random, 8, 64);
    setLengthCaption(t().lengthLabel);
  }

  updateLengthDisplay();
  updateSliderBackground();
  renderStrength(null);
  $('password').textContent = t().passwordPlaceholder;
  $('password').dataset.empty = 'true';
}

function setLengthCaption(text) {
  const cap = $('length-caption');
  if (cap) cap.textContent = text;
}

function updateLengthDisplay() {
  const v = $('length-value');
  if (v) v.textContent = $('length').value;
}

function updateSliderBackground() {
  const s = $('length');
  if (!s) return;
  const pct = ((s.value - s.min) / (s.max - s.min)) * 100;
  s.style.setProperty('--slider-fill', `${pct}%`);
  s.style.background = `linear-gradient(to right, #4a90e2 0 ${pct}%, #ccc ${pct}% 100%)`;
}

/* ---------------------------------------------------------------------
   9. ЛОКАЛИЗАЦИЯ: ПРИМЕНЕНИЕ
   ------------------------------------------------------------------- */

function applyTranslations() {
  const tr = t();
  document.documentElement.lang = tr.htmlLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (tr[key] !== undefined) el.textContent = tr[key];
  });

  document.querySelectorAll('.type-btn').forEach((btn) => {
    const key = `type_${btn.dataset.type}`;
    if (tr[key]) btn.textContent = tr[key];
  });

  // Подпись тумблера показывает язык, НА КОТОРЫЙ переключимся.
  const label = $('lang-label');
  if (label) label.textContent = currentLang === 'ru' ? 'EN' : 'RU';

  const art = tr.articleText;
  ['article-p1', 'article-p2', 'article-p3'].forEach((id, i) => {
    if ($(id) && art[i]) $(id).textContent = art[i];
  });

  setLengthCaption(
    currentType === 'memorable' ? tr.wordsLabel :
    currentType === 'pin'       ? tr.digitsLabel : tr.lengthLabel
  );

  if ($('password') && $('password').dataset.empty !== 'false') {
    $('password').textContent = tr.passwordPlaceholder;
  }
  if (lastEntropy > 0) renderStrength(lastEntropy);
}

window.toggleLanguage = function () {
  // Переход на реальный URL, а не подмена текста: ссылкой можно поделиться,
  // а поисковик получает две отдельные индексируемые страницы.
  window.location.href = LANG_PATHS[currentLang === 'ru' ? 'en' : 'ru'];
};

/* ---------------------------------------------------------------------
   10. ИНИЦИАЛИЗАЦИЯ
   ------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentType = btn.dataset.type;
      updateUIForType(currentType);
    });
  });

  $('length')?.addEventListener('input', () => {
    lastLength[currentType] = parseInt($('length').value, 10);
    updateLengthDisplay();
    updateSliderBackground();
  });

  $('generate-btn')?.addEventListener('click', window.generatePassword);
  $('copy-btn')?.addEventListener('click', window.copyPassword);
  $('lang-toggle')?.addEventListener('click', window.toggleLanguage);

  applyTranslations();
  updateUIForType('random');
});
