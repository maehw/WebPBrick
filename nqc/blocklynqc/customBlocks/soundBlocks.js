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

// This JavaScript code is used to define blocks of the "Sounds" category.

// Block definitions
Blockly.defineBlocksWithJsonArray([
    // Block for playing a sound
    {
      "type": "sound_playsound",
      "message0": "play sound %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "SOUND",
          "options": [
            [
              "click",
              "SOUND_CLICK"
            ],
            [
              "double beep",
              "SOUND_DOUBLE_BEEP"
            ],
            [
              "down",
              "SOUND_DOWN"
            ],
            [
              "up",
              "SOUND_UP"
            ],
            [
              "low beep",
              "SOUND_LOW_BEEP"
            ],
            [
              "fast up",
              "SOUND_FAST_UP"
            ]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 192,
      "tooltip": "",
      "helpUrl": ""
    },
    // Block for playing a tone
    {
      "type": "sound_playtone",
      "message0": "play tone with frequency %1 Hz for %2 seconds",
      "args0": [
        {
          "type": "field_number",
          "name": "FREQUENCY",
          "value": 440,
          "min": 1,
          "max": 20000,
          "precision": 1
        },
        {
          "type": "field_number",
          "name": "DURATION",
          "value": 1,
          "min": 1,
          "max": 1000,
          "precision": 0.01
        },
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 192,
      "tooltip": "",
      "helpUrl": ""
    },
]);
