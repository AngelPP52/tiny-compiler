// 生成器（生成ReactJS代码，这里不加JSX的生成器逻辑了，感兴趣可以自己照着模子加）

function codeGenerator(node) {
    switch (node.type) {
        case 'Program':
            return node.body.map(codeGenerator).join('\n');

        // ReactJS的代码生成器
        case 'ExpressionStatement':
            return (
                codeGenerator(node.expression) + ';'
            );

        case 'MemberExpression':
            return (
                codeGenerator(node.object) +
                '.' +
                codeGenerator(node.property)
            )

        case 'ObjectExpression':
            return (
                '{' +
                node.properties.map(codeGenerator).join(', ') +
                '}'
            )

        case 'ObjectProperty':
            return (
                codeGenerator(node.key) +
                ':' +
                codeGenerator(node.value)
            )

        case 'CallExpression':
            return (
                codeGenerator(node.callee) +
                '(' +
                node.arguments.map(codeGenerator).join(', ') +
                ')'
            );

        case 'Identifier':
            return node.name;

        case 'NumberLiteral':
            return node.value;

        case 'StringLiteral':
            return '"' + node.value + '"';

        case 'NullLiteral':
            return '"null"'

        default:
            throw new TypeError(node.type);
    }
}

module.exports = {
    codeGenerator
}