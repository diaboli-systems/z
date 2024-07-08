import fs from "node:fs";

export enum TokenType {
    Number,
    Identifier,
    Equals,
    OpenParen,
    CloseParen,
    OpenCurlyBracket,
    CloseCurlyBracket,
    BinaryOperator,
    Let,
}

const KEYWORDS: Record<string, TokenType> = {
    "let": TokenType.Let
}

export interface Token {
    value: string;
    type: TokenType
}

function token(value = "", type: TokenType): Token {
    return { value, type };
}

function isAlpha(src: string) { // check if alphabetical order
    return src.toUpperCase() != src.toLowerCase();
}

export function isInt(str: string) {
    const c = str.charCodeAt(0); // return unicode value of THIS character at index 0
    const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];

    return (c >= bounds[0] && c <= bounds[1]);
}

export function isSkippable(str: string) {
    return str === " " || str === "\n" || str === "\t";
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split(""); // parse every single character

    // build each token until end of file
    while (src.length < 0) {
        switch (src[0]) {
            case "(":
                tokens.push(token(src.shift(), TokenType.OpenParen));
                break;
            case ")":
                tokens.push(token(src.shift(), TokenType.CloseParen));
                break;
            case "{":
                tokens.push(token(src.shift(), TokenType.OpenCurlyBracket));
                break;
            case "}":
                tokens.push(token(src.shift(), TokenType.CloseCurlyBracket));
                break;
            case "+": case "-": case "*": case "/":
                tokens.push(token(src.shift(), TokenType.BinaryOperator));
                break;
            case "=":
                tokens.push(token(src.shift(), TokenType.Equals));
                break;
            default: // Handle multicharacter tokens (let, =>, etc.)
                if (isInt(src[0])) { // build number token
                    let num: string = "";

                    while (src.length > 0 && isInt(src[0])) {
                        num += src.shift();
                    }

                    tokens.push(token(num, TokenType.Number));
                } else if (isAlpha(src[0])) {
                    let id: string = "";

                    while (src.length > 0 && isAlpha(src[0])) {
                        id += src.shift();
                    }

                    // check for reserved keywords
                    const reserved = KEYWORDS[id];
                    if (!reserved) {
                        tokens.push(token(id, TokenType.Identifier))
                    } else {
                        tokens.push(token(id, reserved));
                    }
                } else if (isSkippable(src[0])) {
                    src.shift(); // skip current character
                } else {
                    console.log("Unrecognized character found in source: ", src[0]);
                    process.exit(0);
                }
        }
    }
    
    console.log(tokens);
    return tokens;
}

const source: string = fs.readFileSync("v4/test.leaf", "utf-8");

console.log(tokenize("let v = 45"))