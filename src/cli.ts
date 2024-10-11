// cli.ts

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