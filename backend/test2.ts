import {analyzeURL} from './src/rating/main.js';

const result = await analyzeURL('https://github.com/lodash/lodash');
console.log((result));