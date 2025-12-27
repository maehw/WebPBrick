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

// This JavaScript code is used to define blocks of the "MISC" category (e.g. time/data, datalog, system watch).

timeDataCategoryCol = "#79919F";

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for setting RCX' display mode
    {
      "type": "display_mode",
      "message0": "selecione o modo da tela %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            [
              "relógio do sistema",
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
              "saída A",
              "DISPLAY_OUT_A"
            ],
            [
              "saída B",
              "DISPLAY_OUT_B"
            ],
            [
              "saída C",
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
      "message0": "defina o horário do sistema para %1 horas e %2 minutos",
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
      "message0": "obter horário do sistema (em minutos)",
      "inputsInline": true,
      "output": "Number",
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for creating a datalog
    {
      "type": "datalog_create",
      "message0": "criar registro de dados de tamanho %1",
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
      "message0": "Adicionar valor %1 ao registro de dados",
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
      "message0": "limpar temporizador %1",
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
      "message0": "valor do %1 temporizador",
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
    // Block for setting the sleep timeout
    {
      "type": "sleep_setsleeptime",
      "message0": "Defina o tempo limite de suspensão para %1 minuto",
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
      "message0": "ativar modo dormir",
      "inputsInline": true,
      "previousStatement": null,
      "colour": timeDataCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
]);
