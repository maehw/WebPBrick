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

// This JavaScript code is used to check for compatibilities and functions to handle the user interface of the IDE.

// define various control elements
const compileBtn = document.getElementById('compileBtn');
const serialConnectBtn = document.getElementById('serialConnectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const codeArea = document.getElementById('codeArea');
const logArea = document.getElementById('logArea');
const lineNumbers = document.querySelector('.line-numbers');

let codeModified = true; // code modified after build?
let serialConnected = false;

// Helper to check if browser supports WASM
const wasmSupported = (() => {
    // from here: https://stackoverflow.com/questions/47879864/how-can-i-check-if-a-browser-supports-webassembly
    try {
        if (typeof WebAssembly === "object"
            && typeof WebAssembly.instantiate === "function") {
            // magic number '\0', 'a', 's', 'm', followed by version number 1 encoded as uint32
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
    } catch (e) {
    }
    return false;
})();

document.addEventListener('DOMContentLoaded', () => {
  // Feature detection
  const webSerialNotSupported = document.getElementById('webserial-not-supported');
  if(!('serial' in navigator)) {
    // show hidden error banner, deactivate connect button and log to console
    webSerialNotSupported.style.display = "block";
    console.log("Web Serial not supported.");
    disableSerialConnectBtn();
  }

  const wasmNotSupported = document.getElementById('wasm-not-supported');
  if(!wasmSupported) {
    // show hidden error banner, deactivate connect button and log to console
    wasmNotSupported.style.display = "block";
    console.log("WebAssembly (WASM) not supported.");
    disableCompileBtn();
  }

  serialConnectBtn.addEventListener('click', clickSerialConnect);
  downloadBtn.addEventListener('click', clickProgramDownload);
});

// Helper to sleep, i.e. add delay
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// Function to generate line numbers in IDE dynamically
function updateLineNumbers() {
  const lines = codeArea.value.split('\n').length;
  lineNumbers.innerHTML = '';
  for (let i = 1; i <= lines; i++) {
    lineNumbers.innerHTML += `<div>${i}</div>`;
  }
}

// Function to synchronize line numbers scrolling with code editor
function syncScroll() {
  lineNumbers.scrollTop = codeArea.scrollTop;
}

// Update line numbers when content changes
codeArea.addEventListener('input', () => {
  updateLineNumbers();
  codeModified = true;
});

// Synchronize scrolling
codeArea.addEventListener('scroll', () => {
  syncScroll();
});

// NQC code example
exampleCode = `// sensors
#define BUMP         SENSOR_1

// motors
#define LEFT         OUT_A
#define RIGHT        OUT_C

// constants
#define REV_TIME     50
#define SPIN_MIN     70
#define SPIN_RANDOM  50

task main() {
  SetSensor(BUMP, SENSOR_TOUCH);

  // start going forward
  On(LEFT+RIGHT);

  // do this forever (endless loop)
  while (true) {
    // wait for bumper to hit something
    until(BUMP == 0);

    // back up
    Rev(LEFT+RIGHT);
    Wait(REV_TIME);

    // spin around randomly
    Fwd(LEFT);
    Wait(SPIN_MIN + Random(SPIN_RANDOM));

    // resume
    Fwd(RIGHT);
  }
}`;

// Set initial value of code area to NQC code snippet defined above
codeArea.value = exampleCode;

// Disable the Download buttons initially
disableDownloadBtn();

// Initial update of line numbers
updateLineNumbers();

function disableCompileBtn() {
  compileBtn.disabled = true; // Disable compile button
  compileBtn.style.color = 'gray'; // Change text color to indicate compilation is not possible at the moment
}

function disableSerialConnectBtn() {
  serialConnectBtn.disabled = true; // Disable serial connection button
  serialConnectBtn.style.color = 'gray'; // Change text color to indicate connected state or missing functionality support
}

function enableSerialConnectBtn() {
  serialConnectBtn.disabled = false; // Enable serial connection button
  serialConnectBtn.style.color = ''; // Reset text color
}

clearLogBtn.addEventListener('click', () => {
  logArea.value = ''; // Clear log
});

// Function to enable the download button
function enableDownloadBtn() {
  downloadBtn.disabled = false;
  downloadBtn.style.color = ''; // Reset text color
}

// Function to disable the download button
function disableDownloadBtn() {
  downloadBtn.disabled = true;
  downloadBtn.style.color = 'gray'; // Set text color to gray
}

/**
 * @name clickSerialConnect
 * Click handler for the connect/disconnect button.
 */
async function clickSerialConnect() {
  let success = true;

  if (!serialConnected) {
    success = await serialConnect();

    if(success) {
      enableDownloadBtn();
      serialConnectBtn.innerHTML = '🔗 Serial Disconnect';
      serialConnected = true;
    }
  } else {
    success = await serialDisconnect();

    if(success) {
      disableDownloadBtn();
      serialConnectBtn.innerHTML = '🔗 Serial Connect';
      serialConnected = false;
    }
  }
}

/*
// Handler for click on firmware download button
async function clickFwDownload() {
    // Open a dialog first to let the user confirm the download before starting it
    const confirmedFwDownload = window.confirm("Firmware download is quite slow and will take several minutes. " +
        "Firmware download may fail. It may render your RCX (temporarily) unusable." +
        "\n\nI know what I am doing and want to continue.");

    if(confirmedFwDownload) {
        console.log("Firmware download request confirmed.");
        showInfoMsg("Firmware download request confirmed.");

        const success = await downloadFirmware();
        if(success) {
            showInfoMsg("✅ Firmware download complete. 🎉");
        }
        else {
            showErrorMsg("Failed to download firmware. Make sure the RCX is switched on " +
                "and in line of sight of the IR tower. Please retry!");
        }
        showInfoMsg("Please disconnect and re-connect!");
    }
    else {
        console.log("Firmware download request aborted.");
        showInfoMsg("Firmware download request aborted.");
    }
}
*/

// Handler for click on program download button
async function clickProgramDownload() {
    if(rcxBinary === null) {
        showErrorMsg("No program to download. Need to build the NQC code first!");
    }
    else {
        showInfoMsg("Program download requested.");

        // show an info message if the code has been touched after last build in the meantime
        if(codeModified) {
          showInfoMsg("❗ Code has been modified after last build. Consider re-building the current version of the code!");
        }

        const programNumber = 0; // TODO: make program slot selectable
        let success = await downloadProgram(programNumber, rcxBinary);
        if(success) {
            showInfoMsg("️✅ Download of program succeeded! 🎉 " +
                "Press the green 'Run' button 🟢▶️ on the RCX to start execution of the program!");

            success = await playSystemSound(SystemSound.FastSweepUp);

            if(success) {
                showInfoMsg("🎵 Played system sound.");
            }
            else {
                showErrorMsg("Unable to play system sound.");
            }
        }
        else {
            showErrorMsg("Download of program may have failed.");
        }
    }
}
