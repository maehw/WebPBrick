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

 // This JavaScript file wraps WebNQC - the NQC compiler that runs in your web-browser.

let nqc;

// TODO: define proper interface instead of operating on control elements
// define various control elements
const btnConvert = document.getElementById('compileBtn');
const txtDebug = document.getElementById('logArea');
const txtOutput = document.getElementById('logArea');
const txtStdOut = document.getElementById('logArea');
const txtStdError = document.getElementById('logArea');
const cbDownloadRcxFile = document.getElementById('cbDownloadRcxFile');

// define file names
const inputFilename = 'input.nqc';
const outputFilename = 'output.rcx';

let firstErrorLine = null;
let rcxBinary = null;

document.addEventListener('DOMContentLoaded', () => {
  btnConvert.addEventListener('click', clickConvert);
});

function array2hex(arrayBuffer) {
    if(arrayBuffer.length == 0) {
        return ""
    }
    else {
        return "0x"+Array.from(new Uint8Array(arrayBuffer))
            .map(n => n.toString(16).toUpperCase().padStart(2, "0"))
            .join(" 0x");
    }
}

const printFunction = (function() {
    if (txtStdOut) txtStdOut.value = ''; // clear browser cache
    return function(text) {
      if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
      if (txtStdOut) {
        txtStdOut.value += "[STDOUT] " + text + "\n";
      }
    };
  })();

const printErrFunction = (function() {
      // define regular expression that checks for line numbers in error messages (used for input selection in the textarea as user feedback)
      const regex = new RegExp("^File \"" + inputFilename + "\" ; line ([0-9]+)$", "g");
      return function(text) {
        debugger;

        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
          logError(text);

          // parse error line and see if we can get the line number out of it
          const match = text.match(regex);
          if(match) {
              const lineNo = parseInt(text.replace(regex, "$1"));
              //console.log("Detected error on line #" + lineNo);
              if(firstErrorLine === null) {
                // overwrite global variable, but only if it's not been set before (after having been reset)
                firstErrorLine = lineNo;
              }
          }
      };
    })();

function logDebug(txt) {
  txtDebug.value += "🕵🏻‍ " + txt + "\n";
}

function logError(txt) {
  txtDebug.value += "❌️ " + txt + "\n";
}

createWebNqc(
  { 'print': printFunction,
    'printErr': printErrFunction }
).then(instance => {
  nqc = instance;
});

async function clickConvert() {
  const showUsage = false;
  const showListing = false;
  const showSourceInListing = false;
  const verbose = true;

  if((typeof nqc !== 'undefined') && (nqc !== null)) {
    // reset first error line
    firstErrorLine = null;

    // create an input file with contents from textarea and make sure to terminate with a linebreak
    nqc.FS.writeFile(inputFilename, codeArea.value + "\n");

    // call NQC
    /*
    Usage: nqc [options] [actions] [ - | filename ] [actions]
       - : read from stdin instead of a source_file
    Options:
       -T<target>: target is one of: RCX CM Scout RCX2 Spy Swan (target=RCX2)
       -n: prevent the API header file from being included
       -D<sym>[=<value>] : define macro <sym>
       -U<sym>: undefine macro <sym>
       -E[<filename>] : write compiler errors to <filename> (or stdout)
       -R<filename> : redirect text output (datalog, etc) to <filename>
       -I<path>: search <path> for include files
       -L[<filename>] : generate code listing to <filename> (or stdout)
       -s: include source code in listings if possible
       -c: generate LASM compatible listings
       -v: verbose
       -q: quiet; suppress action sounds
       -O<outfile>: specify output file
       -1: use NQC API 1.x compatibility mode
    Options made unavailable(!) in WebNQC:
       -b: treat input file as a binary file (don't compile it)
       -d: send program to RCX2
       -S<portname>: specify tower serial port
       -w<ms>: set the download wait timeout in milliseconds
       -f<size>: set firmware chunk size in bytes
       -x: omit packet header (RCX, RCX2 targets only)
    Actions:
       -api: dump the standard API header file to stdout
       -help: display command line options
    Actions made unavailable(!) in WebNQC:
       -run: run current program
       -pgm <number>: select program number
       -datalog | -datalog_full: fetch datalog from RCX2
       -near | -far: set IR tower to near or far mode
       -watch <hhmm> | now: set RCX2 clock to <hhmm> or system time
       -firmware <filename>: send firmware to RCX2
       -firmfast <filename>: send firmware to RCX2 at quad speed
       -getversion: report RCX2 ROM and firmware version
       -batterylevel: report battery level in volts
       -sleep <timeout>: set RCX2 sleep timeout in minutes
       -msg <number>: send IR message to RCX2
       -raw <data>: format data as a packet and send to RCX2
       -remote <value> <repeat>: invoke a remote command on the RCX2
       -clear: erase all programs and datalog on RCX2
    */
    if(showUsage) {
        // only for debugging purpose
        args = ['-help'];
    }
    else {
        // only for debugging purpose (for now)
        if(showListing) {
          args = ['-L'];
          if(showSourceInListing) {
            args.push('-s');
          }
          args.push('-O'+outputFilename);
          args.push(inputFilename);
        }
        else {
          args = ['-O'+outputFilename, inputFilename];
        }
    }
    //logDebug("Calling WebNQC with arguments: " + args);

    // initialize return value and exception flag
    let exceptionOccurred = false;
    let retval = 0;

    try {
      retval = nqc.callMain(args);
    }
    catch(e) {
      logError("An error has occurred: '" + e.message + "' at an unknown location in your code. Please double-check your code.");
      logError("Compilation failed.");
      exceptionOccurred = true;
    }

    if(!exceptionOccurred) {
       // nqc.FS.isFile(outputFilename))  // TODO: can we check for file existence?!
      if(retval == 0) {
          const out = nqc.FS.readFile(outputFilename);
          logDebug("Compiled NQC code successfully using WebNQC.");

          logDebug("Binary output length: " + out.length);
          logDebug("Binary output as HEX: " + array2hex(out));

          // copy binary to global variable
          rcxBinary = out;
      }
      else {
        // copy global variable into local one and reset the global one
        const errorLine = firstErrorLine;
        firstErrorLine = null;
        logDebug("Return value from WebNQC call: " + retval);

        if(errorLine) {
            logError("First compilation error occurred on line " + errorLine);

            // Highlight the line where the error occurred
            codeArea.focus(); // Ensure the code area is focused
            const errorLineNumber = errorLine - 1; // Adjust to zero-based index

            // Calculate the position of the error line in the codeArea
            const lines = codeArea.value.split('\n');
            const startPos = lines.slice(0, errorLineNumber).join('\n').length + 1;
            const endPos = lines.slice(0, errorLineNumber + 1).join('\n').length;

            // Select the error line in the codeArea
            codeArea.setSelectionRange(startPos, endPos);
        }
        logError("Compilation failed.");
      }
    }
  }
  else {
    logError("WebNQC seems to be broken.");
  }
}
