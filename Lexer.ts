enum TokenType {
    Number,
    Identifier,
    Conditional,
    OpenParen,
    CloseParen,
    BinaryOperator,
    String,
    Variable,
    Print,
    Function,
    Call,
    Comment,
    Boolean,
    OpenCurlyBracket,
    CloseCurlyBracket,
    Type,
    Equals,
    Else,
    Elif,
    ConditionEnd
}

export const KEYWORDS: Record<string, TokenType> = {
    "new": TokenType.Variable,
    "println": TokenType.Print,
    "func": TokenType.Function,
    "call": TokenType.Call,
    "#": TokenType.Comment,
    "if": TokenType.Conditional,
    "else": TokenType.Else,
    "end": TokenType.ConditionEnd,
    "elif": TokenType.Elif,
    "}": TokenType.CloseCurlyBracket,
    "{": TokenType.OpenCurlyBracket
}

interface Token {
    value: string;
    type: TokenType
}

function token(value = "", type: TokenType): Token {
    return {
        value,
        type
    }
}

function isAlpha(src: string) { // check if alphabetical order
    const allowed_chars = [
        "\"",
        "`",
        "_",
        "!",
        ",",
        "{",
        "}",
        "$",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
    ]

    if (allowed_chars.includes(src)) {
        return true;
    }
    return src.toUpperCase() != src.toLowerCase();
}

export function Lexer(code: string): Token[] {
    const tokens = new Array<Token>();
    let src = code.split("");

    while (src.length > 0) {
        let ident: string = src[0];

        if (isAlpha(src[0])) {
            ident = "";
            while (src.length > 0 && isAlpha(src[0])) {
                ident += src.shift();
            }
        }

        if (ident != " " && ident != "\n" && ident != "\t") {
            switch (ident) {
                case "(":
                    tokens.push(token(ident, TokenType.OpenParen));
                    break;
                case ")":
                    tokens.push(token(ident, TokenType.CloseParen));
                    break;
                case "-": case "+": case "*": case "/":
                    tokens.push(token(ident, TokenType.BinaryOperator));
                    break;
                case "&":
                    tokens.push(token(ident, TokenType.Type));
                    break;
                case ":":
                    tokens.push(token(ident, TokenType.Equals));
                    break;
                default:
                    const keyword = KEYWORDS[ident];

                    if (keyword) {
                        tokens.push(token(ident, KEYWORDS[ident]));
                    } else {
                        tokens.push(token(ident, TokenType.Identifier));
                    }
                    break;
            }
        }

        src = src.slice(1);
    }

    return tokens;
}