"use strict";
// // Import yargs and other dependencies
// import yargs from 'yargs';
// import { hideBin } from 'yargs/helpers';
// import { calculateRampUp } from './metrics/rampUpTime';
// import { calculateCorrectness } from './metrics/correctness';
// import { calculateBusFactor } from './metrics/busFactor';
// import { calculateResponsiveness } from './metrics/responsiveness';
// import { calculateLicenseCompatibility } from './metrics/licenseCompatability';
// // Define the CLI commands and options
// yargs(hideBin(process.argv))
//     .command(
//         'evaluate [url]', // Evaluate command
//         'Evaluate a module from a given URL',
//         (yargs) => {
//             yargs.positional('url', {
//                 describe: 'The URL of the module to evaluate',
//                 type: 'string',
//                 demandOption: true
//             });
//         },
//         async (argv) => {
//             // Call each metric function to calculate scores
//             const rampUpScore = await calculateRampUp(argv.url);
//             const correctnessScore = await calculateCorrectness(argv.url);
//             const busFactorScore = await calculateBusFactor(argv.url);
//             const responsivenessScore = await calculateResponsiveness(argv.url);
//             const licenseCompatibilityScore = await calculateLicenseCompatibility(argv.url);
//             // Combine the results into a final object
//             const result = {
//                 URL: argv.url,
//                 NetScore: (rampUpScore + correctnessScore + busFactorScore + responsivenessScore + licenseCompatibilityScore) / 5, // Simple average
//                 RampUp: rampUpScore,
//                 Correctness: correctnessScore,
//                 BusFactor: busFactorScore,
//                 Responsiveness: responsivenessScore,
//                 LicenseCompatibility: licenseCompatibilityScore
//             };
//             // Output the result in JSON format
//             console.log(JSON.stringify(result, null, 2));
//         }
//     )
//     .help()
//     .argv;
// // compile with
// // npx tsc cli.ts
// // run with
// // node cli.js evaluate --url=https://github.com/user/repo
