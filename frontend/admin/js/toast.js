export function showErrorToast(message) {
  const errorToast = document.getElementById("errorToast");
  const text = document.getElementById("errorToastText");

  if (!errorToast || !text) return;

  text.textContent = message;

  errorToast.classList.add("show");

  setTimeout(() => {
    errorToast.classList.remove("show");
  }, 5000);
}

export function showSuccessToast(message) {
  const successToast = document.getElementById("successToast");

  if (!successToast) return;

  const text = successToast.querySelector("span");

  if (text) {
    text.textContent = message;
  }

  successToast.classList.add("show");

  setTimeout(() => {
    successToast.classList.remove("show");
  }, 5000);
}

export function showDeleteToast(message) {
  const deleteToast = document.getElementById("deleteToast");

  if (!deleteToast) return;

  const text = deleteToast.querySelector("span");

  if (text) {
    text.textContent = message;
  }

  deleteToast.classList.add("show");

  setTimeout(() => {
    deleteToast.classList.remove("show");
  }, 5000);
}
