import pc from "picocolors";
import fs from "node:fs";
import { Lexer, KEYWORDS } from "./Lexer";
import { error } from "./error";
import { Variable, Function, Print, Conditional } from "./Classes";

const tokens = Lexer(fs.readFileSync("main.z", "utf-8"));

type Chunks = {
    code: Array<any>[];
    endpoints: number[];
}
const chunks: Chunks = {
    code: [],
    endpoints: []
};

tokens.forEach((token, i: number) => {
    const classes: Array<string> = Object.keys(KEYWORDS);

    if (classes.includes(token.value)) chunks.endpoints.push(i);
});
chunks.endpoints.push(tokens.length); // push length of tokens to make sure all chunks are included

chunks.endpoints.forEach((endpoint, i: number) => {
    if (endpoint !== 0) {
        chunks.code.push(tokens.slice(chunks.endpoints[i - 1], endpoint));
    }
});

export default chunks.code;

let builder: Array<string> = [];
let params: Array<string | number> = [];

// parse each chunk into readable javascript
chunks.code.forEach(lines => {
    lines.forEach((line, l: number) => { // error handling
        switch (line.type) {
            case 2: // conditional statements
                if (lines[1].value != ":") {
                    error(`A colon was expected at "${lines[1].value}"`);
                }
                builder.push(Conditional(lines, "if"));
                break;
            case 7: // variables
                if (lines[l + 2].value != "&") {
                    console.log(lines[l + 2])
                    error("A type is required for a variable.");
                } else if (lines[l + 4].value != ":") {
                    error(`A colon was expected at "${lines[l + 4].value}"`);
                } else {
                    const type = lines[l + 3].value;
                    const value = lines[l + 5].value;

                    switch (type) {
                        case "bool":
                            if (value != "true" || value != "false") {
                                error(`"${value}" is not a boolean.`);
                            }
                            break;
                        case "str":
                            if (!value.includes("\"") && !value.includes("`")) {
                                error(`"${value}" is not a string.`);
                            }
                            break;
                        case "int":
                            if (Number.isNaN(parseInt(value))) {
                                error(`${value} is not an integer.`);
                            }
                            break;
                        case "any":
                            break;
                        default:
                            error(`"${type}" is not a valid type`);
                    }
                }

                builder.push(Variable(lines));
                break;
            case 8: // printing
                if (lines[1].value != ":") {
                    error(`Identifier ":" was expected at ${lines[1].value}`);
                }

                builder.push(Print(lines));
                break;
            case 9: // functions
                if (lines[1].value != ":") {
                    error(`Colon was expected at ${lines[1].value}`);
                } else if (lines[2].value != "(") {
                    error("Please add parentheses to the function.");
                }

                const f: any = Function(lines, "build");

                builder.push(String(f.parsed));
                params = [...params, ...f.params];
                break;
            case 10: // calling functions
                if (lines[1].value != ":") {
                    error(`Identifier ":" was expected at ${lines[1].value}`);
                }

                builder.push(String(Function(lines, "call")));
                break;
            case 18:
                builder.push(Conditional(lines, "elif"));
                break;
            case 13: case 14: case 17: case 19:
                Object.entries(KEYWORDS).map(entry => {
                    if (entry[1] == line.type) {
                        if (line.type != 19) {
                            builder.push(entry[0]);
                        } else {
                            builder.push("fi");
                        }
                    }
                });
                break;
        }
    });
});

let build  = builder.join("\n");

params.forEach((p: any) => { // replace all function parameters with $1, $2, $3, etc. so it can be read in Bash
    build = build.replace(eval(`/${p.name}/g`), `$${p.i}`);
});

console.log(`${build}\n\n${pc.green("Compiled successfully!")}`);

fs.writeFileSync("target/output.sh", build); // write to output.sh