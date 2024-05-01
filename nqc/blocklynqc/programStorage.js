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

// This JavaScript code is used for saving/loading programs (storage).

// Save program upon request (currently only to the web browser's "local storage").
const saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', () => {
  if(workspace) {
    // Serialize the state.
    const state = Blockly.serialization.workspaces.save(workspace);

    // Then you save the state, e.g. to local storage.
    localStorage.setItem('workspace-state', JSON.stringify(state));
  }
});

// Load program upon request (currently only from the web browser's "local storage")
const loadBtn = document.getElementById('loadBtn');
loadBtn.addEventListener('click', () => {
  if(workspace) {
    // Get your saved state from somewhere, e.g. local storage.
    const state = JSON.parse(localStorage.getItem('workspace-state'));

    // Deserialize the state.
    Blockly.serialization.workspaces.load(state, workspace);
  }
});
