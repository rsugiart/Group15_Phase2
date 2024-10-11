import { runCommand } from './src/jestRunner';
import { describe, it, expect, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Command Line Runner', () => {
  let total = 0;
  let passed = 0;

  it('should return 0 for "./run testURL11.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL11.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL12.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL12.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL13.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL13.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL14.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL14.txt');
    expect(exitCode).toBe(0);
    if (exitCode === 0) {
      passed += 1;
    }
    total += 1;
  });

  it('should return 0 for "./run testURL15.txt"', async () => {
    const { stdout, exitCode } = await runCommand('./run ./testURLs/testURL15.txt');
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
