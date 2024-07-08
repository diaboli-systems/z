import tokens from "./Parser";
import { error } from "./error";

function isVar(variable: string) {
    let parsedVariable: string | null = null;

    tokens.filter(t => { // check if any variables are present in the condition
        if (t[1]) {
            if (t[0].value == "new" && t[1].value == variable) {
                parsedVariable = `$${t[1].value}`;
            }
        }
    });

    return parsedVariable;
}

function convertToTemplate(str: string) {
    return str.replace(/{{/g, "${").replace(/}}/g, "}");
}

export function Variable(lines: Array<any>) {
    let variable_content: Array<string> = [];

    for (let i = 4; i < lines.length; i++) {
        if (lines[i].value != ":") {
            variable_content.push(lines[i].value);
        }
    }

    return `${lines[1].value}=${lines[3].value == "int" ? variable_content.join("") : convertToTemplate(variable_content.join(" "))};`;
}

export function Function(lines: Array<any>, option: string) {
    let firstOpenParentheses: number = 0;
    let firstCloseParentheses: number = 0;
    let params: Array<string> = [];

    switch (option) {
        case "build": // building a function
            // check last parentheses (after all function params) to find the function name
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].value == "(") {
                    firstOpenParentheses = i;
                } else if (lines[i].value == ")") {
                    firstCloseParentheses = i;
                    break;
                }
            }

            // get paramters
            for (let i = firstOpenParentheses + 1; i < firstCloseParentheses; i++) {
                params.push(lines[i].value);
            }

            // check if function is empty between brackets
            if (lines[firstCloseParentheses + 4] && lines[firstCloseParentheses + 4].value == "}") {
                error("Function cannot be empty.");
            }

            return {
                parsed: `function ${lines[firstCloseParentheses + 1].value}()`, // pass function template to Parser
                params: params.map((p, i: number) => { // pass parameters to Parser
                    return {
                        i: i + 1,
                        name: p
                    }
                })
            };
        case "call":
            // check last parentheses (after all function params) to find the function name
            for (let i = 3; i < lines.length; i++) {
                if (lines[i].value == ")") {
                    firstCloseParentheses = i;
                    break;
                }
            }

            // get parameters
            for (let i = 2 + 1; i < firstCloseParentheses; i++) {
                params.push(lines[i].value);
            }

            // activate function and remove commas between parameters
            return `${lines[lines.length - 1].value} ${params.join(" ").replace(/,/g, "")};`;
        default:
            error(`Invalid option: ${option}`);
    }
}

export function Print(lines: Array<any>) {
    let printable: Array<string> = [];

    for (let i = 2; i < lines.length; i ++) { // for checking if the value is a variable, then add $ to it
        if (isVar(lines[i].value)) lines[i].value = isVar(lines[i].value);
        printable.push(lines[i].value);
    }

    return `echo ${convertToTemplate(printable.join(" "))};`;
}

export function Conditional(lines: Array<any>, type: string) {
    let condition: Array<string> = []; // pushing syntax to condition array

    for (let i = 2; i < lines.length; i++) { // convert equal signs to readable bash syntax
        if (lines[i].value == "=") {
            lines[i].value = "==";
        } else if (lines[i].value == "not") {
            lines[i + 1].value = "!=";
            lines.splice(i, 1);
        }
        condition.push(lines[i].value);
    }

    // for bash scripting
    condition.forEach((c, i: number) => {
        if (c != "==" && c != "!=") {
            if (isVar(c)) condition[i] = String(isVar(c));
        }
    })

    return `${type} [ ${condition.join(" ")} ]; then`;
}

export function Elif(lines: Array<any>) {
    let condition: Array<string> = [];

    for (let i = 2; i < lines.length; i++) {
        if (lines[i].value == "=") {
            lines[i].value = "==";
        } else if (lines[i].value == "not") {
            lines[i + 1].value = "!=";
            lines.splice(i, 1);
        }
        condition.push(lines[i].value);
    }

    condition.forEach((c, i: number) => {
        if (c != "==" && c != "!=") {
            if (isVar(c)) condition[i] = String(isVar(c));
        }
    });

    return `elif [[ ${condition.join(" ")} ]]; then`;
}