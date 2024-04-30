/*
 * WebPBrick
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

// This JavaScript code is used to define blocks of the "Outputs" category.

outputsCategoryCol = "#FF5E00";

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for setting motor/output power
    {
      "type": "motion_setpower",
      "message0": "set output %1 power level to %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OUTPUT",
          "options": [
            [
              "A",
              "OUT_A"
            ],
            [
              "B",
              "OUT_B"
            ],
            [
              "C",
              "OUT_C"
            ]
          ]
        },
        {
          "type": "input_value",
          "name": "POWER",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": outputsCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for setting motor/output direction
    {
      "type": "motion_setdirection",
      "message0": "set output %1 direction to %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OUTPUT",
          "options": [
            [
              "A",
              "OUT_A"
            ],
            [
              "B",
              "OUT_B"
            ],
            [
              "C",
              "OUT_C"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "DIRECTION",
          "options": [
            [
              "forward",
              "OUT_FWD"
            ],
            [
              "reverse",
              "OUT_REV"
            ],
            [
              "toggle",
              "OUT_TOGGLE"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": outputsCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for switching motor/output on in a specific direction
    {
      "type": "motion_onwithdirection",
      "message0": "switch output %1 on in %2 direction",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OUTPUT",
          "options": [
            [
              "A",
              "OUT_A"
            ],
            [
              "B",
              "OUT_B"
            ],
            [
              "C",
              "OUT_C"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "DIRECTION",
          "options": [
            [
              "forward",
              "OnFwd"
            ],
            [
              "reverse",
              "OnRev"
            ],
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": outputsCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for switching motor/output off
    {
      "type": "motion_off",
      "message0": "switch output %1 off",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OUTPUT",
          "options": [
            [
              "A",
              "OUT_A"
            ],
            [
              "B",
              "OUT_B"
            ],
            [
              "C",
              "OUT_C"
            ]
          ]
        },
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": outputsCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for switching motor/output on
    {
      "type": "motion_on",
      "message0": "switch output %1 on",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OUTPUT",
          "options": [
            [
              "A",
              "OUT_A"
            ],
            [
              "B",
              "OUT_B"
            ],
            [
              "C",
              "OUT_C"
            ]
          ]
        },
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": outputsCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for setting motor/output mode
    {
      "type": "motion_setmode",
      "message0": "set output %1 mode to %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OUTPUT",
          "options": [
            [
              "A",
              "OUT_A"
            ],
            [
              "B",
              "OUT_B"
            ],
            [
              "C",
              "OUT_C"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            [
              "on",
              "OUT_ON"
            ],
            [
              "off",
              "OUT_OFF"
            ],
            [
              "float",
              "OUT_FLOAT"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": outputsCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
]);
