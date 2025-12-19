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

// This JavaScript code is used to define blocks of the "Sensors" category.

sensorCategoryCol = 96; // hue value

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for sensor configuration
    {
      "type": "sensor_config",
      "message0": "defina a configuração do sensor %1 (tipo + modo) para %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "INPUT",
          "options": [
            [
              "1",
              "SENSOR_1"
            ],
            [
              "2",
              "SENSOR_2"
            ],
            [
              "3",
              "SENSOR_3"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "CONFIG",
          "options": [
            [
              "toque",
              "SENSOR_TOUCH"
            ],
            [
              "luminosidade",
              "SENSOR_LIGHT"
            ],
            [
              "rotação",
              "SENSOR_ROTATION"
            ],
            [
              "temperatura (°C)",
              "SENSOR_CELSIUS"
            ],
            [
              "temperatura (°F)",
              "SENSOR_FAHRENHEIT"
            ],
            [
              "detecção de pulso",
              "SENSOR_PULSE"
            ],
            [
              "detecção de beirada",
              "SENSOR_EDGE"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": sensorCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for sensor mode
    {
      "type": "sensor_setmode",
      "message0": "defina o modo do sensor %1 para %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "INPUT",
          "options": [
            [
              "1",
              "SENSOR_1"
            ],
            [
              "2",
              "SENSOR_2"
            ],
            [
              "3",
              "SENSOR_3"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            [
              "cru",
              "SENSOR_MODE_RAW"
            ],
            [
              "bool",
              "SENSOR_MODE_BOOL"
            ],
            [
              "edge",
              "SENSOR_MODE_EDGE"
            ],
            [
              "pulse",
              "SENSOR_MODE_PULSE"
            ],
            [
              "percent",
              "SENSOR_MODE_PERCENT"
            ],
            [
              "Celsius (°C)",
              "SENSOR_MODE_CELSIUS"
            ],
            [
              "Fahrenheit (F)",
              "SENSOR_MODE_FAHRENHEIT"
            ],
            [
              "rotation",
              "SENSOR_MODE_ROTATION"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": sensorCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for sensor type
    {
      "type": "sensor_type",
      "message0": "set sensor %1 type to %2 sensor",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "INPUT",
          "options": [
            [
              "1",
              "SENSOR_1"
            ],
            [
              "2",
              "SENSOR_2"
            ],
            [
              "3",
              "SENSOR_3"
            ]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "TYPE",
          "options": [
            [
              "touch",
              "SENSOR_TYPE_TOUCH"
            ],
            [
              "light",
              "SENSOR_TYPE_LIGHT"
            ],
            [
              "temperature",
              "SENSOR_TYPE_TEMPERATURE"
            ],
            [
              "rotation",
              "SENSOR_TYPE_ROTATION"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": sensorCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for sensor clear
    {
      "type": "sensor_clear",
      "message0": "clear sensor %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "INPUT",
          "options": [
            [
              "1",
              "SENSOR_1"
            ],
            [
              "2",
              "SENSOR_2"
            ],
            [
              "3",
              "SENSOR_3"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": sensorCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for sensor value
    {
      "type": "sensor_read",
      "message0": "sensor %1 value",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "INPUT",
          "options": [
            [
              "1",
              "SENSOR_1"
            ],
            [
              "2",
              "SENSOR_2"
            ],
            [
              "3",
              "SENSOR_3"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "output": "Number",
      "colour": sensorCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for raw sensor value
    {
      "type": "sensor_readraw",
      "message0": "sensor %1 raw value",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "INPUT",
          "options": [
            [
              "1",
              "SENSOR_1"
            ],
            [
              "2",
              "SENSOR_2"
            ],
            [
              "3",
              "SENSOR_3"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "output": "Number",
      "colour": sensorCategoryCol,
      "tooltip": "",
      "helpUrl": ""
    }
]);
