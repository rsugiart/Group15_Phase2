import {analyzeURL} from './src/rating/main.js';

const result = await analyzeURL('https://github.com/jashkenas/underscore');
console.log((result));