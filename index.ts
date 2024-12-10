/*
NYC Test Runner
Sources: 
    https://github.com/frenya/vscode-recall/blob/master/src/test/suite/index.ts
    https://frenya.net/blog/vscode-extension-code-coverage-nyc
    https://stackoverflow.com/questions/56301056/how-do-a-generate-vscode-typescript-extension-coverage-report/65804621#65804621
*/

// Simulates the recommended config option
// extends: "@istanbuljs/nyc-config-typescript",

import * as baseConfig from "@istanbuljs/nyc-config-typescript";
// Recommended modules, loading them here to speed up NYC init
// and minimize risk of race condition
import 'ts-node/register';
import 'source-map-support/register';
import path from "path";
const NYC = require('nyc');
import glob from 'glob';

export async function run(): Promise<void> {
	const testsRoot = path.resolve(__dirname, '..');

  // Setup coverage pre-test, including post-test hook to report
  const nyc = new NYC({
    ...baseConfig,
    cwd: path.join(__dirname, '..', '..', '..'),
    reporter: ['text-summary', 'html'],
    all: true,
    silent: false,
    instrument: true,
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    include: [ "out/**/*.js" ],
    exclude: [ "out/test/**" ],
  });
  await nyc.wrap();
// Debug which files will be included/excluded
console.log('Glob verification', await nyc.exclude.glob(nyc.cwd));
}

const files = glob.sync('**/*.test.js', { cwd: testsRoot });


// Print a warning for any module that should be instrumented and is already loaded,
// delete its cache entry and re-require
// NOTE: This would not be a good practice for production code (possible memory leaks), but can be accepted for unit tests
// NOTE: nyc.exclude handles both the include and exlude patterns, the name is a bit misleading here
Object.keys(require.cache).filter(f => nyc.exclude.shouldInstrument(f)).forEach(m => {
    console.warn('Module loaded before NYC, invalidating:', m);
    delete require.cache[m];
    require(m);
});

async function captureStdout(fn) {
let w = process.stdout.write, buffer = '';
process.stdout.write = (s) => {
    buffer = buffer + s;
    return true; 
};
await fn();
process.stdout.write = w;
return buffer;
}

// Capture text-summary reporter's output and log it in console
console.log(await captureStdout(nyc.report.bind(nyc)));