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
const usbConnectBtn = document.getElementById('usbConnectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const codeArea = document.getElementById('codeArea');
const logArea = document.getElementById('logArea');
const lineNumbers = document.querySelector('.line-numbers');
const programNumberSelection = document.getElementById('programNumber');

let codeModified = true; // code modified after build?
let serialConnected = false;
let usbConnected = false;

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
    console.log("Web Serial não suportado.");
    disableSerialConnectBtn();
  }

  const webUsbNotSupported = document.getElementById('webusb-not-supported');
  if(!('usb' in navigator)) {
    // show hidden error banner, deactivate connect button and log to console
    webUsbNotSupported.style.display = "block";
    console.log("WebUSB não suportado.");
    disableUsbConnectBtn();
  }

  const wasmNotSupported = document.getElementById('wasm-not-supported');
  if(!wasmSupported) {
    // show hidden error banner, deactivate connect button and log to console
    wasmNotSupported.style.display = "block";
    console.log("WebAssembly (WASM) não suportado.");
    disableCompileBtn();
  }

  serialConnectBtn.addEventListener('click', clickSerialConnect);
  usbConnectBtn.addEventListener('click', clickUsbConnect);
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

function disableUsbConnectBtn() {
  usbConnectBtn.disabled = true; // Disable USB connection button
  usbConnectBtn.style.color = 'gray'; // Change text color to indicate missing functionality support
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
      success = await ping();

      if(!success) {
        showErrorMsg("Não foi possível se comunicar com o bloco RCX.\n" +
               "O bloco RCX precisa estar ligado e perto da torre infravermelho, também como no campo de visão da torre.\n" +
               "Por favor, tente novamente.");
      } else {
        showInfoMsg("🔗 Comunicação funcionando, O bloco RCX está respondendo!");

        fwVersion = await checkFirmware();

        if(fwVersion == null) {
            showErrorMsg("Não foi possível determinar a versão do firmware.");
        } else {
          if(fwVersion == '0.0') {
            showErrorMsg("Versão do firmware '0.0' indica que atualmente nenhum firmware está carregado na memória RAM. " +
              "O download de programas para o bloco RCX não é possível.");
          } else {
            await checkBatteryLevel();

            enableDownloadBtn();
            serialConnectBtn.innerHTML = '🔗 Desconetar torre serial';
            serialConnected = true;
          }
        }
      }
    }
  } else {
    success = await serialDisconnect();

    if(success) {
      disableDownloadBtn();
      serialConnectBtn.innerHTML = '🔗 Conectar torre serial';
      serialConnected = false;
    }
  }
}

/**
 * @name clickUsbConnect
 * Click handler for the USB connect/disconnect button.
 */
async function clickUsbConnect() {
  let success = true;

  if (!usbConnected) {
    if(serialConnected) {
      showErrorMsg("Já conectado pela torre serial. Por favor, desconecte primeiro.");
      return;
    }

    success = await usbConnect();

    if(success) {
      success = await ping();

      if(!success) {
        showErrorMsg("Não foi possível se comunicar com o bloco RCX.\n" +
               "O bloco RCX precisa estar ligado e perto da torre infravermelho, também como no campo de visão da torre.\n" +
               "Por favor, tente novamente.");
      } else {
        showInfoMsg("🔗 Comunicação funcionando, O bloco RCX está respondendo!");

        fwVersion = await checkFirmware();

        if(fwVersion == null) {
            showErrorMsg("Não foi possível determinar a versão do firmware.");
        } else {
          if(fwVersion == '0.0') {
            showErrorMsg("Versão do firmware '0.0' indica que atualmente nenhum firmware está carregado na memória RAM. " +
              "O download de programas para o bloco RCX não é possível.");
          } else {
            await checkBatteryLevel();

            enableDownloadBtn();
            usbConnectBtn.innerHTML = '🔗 Desconectar torre USB';
            usbConnected = true;
            disableSerialConnectBtn(); // only one IR tower at a time
          }
        }
      }

      if(!usbConnected) {
        // give the tower back, so that the next attempt starts from scratch
        await usbDisconnect(true);
      }
    }
  } else {
    success = await usbDisconnect();

    if(success) {
      disableDownloadBtn();
      usbConnectBtn.innerHTML = '🔗 Conectar torre USB';
      usbConnected = false;
      if('serial' in navigator) {
        enableSerialConnectBtn();
      }
    }
  }
}

// Handler for click on program download button
async function clickProgramDownload() {
    // build first when there's no binary yet or when the code has been modified after the last build
    if((rcxBinary === null) || codeModified) {
        showInfoMsg("🧱 Construindo a versão atual do código antes do download...");
        await clickConvert();
    }

    if((rcxBinary === null) || codeModified) {
        showErrorMsg("Nenhum programa para ser baixado. A construção do código NQC falhou!");
    }
    else {
        showInfoMsg("Solicitação para baixar o programa recebida..");

        const programNumber= programNumberSelection.value;
        let success = await downloadProgram(programNumber, rcxBinary);
        if(success) {
            showInfoMsg("️✅ Programa baixado com sucesso! 🎉 " +
                "Precione o botão verde 'Run' 🟢▶️ no RCX para inicar a execução do programa!");

/*
            success = await playSystemSound(SystemSound.FastSweepUp);

            if(success) {
                showInfoMsg("🎵 Tocado som do sistema.");
            }
            else {
                showErrorMsg("Não foi possível tocar o som do sistema.");
            }
*/
        }
        else {
            showErrorMsg("O download do programa pode ter falhado.");
        }
    }
}
