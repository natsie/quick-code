import fs from 'fs/promises';
import Executor from './js/components/Compiler/Executor.js';
import cp from "child_process"
import path from 'path';

async function scanForFiles(ext, options = {}) {
    function scanFolder(parent, extension, matches = []) {
        const promises = []

        return fs.readdir(parent, { withFileTypes: true }).then(entries => {
            for (const c of entries) {
                if (c.isDirectory()) promises.push(scanFolder(path.join(parent, c.name), extension, matches))
                if (c.isFile() && c.name.endsWith(extension)) matches.push(path.join(parent, c.name))
            }
            return Promise.resolve()
        }).then(() => Promise.allSettled(promises)).then(() => matches)
    }

    const wd = process.cwd()
    const matches = await scanFolder(wd, ext)

    return matches
}

async function runAll() {
    const qcFiles = await scanForFiles(".qc", { recursive: true })
    let instances = new Array()
    const tracking = { succeeded: 0, failed: 0 }
    console.log(qcFiles);

    console.log(`Running ${qcFiles.length} file${qcFiles.length === 1 ? "" : "s"}.`)
    instances = qcFiles.map((async file => {
        const filename = file
        const fileContent = await fs.readFile(file, { encoding: "utf8" }).catch(e => null)
        if (!fileContent) return { success: false, err: "Failed to read file", filename }

        const logs = new Array()
        const executor = new Executor().init(fileContent)
        executor.intercept.console.log = logs.push.bind(logs)

        let env = new Map()
        try {
            env = await executor.execute()
            return { success: true, filename, env, logs }
        } catch (e) {
            return { success: false, filename, err, env, logs }
        }
    }))

    await Promise.allSettled(instances).then(pArr => {
        for (const p of pArr) {
            p.value.success && tracking.succeeded++
            !p.value.success && tracking.failed++

            if (p.value.success) {
                console.log("✅ " + p.value.filename)
                process.argv.includes("--verbose") && console.log(p.value)
            } else {
                console.log("❌ " + p.value.filename)
                process.argv.includes("--verbose") && console.log(p.value)
            }
        }
    })
    console.log()
    console.log(`Successfully ran ${tracking.succeeded} file${tracking.succeeded === 1 ? "" : "s"}.`)
    console.log(`Failure when running ${tracking.failed} file${tracking.failed === 1 ? "" : "s"}.`)
}

async function main() {
    if (process.argv.filter(a => !a.startsWith("-")).length < 3) {
        console.info('Usage: node node-main.js <filename>');
        console.info("Running all .qc files.")
        await runAll()
        process.exit()
    }

    const filename = process.argv[2];
    try {
        const code = await fs.readFile(filename, 'utf8');
        const executor = new Executor().init(code);
        await executor.execute();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
// const fs = require("fs/promises");
// const emojisJson = require("./js/components/Compiler/emojis.json");
// const emojis = emojisJson.reduce((acc, cur) => {
// 	acc[cur.name.replace(/(\s)|\:/g, "-").toLowerCase()] = cur;
// 	return acc;
// }, {});
// console.log(emojis);

// function getEmojiData() {
// 	const data = [];
// 	document.querySelectorAll("tr").forEach((e) => {
// 		const img = e.querySelector(".andr img");
// 		if (!img) return;

// 		const char = img.alt;
// 		const code = e.querySelector(".code a").textContent;
// 		const name = e.querySelectorAll(".name")[0].textContent;
// 		const keywords = e.querySelectorAll(".name")[1].textContent;
// 		data.push({ char, code, name, keywords });
// 	});