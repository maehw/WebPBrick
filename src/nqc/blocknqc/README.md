# BlockNQC

Editor de programação visual para gerar código NQC que pode então ser compilado com um compilador NQC, por exemplo, [WebNQC](https://github.com/maehw/WebNQC) embutido em [WebPBrick](https://github.com/maehw/WebPBrick/).


## Blockly

### Blockly código fonte e instalação

veja https://developers.google.com/blockly/guides/get-started/get-the-code


## Blocos

### Blocos padrão embutidos

* Veja a Wiki dos blocos do Blockly: https://github.com/google/blockly/wiki
* Veja o playground avançado do Blockly: https://blockly-demo.appspot.com/static/tests/playgrounds/advanced_playground.html
* Veja também: https://github.com/google/blockly-samples/blob/master/plugins/dev-tools/src/toolboxCategories.js

### Blocos customizados

* Use as ferramentas de desenvolvimento Blockly: https://developers.google.com/blockly/guides/create-custom-blocks/blockly-developer-tools > fábrica de blocos https://blockly-demo.appspot.com/static/demos/blockfactory/index.html
* https://blockly-demo.appspot.com/static/demos/blockfactory/index.html

## Perguntas abertas 

* O número de variáveis pode ser limitado? _(Todas as variáveis são globalizadas, então são limitadas pelo interpretador de bytecode RCX a 32. O Blockly trata variáveis como globais por padrão.)_ * O número de opções de blocos embutidos pode ser reduzido? Por exemplo, '^' (gerador de código JavaScript gera 'Math.pow()') ser removido de 'math_arithmetic'? * Como implementar corretamente o recurso 'tarefa'? Apenas as tarefas que existem devem ser iniciadas/interrompidas (ou seja, quando o nome delas foi declarado). * Como a forma de armazenar/carregar programas (como JSON) pode ser melhorada?

## Opcional à fazer

_(considerados bom ter)_

* Implementar 'Program()' e 'SelectProgram()' 
* Implementar funções e sub-rotinas (blocos de código podem ser copiados e colados). 
* Loops de suporte 'to' 
* Instrução 'switch' de suporte 
* Implementar controle de acesso a recursos ('adquirir', 'monitorar') 
* Restringa o bloco 'math_single' a 'abs()' e _unary minus_ (ou reimplemente) 
* Reimplementar 'math_number_property' 
* Adicionar suporte para 'sign()' e operações bit a bit 
* Implementar 'OutputStatus()' 
* Contadores de suporte 
* Eventos de apoio 
* Adicionar instruções (dicas de ferramentas conscientes do contexto) 
* Adicionar suporte para funções "RCX2" - precisa conferir novamente com a versão usada do firmware?! 
* Defina aliases para entradas de sensores e saídas (motores).
