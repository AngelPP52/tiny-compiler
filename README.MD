# 简易编译器从0到1

场景：将一段JSX语法的代码生成一个ast，并支持遍历和修改这个ast，将ast重新生成JS语法的代码

> JSX代码

```jsx
<h1 id="title"><span>hello</span>world</h1>
```
> JS代码

```js
React.createElement("h1", {
  id: "title"
},React.createElement("span", null, "hello"), "world");
```
## 有限状态机

原理：根据输入状态决定下一个状态

*注意：实心圆表示一个功能状态机；实线箭头表示常规情况，虚线箭头表示可能存在的分情况。letter有两种情况（英文或"_"）*

> 单闭合标签

```mermaid
graph LR
start(start) --> |<|parenL((左分号)) --> |letter|label((标签)) --> |空格|attr((属性)) -.-> |空格|attr --> |/|blackSlash((反斜杠)) --> |>|parenR((右分号)) --> end1(end)

classDef border-green stroke:black,fill: green, color: white,stroke-width: 4
classDef orange stroke:orange,fill: orange,color:black,stroke-width:4
classDef cyan stroke:cyan,fill: cyan,color:black,stroke-width:4

class parenL border-green
class parenR border-green
class attr orange
class label cyan

classDef stroke-dash stroke-dasharray: 5,5
class start stroke-dash
class end1 stroke-dash
```

![](https://github.com/AngelPP52/tiny-compiler/blob/master/images/singleLabel.jpg)

- 实际词法转AST时，反斜杠则表示标签是单闭合的，并且下一个右分号直接完成此节点的解析
- 标签和属性都是同级的"属性"（AST节点属性）
- 单闭合标签没有孩子节点

> 双闭合标签

```mermaid
graph LR
start(start) --> |<|parenL((左开分号)) --> |letter|label((标签)) --> |空格|attr((属性)) -.-> |空格|attr --> |>|parenR((右开分号)) --> |非<|text((文本)) --> |<|parenL2((左闭分号)) --> |/|blackSlash((反斜杠)) --> |letter|label2((标签)) --> |>|parenR2((右闭分号)) --> end1(end)

label -.-> |>|parenR

parenR -.-> |<|parenL
parenR -.-> |<|parenL2

parenR2 -.-> |非<|text
parenR2 -.-> |<|parenL2
parenR2 -.-> |<|parenL


classDef border-green stroke:black,fill: green, color: white,stroke-width: 4
classDef border-red stroke:black,fill: red, color: white,stroke-width: 4
classDef orange stroke:orange,fill: orange,color:black,stroke-width:4
classDef cyan stroke:cyan,fill: cyan,color:black,stroke-width:4

class parenL border-green
class parenR border-green
class parenL2 border-red
class parenR2 border-red
class attr orange
class label cyan
class label2 cyan

classDef stroke-dash stroke-dasharray: 5,5
class start stroke-dash
class end1 stroke-dash

classDef blue stroke: blue,fill:blue,stroke-width:3,color:white
class text blue
```

![](https://github.com/AngelPP52/tiny-compiler/blob/master/images/dblLabel.jpg)

- 标签和属性都是同级的"属性"（AST节点属性）
- 右开分号后与左闭分号前包裹的属于孩子节点
- 右开分号后与左闭分号前之间也可能没有孩子节点（">"的下一个字符就是"<"）

> 解析属性

```mermaid
graph LR
start(...) --> |letter|attrKey((属性名)) --> |=|eqs((等号)) --> |''|sem1((左引号)) --> |letter|attrValue((字符串属性值)) --> |''|sem2((右引号)) -.-> |空格|attrKey
eqs -.-> |&#123|bracketL((左括号)) -.-> |letter|attrValue2((表达式属性值)) -.-> |&#125|bracketR((右括号)) -.-> |空格|attrKey
sem2 --> end1(...)
bracketR --> end2(...)

classDef stroke-dash stroke-dasharray: 5,5
class start stroke-dash
class end1 stroke-dash
class end2 stroke-dash

classDef orange stroke:orange,fill: orange,color:black,stroke-width:4
classDef purple stroke:purple,fill: purple,color:white,stroke-width:4

class attrKey orange
class attrValue purple
class attrValue2 purple
```

![](https://github.com/AngelPP52/tiny-compiler/blob/master/images/attributeValue.jpg)

- key-value（属性名-属性值）的键值对

> 拓展一：JSX表达式属性值（TODO）

```mermaid
graph LR

start(...) --> |letter|attrValue((表达式属性值)) --> todo(TODO) --> end1(...)

classDef purple stroke:purple,fill: purple,color:white,stroke-width:4
class attrValue purple

classDef stroke-dash stroke-dasharray: 5,5
class start stroke-dash
class end1 stroke-dash
```

![](https://github.com/AngelPP52/tiny-compiler/blob/master/images/JSXAttributeValue.jpg)

- letter
- this.letter
- {letter:字符串/letter}

> 拓展二：JSX表达式文本（TODO）

文本节点中的{}

> 拓展三：<></>“模板”双闭合标签

## 词法分析

原理：运用有限状态机的原理，JSX语法代码字符串逐个字符输入到功能状态机，由具体的功能状态机根据输入决定下一个状态。最终将所有结果emit出去

*注意：粗体英文字符表示功能状态机；—表示正常流程，---（+--或#--或~--等等）表示上一步可能的分情况；空格（等号，分号，大括号）均不输出*

- — tokenizer函数：遍历字符，输入给状态机
- — emit函数：发射一个解析完成的记录｛type，value｝
- — **start**：入口状态机
  - — foundParen："<"左开分号
  - --- 非<：start
- — **foundParenL**：发现"<"左开分号
  - — letter：label
  - --- backSlash：“/”反斜杠，label
- — **foundParenR**：发现">"右开分号
  - — <：foundParenL
  - --- 非<：text
- — **label**：解析标签名
  - — letter：标签名（的一个字符）
  - --- parenR：">"右开分号，foundParenR
  - +-- whiteSpace：" "空格，attribute
- — **attribute**：解析属性
  - — letter：属性名，attributeKey
- — **attributeKey**：解析属性名
  - — letter：属性名（的一个字符串）
  - — equalSign："="等号，attributeValue
- — **attributeValue**：解析属性值
  - — quoMark："左引号，attributeStringValue
  - --- bracketL："{"左大括号，attributeJSXValue
- — **attributeStringValue**：解析字符串属性值
  - — letter：字符串属性值
  - — quoMark："右引号，tryLeaveAttribute
- — **attributeJSXValue**：解析表达式属性值
  - — letter：表达式属性值
  - — bracketR："}"右大括号，tryLeaveAttribute
- — **tryLeaveAttribute**：尝试退出属性的分析
  - — whiteSpace：" "空格，attribute
  - --- parenR：">"右开分号，foundParenR
- — **text**：解析文本
  - 非<：文本内容
  - — <："<"左开分号或左闭分号，foundParenL

实现：./src/tokenizer.js

分词结果：

```js
{ type: 'parenLeft', value: '<' }
{ type: 'label', value: 'h1' }
{ type: 'attributeKey', value: 'id' }
{ type: 'attributeStringValue', value: 'title' }
{ type: 'parenRight', value: '>' }
{ type: 'parenLeft', value: '<' }
{ type: 'label', value: 'span' }
{ type: 'parenRight', value: '>' }
{ type: 'text', value: 'hello' }
{ type: 'parenLeft', value: '<' }
{ type: 'backSlash', value: '/' }
{ type: 'label', value: 'span' }
{ type: 'parenRight', value: '>' }
{ type: 'text', value: 'world' }
{ type: 'parenLeft', value: '<' }
{ type: 'backSlash', value: '/' }
{ type: 'label', value: 'h1' }
{ type: 'parenRight', value: '>' }
```

## 语法分析

首先，弄明白，分词结果中哪些结果是我们需要的，而哪些结果是我们不需要的。如果你不太确定，请配合[astexplorer](https://astexplorer.net/)使用

然后，弄明白，分词结果中，哪些是入口，哪些是出口。结合有限状态机，很明显，<...>是标签的入口，</...>是标签的出口，抓住这一点，递归方法walk就很好写了。接下来，只需要关心入口和出口之间的属性，和孩子节点...

最后，遍历分词结果生成一棵ast。分词数组的移动指针是个关键，注意在合适的时机，应该采用自增的方式跳过处理某个单词，代码中充分显示这个特点，这也是我debug花时间最多的地方...

实现：./src/parser.js

语法分析结果：

```js
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "JSXElement",
        "openingElement": {
          "type": "JSXOpeningElement",
          "name": {
            "type": "JSXIdentifier",
            "name": "h1"
          },
          "attributes": [
            {
              "type": "JSXAttribute",
              "name": {
                "type": "JSXIdentifier",
                "name": "id"
              },
              "value": {
                "type": "StringLiteral",
                "value": "title"
              }
            }
          ]
        },
        "closingElement": {
          "type": "JSXClosingElement",
          "name": {
            "type": "JSXIdentifier",
            "name": "h1"
          }
        },
        "children": [
          {
            "type": "JSXElement",
            "openingElement": {
              "type": "JSXOpeningElement",
              "name": {
                "type": "JSXIdentifier",
                "name": "span"
              },
              "attributes": []
            },
            "closingElement": {
              "type": "JSXClosingElement",
              "name": {
                "type": "JSXIdentifier",
                "name": "span"
              }
            },
            "children": [
              {
                "type": "JSXText",
                "value": "hello"
              }
            ]
          },
          {
            "type": "JSXText",
            "value": "world"
          }
        ]
      }
    }
  ]
}
```

## 访问器

作用：在遍历抽象语法树时，提供给用户可以自定义的"进入"或"退出"某种类型节点时调用的函数。形式可以是函数或是{enter函数，exist函数}对象

例子：

```js
let code = '<h1 id="title"><span>hello</span>world</h1>';

let ast = parser(code);
traverse(ast, {
    JSXOpeningElement: {
        enter: function (node, parent) {
            console.log('进入开标签', node);
        },
        exit: function (node, parent) {
            console.log('退出开标签', node);
        }
    }
})
```

## 遍历器

递归遍历抽象语法树，这里采取的先序遍历方式，先访问自己再依次访问孩子

这里，需要在访问节点的前面调用enter函数，和结束访问节点的后面调用exist函数

实现：./src/traverse.js

## 转换器

这是我另外一个[jsx-to-js.loader](https://github.com/AngelPP52/ast_homework)的逻辑，可以将jsx代码转成一段js的代码，比较粗糙...

实现：./src/transformer.js

转换结果：

```js
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "React"
          },
          "property": {
            "type": "Identifier",
            "name": "createElement"
          }
        },
        "arguments": [
          {
            "type": "StringLiteral",
            "value": "h1"
          },
          {
            "type": "ObjectExpression",
            "properties": [
              {
                "type": "ObjectProperty",
                "key": {
                  "type": "Identifier",
                  "name": "id"
                },
                "value": {
                  "type": "StringLiteral",
                  "value": "title"
                }
              }
            ]
          },
          {
            "type": "CallExpression",
            "callee": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "React"
              },
              "property": {
                "type": "Identifier",
                "name": "createElement"
              }
            },
            "arguments": [
              {
                "type": "StringLiteral",
                "value": "span"
              },
              {
                "type": "NullLiteral"
              },
              {
                "type": "StringLiteral",
                "value": "hello"
              }
            ]
          },
          {
            "type": "StringLiteral",
            "value": "world"
          }
        ]
      }
    }
  ]
}
```

## 生成器

采取先序遍历，递归遍历抽象语法树，将特定的节点类型转换成对应的js代码即可。又是递归哟，这回真是深入浅出递归思想啦...

实现：./src/codeGenerator.js

------

如有不足，欢迎指出，共同进步！
