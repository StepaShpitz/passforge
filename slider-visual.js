
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('input[type="range"]');

  if (slider) {
    function updateSliderBackground() {
      const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
      slider.style.background = `linear-gradient(to right, #4A69BD 0%, #4A69BD ${value}%, #ccc ${value}%, #ccc 100%)`;
    }

    slider.addEventListener('input', updateSliderBackground);
    updateSliderBackground(); // инициализация при загрузке
  }
});
