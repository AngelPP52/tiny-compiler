# 简易编译器从0到1

目标：将一段JSX语法的代码生成一个ast，并支持遍历和修改这个ast，将ast重新生成JS语法的代码

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

> 普通文本节点

```mermaid
graph LR
start --> |letter|text((文本)) --> end1[end]
```

> 单闭合标签

```mermaid
graph LR
start --> |<|parenL((左分号)) --> |letter|label((标签)) --> |空格|attr((属性)) --> |空格|attr --> |/|blackSlash((反斜杠)) --> |>|parenR((右分号)) --> end1[end]
```

> 双闭合标签

```mermaid
graph LR
start --> |<|parenL((左分号)) --> |letter|label((标签)) --> |空格|attr((属性)) --> |空格|attr --> |>|parenR((右分号)) --> |非<|content((文本)) --> |<|parenL2((左分号)) --> |/|blackSlash((反斜杠)) --> |letter|label2((标签)) --> |>|parenR2((右分号)) --> end1[end]

parenR -.-> |<|parenL

parenR2 -.-> |非<|content
parenR2 -.-> |<|parenL2
```

> 解析属性

```mermaid
graph LR
start --> |letter|attrKey((属性名)) --> |=|eqs((等号)) --> |''|sem1((分号)) --> |letter|attrValue((属性值)) --> |''|sem2((分号)) --> |空格|attrKey
```

## 词法分析

## 语法分析

如何处理普通节点

如何处理单闭合节点</>

如何处理双闭合节点<></>

如何处理孩子节点

## 遍历器

## 访问器

## 生成器