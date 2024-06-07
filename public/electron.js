const { app, BrowserWindow, globalShortcut } = require('electron'); // import electron modules
const path = require('path'); // import path module
const remoteMain = require('@electron/remote/main'); // import remote module

remoteMain.initialize(); // initialize remote module

let mainWindow; // declare mainWindow variable
// test push
// function to create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 860, // set initial width
    height: 200, // set initial height
    minWidth: 860, // set minimum width
    minHeight: 592, // set minimum height
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload script
      nodeIntegration: true, // enable node integration
      contextIsolation: true, // enable context isolation
      enableRemoteModule: true, // enable remote module
    },
    frame: true, // ensure the window has standard frame with controls
  });

  remoteMain.enable(mainWindow.webContents); // enable remote module for this window

  mainWindow.loadURL('http://localhost:3000'); // load the app

  // handle window entering fullscreen
  mainWindow.on('enter-full-screen', () => {
    mainWindow.setResizable(true); // make window resizable
  });

  // handle window leaving fullscreen
  mainWindow.on('leave-full-screen', () => {
    mainWindow.setResizable(false); // make window non-resizable
    mainWindow.setSize(860, 200); // reset window size
  });

  // register a global shortcut for exiting fullscreen
  globalShortcut.register('Esc', () => {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false); // exit fullscreen
    }
  });

  // handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null; // dereference the window object
  });
}

// create window when app is ready
app.whenReady().then(() => {
  createWindow();

  // handle app activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(); // create window if none are open
    }
  });
});

// handle all windows closed event
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit(); // quit the app if not on macOS
  }
});

// handle app will quit event
app.on('will-quit', () => {
  globalShortcut.unregisterAll(); // unregister all shortcuts
});
