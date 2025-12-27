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

// This JavaScript code is used to define custom blocks of the "Math" category.

mathCategoryCol = 230; // hue value

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for creating a random number
    {
      "type": "math_random_int0",
      "message0": "número inteiro aleatório de 0 a %1",
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
      "colour": mathCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for creating a random number
    {
      "type": "math_abssign",
      "message0": "%1 de %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": [
            [
              "valor absoluto",
              "abs"
            ],
            [
              "sinal de",
              "sign"
            ],
          ]
        },
        {
          "type": "field_number",
          "name": "NUMBER",
          "value": -18,
          "precision": 1
        },
      ],
      "inputsInline": true,
      "output": "Number",
      "colour": mathCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
]);
