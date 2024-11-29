const iih = `
<textarea id="input"></textarea>
<textarea id="output"></textarea>
<div>
<button id="loadBtn">Load</button>
<button id="compileBtn">Compile</button>
</div>
`;
const jcs = new CSSStyleSheet();
jcs.replaceSync(`
:host {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 2%;
}
textarea {
  width: 100%;
  border: none;
  text-wrap: nowrap;
  padding: .5rem;
  outline: .18rem solid #888;
  transition: all .5s ease-in;
  &:focus-within, &:active, &:focus {
    outline-color: #0f4;
  }
  &:hover:not(:focus-within) {
    outline-color: #0ff;
  }
  &:nth-child(1) {
    background-color: #dde;
  }
  &:nth-child(2) {
    background-color: var(--result-color, #ffc);
  }
}
button {
  width: 100%;
}
`);
class JSCompile extends HTMLElement {
  constructor() {
    super();
    this.#prop.shadow = this.attachShadow({ mode: "closed" });
    this.#prop("shadow").adoptedStyleSheets.push(jcs);
  }
  #prop(prop) {
    return this.#prop[prop];
  }
  retrieve(prop) {
    switch (prop) {
      case "input":
        return this.#prop("input");
      case "output":
        return this.#prop("output");
      default:
        return undefined;
    }
  }
  async loadFile() {
    let file = this.#prop("fileHandle")[0];
    file = (await file.getFile?.()) || file;
    this.#prop("input").value = await file.text();
  }
  addListeners() {
    const s = this.#prop("shadow");
    this.#prop("cHandler") && s.removeEventListener(this.#prop("cHandler"));
    this.#prop("dcHandler") && s.removeEventListener(this.#prop("dcHandler"));
    this.removeEventListener("contextmenu", this.initiateCompilation);

    this.#prop.cHandler = async ({ target, ctrlKey, shiftKey }) => {
      switch (target) {
        case this.#prop("loadBtn"):
          const fileHandle = await window
            .showOpenFilePicker()
            ?.catch((e) => null);
          fileHandle && ((this.#prop.fileHandle = fileHandle), this.loadFile());
          !fileHandle &&
            new Promise((r) => alert("Failed to get file.") || r());
          break;
        case this.#prop("compileBtn"):
          this.initiateCompilation();
          break;
        default:
          return;
      }
    };

    this.#prop.dcHandler = async (event) => {
      const { ctrlKey, shiftKey, altKey, target } = event;
      if (!["input", "output"].includes(target.id)) return;
      if (ctrlKey && !shiftKey && !altKey) return target.requestFullscreen();
    };
    this.#prop("compileBtn").addEventListener(
      "click",
      () => this.initiateCompilation,
    );
    s.addEventListener("click", this.#prop("cHandler"));
    s.addEventListener("dblclick", this.#prop("dcHandler"));
  }
  initiateCompilation() {
    return this.compiler?.compile(
      this.#prop("input").value,
      this.#prop("output"),
    );
  }
  connectedCallback() {
    this.#prop("shadow").innerHTML = iih;
    [...this.#prop("shadow").querySelectorAll("*")].forEach((el) => {
      el.id && (this.#prop[el.id] = el);
      el.tagName.toLowerCase() === "textarea" &&
        el.setAttribute("spellcheck", "false");
    });
    this.addListeners();
  }
}
export { JSCompile };
