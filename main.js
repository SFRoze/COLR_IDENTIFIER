const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, screen, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let isColorPickingMode = false;
let colorPickingInterval = null;
let screenCapture = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 520,
    minWidth: 350,
    minHeight: 400,
    resizable: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    autoHideMenuBar: true
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register global hotkeys
  globalShortcut.register('CmdOrCtrl+Shift+C', () => {
    toggleColorPicking();
  });
  
  // Register additional shortcuts for color picking mode
  globalShortcut.register('Space', () => {
    if (isColorPickingMode) {
      // Pick color at cursor and stop picking
      pickColorAndStop();
    }
  });
  
  globalShortcut.register('Escape', () => {
    if (isColorPickingMode) {
      toggleColorPicking();
    }
  });
}

async function toggleColorPicking() {
  isColorPickingMode = !isColorPickingMode;
  
  if (isColorPickingMode) {
    // Start color picking mode
    await startScreenCapture();
    mainWindow.webContents.send('start-color-picking');
    
    // Make window stay on top
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    
    // Start real-time color tracking
    startColorTracking();
  } else {
    // Stop color picking mode
    stopColorTracking();
    mainWindow.webContents.send('stop-color-picking');
    
    // Restore normal window behavior
    mainWindow.setAlwaysOnTop(false);
    screenCapture = null;
  }
}

async function startScreenCapture() {
  try {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    
    console.log('Capturing screen:', width, 'x', height);
    
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'],
      thumbnailSize: { width: Math.min(width, 1920), height: Math.min(height, 1080) }
    });
    
    if (sources.length > 0) {
      screenCapture = sources[0].thumbnail;
      const bitmapSize = screenCapture.getBitmap().length;
      console.log('Screen captured successfully. Bitmap size:', bitmapSize, 'bytes');
      return true;
    }
  } catch (error) {
    console.error('Error capturing screen:', error);
  }
  return false;
}

function startColorTracking() {
  console.log('Starting color tracking...');
  colorPickingInterval = setInterval(async () => {
    if (isColorPickingMode && screenCapture && !screenCapture.isEmpty()) {
      try {
        const cursorPos = screen.getCursorScreenPoint();
        const color = getColorAtPosition(cursorPos.x, cursorPos.y);
        if (color && color.r !== undefined) {
          console.log('Sending color update:', { x: cursorPos.x, y: cursorPos.y, color });
          mainWindow.webContents.send('cursor-color-update', {
            x: cursorPos.x,
            y: cursorPos.y,
            color: color
          });
        } else {
          console.log('No color found at position:', cursorPos.x, cursorPos.y);
        }
      } catch (error) {
        console.error('Error in color tracking:', error);
      }
    } else {
      console.log('Color tracking skipped - mode:', isColorPickingMode, 'capture:', !!screenCapture);
    }
  }, 50); // ~20fps for stability
}

function stopColorTracking() {
  if (colorPickingInterval) {
    clearInterval(colorPickingInterval);
    colorPickingInterval = null;
  }
}

function getColorAtPosition(x, y) {
  if (!screenCapture) return null;
  
  try {
    const display = screen.getPrimaryDisplay();
    const screenBounds = display.bounds;
    const thumbnailSize = screenCapture.getSize();
    
    // Calculate scale ratios between screen and thumbnail
    const scaleX = thumbnailSize.width / screenBounds.width;
    const scaleY = thumbnailSize.height / screenBounds.height;
    
    // Scale cursor coordinates to thumbnail coordinates
    const thumbnailX = Math.round(x * scaleX);
    const thumbnailY = Math.round(y * scaleY);
    
    // Ensure coordinates are within thumbnail bounds
    const boundedX = Math.max(0, Math.min(thumbnailX, thumbnailSize.width - 1));
    const boundedY = Math.max(0, Math.min(thumbnailY, thumbnailSize.height - 1));
    
    const bitmap = screenCapture.getBitmap();
    const bytesPerPixel = 4; // BGRA format
    const index = (boundedY * thumbnailSize.width + boundedX) * bytesPerPixel;
    
    if (index >= 0 && index + 3 < bitmap.length) {
      return {
        r: bitmap[index + 2], // Red (BGRA format)
        g: bitmap[index + 1], // Green 
        b: bitmap[index + 0], // Blue
        a: bitmap[index + 3]  // Alpha
      };
    }
  } catch (error) {
    console.error('Error getting color at position:', error, { x, y });
  }
  return null;
}

// Handle color picking at specific position
ipcMain.handle('pick-color-at-cursor', () => {
  if (isColorPickingMode && screenCapture) {
    const cursorPos = screen.getCursorScreenPoint();
    const color = getColorAtPosition(cursorPos.x, cursorPos.y);
    return { position: cursorPos, color: color };
  }
  return null;
});

// Handle color picking toggle
ipcMain.handle('toggle-color-picking', async () => {
  await toggleColorPicking();
  return isColorPickingMode;
});

// Get cursor position
ipcMain.handle('get-cursor-position', () => {
  return screen.getCursorScreenPoint();
});

// Pick color and stop picking mode
async function pickColorAndStop() {
  if (isColorPickingMode && screenCapture) {
    const cursorPos = screen.getCursorScreenPoint();
    const color = getColorAtPosition(cursorPos.x, cursorPos.y);
    if (color && color.r !== undefined) {
      // Send the picked color to the renderer
      mainWindow.webContents.send('color-picked', {
        position: cursorPos,
        color: color
      });
      // Stop color picking mode
      await toggleColorPicking();
    }
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    globalShortcut.unregisterAll();
    app.quit();
  }
});

app.on('will-quit', () => {
  // Clean up
  stopColorTracking();
  globalShortcut.unregisterAll();
});
