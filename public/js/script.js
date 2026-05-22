// Form validation
(() => {
  "use strict";
  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false,
    );
  });
})();

// Flash auto-dismiss + close button
document.querySelectorAll(".flash").forEach((flash) => {
  const close = flash.querySelector(".flash-close");
  const dismiss = () => {
    flash.classList.add("flash-leaving");
    setTimeout(() => flash.remove(), 250);
  };
  if (close) close.addEventListener("click", dismiss);
  setTimeout(dismiss, 4500);
});
