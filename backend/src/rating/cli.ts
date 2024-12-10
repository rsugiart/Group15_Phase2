// cli.ts
/**
 * A Command Line Interface (CLI) tool for greeting users.
 * 
 * This CLI tool allows users to:
 *  - Generate a greeting message for a specified name.
 *  - Customize the greeting with an optional exclamation mark.
 * 
 * Commands:
 *  - `greet [name]`: Outputs a greeting message. 
 *    - Positional Arguments:
 *      - `name` (string, optional): The name to greet. Defaults to "World".
 *    - Options:
 *      - `--exclaim` or `-e` (boolean): If set, adds an exclamation mark to the greeting.
 * 
 * Usage:
 *  - Compile with: `npx tsc cli.ts`
 *  - Run with:
 *    - `node cli.js greet --name=Sam`
 *    - `node cli.js greet --name=Sam --exclaim`
 *    - `node cli.js greet` (defaults to "World")
 *    - `node cli.js greet --help` (displays help information)
 * 
 * Example Outputs:
 *  - `node cli.js greet --name=Sam --exclaim` → "Hello, Sam!"
 *  - `node cli.js greet --name=Sam` → "Hello, Sam."
 *  - `node cli.js greet` → "Hello, World."
 * 
 * Dependencies:
 *  - `yargs`: Used for parsing command-line arguments and options.
 *  - `hideBin`: Helper function to parse `process.argv` arguments.
 *
 */


// Step 1: Import yargs
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Step 2: Define commands and options
yargs(hideBin(process.argv))
    .command(
        'greet [name]', // Command name and positional argument
        'Greet the user by name', // Command description
        (yargs) => {
            yargs.positional('name', {
                describe: 'Name to greet',
                type: 'string',
                default: 'World'
            });
        },
        (argv) => {
            // Command handler
            let greeting = `Hello, ${argv.name}`;
            if (argv.exclaim) {
                greeting += '!';
            } else {
                greeting += '.';
            }
            console.log(greeting);
        }
    )
    .option('exclaim', {
        alias: 'e',
        type: 'boolean',
        description: 'Add an exclamation mark to the greeting'
    })
    .help() // Enable help command
    .argv; // Parse the arguments

    //compile with
    //npx tsc cli.ts

    //run with
    //node cli.js greet --name=Sam --exclaim