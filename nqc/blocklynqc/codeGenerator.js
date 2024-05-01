/*
 * WebPBrick / BlockNQC
 * Copyright (C) 2024 maehw
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// This JavaScript code is used for code generation as its syntax is quite similar to C/NQC.
// Most of the code here is for code generation of custom blocks.
// Some code here also replaces code generation of built-in default blocks, where the generated JavaScript code is not
// compatible with NQC.

const codeGenerator = javascript.javascriptGenerator;

codeGenerator.forBlock['controls_taskmain'] = function(block, generator) {
  const innerCode = generator.statementToCode(block, 'BODY');
  const code = `task main() {\n${innerCode}}\n`;

  return code;
}

codeGenerator.forBlock['controls_taskdef'] = function(block, generator) {
  let taskName = block.getFieldValue('NAME');
  taskName = (taskName === null) ? "" : taskName;

  const innerCode = generator.statementToCode(block, 'BODY');
  const code = `task ${taskName}() {\n${innerCode}}\n`;

  return code;
}

codeGenerator.forBlock['controls_taskstart'] = function(block, generator) {
  let taskName = block.getFieldValue('NAME');
  taskName = (taskName === null) ? "" : taskName;

  const code = `start ${taskName};\n`;

  return code;
}

codeGenerator.forBlock['controls_taskstop'] = function(block, generator) {
  let taskName = block.getFieldValue('NAME');
  taskName = (taskName === null) ? "" : taskName;

  const code = `stop ${taskName};\n`;

  return code;
}

codeGenerator.forBlock['controls_stopalltasks'] = function(block, generator) {
  return "StopAllTasks();\n";
}

codeGenerator.forBlock['controls_repeat_ext'] = function(block, generator) {
  const numTimes = generator.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC);

  const innerCode = generator.statementToCode(block, 'DO');
  const code = `repeat(${numTimes}) {\n${innerCode}}\n`;

  return code;
}

codeGenerator.forBlock['controls_wait'] = function(block, generator) {
  let waitTime = generator.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC);

  // convert to multiples of 1/100 seconds
  if(isNaN(waitTime)) {
    // we have an expression here and not a numerical value itself
    waitTime = `(${waitTime}) * 100`;
  }
  else {
    waitTime = Math.round(waitTime * 100);
  }

  const code = `Wait(${waitTime});\n`;

  return code;
}

codeGenerator.forBlock['math_random_int0'] = function(block, generator) {
  const upperBound = block.getFieldValue('UPPER');

  const code = `Random(${upperBound})`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['math_change'] = function(block, generator) {
  const varId = block.getFieldValue('VAR');
  const varName = Blockly.Variables.getVariable(workspace, varId).name;
  const delta = generator.valueToCode(block, 'DELTA', Blockly.JavaScript.ORDER_ATOMIC);

  const code = `${varName} += ${delta};\n`;

  return code;
}

codeGenerator.forBlock['math_abssign'] = function(block, generator) {
  const operation = block.getFieldValue('OP');
  const number = block.getFieldValue('NUMBER');
  const code = `${operation}(${number})`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['motion_setdirection'] = function(block, generator) {
  const outputPort = block.getFieldValue('OUTPUT');
  const outputDirection = block.getFieldValue('DIRECTION');
  const code = `SetDirection(${outputPort}, ${outputDirection});\n`;

  return code;
}

codeGenerator.forBlock['motion_setmode'] = function(block, generator) {
  const outputPort = block.getFieldValue('OUTPUT');
  const outputMode = block.getFieldValue('MODE');
  const code = `SetOutput(${outputPort}, ${outputMode});\n`;

  return code;
}

codeGenerator.forBlock['motion_setpower'] = function(block, generator) {
  const outputPort = block.getFieldValue('OUTPUT');
  const outputPower = generator.valueToCode(block, 'POWER', Blockly.JavaScript.ORDER_ATOMIC);
  const code = `SetPower(${outputPort}, ${outputPower});\n`;

  return code;
}

codeGenerator.forBlock['motion_onwithdirection'] = function(block, generator) {
  const outputPort = block.getFieldValue('OUTPUT');
  const outputDirection = block.getFieldValue('DIRECTION');
  const code = `${outputDirection}(${outputPort});\n`;

  return code;
}

codeGenerator.forBlock['motion_off'] = function(block, generator) {
  const outputPort = block.getFieldValue('OUTPUT');
  const code = `Off(${outputPort});\n`;

  return code;
}

codeGenerator.forBlock['motion_on'] = function(block, generator) {
  const outputPort = block.getFieldValue('OUTPUT');
  const code = `On(${outputPort});\n`;

  return code;
}

codeGenerator.forBlock['sensor_type'] = function(block, generator) {
  const inputPort = block.getFieldValue('INPUT');
  const sensorType = block.getFieldValue('TYPE');
  const code = `SetSensorType(${inputPort}, ${sensorType});\n`;

  return code;
}

codeGenerator.forBlock['sensor_setmode'] = function(block, generator) {
  const inputPort = block.getFieldValue('INPUT');
  const sensorMode = block.getFieldValue('MODE');
  const code = `SetSensorMode(${inputPort}, ${sensorMode});\n`;

  return code;
}

codeGenerator.forBlock['sensor_config'] = function(block, generator) {
  const inputPort = block.getFieldValue('INPUT');
  const sensorConfig = block.getFieldValue('CONFIG');
  const code = `SetSensor(${inputPort}, ${sensorConfig});\n`;

  return code;
}

codeGenerator.forBlock['sensor_read'] = function(block, generator) {
  const inputPort = block.getFieldValue('INPUT');
  const code = `${inputPort}`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['sensor_readraw'] = function(block, generator) {
  const inputPort = block.getFieldValue('INPUT');
  const code = `SensorValueRaw(${inputPort})`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['sensor_clear'] = function(block, generator) {
  const inputPort = block.getFieldValue('INPUT');
  const code = `ClearSensor(${inputPort});\n`;

  return code;
}

codeGenerator.forBlock['sound_playsound'] = function(block, generator) {
  const sound = block.getFieldValue('SOUND');
  const code = `PlaySound(${sound});\n`;

  return code;
}

codeGenerator.forBlock['sound_playtone'] = function(block, generator) {
  const toneFrequency = block.getFieldValue('FREQUENCY');
  let toneDuration = block.getFieldValue('DURATION');
  toneDuration *= 100;
  const code = `PlayTone(${toneFrequency}, ${toneDuration});\n`;

  return code;
}

codeGenerator.forBlock['infrared_txpower'] = function(block, generator) {
  const txPowerLevel = block.getFieldValue('LEVEL');
  const code = `SetTxPower(${txPowerLevel});\n`;

  return code;
}

codeGenerator.forBlock['infrared_msgsend'] = function(block, generator) {
  const message = generator.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC);
  const code = `SendMessage(${message});\n`;

  return code;
}

codeGenerator.forBlock['infrared_msgclear'] = function(block, generator) {
  const code = `ClearMessage();\n`;

  return code;
}

codeGenerator.forBlock['infrared_msgreceive'] = function(block, generator) {
  const code = `Message()`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['display_mode'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const code = `SelectDisplay(${mode});\n`;

  return code;
}

codeGenerator.forBlock['watch_set'] = function(block, generator) {
  const hours = block.getFieldValue('HOURS');
  const minutes = block.getFieldValue('MINUTES');
  const code = `SetWatch(${hours}, ${minutes});\n`;

  return code;
}

codeGenerator.forBlock['watch_get'] = function(block, generator) {
  const code = `Watch()`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['datalog_create'] = function(block, generator) {
  const datalogSize = block.getFieldValue('SIZE');
  const code = `CreateDatalog(${datalogSize});\n`;

  return code;
}

codeGenerator.forBlock['datalog_addvalue'] = function(block, generator) {
  const datalogValue = generator.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  const code = `AddToDatalog(${datalogValue});\n`;

  return code;
}

codeGenerator.forBlock['timer_read'] = function(block, generator) {
  const timerId = block.getFieldValue('TIMER');
  const code = `Timer(${timerId})`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

codeGenerator.forBlock['timer_clear'] = function(block, generator) {
  const timerId = block.getFieldValue('TIMER');
  const code = `ClearTimer(${timerId});\n`;

  return code;
}

codeGenerator.forBlock['sleep_setsleeptime'] = function(block, generator) {
  const minutesTimeout = block.getFieldValue('TIMEOUT');
  const code = `SetSleepTime(${minutesTimeout});\n`;

  return code;
}

codeGenerator.forBlock['sleep_gosleep'] = function(block, generator) {
  const code = `SleepNow();\n`;

  return code;
}


// Generate code upon request
const generateCodeBtn = document.getElementById('generateCodeBtn');
generateCodeBtn.addEventListener('click', () => {
  if (codeGenerator) {
    const jsCode = codeGenerator.workspaceToCode(workspace);
    const generatedCodeField = document.getElementById('generatedCode');

    // replace untyped variable declarations (`var x`) with typed ones (`int x`);
    // "All variables in NQC are of one of two types - specifically 16 bit signed integers or
    //  pointers to 16 bit signed integers." -- let's forget about pointers in Blockly (at least for now)

    // only check for expressions that start with `^var ` (i.e. `^` at the start of line);
    // this is done by splitting the code up and processing it line by line

    // split the string into an array of lines
    const jsLines = jsCode.split("\n");

    // Process each line (for example, adding a prefix)
    const nqcLines = jsLines.map(line => {
        // Correct variable declarations:
        // When the line begins with "var " replace it with "int "
        if(line.startsWith("var ")) {
            line = "int " + line.substring(4);
        }
        return line;
    });

    // Join the processed lines back together into a single string
    const nqcCode = nqcLines.join("\n");

    generatedCodeField.value = nqcCode;
  }
});
