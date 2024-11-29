import { Compiler } from "./components/Compiler/Compiler.js";
import { JSCompile } from "./components/JSCompile/JSCompile.js";
import { polyfill, main } from "./main.js";
customElements.define("js-compile", JSCompile);

polyfill();
main({ Compiler });
