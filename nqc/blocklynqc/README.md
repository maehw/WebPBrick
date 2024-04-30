# BlockNQC

Visual programming editor to generate NQC code which can then be compiled with a NQC compiler, e.g. [WebNQC](https://github.com/maehw/WebNQC) embedded into [WebPBrick](https://github.com/maehw/WebPBrick/).


## Blockly

### Blockly source code and installation

see https://developers.google.com/blockly/guides/get-started/get-the-code


## Blocks

### Built-in default blocks

* Check Blockly Block Wiki: https://github.com/google/blockly/wiki
* Check Blockly Advanced Playground: https://blockly-demo.appspot.com/static/tests/playgrounds/advanced_playground.html
* See also: https://github.com/google/blockly-samples/blob/master/plugins/dev-tools/src/toolboxCategories.js

### Custom blocks

* Use Blockly Developer Tools: https://developers.google.com/blockly/guides/create-custom-blocks/blockly-developer-tools > Block Factory https://blockly-demo.appspot.com/static/demos/blockfactory/index.html
* https://blockly-demo.appspot.com/static/demos/blockfactory/index.html

## Open questions

* Can the number of variables be limited? _(All variables are made global, so they are limited by the RCX bytecode interpreter to 32. Blockly treats variables as global by default.)_
* Can the number of options of built-in blocks be reduced? E.g. `^` (JavaScript code generator generates `Math.pow()`) be removed from `math_arithmetic`?
* How to implement the `task` feature properly? Only tasks should be started/stopped that exists (i.e. where their name has been declared).

## Important TODOs

Replace files taken from https://unpkg.com/blockly/ !

## Optional TODOs

_(considered nice-to-have)_

* Implement `Program()` and `SelectProgram()`
* Implement functions and subroutines.
* Support `for` loops
* Support `switch` statement
* Implement resource access control (`acquire`, `monitor`)
* Restrict `math_single` block to `abs()` and _unary minus_ (or reimplement)
* Reimplement `math_number_property`
* Add support for `sign()` and bitwise operations
* Implement `OutputStatus()`
* Support counters
* Support events
* Add instructions (context-aware tooltips)
* Add support for "RCX2" functions - need to double-check against used firmware version?!
* Define aliases for sensor inputs and (motor) outputs.
