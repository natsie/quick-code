import Environment from './Environment.js';

class TrieNode {
	constructor() {
		this.endOfWord = false;
		this.children = {};
	}
}

class Trie {
	constructor() {
		this.root = new TrieNode();
	}

	insert(word, data) {
		let node = this.root;
		for (const char of word) {
			if (!node.children[char]) node.children[char] = new TrieNode();
			node = node.children[char];
		}
		node.data = data;
		node.endOfWord = true;
	}

	retrieve(word) {
		let node = this.root;
		for (let char of word) {
			if (!node.children[char]) {
				return null;
			}
			node = node.children[char];
		}
		return node.endOfWord ? node.data : null;
	}

	search(word) {
		let node = this.root;
		for (let char of word) {
			if (!node.children[char]) {
				return false;
			}
			node = node.children[char];
		}
		return node.endOfWord;
	}

	startsWith(prefix) {
		let node = this.root;
		for (let char of prefix) {
			if (!node.children[char]) {
				return [];
			}
			node = node.children[char];
		}
		return this._collectWords(node, prefix);
	}

	remove(word) {
		this._remove(this.root, word, 0);
	}

	_remove(node, word, index) {
		if (index === word.length) {
			if (!node.endOfWord) {
				return false;
			}
			node.endOfWord = false;
			return Object.values(node.children).length === 0;
		}

		const char = word[index];
		const childNode = node.children[char];

		if (!childNode) {
			return false;
		}

		const shouldDeleteCurrentNode = this._remove(childNode, word, index + 1);

		if (shouldDeleteCurrentNode) {
			delete node.children[char];
			return Object.values(node.children).length === 0;
		}

		return false;
	}

	_collectWords(node, prefix) {
		let words = [];
		if (node.endOfWord) {
			words.push(prefix);
		}
		for (let char in node.children) {
			words = words.concat(
				this._collectWords(node.children[char], prefix + char),
			);
		}
		return words;
	}
}

class Executor {
	static _ = {
		opMap: {
			"**": "exponentiate",
			"/": "divide",
			of: "multiply",
			"*": "multiply",
			"%": "modulo",
			"+": "increment",
			"-": "decrement",
			"<": "logicalLessThan",
			"<=": "logicalLessThanEqual",
			">": "logicalGreaterThan",
			">=": "logicalGreaterThanEqual",
			"===": "logicalStrictEqual",
			"!==": "logicalStrictNotEqual",
			"==": "logicalEqual",
			"!=": "logicalNotEqual",
			"&&": "logicalAnd",
			"||": "logicalOr",
		},
		exponentiate: (a, b) => a ** b,
		divide: (a, b) => a / b,
		multiply: (a, b) => a * b,
		modulo: (a, b) => a % b,
		increment: (a, b) => a + b,
		decrement: (a, b) => a - b,
		logicalLessThan: (a, b) => a < b,
		logicalLessThanEqual: (a, b) => a <= b,
		logicalGreaterThan: (a, b) => a > b,
		logicalGreaterThanEqual: (a, b) => a >= b,
		logicalStrictEqual: (a, b) => a === b,
		logicalStrictNotEqual: (a, b) => a !== b,
		logicalEqual: (a, b) => a == b,
		logicalNotEqual: (a, b) => a != b,
		logicalAnd: (a, b) => a && b,
		logicalOr: (a, b) => a || b,
		logicalNot: (a) => !a,
		isString(str) {
			if (typeof str !== "string") return false;
			const indicators = "\"'`";

			if (!indicators.includes(str[0])) return false;
			const strInit = str[0];
			for (let i = 1; i < str.length; i++) {
				if (str[i] === strInit && str[i - 1] !== "\\") {
					if (i === str.length - 1) return true;
					return false;
				}
			}
		},
		performArithmeticOp(env, expr) {
			const operations = Object.entries(this.opMap).reverse();
			const functions = this;
			const tree = { value: expr };

			if (this.isString(expr)) return expr.slice(1, -1);

			function createSubtree(subtree) {
				// Step 1: Handle Brackets
				const bracketMatch = /\(([^()]+)\)/; // Matches innermost parentheses
				while (bracketMatch.test(subtree.value)) {
					subtree.value = subtree.value.replace(
						bracketMatch,
						(_, innerExpr) => {
							return createSubtree({ value: innerExpr }).value;
						},
					);
				}

				// Step 2: Handle Other Operators
				let fragmented = false;
				for (const [op, opName] of operations) {
					const s = subtree.value.split(` ${op} `);
					if (s.length > 1) {
						subtree.left = { value: s[0] };
						subtree.right = { value: s.slice(1).join(" ") };
						subtree.operation = opName;
						createSubtree(subtree.left);
						createSubtree(subtree.right);
						subtree.value = functions[subtree.operation](
							subtree.left.value,
							subtree.right.value,
						);
						fragmented = true;
						break;
					}
				}

				// Step 3: Resolve Leaf Nodes
				if (!fragmented) {
					const negation =
						Array.from(subtree.value.trim()).reduce(
							(acc, cur) => {
								if (cur === "!" && acc.pb)
									throw new SyntaxError("! within expression.");
								if (cur === "!" && !acc.pb) acc.c++;
								if (cur !== "!") acc.pb = true;
								return acc;
							},
							{ c: 0, pb: false },
						).c % 2;
					let value = subtree.value.trim().replace(/\!/g, "");
					subtree.value = Number(value);
					if (isNaN(subtree.value)) {
						subtree.value = env.get(value);
						if (subtree.value === Environment.UndeclaredVariable) {
							throw new ReferenceError(value + " is not defined.");
						}
						subtree.value = subtree.value.value;
					}
					negation && (subtree.value = !subtree.value);
				}

				return subtree;
			}

			createSubtree(tree);
			return tree.value;
		},
	};

	code = ""; // Raw code
	instructions = []; // Preprocessed code array
	trie = new Trie();
	intercept = { console: { ...console } };
	environment = null;
	callStack = []; // Track function calls

	// Parse code into an array of instructions
	preprocessCode() {
		const lines = this.code.split("\n").map((line) => line.trim());
		let withinExecution = false;

		this.instructions = [];

		for (const line of lines) {
			if (/^%-- BEGIN EXECUTION --%/.test(line)) {
				withinExecution = true;
				continue;
			}
			if (/^%-- TERMINATE EXECUTION --%/.test(line)) {
				withinExecution = false;
				break;
			}

			if (withinExecution && line && !line.startsWith("//")) {
				this.instructions.push(line);
			}
		}
	}

	prepareTrie() {
		const self = this;
		this.trie.insert("DECLARE", async function DECLARE(env, operand) {
			let [id, val] = operand.trim().split("=");
			id = id.trim();

			const isConstant = id?.startsWith("*");
			isConstant && (id = id.slice(1));
			if (!id) throw new SyntaxError("Invalid identifier for DECLARE.");

			if (val) {
				val = val.trim();
				// Check if value is a CALL expression
				if (val.startsWith("CALL")) {
					const callResult = await self.trie.retrieve("CALL")(env, val.slice(4).trim());
					val = callResult;
				} else {
					// Try numeric/boolean conversion first
					val = Number(val) || val;
					if (val === "true") val = true;
					if (val === "false") val = false;
					// If not a simple value, try arithmetic evaluation
					if (!["number", "boolean"].includes(typeof val)) {
						val = Executor._.performArithmeticOp(env, val);
					}
				}
			}

			if (isConstant && val === undefined) {
				throw new TypeError(
					"Value type of constant variable declaration cannot be undefined.",
				);
			}
			return env.declare(id, { value: val, constant: isConstant });
		});
		this.trie.insert("ASSIGN", async function ASSIGN(env, operand) {
			let [id, ...val] = operand
				.split(" ")
				.map((s) => s.trim())
				.filter(Boolean);
			if (!id)
				throw new SyntaxError(
					"ASSIGN expects a non-constant variable identifier.",
				);

			let makeConstant = id.startsWith("*");
			makeConstant && (id = id.slice(1));

			const varObj = env.get(id);
			if (varObj === Environment.UndeclaredVariable) {
				throw new ReferenceError(id + " is not defined.");
			}
			if (varObj.constant) {
				throw new TypeError("Assignment to constant variable.");
			}
			val = val.join(" ");

			varObj.value = Executor._.performArithmeticOp(env, val);
			varObj.constant = makeConstant;
		});
		this.trie.insert("JUMP", async function JUMP(env, operand, _, i) {
			const result = { jump: i };
			operand = operand.trim();

			if (!operand) return result;
			if (/^(\+|\-)[0-9]{1,}/.test(operand)) {
				switch (operand[0]) {
					case "+":
						result.jump += Number(operand.slice(1));
						break;
					case "-":
						result.jump -= Number(operand.slice(1));
						break;
					default:
						throw new SyntaxError("Invalid JUMP operator.");
				}
			} else {
				operand = Number(Executor._.performArithmeticOp(env, operand));
				if (isNaN(operand))
					throw new SyntaxError("JUMP operand failed to cast to number.");
				result.jump = operand;
			}

			return result;
		});
		this.trie.insert("WAIT", async function WAIT(env, operand) {
			await new Promise((resolve, reject) =>
				setTimeout(
					resolve,
					Executor._.performArithmeticOp(env, operand.trim()),
				),
			);
		});
		this.trie.insert("IF", async function IF(env, operand, instructions, iIndex) {
			const if_instructions = structuredClone(instructions.slice(iIndex));
			const else_instructions = structuredClone(instructions.slice(iIndex));
			const operandValue = Executor._.performArithmeticOp(
				env,
				operand.trim(),
			);
			const {
				depth,
				else: elseIndex,
				end: endIndex,
			} = if_instructions.reduce(
				(acc, cur, i) => {
					if (acc.break) return acc

					const keyword = cur.split(" ")[0];
					if (keyword === "IF") acc.depth++;
					if (keyword === "END") acc.depth--, (acc.end = i);
					if (keyword === "ELSE" && acc.depth === 1) acc.else = i;
					if (acc.depth === 0) acc.break = true
					return acc;
				},
				{ depth: 0, break: 0 },
			);
			if (depth > 0)
				throw new SyntaxError(
					"IF keyword with no corresponding END keyword.",
				);
			if (depth < 0)
				throw new SyntaxError("END keyword without preceeding IF.");

			if_instructions.splice(0, 1);
			if (elseIndex) {
				if_instructions.splice(elseIndex - 1);
				else_instructions.splice(0, elseIndex + 1);
				else_instructions.splice(endIndex - elseIndex - 1);
			} else {
				if_instructions.splice(endIndex - 1);
				else_instructions.splice(0);
			}

			const overrides = {
				JUMP: async (env2, operand, _, i) => {
					const r = await self.trie.retrieve("JUMP")(
						env2,
						operand,
						_,
						i + iIndex, // assume jump is relative to outer script
					);
					if (r.jump <= iIndex || r.jump > endIndex) {
						// is jumping outside IF
						env2.declare("__jump", r.jump - 1); // remember where to go in outer script
						return { jump: _.length - 1 }; // end IF execution
					}
					r.jump -= iIndex; // set jump within IF context
					return r;
				},
				RET: async (env2, operand, _, i) => {
					env.declare("__ret", await self.trie.retrieve("RET")(
						env2,
						operand,
					))
				},
			};

			if (operandValue) {
				const result = await self.execute(
					new Environment(env),
					if_instructions,
					overrides,
				);
				if (result.has("__jump")) return { jump: result.get("__jump") }; // forward jumps to escaped the context
			} else {
				const result = await self.execute(
					new Environment(env),
					else_instructions,
					overrides,
				);
				if (result.has("__jump")) return { jump: result.get("__jump") }; // forward jumps to escaped the context
			}
			return { jump: endIndex + iIndex }; // jump to the END
		});
		this.trie.insert("IGNORE", async function IGNORE(env, operand) { });
		this.trie.insert("STD::OUT", async function STDOUT(env, operand) {
			const value = Executor._.performArithmeticOp(env, operand.trim());
			self.intercept.console.log(value);
		});

		// Add function-related keywords
		this.trie.insert("FUNC", async function FUNC(env, operand, _, iIndex) {
			const words = operand.trim().split(" ").filter(w => w);
			const name = words[0];
			const params = words.slice(1);

			// Collect function body until END
			const bodyStart = iIndex + 1;
			let depth = 1;
			let bodyEnd = bodyStart;

			while (depth > 0 && bodyEnd < self.instructions.length) {
				const instruction = self.instructions[bodyEnd];
				if (["IF", "WHILE", "FUNC"].some((k) => instruction.startsWith(k))) depth++;
				if (instruction === "END") depth--;
				bodyEnd++;
			}

			if (depth > 0) {
				throw new SyntaxError("Unclosed function definition");
			}

			const body = self.instructions.slice(bodyStart, bodyEnd - 1);
			const func = { params, body, func: true };

			// If name is provided, declare function in environment
			if (name !== "_") { // Anonymous function if name is "_"
				env.declare(name, { value: func, constant: false });
			}

			return { jump: bodyEnd - 1, value: func }; // Skip the function body
		});

		this.trie.insert("CALL", async function CALL(env, operand) {
			const words = operand.trim().split(" ").filter(w => w);
			const funcNameOrExpr = words[0];
			const args = words.slice(1);

			// Get function either from variable or direct definition
			let func;
			if (funcNameOrExpr.startsWith("FUNC ")) {
				// Inline function definition
				const funcDef = await self.trie.retrieve("FUNC")(env, funcNameOrExpr.slice(4));
				func = funcDef.value;
			} else {
				// Get function from variable
				const funcVar = env.get(funcNameOrExpr);
				if (funcVar === Environment.UndeclaredVariable || !funcVar.value.func) {
					throw new ReferenceError(`${funcNameOrExpr} is not a function`);
				}
				func = funcVar.value;
			}

			// Create new environment for function scope
			const funcEnv = new Environment(env);

			// Bind parameters to arguments
			func.params.map((p, i) => { funcEnv.declare(p, { value: (args[i] !== undefined) ? Executor._.performArithmeticOp(env, args[i]) : undefined, constant: false }) })
			funcEnv.declare("__ret", Environment.UndeclaredVariable);

			// Push to call stack
			self.callStack.push(funcNameOrExpr);

			// Execute function body
			await self.execute(funcEnv, func.body);

			// Pop from call stack
			self.callStack.pop();

			// Return the last return value
			return funcEnv.get("__ret");
		});

		this.trie.insert("RET", async function RET(env, operand) {
			// Check if we're inside a function context by looking at callStack
			if (self.callStack.length === 0) {
				throw new SyntaxError("RET outside of function");
			}
			const val = Executor._.performArithmeticOp(env, operand.trim())
			env.declare("__ret", val)
			return val
		});
	}

	// Execute the preprocessed instructions
	execute(environment, instructions, overrides = {}) {
		!environment && (environment = this.environment);
		!instructions && (instructions = this.instructions);
		return new Promise(async (resolve, reject) => {
			try {
				for (let i = 0; i < instructions.length; i++) {
					if (environment.get("__ret") !== Environment.UndeclaredVariable) resolve(environment)
					const instruction = instructions[i];
					const [keyword, ...rest] = instruction.split(" ");
					const operation = overrides[keyword] || this.trie.retrieve(keyword);

					if (!operation) {
						throw new SyntaxError(`Unknown operation: ${keyword}`);
					}

					const operand = rest.join(" ").trim();
					await this.trie.retrieve("WAIT")(environment, "0", instructions, i);
					const result = await operation(environment, operand, instructions, i)
					if (result?.jump !== undefined) i = result.jump;
				}
				resolve(environment);
			} catch (err) {
				reject(err);
			}
		});
	}

	// Inject built-in variables into the environment
	injectStandardLibrary() {
		this.environment.declare("std", {
			constant: true,
			value: {
				in: (globalThis || window).prompt || ((...args) => console.log(...args) || true),
				out: (globalThis || window).alert || console.log,
				query: (globalThis || window).confirm || ((...args) => console.log(...args) || true),
			},
		});
	}

	// Initialize executor
	init(code) {
		this.code = code;
		this.environment = new Environment();
		this.preprocessCode();
		this.prepareTrie();
		this.injectStandardLibrary();
		return this;
	}
}

export default Executor;

console.log(
	"%cWelcome to QuickCode",
	"padding:.5rem;font-weight:400;background-color:black;color:yellow;border:1px solid white;font-size:2rem",
);
