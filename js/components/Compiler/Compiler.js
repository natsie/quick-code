import Executor from "./Executor.js";
import Environment from "./Environment.js";

class Compiler extends EventTarget {
  constructor() {
    super();
    this.context = {};
    this.settings = new Map();
  }
  async compile(code, outputEl) {
    if (typeof code !== "string") throw new Error("Invalid input.");
    const settings = new Map();
    const executor = new Executor().init(code);
    executor.intercept.console.log = (...args) => {
      console.log(...args);
      outputEl.value +=
        args.map((a) => JSON.stringify(a, null, 2)).join(" ") + "\n";
    };
    console.log(await executor.execute());
  }
}
export { Compiler, Environment, Executor };
