import { runCommand } from './src/jestRunner';
import { describe, it, expect, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Command Line Runner', () => {
  let total = 0;
  let passed = 0;

  it('should return 0 for "./run testURL6.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL6.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL7.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL7.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL8.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL8.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL9.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL9.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL10.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL10.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  afterAll(() => {
    const filePath = path.join(__dirname, 'testResults.txt');
    const results = `Total ${total} Passed ${passed}\n`;
    fs.appendFileSync(filePath, results, 'utf8');
  });

});
