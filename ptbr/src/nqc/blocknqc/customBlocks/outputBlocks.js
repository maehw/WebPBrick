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

// This JavaScript code is used to define blocks of the "Outputs" category.

outputsCategoryCol = "#FF5E00";

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for setting motor/output power
    {
      "type": "output_setpower",
      "message0": "Defina o nível de potência de saída %1 para %2",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
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
      "helpUrl": "",
      "extensions": [
        'power_range_validation',
      ]
    },
    // Block for setting motor/output direction
    {
      "type": "output_setdirection",
      "message0": "Defina a direção de saída %1 para %2",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "DIRECTION",
          "options": [
            [
              "para frente",
              "OUT_FWD"
            ],
            [
              "para trás",
              "OUT_REV"
            ],
            [
              "alternar",
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
      "type": "output_onwithdirection",
      "message0": "A saída %1 deve estar ligada na direção %2",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "DIRECTION",
          "options": [
            [
              "para frente",
              "OnFwd"
            ],
            [
              "para trás",
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
      "type": "output_off",
      "message0": "desligar porta de saída %1 ",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
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
    // Block for switching motor/output off smoothly ("float" or "coast")
    {
      "type": "output_float",
      "message0": "desligar porta de saída %1 suavemente",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
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
      "type": "output_on",
      "message0": "ligar porta de saída %1 ",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
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
      "type": "output_setmode",
      "message0": "defina o modo da porta de saída %1 para %2",
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
            ],
            [
              "A + B",
              "OUT_A+OUT_B"
            ],
            [
              "A + C",
              "OUT_A+OUT_C"
            ],
            [
              "B + C",
              "OUT_B+OUT_C"
            ],
            [
              "A + B + C",
              "OUT_A+OUT_B+OUT_C"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            [
              "ligar",
              "OUT_ON"
            ],
            [
              "desligar",
              "OUT_OFF"
            ],
            [
              "desligar em ponto morto",
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

Blockly.Extensions.register('power_range_validation', function() {
  this.setOnChange(function(changeEvent) {
    if (changeEvent instanceof Blockly.Events.BlockChange) {
      checkIntegerInputRange(this, 'POWER', 0, 7);
    }
  });
});
