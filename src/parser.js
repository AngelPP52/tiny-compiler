// 语法分析，生成ast（请配合.MD的语法分析部分食用）

const { tokenizer } = require('./tokenizer');

function parser(code) {
    let tokens = tokenizer(code);
    let current = 0; // tokens移动指针
    function walk(parent) {
        let token = tokens[current]; // 当前单词
        let next = tokens[current + 1]; // 下一个单词，因为这里需要预判一下当前<是属于开分号还是闭分号
        if (token.type === 'parenLeft' && token.value == '<' && next.type === 'label') {
            let node = {
                type: 'JSXElement',
                openingElement: null,
                closingElement: null,
                children: []
            }
            token = tokens[++current]; // 标签
            let labelName = token.value; // 标签名

            node.openingElement = {
                type: 'JSXOpeningElement',
                name: {
                    type: "JSXIdentifier",
                    name: token.value
                },
                attributes: []
            }

            token = tokens[++current]; // 跳过标签

            while (token.type != 'parenRight' && token.type === "attributeKey") { // walk所有属性
                node.openingElement.attributes.push(walk());
                token = tokens[current];
            }

            token = tokens[++current]; // 跳过>单词
            next = tokens[current+1]; // 下一个单词，反斜杠
            next_next = tokens[current+2]; // 下一个单词，标签

            // 根据结束标签的标签名一致，中间的内容都是孩子节点
            while (token.type !== 'parenLeft' || token.type === 'parenLeft' && next.type !== 'backSlash' && next_next.value !== labelName) { // walk所有孩子
                node.children.push(walk());
                token = tokens[current];
                next = tokens[current+1]; // 下一个单词，反斜杠
                next_next = tokens[current+2]; // 下一个单词，标签
            }

            node.closingElement = walk(node); // walk闭合标签
            
            return node;
        } 
        else if(parent && token.type === 'parenLeft' && token.value == '<' && next.type === 'backSlash'){
            current++; // 跳过<单词
            token = tokens[++current]; // 闭合标签，跳过反斜杠
            current++; // 跳过标签
            current++; // 跳过>单词
            return parent.closingElement = {
                type: "JSXClosingElement",
                name: {
                    type: "JSXIdentifier",
                    name: token.value
                }
            }
        }
        else if(token.type === "attributeKey"){
            let next = tokens[++current]; // attributeValue // 只处理了attributeStringValue的情况
            let node = {
                type: "JSXAttribute",
                name: {
                    type: "JSXIdentifier",
                    name: token.value
                },
                value: {
                    type: "StringLiteral",
                    value: next.value
                }
            }
            current++; // 跳过attributeValue
            return node
        }
        else if(token.type === "text"){
            current++; // 跳过>单词
            return {
                type: "JSXText",
                value: token.value
            }
        }
        throw new TypeError(token.type);
    }

    // ast根节点
    var ast = {
        type: 'Program',
        body: [
            {
                type: 'ExpressionStatement',
                expression: null
            }
        ]
    };

    // walk
    ast.body[0].expression = walk();

    return ast;
}

module.exports = {
    parser
}

// let code = '<h1 id="title"><span>hello</span>world</h1>';

// console.log(JSON.stringify(parser(code), null, 2));