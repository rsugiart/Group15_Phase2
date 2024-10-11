// jestRunner1-5.test.ts
import { runCommand } from './src/jestRunner';
import { describe, it, expect, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Command Line Runner', () => {
  let total = 0;
  let passed = 0;

  const testUrls = ['./testURLs/testURL1.txt', './testURLs/testURL2.txt', './testURLs/testURL3.txt', './testURLs/testURL4.txt', './testURLs/testURL5.txt'];

  for (const url of testUrls) {
    it(`should return 0 for "${url}"`, async () => {
      const { stdout, exitCode } = await runCommand(`./run ${url}`);
      expect(exitCode).toBe(0);
      if (exitCode === 0) {
        passed += 1;
      }
      total += 1;
    });
  }

  afterAll(() => {
    const filePath = path.join(__dirname, 'testResults.txt');
    const results = `Total ${total} Passed ${passed}\n`;
    fs.appendFileSync(filePath, results, 'utf8');
  });
});
