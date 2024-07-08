import pc from "picocolors"

export const error = (e:string) => {
    console.log(`\n${pc.red("Error:")} ${pc.underline(e)}\n`);
    process.exit(0);
}