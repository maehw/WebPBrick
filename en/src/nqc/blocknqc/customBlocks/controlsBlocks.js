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

// This JavaScript code is used to define blocks of the "Control" category.
// This includes blocks for waiting for a specific time but also task control.

controlsCategoryCol = 120; // hue value

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for waiting for a specific amount of time (in multiple of seconds)
    {
      "type": "controls_wait",
      "message0": "wait for %1 seconds",
      "args0": [
        {
          "type": "input_value",
          "name": "DURATION",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": controlsCategoryCol,
      "tooltip": "",
      "helpUrl": "",
      "extensions": [
        'wait_floatduration_range_validation',
      ]
    },
    // Block for waiting for a specific amount of time (in multiple of 1/100 seconds)
    {
      "type": "controls_waitfraction",
      "message0": "wait for %1 × 1/100 seconds",
      "args0": [
        {
          "type": "input_value",
          "name": "DURATION",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": controlsCategoryCol,
      "tooltip": "",
      "helpUrl": "",
      "extensions": [
        'wait_duration_range_validation',
      ]
    },
]);

Blockly.Extensions.register('wait_floatduration_range_validation', function() {
  this.setOnChange(function(changeEvent) {
    if (changeEvent instanceof Blockly.Events.BlockChange) {
      checkFloatInputRange(this, 'DURATION', 2, 0, 655.35);
    }
  });
});

Blockly.Extensions.register('wait_duration_range_validation', function() {
  this.setOnChange(function(changeEvent) {
    if (changeEvent instanceof Blockly.Events.BlockChange) {
      checkIntegerInputRange(this, 'DURATION', 0, 65535);
    }
  });
});

