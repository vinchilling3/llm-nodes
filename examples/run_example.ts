(async function main() {
    const scriptName = process.argv[2];
    const args = process.argv.slice(3);
    if (!scriptName) {
        console.log("Please provide a script name");
        return;
    }
    try {
        const test = await import(`./${scriptName}`);
        await test.default(...args);
    } catch (error) {
        console.log(error);
    }
})();
