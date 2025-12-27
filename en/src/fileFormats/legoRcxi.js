// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.LegoRcx = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
/**
 * LEGO RCX binary image format for the yellow LEGO Mindstorms RCX programmable
 * brick which contains LASM bytecode that is interpreted on the brick along
 * with additional meta data like task, subroutine and variable names.
 * You can uncomment a line to even decode the embedded bytecode
 * (not fully supported all opcodes, but a start!).
 *
 * See also:
 * * LEGO's specification document "RCX 2.0 Firmware Command Overview"
 * * NQC's rcxlib source code (https://bricxcc.sourceforge.net/nqc/)
 *
 * Converted to kaitai struct by maehw, 2024.
 */

var LegoRcx = (function() {
  function LegoRcx(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  LegoRcx.prototype._read = function() {
    this.magic = this._io.readBytes(4);
    if (!((KaitaiStream.byteArrayCompare(this.magic, [82, 67, 88, 73]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([82, 67, 88, 73], this.magic, this._io, "/seq/0");
    }
    this.currentVersion = this._io.readBytes(2);
    if (!((KaitaiStream.byteArrayCompare(this.currentVersion, [2, 1]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([2, 1], this.currentVersion, this._io, "/seq/1");
    }
    this.chunkCount = this._io.readU2le();
    this.symbolCount = this._io.readU2le();
    this.targetType = this._io.readBytes(2);
    if (!((KaitaiStream.byteArrayCompare(this.targetType, [3, 0]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([3, 0], this.targetType, this._io, "/seq/4");
    }
    this.chunks = [];
    for (var i = 0; i < this.chunkCount; i++) {
      this.chunks.push(new Chunk(this._io, this, this._root));
    }
    this.symbols = [];
    for (var i = 0; i < this.symbolCount; i++) {
      this.symbols.push(new Symbol(this._io, this, this._root));
    }
  }

  /**
   * StartTask (start)
   */

  var OpStartParams = LegoRcx.OpStartParams = (function() {
    function OpStartParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpStartParams.prototype._read = function() {
      this.taskNumber = this._io.readU1();
    }

    return OpStartParams;
  })();

  var Chunk = LegoRcx.Chunk = (function() {
    function Chunk(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Chunk.prototype._read = function() {
      this.chunkType = this._io.readU1();
      this.chunkIndex = this._io.readU1();
      this.chunkLength = this._io.readU2le();
      this.chunkData = this._io.readBytes(this.chunkLength);
      this.chunkPadding = this._io.readBytes((3 - KaitaiStream.mod((this.chunkLength + 3), 4)));
    }

    /**
     * Type of chunk
     */

    /**
     * Index of chunk
     */

    /**
     * Length of chunk data in bytes
     */

    /**
     * LEGO bytecode data
     */

    /**
     * Chunk padding is used to align chunks to a 4 byte
     */

    return Chunk;
  })();

  var LasmBytecode = LegoRcx.LasmBytecode = (function() {
    function LasmBytecode(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    LasmBytecode.prototype._read = function() {
      this.lasmOpcodes = [];
      var i = 0;
      while (!this._io.isEof()) {
        this.lasmOpcodes.push(new Opcode(this._io, this, this._root));
        i++;
      }
    }

    /**
     * Sequence of opcodes
     */

    return LasmBytecode;
  })();

  /**
   * SetSensorMode (senm)
   */

  var OpSenmParams = LegoRcx.OpSenmParams = (function() {
    function OpSenmParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpSenmParams.prototype._read = function() {
      this.sensorNumber = this._io.readU1();
      this.mode = this._io.readBitsIntBe(3);
      this.slope = this._io.readBitsIntBe(4);
    }

    return OpSenmParams;
  })();

  /**
   * PlayTone (playt)
   */

  var OpPlaytParams = LegoRcx.OpPlaytParams = (function() {
    function OpPlaytParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpPlaytParams.prototype._read = function() {
      this.frequency = this._io.readU2le();
      this.duration = this._io.readU1();
    }

    return OpPlaytParams;
  })();

  /**
   * SetFwdSetRwdRewDir (dir)
   */

  var OpDirParams = LegoRcx.OpDirParams = (function() {
    function OpDirParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpDirParams.prototype._read = function() {
      this.direction = this._io.readBitsIntBe(2);
      this.reserved = this._io.readBitsIntBe(3);
      this.motorList = this._io.readBitsIntBe(3);
    }

    return OpDirParams;
  })();

  /**
   * PlaySystemSound (plays)
   */

  var OpPlaysParams = LegoRcx.OpPlaysParams = (function() {
    function OpPlaysParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpPlaysParams.prototype._read = function() {
      this.sound = this._io.readU1();
    }

    return OpPlaysParams;
  })();

  /**
   * SCheckDo (chk)
   */

  var OpChkParams = LegoRcx.OpChkParams = (function() {
    function OpChkParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpChkParams.prototype._read = function() {
      this.comparison = this._io.readBitsIntBe(2);
      this.source1 = this._io.readBitsIntBe(6);
      this._io.alignToByte();
      this.source2 = this._io.readU1();
      this.value1 = this._io.readU2le();
      this.value2 = this._io.readU1();
      this.jumpDistance = this._io.readS1();
    }

    return OpChkParams;
  })();

  /**
   * SDecVarJumpLTZero (decvjn)
   */

  var OpDecvjnParams = LegoRcx.OpDecvjnParams = (function() {
    function OpDecvjnParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpDecvjnParams.prototype._read = function() {
      this.variableNumber = this._io.readU1();
      this.backwardsNotForwards = this._io.readBitsIntBe(1) != 0;
      this.jumpDistance = this._io.readBitsIntBe(7);
    }

    return OpDecvjnParams;
  })();

  /**
   * Wait (wait)
   */

  var OpWaitParams = LegoRcx.OpWaitParams = (function() {
    function OpWaitParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpWaitParams.prototype._read = function() {
      this.waitSource = this._io.readU1();
      this.waitValue = this._io.readU2le();
    }

    return OpWaitParams;
  })();

  var Symbol = LegoRcx.Symbol = (function() {
    function Symbol(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Symbol.prototype._read = function() {
      this.symbolType = this._io.readU1();
      this.symbolIndex = this._io.readU1();
      this.symbolLength = this._io.readU2le();
      this.symbolName = KaitaiStream.bytesToStr(this._io.readBytes(this.symbolLength), "ascii");
    }

    /**
     * Symbol type: task symbol (0), sub symbol (1), var symbol (2)
     */

    /**
     * Symbol index
     */

    /**
     * Symbol length in bytes
     */

    /**
     * Symbol name
     */

    return Symbol;
  })();

  /**
   * SetVar (setv)
   */

  var OpSetvParams = LegoRcx.OpSetvParams = (function() {
    function OpSetvParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpSetvParams.prototype._read = function() {
      this.variableNumber = this._io.readU1();
      this.source = this._io.readU1();
      this.value = this._io.readU2le();
    }

    return OpSetvParams;
  })();

  /**
   * LCheckDo (checkl)
   */

  var OpChecklParams = LegoRcx.OpChecklParams = (function() {
    function OpChecklParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpChecklParams.prototype._read = function() {
      this.comparison = this._io.readBitsIntBe(2);
      this.source1 = this._io.readBitsIntBe(6);
      this.reserved = this._io.readBitsIntBe(2);
      this.source2 = this._io.readBitsIntBe(6);
      this._io.alignToByte();
      this.value1 = this._io.readS2le();
      this.value2 = this._io.readS1();
      this.jumpDistance = this._io.readS2le();
    }

    return OpChecklParams;
  })();

  var Opcode = LegoRcx.Opcode = (function() {
    function Opcode(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Opcode.prototype._read = function() {
      this.opcodeByte = this._io.readU1();
      switch (this.opcodeByte) {
      case 81:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpPlaysParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 39:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpJmpParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 35:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpPlaytParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 20:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpSetvParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 113:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpStartParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 149:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpChecklParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 66:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpSenmParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 67:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpWaitParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 33:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpOutParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 19:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpPwrParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 225:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpDirParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 242:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpDecvjnParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 133:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpChkParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 129:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpStopParams(_io__raw_parameterBytes, this, this._root);
        break;
      case 50:
        this._raw_parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        var _io__raw_parameterBytes = new KaitaiStream(this._raw_parameterBytes);
        this.parameterBytes = new OpSentParams(_io__raw_parameterBytes, this, this._root);
        break;
      default:
        this.parameterBytes = this._io.readBytes((this.opcodeByte == 149 ? 7 : (this.opcodeByte == 39 ? 1 : (this.opcodeByte == 133 ? 6 : (this.opcodeByte & 7)))));
        break;
      }
    }

    /**
     * usually the three least significant bits represent the size,
     * but for some opcodes that's not the case!
     */

    return Opcode;
  })();

  /**
   * SetSensorType (sent)
   */

  var OpSentParams = LegoRcx.OpSentParams = (function() {
    function OpSentParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpSentParams.prototype._read = function() {
      this.sensorNumber = this._io.readU1();
      this.sensorType = this._io.readU1();
    }

    return OpSentParams;
  })();

  /**
   * StopTask (stop)
   */

  var OpStopParams = LegoRcx.OpStopParams = (function() {
    function OpStopParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpStopParams.prototype._read = function() {
      this.taskNumber = this._io.readU1();
    }

    return OpStopParams;
  })();

  /**
   * SetPower (pwr)
   */

  var OpPwrParams = LegoRcx.OpPwrParams = (function() {
    function OpPwrParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpPwrParams.prototype._read = function() {
      this.motorList = this._io.readU1();
      this.powerSource = this._io.readU1();
      this.powerValue = this._io.readU1();
    }

    return OpPwrParams;
  })();

  /**
   * OnOffFloat (out)
   */

  var OpOutParams = LegoRcx.OpOutParams = (function() {
    function OpOutParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpOutParams.prototype._read = function() {
      this.floatOffOn = this._io.readBitsIntBe(2);
      this.reserved = this._io.readBitsIntBe(3);
      this.motorList = this._io.readBitsIntBe(3);
    }

    return OpOutParams;
  })();

  /**
   * SJump (jmp)
   */

  var OpJmpParams = LegoRcx.OpJmpParams = (function() {
    function OpJmpParams(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    OpJmpParams.prototype._read = function() {
      this.backwardsNotForwards = this._io.readBitsIntBe(1) != 0;
      this.jumpDistance = this._io.readBitsIntBe(7);
    }

    return OpJmpParams;
  })();

  /**
   * Expecting this magic
   */

  /**
   * Expecting version 1.02
   */

  /**
   * Number of chunks in this image
   */

  /**
   * Number of symbols in this image
   */

  /**
   * Expecting target type 3 (RCX 2.0 (i.e., RCX bricks with v.0328 or
   * later firmwares))
   */

  /**
   * List of the actual chunks
   */

  /**
   * List of the actual symbols
   */

  return LegoRcx;
})();
return LegoRcx;
}));
