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

// This JavaScript code is used to define the Blockly toolbox and set up the Blockly workspace.

// Define Blockly toolbox using JSON
const toolbox = {
  'kind': "categoryToolbox",
  'contents': [
    {
      kind: 'category',
      name: 'Lógica',
      categorystyle: 'logic_category',
      contents: [
        {
          type: 'controls_if',
          kind: 'block',
        },
        {
          type: 'logic_compare',
          kind: 'block',
          fields: {
            OP: 'EQ',
          },
        },
        {
          type: 'logic_operation',
          kind: 'block',
          fields: {
            OP: 'AND',
          },
        },
        {
          type: 'logic_negate',
          kind: 'block',
        },
        {
          type: 'logic_boolean',
          kind: 'block',
          fields: {
            BOOL: 'TRUE',
          },
        },
        {
          type: 'logic_boolean',
          kind: 'block',
          fields: {
            BOOL: 'FALSE',
          },
        },
      ], /* end of category contents */
    }, /* end of Logic category */
    {
      kind: 'category',
      name: 'Tarefas',
      contents: [
        {
          type: 'task_definition',
          kind: 'block',
        },
        {
          type: 'task_start',
          kind: 'block',
        },
        {
          type: 'task_stop',
          kind: 'block',
        },
        {
          type: 'task_stopall',
          kind: 'block',
        },
      ], /* end of category contents */
    }, /* end of Tasks category */
    {
      kind: 'category',
      name: 'Repetições(loop) e controle',
      categorystyle: 'loop_category',
      contents: [
        {
          'kind': 'block',
          'type': 'controls_repeat_ext',
          'inputs': {
            'TIMES': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 4
                }
              }
            }
          }
        },
        {
          type: 'controls_whileUntil',
          kind: 'block',
          fields: {
            MODE: 'WHILE',
          },
        },
        {
          type: 'controls_flow_statements',
          kind: 'block',
          enabled: true,
          fields: {
            FLOW: 'BREAK',
          },
        },
        {
          type: 'controls_flow_statements',
          kind: 'block',
          enabled: true,
          fields: {
            FLOW: 'CONTINUE',
          },
        },
        {
          type: 'controls_wait',
          kind: 'block',
          inputs: {
            'DURATION': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 1
                }
              }
            },
          }
        },
        {
          type: 'controls_waitfraction',
          kind: 'block',
          inputs: {
            'DURATION': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 100
                }
              }
            },
          }
        },
      ], /* end of category contents */
    }, /* end of Loops & Control category */
    {
      kind: 'category',
      name: 'Matemática',
      categorystyle: 'math_category',
      contents: [
        {
          type: 'math_number',
          kind: 'block',
          fields: {
            NUM: 123,
          },
        },
        {
          type: 'math_arithmetic',
          kind: 'block',
          fields: {
            OP: 'ADD',
          },
          inputs: {
            A: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
            B: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
/*
// Cannot use this out of the box unless the JavaScript code generator is overridden
        {
          type: 'math_number_property',
          kind: 'block',
          fields: {
            PROPERTY: 'EVEN',
          },
          inputs: {
            NUMBER_TO_CHECK: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 0,
                },
              },
            },
          },
        },
*/
        {
          type: 'math_modulo',
          kind: 'block',
          inputs: {
            DIVIDEND: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 64,
                },
              },
            },
            DIVISOR: {
              shadow: {
                type: 'math_number',
                fields: {
                  NUM: 10,
                },
              },
            },
          },
        },
        {
          type: 'math_abssign',
          kind: 'block',
        },
        {
          type: 'math_random_int0',
          kind: 'block',
        },
/*
// Cannot use all of these ... unless the JavaScript code generator is overridden
        {
          type: 'math_single',
          kind: 'block',
          "fields": {
            "OP": "NEG"
          },
        },
        {
          type: 'math_single',
          kind: 'block',
          "fields": {
            "OP": "ABS"
          },
        },
*/
      ], /* end of category contents */
    }, /* end of Math category */
    {
      kind: 'category',
      name: 'Variáveis',
      custom: 'VARIABLE',
      categorystyle: 'variable_category',
    }, /* end of Variables category */
    {
      kind: 'category',
      name: 'Saídas',
      /* custom: 'MOTION', -- only required for 'dynamic categories', seems to require callbacks */
      contents: [
        {
          type: 'output_setdirection',
          kind: 'block',
        },
        {
          type: 'output_setmode',
          kind: 'block',
        },
        {
          type: 'output_setpower',
          kind: 'block',
          inputs: {
            'POWER': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 7
                }
              }
            }
          }
        },
        {
          type: 'output_onwithdirection',
          kind: 'block',
        },
        {
          type: 'output_on',
          kind: 'block',
        },
        {
          type: 'output_off',
          kind: 'block',
        },
        {
          type: 'output_float',
          kind: 'block',
        },
      ],
    }, /* end of Outputs category */
    {
      kind: 'category',
      name: 'Sensores',
      /* custom: 'SENSORS', -- only required for 'dynamic categories', seems to require callbacks */
      contents: [
        {
          type: 'sensor_config',
          kind: 'block',
        },
        {
          type: 'sensor_type',
          kind: 'block',
        },
        {
          type: 'sensor_setmode',
          kind: 'block',
        },
        {
          type: 'sensor_read',
          kind: 'block',
        },
        {
          type: 'sensor_readraw',
          kind: 'block',
        },
        {
          type: 'sensor_clear',
          kind: 'block',
        },
      ],
    }, /* end of Sensors category */
    {
      kind: 'category',
      name: 'Sons',
      contents: [

        {
          type: 'sound_playsound',
          kind: 'block',
        },
        {
          type: 'sound_playtone',
          kind: 'block',
        },
      ],
    }, /* end of Sound category */
    {
      kind: 'category',
      name: 'Mensagens Infra Vermelho',
      contents: [
        {
          type: 'infrared_txpower',
          kind: 'block',
        },
        {
          type: 'infrared_msgsend',
          kind: 'block',
          inputs: {
            'MESSAGE': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 42
                }
              }
            },
          }
        },
        {
          type: 'infrared_msgclear',
          kind: 'block',
        },
        {
          type: 'infrared_msgreceive',
          kind: 'block',
        },
      ],
    }, /* end of IR Messages category */
    {
      kind: 'category',
      name: 'Hora & Data',
      contents: [
        {
          type: 'display_mode',
          kind: 'block',
        },
        {
          type: 'watch_set',
          kind: 'block',
        },
        {
          type: 'watch_get',
          kind: 'block',
        },
        {
          type: 'timer_read',
          kind: 'block',
        },
        {
          type: 'timer_clear',
          kind: 'block',
        },
        {
          type: 'sleep_setsleeptime',
          kind: 'block',
        },
        {
          type: 'sleep_gosleep',
          kind: 'block',
        },
        {
          type: 'datalog_create',
          kind: 'block',
        },
        {
          type: 'datalog_addvalue',
          kind: 'block',
          inputs: {
            'VALUE': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 23
                }
              }
            },
          }
        },
      ],
    }, /* end of Messages category */
  ] /* end of toolbox contents */
}; /* end of toolbox */

// Blockly.inject(location, options)
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolbox,
  scrollbars: false,
  horizontalLayout: false,
  toolboxPosition: "begin",
  renderer: 'Zelos',
  sounds: false,
  maxInstances: {
    "task_main": 1,
    "task_definition": 9, /* up to 10 (1+9) concurrent tasks in total */
  }
});

// Disable orphan blocks so that we do not generate any code for those
workspace.addChangeListener(Blockly.Events.disableOrphans);

// Make sure that there's a "main task" block in the workspace and also make sure it cannot be deleted
const mainTask = Blockly.serialization.blocks.append({'type': 'task_main'}, workspace);
mainTask.setDeletable(false);
// Offset the block so that it's not directly placed on the border of the toolbox
mainTask.moveTo(new Blockly.utils.Coordinate(100, 10));
