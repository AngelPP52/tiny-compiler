// 词法分析，分词（请配合.MD的词法分析部分食用）
// 有限状态机（请配合.MD的有限状态机部分食用）

let LETTERS = /^[a-zA-Z0-9_]$/;
let NOT_LEFT_SEM = /^</;

let currentToken = { type: "", value: "" };
let tokens = [];

function emit(token) {
    // console.log(token);
    currentToken = { type: "", value: "" }; // 清空一下currentToken，避免污染下一个单词
    tokens.push(token);
}

function start(char) {
    if (char === "<") {
        emit({ type: "parenLeft", value: "<" });
        return foundParenL;
    }
    return start;
}

function foundParenL(char) {
    if (LETTERS.test(char)) {
        currentToken.value = char;
        currentToken.type = "label";
        return label;
    } else if (char === "/") {
        emit({ type: "backSlash", value: "/" });
        return foundParenL;
    }
    throw new TypeError("Error");
}

function foundParenR(char) {
    if (char === "<") {
        emit({ type: "parenLeft", value: "<" });
        return foundParenL;
    } else {
        // 文本节点
        currentToken.value = char;
        currentToken.type = "text";
        return text;
    }
}

function label(char) {
    if (LETTERS.test(char)) {
        currentToken.value += char;
        return label;
    } else if (char === " ") {
        // 空格不输出
        emit(currentToken);
        return attribute;
    } else if (char === ">") {
        emit(currentToken);
        emit({ type: "parenRight", value: ">" });
        return foundParenR;
    }
    throw new TypeError("Error");
}

function attribute(char) {
    if (LETTERS.test(char)) {
        currentToken.value = char;
        currentToken.type = "attributeKey";
        return attributeKey;
    }
    throw new TypeError("Error");
}

function attributeKey(char) {
    if (LETTERS.test(char)) {
        currentToken.value += char;
        return attributeKey;
    } else if (char === "=") {
        emit(currentToken);
        // emit({type: "equalSign", value: "="})
        return attributeValue;
    }
    throw new TypeError("Error");
}

function attributeValue(char) {
    if (char === '"') {
        // emit({type: "quoMarkLeft", value: "\""});
        currentToken.value = "";
        currentToken.type = "attributeStringValue";
        return attributeStringValue;
    } else if (char === "{") {
        // emit({type: "bracketL", value: "{"});
        currentToken.value = "";
        currentToken.type = "attributeJSXValue";
        return attributeJSXValue;
    }
    throw new TypeError("Error");
}

function attributeStringValue(char) {
    if (LETTERS.test(char)) {
        currentToken.value += char;
        return attributeStringValue;
    } else if (char === '"') {
        emit(currentToken);
        // emit({type: "quoMarkRight", value:"\""})
        return tryLeaveAttribute;
    }
    throw new TypeError("Error");
}

function attributeJSXValue(char) {
    if (LETTERS.test(char)) {
        currentToken.value += char;
        return attributeJSXValue;
    } else if (char === "}") {
        emit(currentToken);
        // emit({type: "bracketR", value:"}"})
        return tryLeaveAttribute;
    }
    throw new TypeError("Error");
}

function tryLeaveAttribute(char) {
    if (char === " ") {
        return attribute;
    } else if (char === ">") {
        emit({ type: "parenRight", value: ">" });
        return foundParenR;
    }
    throw new TypeError("Error");
}

function text(char) {
    if (char === "<") {
        emit(currentToken);
        emit({ type: "parenLeft", value: "<" });
        return foundParenL;
    } else {
        // 文本内容
        currentToken.value += char;
        return text;
    }
}

function tokenizer(input) {
    tokens = [];
    let state = start;
    for (let char of input) {
        state = state(char);
    }
    return tokens;
}

module.exports = {
    tokenizer
};

// let code = '<h1 id="title"><span>hello</span>world</h1>';

// tokenizer(code);


