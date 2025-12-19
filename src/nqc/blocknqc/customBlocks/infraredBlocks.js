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

// This JavaScript code is used to define blocks for the infrared communication category.

infraredCategoryCol = "#AC0E0E";

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for setting infrared TX power
    {
      "type": "infrared_txpower",
      "message0": "coloque a potência da torre infravermelho para %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "LEVEL",
          "options": [
            [
              "baixo",
              "TX_POWER_LO"
            ],
            [
              "alto",
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
      "message0": "Enviar mensagem infravelho %1 por infravermelho",
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
      "message0": "limpar última mensagem infravermelho recebida",
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
      "message0": "receber mensagem infravermelho",
      "output": "Number",
      "inputsInline": true,
      "colour": infraredCategoryCol,
      "tooltip": "",
      "helpUrl": "",
    },
]);
