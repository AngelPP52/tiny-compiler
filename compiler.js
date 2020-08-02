// tiny-compiler
const {parser} = require('./src/parser');
const {transformer} = require('./src/transformer');
const {codeGenerator} = require('./src/codeGenerator');


let code = '<h1 id="title"><span>hello</span>world</h1>';
let ast = parser(code);
transformer(ast);
let outputCode = codeGenerator(ast);
console.log(outputCode);