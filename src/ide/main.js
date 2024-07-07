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
//const usbConnectBtn = document.getElementById('usbConnectBtn');
const serialConnectBtn = document.getElementById('serialConnectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadFirmwareBtn = document.getElementById('downloadFirmwareBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const codeArea = document.getElementById('codeArea');
const logArea = document.getElementById('logArea');
const lineNumbers = document.querySelector('.line-numbers');

let usbConnected = false;
let codeModified = true; // code modified after build?

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

/*
  const webUsbNotSupported = document.getElementById('webusb-not-supported');
  if(!('usb' in navigator)) {
    // show hidden error banner, deactivate connect button and log to console
    webUsbNotSupported.style.display = "block";
    console.log("WebUSB not supported.");
    disableUsbConnectBtn();
  }
*/

  const wasmNotSupported = document.getElementById('wasm-not-supported');
  if(!wasmSupported) {
    // show hidden error banner, deactivate connect button and log to console
    wasmNotSupported.style.display = "block";
    console.log("WebAssembly (WASM) not supported.");
    disableCompileBtn();
  }
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
disableDownloadFirmwareBtn();

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

function disableUsbConnectBtn() {
  //usbConnectBtn.disabled = true; // Disable serial connection button
  //usbConnectBtn.style.color = 'gray'; // Change text color to indicate connected state or missing functionality support
}

function enableUsbConnectBtn() {
  //usbConnectBtn.disabled = false; // Enable serial connection button
  //usbConnectBtn.style.color = ''; // Reset text color
}

/*
// future use
usbConnectBtn.addEventListener('click', () => {
  if (!usbConnected) {
    usbConnected = true;
    usbConnectBtn.innerHTML = '🔗 USB Disconnect';
    disableSerialConnectBtn();
    enableDownloadBtn();
    enableDownloadFirmwareBtn();
  } else {
    usbConnected = false;
    usbConnectBtn.innerHTML = '🔗 USB Connect';
    enableSerialConnectBtn();
    disableDownloadBtn();
    disableDownloadFirmwareBtn();
  }
});
*/

serialConnectBtn.addEventListener('click', () => {
  if (!serialConnected) {
    disableUsbConnectBtn();
    enableDownloadBtn();
    enableDownloadFirmwareBtn();
  } else {
    enableUsbConnectBtn();
    disableDownloadBtn();
    disableDownloadFirmwareBtn();
  }
});

clearLogBtn.addEventListener('click', () => {
  logArea.value = ''; // Clear log
});

// Function to enable the download button
function enableDownloadBtn() {
  downloadBtn.disabled = false;
  downloadBtn.style.color = ''; // Reset text color
}

// Function to enable the firmware download button
function enableDownloadFirmwareBtn() {
  downloadFirmwareBtn.disabled = false;
  downloadFirmwareBtn.style.color = ''; // Reset text color
}

// Function to disable the download button
function disableDownloadBtn() {
  downloadBtn.disabled = true;
  downloadBtn.style.color = 'gray'; // Set text color to gray
}

// Function to disable the download firmware button
function disableDownloadFirmwareBtn() {
  downloadFirmwareBtn.disabled = true;
  downloadFirmwareBtn.style.color = 'gray'; // Set text color to gray
}
