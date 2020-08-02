// 遍历器（JSX语法树和ReactJS语法树）
// 访问器是用户自定义的
// JSX表达式TODO

const { parser } = require('./parser');

function traverse(ast, visitor) {
    function traverseArray(array, parent) {
        array.forEach(function (child) {
            traverseNode(child, parent);
        });
    }

    function traverseNode(node, parent) {
        if(node && typeof node.replaceWith !== 'function'){ // 给每一个node添加一个replaceWith方法，用于替换父节点中的node
            // 替换逻辑
            node.replaceWith = (newNode)=>{
                if(parent){
                    for (const key in parent) {
                        if (parent.hasOwnProperty(key)) {
                            if(parent[key] === node){
                                parent[key] = newNode;
                            }
                        }
                    }
                }
            }
        }
        var method = visitor[node.type];
        if (method) {
            node.node = node; // 添加一个node属性指向自己，转换器中是这样使用的nodePath.node
            if (typeof method === 'function') {
                method(node, parent)
            } else if (method.enter) {
                method.enter(node, parent);
            }
        }
        switch (node.type) {
            case 'Program':
                traverseArray(node.body, node);
                break;
            case 'ExpressionStatement': // 表达式
                traverseNode(node.expression, node);
                break;
            // JSX标签的遍历
            case 'JSXElement': // JSX标签
                traverseNode(node.openingElement, node);
                traverseNode(node.closingElement, node);
                traverseArray(node.children, node);
                break;
            case 'JSXOpeningElement': // 开标签
                traverseNode(node.name, node); // 标签名
                traverseArray(node.attributes, node);
                break;
            case 'JSXAttribute': // 属性
                traverseNode(node.name, node); // 属性名
                traverseNode(node.value, node); // 属性值
                break;
            case 'JSXClosingElement': // 闭合标签
                traverseNode(node.name, node); // 标签名
                break;
            case 'JSXIdentifier': // 属性名
                break;
            case 'StringLiteral': // 字符串属性值，字符串参数
                break;
            case 'JSXText': // 文本
                break;
            // ReactJS的遍历
            case 'CallExpression':
                traverseNode(node.callee, node); // 成员表达式
                traverseArray(node.arguments, node); // 参数列表
                break;
            case 'MemberExpression':
                traverseNode(node.object, node); // （成员）对象
                traverseNode(node.property, node); // （成员）对象属性
                break;
            case 'Identifier': // "变量"名
                break;
            case 'ObjectExpression': // 对象数组
                traverseArray(node.properties, node); // 对象
                break;
            case 'ObjectProperty': // 对象属性
                traverseNode(node.key, node); // 对象属性名
                traverseNode(node.value, node); // 对象属性值
                break;
            case 'NullLiteral':
                break;
            default:
                throw new TypeError(node.type);
        }
        if (method && method.exit) {
            node.node = node; // 同样，也需要添加一个node.node属性
            method.exit(node, parent);
        }
    }

    // 开始遍历ast
    traverseNode(ast, null);
}

module.exports = {
    traverse
};


// let code = '<h1 id="title"><span>hello</span>world</h1>';

// let ast = parser(code);
// traverse(ast, {
//     JSXOpeningElement: {
//         enter: function (node, parent) {
//             console.log('进入开标签', node);
//         },
//         exit: function (node, parent) {
//             console.log('退出开标签', node);
//         }
//     }
// })
