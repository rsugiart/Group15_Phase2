import { runCommand } from './src/jestRunner';
import { describe, it, expect, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Command Line Runner', () => {
  let total = 0;
  let passed = 0;

  it('should return 0 for "./run testURL16.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL16.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL17.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL17.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL18.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL18.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL19.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL19.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL20.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL20.txt');
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
