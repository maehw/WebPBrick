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

// This JavaScript code is used to define blocks of the "Task" category.

tasksCategoryCol = "#FFC400";

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for the definition of the main task
    {
      "type": "task_main",
      "message0": "task main %1 %2",
      "args0": [
        {
          "type": "input_dummy"
        },
        {
          "type": "input_statement",
          "name": "BODY"
        }
      ],
      "inputsInline": false,
      "colour": tasksCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for a task definition
    {
      "type": "task_definition",
      "message0": "task %1 %2 %3",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "not_main"
        },
        {
          "type": "input_dummy"
        },
        {
          "type": "input_statement",
          "name": "BODY"
        }
      ],
      "inputsInline": false,
      "colour": tasksCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for starting a task
    {
      "type": "task_start",
      "message0": "start task %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "not_main"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": tasksCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for stopping a task
    {
      "type": "task_stop",
      "message0": "stop task %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "not_main"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": tasksCategoryCol,
      "fill": "black",
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for stopping all tasks
    {
      "type": "task_stopall",
      "message0": "stop all tasks",
      "inputsInline": true,
      "previousStatement": null,
      "colour": tasksCategoryCol,
      "fill": "black",
      "tooltip": "",
      "helpUrl": ""
    },
]);
