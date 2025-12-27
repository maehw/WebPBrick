meta:
  id: lego_rcx
  file-extension: rcx
  endian: le

doc: |
  LEGO RCX binary image format for the yellow LEGO Mindstorms RCX programmable
  brick which contains LASM bytecode that is interpreted on the brick along
  with additional meta data like task, subroutine and variable names.
  You can uncomment a line to even decode the embedded bytecode
  (not fully supported all opcodes, but a start!).

  See also:
  * LEGO's specification document "RCX 2.0 Firmware Command Overview"
  * NQC's rcxlib source code (https://bricxcc.sourceforge.net/nqc/)

  Written for the WebPBrick project in kaitai struct.
  GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
  Copyright (C) 2024 maehw

seq:
  - id: magic
    contents: "RCXI"
    doc: Expecting this magic
  - id: current_version
    contents: [0x02, 0x01]
    doc: Expecting version 1.02
  - id: chunk_count
    type: u2
    doc: Number of chunks in this image
  - id: symbol_count
    type: u2
    doc: Number of symbols in this image
  - id: target_type
    contents: [0x03, 0x00]
    doc: |
      Expecting target type 3 (RCX 2.0 (i.e., RCX bricks with v.0328 or
      later firmwares))
  - id: chunks
    type: chunk
    repeat: expr
    repeat-expr: chunk_count
    doc: List of the actual chunks
  - id: symbols
    type: symbol
    repeat: expr
    repeat-expr: symbol_count
    doc: List of the actual symbols

types:
  chunk:
    seq:
    - id: chunk_type
      type: u1
      doc: Type of chunk
    - id: chunk_index
      type: u1
      doc: Index of chunk
    - id: chunk_length
      type: u2
      doc: Length of chunk data in bytes
    - id: chunk_data
      # uncomment the 'type' line if you want to decompile the bytecode
      # however, this may not be fully handled yet! (expect length mismatches!)
      # type: lasm_bytecode
      size: chunk_length
      doc: LEGO bytecode data
    - id: chunk_padding
      size: 3 - ((chunk_length+3) % 4)
      doc: Chunk padding is used to align chunks to a 4 byte
  symbol:
    seq:
    - id: symbol_type
      type: u1
      doc: Symbol type: task symbol (0), sub symbol (1), var symbol (2)
    - id: symbol_index
      type: u1
      doc: Symbol index
    - id: symbol_length
      type: u2
      doc: Symbol length in bytes
    - id: symbol_name
      type: str
      size: symbol_length
      encoding: ascii
      doc: Symbol name
  lasm_bytecode:
    seq:
      - id: lasm_opcodes
        type: opcode
        repeat: eos
        doc: Sequence of opcodes
  opcode:
    seq:
    - id: opcode_byte
      type: u1
    - id: parameter_bytes
      doc:  |
        usually the three least significant bits represent the size, 
        but for some opcodes that's not the case!
      size: |
        (opcode_byte == 0x95) ? 7 : (
          ((opcode_byte == 0x27) ? 1 : 
            (opcode_byte == 0x85) ? 6 : (opcode_byte & 0x7))
        )
      type:
        switch-on: opcode_byte
        cases:
          0x13: op_pwr_params
          0x14: op_setv_params
          0x21: op_out_params
          0x23: op_playt_params
          0x27: op_jmp_params
          0x32: op_sent_params
          0x42: op_senm_params
          0x43: op_wait_params
          0x51: op_plays_params
          0x71: op_start_params
          0x81: op_stop_params
          0x85: op_chk_params
          0x95: op_checkl_params
          0xE1: op_dir_params
          0xF2: op_decvjn_params
  op_pwr_params:
    doc: SetPower (pwr)
    seq:
    - id: motor_list
      type: u1
    - id: power_source
      type: u1
    - id: power_value
      type: u1
  op_dir_params:
    doc: SetFwdSetRwdRewDir (dir)
    seq:
    - id: direction
      type: b2
    - id: reserved
      type: b3
    - id: motor_list
      type: b3
  op_sent_params:
    doc: SetSensorType (sent)
    seq:
    - id: sensor_number
      type: u1
    - id: sensor_type
      type: u1
  op_senm_params:
    doc: SetSensorMode (senm)
    seq:
    - id: sensor_number
      type: u1
    - id: mode
      type: b3
    - id: slope
      type: b4
  op_out_params:
    doc: OnOffFloat (out)
    seq:
    - id: float_off_on
      type: b2
    - id: reserved
      type: b3
    - id: motor_list
      type: b3
  op_checkl_params:
    doc: LCheckDo (checkl)
    seq:
    - id: comparison
      type: b2
    - id: source1
      type: b6
    - id: reserved
      type: b2
    - id: source2
      type: b6
    - id: value1
      type: s2  # no clue if signed or unsigned
    - id: value2
      type: s1  # no clue if signed or unsigned
    - id: jump_distance
      type: s2  # no clue if signed or unsigned
  op_plays_params:
    doc: PlaySystemSound (plays)
    seq:
    - id: sound
      type: u1
  op_jmp_params:
    doc: SJump (jmp)
    seq:
    - id: backwards_not_forwards
      type: b1
    - id: jump_distance
      type: b7
  op_setv_params:
    doc: SetVar (setv)
    seq:
    - id: variable_number
      type: u1
    - id: source
      type: u1
    - id: value
      type: u2
  op_wait_params:
    doc: Wait (wait)
    seq:
    - id: wait_source
      type: u1
    - id: wait_value
      type: u2
  op_decvjn_params:
    doc: SDecVarJumpLTZero (decvjn)
    seq:
    - id: variable_number
      type: u1
    - id: backwards_not_forwards
      type: b1
    - id: jump_distance
      type: b7
  op_start_params:
    doc: StartTask (start)
    seq:
    - id: task_number
      type: u1
  op_stop_params:
    doc: StopTask (stop)
    seq:
    - id: task_number
      type: u1
  op_chk_params:
    doc: SCheckDo (chk)
    seq:
    - id: comparison
      type: b2
    - id: source1
      type: b6
    - id: source2
      type: u1
    - id: value1
      type: u2
    - id: value2
      type: u1
    - id: jump_distance
      type: s1  # no clue if signed or unsigned
  op_playt_params:
    doc: PlayTone (playt)
    seq:
    - id: frequency
      type: u2
    - id: duration
      type: u1
