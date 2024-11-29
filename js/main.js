export function polyfill() {
  function showOpenFilePicker() {
    const fileInputId = Math.random().toString().substring(2, 15);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.id = fileInputId;
    fileInput.style = "display: none;";
    document.body.appendChild(fileInput);

    return function showOpenFilePicker() {
      return new Promise((resolve, reject) => {
        const ac = new AbortController();
        const { signal } = ac;
        const cresolve = () => resolve(fileInput.files);
        fileInput.addEventListener("change", cresolve, { once: true, signal });
        fileInput.addEventListener("cancel", reject, { once: true, signal });
        try {
          fileInput.showPicker();
        } catch (error) {
          ac.abort();
          reject(error);
        }
      });
    };
  }
  window.showOpenFilePicker = showOpenFilePicker();
}
export function main(data) {
  document.querySelector("js-compile").compiler = new data.Compiler();
}
