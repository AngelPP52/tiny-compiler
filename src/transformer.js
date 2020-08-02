// 转换器（loader的作用）
// 返回TODO，不改变原来的ast

const { traverse } = require('./traverse');
const { parser } = require('./parser');

class t { // 这里模拟@babel/types的一些方法
    static nullLiteral() {
        return {
            type: 'NullLiteral'
        }
    }

    static memberExpression(object, property) {
        return {
            type: 'MemberExpression',
            object,
            property
        }
    }

    static identifier(name) {
        return {
            type: 'Identifier',
            name
        }
    }

    static stringLiteral(value) {
        return {
            type: 'StringLiteral',
            value
        }
    }

    static objectExpression(properties) {
        return {
            type: 'ObjectExpression',
            properties
        }
    }

    static objectProperty(key, value) {
        return {
            type: 'ObjectProperty',
            key,
            value
        }
    }

    static callExpression(callee, _arguments) {
        return {
            type: 'CallExpression',
            callee,
            arguments: _arguments
        }
    }

    static isJSXText(node) {
        return node.type === 'JSXText'
    }

    static isJSXElement(node) {
        return node.type === 'JSXElement';
    }
}

function transformer(ast) {
    traverse(ast, {
        JSXElement(nodePath) {
            const next = (node) => {
                if (!node) return t.nullLiteral();
                // JSX 标签节点
                if (t.isJSXElement(node)) {
                    // React.createElement函数
                    let memberExpression = t.memberExpression(
                        t.identifier("React"),
                        t.identifier("createElement")
                    );
                    // 函数参数列表
                    let _arguments = [];
                    // 标签
                    let stringLiteral = t.stringLiteral(node.openingElement.name.name);
                    // 属性
                    let objectExpression = node.openingElement.attributes.length
                        ? t.objectExpression(
                            node.openingElement.attributes.map((attr) =>
                                t.objectProperty(t.identifier(attr.name.name), attr.value)
                            )
                        )
                        : t.nullLiteral();
                    _arguments = [stringLiteral, objectExpression];
                    // 递归处理子节点
                    _arguments.push(...node.children.map((item) => next(item)));
                    return t.callExpression(memberExpression, _arguments);
                } else if (t.isJSXText(node)) {
                    // JSX 文本节点
                    return t.stringLiteral(node.value);
                }
            };
            let targetNode = next(nodePath.node);
            nodePath.replaceWith(targetNode);
        },
    });
}

module.exports = {
    transformer
}


// let code = '<h1 id="title"><span>hello</span>world</h1>';

// let ast = parser(code);
// transformer(ast)
// console.log("转义后的ast: %s", JSON.stringify(ast, null, 2));