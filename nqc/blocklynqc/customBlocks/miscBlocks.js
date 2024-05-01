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

// This JavaScript code is used to define blocks of the "MISC" category (e.g. holds infrared communication and time/data).

infraredCategoryCol = "#AC0E0E";
timeDataCategoryCol = "#79919F";

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for setting infrared TX power
    {
      "type": "infrared_txpower",
      "message0": "set IR TX power level to %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "LEVEL",
          "options": [
            [
              "low",
              "TX_POWER_LO"
            ],
            [
              "high",
              "TX_POWER_HI"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": infraredCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for sending IR message
    {
      "type": "infrared_msgsend",
      "message0": "send IR message %1 via IR",
      "args0": [
        {
          "type": "input_value",
          "name": "MESSAGE",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": infraredCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for clearing IR message
    {
      "type": "infrared_msgclear",
      "message0": "clear last received IR message",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": infraredCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for receiving an IR message
    {
      "type": "infrared_msgreceive",
      "message0": "receive IR message",
      "output": "Number",
      "inputsInline": true,
      "colour": infraredCategoryCol,
      "tooltip": "",
      "helpUrl": "",
    },
    // Block for setting RCX' display mode
    {
      "type": "display_mode",
      "message0": "select display mode %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            [
              "system watch",
              "DISPLAY_WATCH"
            ],
            [
              "sensor 1",
              "DISPLAY_SENSOR_1"
            ],
            [
              "sensor 2",
              "DISPLAY_SENSOR_2"
            ],
            [
              "sensor 3",
              "DISPLAY_SENSOR_3"
            ],
            [
              "output A",
              "DISPLAY_OUT_A"
            ],
            [
              "output B",
              "DISPLAY_OUT_B"
            ],
            [
              "output C",
              "DISPLAY_OUT_C"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for setting RCX watch
    {
      "type": "watch_set",
      "message0": "set system watch to %1 hours %2 minutes",
      "args0": [
        {
          "type": "field_number",
          "name": "HOURS",
          "value": 13,
          "min": 0,
          "max": 23,
          "precision": 1
        },
        {
          "type": "field_number",
          "name": "MINUTES",
          "value": 15,
          "min": 0,
          "max": 59,
          "precision": 1
        },
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for setting RCX watch
    {
      "type": "watch_get",
      "message0": "get system watch value (in minutes)",
      "inputsInline": true,
      "output": "Number",
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for creating a datalog
    {
      "type": "datalog_create",
      "message0": "create datalog of size %1",
      "args0": [
        {
          "type": "field_number",
          "name": "SIZE",
          "value": 100,
          "min": 1,
          "max": 10000,
          "precision": 1
        },
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for adding a value to the datalog
    {
      "type": "datalog_addvalue",
      "message0": "add value %1 to datalog",
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for clearing a timer
    {
      "type": "timer_clear",
      "message0": "clear timer %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TIMER",
          "options": [
            [
              "0",
              "0"
            ],
            [
              "1",
              "1"
            ],
            [
              "2",
              "2"
            ],
            [
              "3",
              "3"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },

    // Block for reading a timer value
    {
      "type": "timer_read",
      "message0": "timer %1 value",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TIMER",
          "options": [
            [
              "0",
              "0"
            ],
            [
              "1",
              "1"
            ],
            [
              "2",
              "2"
            ],
            [
              "3",
              "3"
            ]
          ]
        }
      ],
      "output": "Number",
      "inputsInline": true,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for creating a random number
    {
      "type": "math_random_int0",
      "message0": "random integer from 0 to %1",
      "args0": [
        {
          "type": "field_number",
          "name": "UPPER",
          "value": 10,
          "min": 0,
          "max": 10000,
          "precision": 1
        },
      ],
      "inputsInline": true,
      "output": "Number",
      "colour": 230,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for setting the sleep timeout
    {
      "type": "sleep_setsleeptime",
      "message0": "set sleep timeout to %1 minutes",
      "args0": [
        {
          "type": "field_number",
          "name": "TIMEOUT",
          "value": 10,
          "min": 0,
          "max": 10000,
          "precision": 1
        },
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for going to sleep
    {
      "type": "sleep_gosleep",
      "message0": "go to sleep",
      "inputsInline": true,
      "previousStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
]);
