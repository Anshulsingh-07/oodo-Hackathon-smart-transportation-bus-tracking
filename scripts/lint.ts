import { ESLint } from 'eslint';

async function runLint() {
    const eslint = new ESLint({
        overrideConfigFile: '.eslintrc.json',
        fix: true,
    });

    const results = await eslint.lintFiles(['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}']);

    await ESLint.outputFixes(results);

    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    console.log(resultText);

    if (results.some(result => result.errorCount > 0)) {
        process.exitCode = 1; // Indicate that there were linting errors
    }
}

runLint().catch(error => {
    console.error('Error running lint:', error);
    process.exit(1);
});