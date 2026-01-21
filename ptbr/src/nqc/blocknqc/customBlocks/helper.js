/*
 * WebPBrick / BlockNQC
 * Copyright (C) 2026 maehw
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

// This JavaScript code is some helper code.
// Currently it provides input range checking functionality.

function checkIntegerInputRange(block, inputName, minValue, maxValue) {
  let warnText = "";
  let targetBlock = block.getInput(inputName).connection.targetBlock();
  if (targetBlock) {
    let inputList = targetBlock.inputList;
    if (Array.isArray(inputList) && (inputList.length == 1)) {
      if (inputList[0].type == Blockly.inputTypes.DUMMY) {
        let fieldRow = inputList[0].fieldRow;
        if(Array.isArray(fieldRow) && (fieldRow.length == 1) && (fieldRow[0].name == "NUM")) {
          let value = fieldRow[0].getValue();
          if (!Number.isInteger(value)) {
            warnText += 'Accepting only integer numbers: rounded last input. ';
            value = Math.round(value);
          }
          if (value < minValue) {
            warnText += 'Accepting only numbers up to ' + minValue + '. ';
            value = minValue;
          } else if(value > maxValue) {
            warnText += 'Accepting only numbers below ' + maxValue + '. ';
            value = maxValue;
          }
          fieldRow[0].setValue(value);
        }
      }
    }
  }
  block.setWarningText(warnText); // empty warning text is not displayed, which makes it a nice default
}

function checkFloatInputRange(block, inputName, numDecimalPlaces, minValue, maxValue) {
  let warnText = "";
  let targetBlock = block.getInput(inputName).connection.targetBlock();
  if (targetBlock) {
    let inputList = targetBlock.inputList;
    if (Array.isArray(inputList) && (inputList.length == 1)) {
      if (inputList[0].type == Blockly.inputTypes.DUMMY) {
        let fieldRow = inputList[0].fieldRow;
        if(Array.isArray(fieldRow) && (fieldRow.length == 1) && (fieldRow[0].name == "NUM")) {
          let value = fieldRow[0].getValue();
          if (!Number.isInteger(value) && (value != value.toFixed(numDecimalPlaces))) {
            warnText += 'Accepting only two decimal places: trimmed digit(s). ';
            value = value.toFixed(numDecimalPlaces);
          }
          if (value < minValue) {
            warnText += 'Accepting only numbers up to ' + minValue + '. ';
            value = minValue;
          } else if(value > maxValue) {
            warnText += 'Accepting only numbers below ' + maxValue + '. ';
            value = maxValue;
          }
          fieldRow[0].setValue(value);
        }
      }
    }
  }
  block.setWarningText(warnText); // empty warning text is not displayed, which makes it a nice default
}
