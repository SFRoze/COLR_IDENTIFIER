const { ipcRenderer } = require('electron');

class ColorPicker {
    constructor() {
        this.currentColor = { r: 106, g: 76, b: 147 }; // Default purple color
        this.isColorPickingMode = false;
        this.colorHistory = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
        this.setupIpcListeners();
        this.setupTabs();
        this.renderFavorites();
        this.renderHistory();
    }

    initializeElements() {
        this.colorPreview = document.getElementById('colorPreview');
        this.colorInput = document.getElementById('colorInput');
        this.colorFormat = document.getElementById('colorFormat');
        this.copyBtn = document.getElementById('copyBtn');
        this.startColorPickingBtn = document.getElementById('startColorPicking');
        this.coordinates = document.getElementById('coordinates');
        this.cursorPos = document.getElementById('cursor-pos');
        
        // Color space radio buttons
        this.rgbRadio = document.getElementById('rgb');
        this.hsvRadio = document.getElementById('hsv');
        this.hslRadio = document.getElementById('hsl');
        
        // Sliders
        this.component1 = document.getElementById('component1');
        this.component2 = document.getElementById('component2');
        this.component3 = document.getElementById('component3');
        
        // Slider values
        this.component1Value = document.getElementById('component1Value');
        this.component2Value = document.getElementById('component2Value');
        this.component3Value = document.getElementById('component3Value');
        
        // Color values display
        this.colorValues = document.querySelectorAll('.color-value');
        
        // Palette colors
        this.paletteColors = document.querySelectorAll('.palette-color');
    }

    setupEventListeners() {
        // Color format dropdown
        this.colorFormat.addEventListener('change', () => this.updateColorInput());
        
        // Copy button
        this.copyBtn.addEventListener('click', () => this.copyColorValue());
        
        // Action buttons
        this.startColorPickingBtn.addEventListener('click', () => this.toggleColorPicking());
        
        // Note: saveToFavoritesBtn will be set up in setupTabs() after DOM is ready
        
        // Color space radio buttons
        document.querySelectorAll('input[name="colorSpace"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateColorSpaceUI());
        });
        
        // Color sliders
        this.component1.addEventListener('input', () => this.updateColorFromSliders());
        this.component2.addEventListener('input', () => this.updateColorFromSliders());
        this.component3.addEventListener('input', () => this.updateColorFromSliders());
        
        // Color input field
        this.colorInput.addEventListener('input', () => this.updateColorFromInput());
        this.colorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.updateColorFromInput();
            }
        });
        
        // Palette colors
        this.paletteColors.forEach(palette => {
            palette.addEventListener('click', () => {
                const color = palette.getAttribute('data-color');
                if (color && color !== '#000000') {
                    this.setColorFromHex(color);
                }
            });
        });
        
        // Color values (click to copy)
        this.colorValues.forEach(colorValue => {
            colorValue.addEventListener('click', () => {
                navigator.clipboard.writeText(colorValue.textContent);
                this.showCopyFeedback();
            });
        });
        
        // Window controls (using ipcRenderer instead of remote)
        document.querySelector('.minimize').addEventListener('click', () => {
            // Minimize functionality would need to be handled via IPC
            console.log('Minimize clicked');
        });
        
        document.querySelector('.close').addEventListener('click', () => {
            window.close();
        });

        // Handle clicks during color picking mode
        document.addEventListener('click', (e) => {
            if (this.isColorPickingMode) {
                this.pickColorAtCursor();
                e.preventDefault();
            }
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    setupIpcListeners() {
        console.log('Setting up IPC listeners...');
        
        ipcRenderer.on('start-color-picking', () => {
            console.log('Received start-color-picking event');
            this.startColorPickingMode();
        });
        
        ipcRenderer.on('stop-color-picking', () => {
            console.log('Received stop-color-picking event');
            this.stopColorPickingMode();
        });
        
        // Handle real-time cursor color updates
        ipcRenderer.on('cursor-color-update', (event, data) => {
            if (this.isColorPickingMode && data && data.color) {
                console.log('Updating color from cursor:', data.color);
                this.updateCursorPosition(data.x, data.y);
                this.updateCurrentColorFromPicking(data.color);
            }
        });
        
        // Handle color picked from global shortcut
        ipcRenderer.on('color-picked', (event, data) => {
            if (data && data.color) {
                console.log('Color picked via shortcut:', data.color);
                const { r, g, b } = data.color;
                const hexColor = this.rgbToHex(r, g, b);
                
                // Set the picked color and add to history
                this.setColor(r, g, b);
                this.addToColorHistory(hexColor);
            }
        });
    }

    async toggleColorPicking() {
        try {
            this.isColorPickingMode = await ipcRenderer.invoke('toggle-color-picking');
            this.updateColorPickingUI();
        } catch (error) {
            console.error('Failed to toggle color picking:', error);
        }
    }

    startColorPickingMode() {
        this.isColorPickingMode = true;
        this.updateColorPickingUI();
    }

    stopColorPickingMode() {
        this.isColorPickingMode = false;
        this.updateColorPickingUI();
    }

    updateColorPickingUI() {
        if (this.isColorPickingMode) {
            document.body.classList.add('color-picking-active');
            this.startColorPickingBtn.textContent = 'Stop Color Picking (Ctrl+Shift+C)';
            this.startColorPickingBtn.style.backgroundColor = '#e74c3c';
        } else {
            document.body.classList.remove('color-picking-active');
            this.startColorPickingBtn.textContent = 'Start Color Picking (Ctrl+Shift+C)';
            this.startColorPickingBtn.style.backgroundColor = '#0078d4';
        }
    }

    updateCursorPosition(x, y) {
        this.cursorPos.textContent = `[${x}, ${y}]`;
    }
    
    updateCurrentColorFromPicking(color) {
        if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            // Update the current color without adding to history yet
            this.currentColor = { r: color.r, g: color.g, b: color.b };
            this.updateColorPreview();
            this.updateColorInput();
            this.updateSliders();
            this.updateCoordinates();
        }
    }

    async pickColorAtCursor() {
        try {
            const result = await ipcRenderer.invoke('pick-color-at-cursor');
            if (result && result.color) {
                const { r, g, b } = result.color;
                const hexColor = this.rgbToHex(r, g, b);
                
                // Set the picked color and add to history
                this.setColor(r, g, b);
                this.addToColorHistory(hexColor);
                
                // Stop color picking mode after picking
                if (this.isColorPickingMode) {
                    this.toggleColorPicking();
                }
            }
        } catch (error) {
            console.error('Failed to pick color:', error);
        }
    }

    addToColorHistory(hexColor) {
        if (this.colorHistory.length >= 4) {
            this.colorHistory.shift();
        }
        this.colorHistory.push(hexColor);
        this.updateColorValues();
    }

    setColor(r, g, b) {
        this.currentColor = { r, g, b };
        this.updateUI();
    }

    setColorFromHex(hex) {
        const rgb = this.hexToRgb(hex);
        if (rgb) {
            this.setColor(rgb.r, rgb.g, rgb.b);
        }
    }

    updateUI() {
        this.updateColorPreview();
        this.updateColorInput();
        this.updateSliders();
        this.updateCoordinates();
    }

    updateColorPreview() {
        const hex = this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        this.colorPreview.style.backgroundColor = hex;
    }

    updateColorInput() {
        const format = this.colorFormat.value;
        let value = '';
        
        switch (format) {
            case 'HEX':
                value = this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b);
                break;
            case 'RGB':
                value = `rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
                break;
            case 'HSV':
                const hsv = this.rgbToHsv(this.currentColor.r, this.currentColor.g, this.currentColor.b);
                value = `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`;
                break;
            case 'HSL':
                const hsl = this.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
                value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
                break;
        }
        
        this.colorInput.value = value;
    }

    updateSliders() {
        const colorSpace = document.querySelector('input[name="colorSpace"]:checked').value;
        
        switch (colorSpace) {
            case 'RGB':
                this.component1.value = this.currentColor.r;
                this.component2.value = this.currentColor.g;
                this.component3.value = this.currentColor.b;
                this.component1Value.textContent = this.currentColor.r;
                this.component2Value.textContent = this.currentColor.g;
                this.component3Value.textContent = this.currentColor.b;
                break;
            case 'HSV':
                const hsv = this.rgbToHsv(this.currentColor.r, this.currentColor.g, this.currentColor.b);
                this.component1.value = Math.round(hsv.h);
                this.component2.value = Math.round(hsv.s);
                this.component3.value = Math.round(hsv.v);
                this.component1Value.textContent = Math.round(hsv.h);
                this.component2Value.textContent = Math.round(hsv.s);
                this.component3Value.textContent = Math.round(hsv.v);
                break;
            case 'HSL':
                const hsl = this.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
                this.component1.value = Math.round(hsl.h);
                this.component2.value = Math.round(hsl.s);
                this.component3.value = Math.round(hsl.l);
                this.component1Value.textContent = Math.round(hsl.h);
                this.component2Value.textContent = Math.round(hsl.s);
                this.component3Value.textContent = Math.round(hsl.l);
                break;
        }
    }

    updateColorSpaceUI() {
        const colorSpace = document.querySelector('input[name="colorSpace"]:checked').value;
        const labels = document.querySelectorAll('.slider-group label');
        
        switch (colorSpace) {
            case 'RGB':
                labels[0].textContent = 'R: ';
                labels[1].textContent = 'G: ';
                labels[2].textContent = 'B: ';
                this.component1.max = 255;
                this.component2.max = 255;
                this.component3.max = 255;
                break;
            case 'HSV':
                labels[0].textContent = 'H: ';
                labels[1].textContent = 'S: ';
                labels[2].textContent = 'V: ';
                this.component1.max = 360;
                this.component2.max = 100;
                this.component3.max = 100;
                break;
            case 'HSL':
                labels[0].textContent = 'H: ';
                labels[1].textContent = 'S: ';
                labels[2].textContent = 'L: ';
                this.component1.max = 360;
                this.component2.max = 100;
                this.component3.max = 100;
                break;
        }
        
        this.updateSliders();
    }

    updateColorFromSliders() {
        const colorSpace = document.querySelector('input[name="colorSpace"]:checked').value;
        const val1 = parseInt(this.component1.value);
        const val2 = parseInt(this.component2.value);
        const val3 = parseInt(this.component3.value);
        
        switch (colorSpace) {
            case 'RGB':
                this.setColor(val1, val2, val3);
                break;
            case 'HSV':
                const rgb = this.hsvToRgb(val1, val2, val3);
                this.setColor(rgb.r, rgb.g, rgb.b);
                break;
            case 'HSL':
                const rgbFromHsl = this.hslToRgb(val1, val2, val3);
                this.setColor(rgbFromHsl.r, rgbFromHsl.g, rgbFromHsl.b);
                break;
        }
    }

    updateColorFromInput() {
        const input = this.colorInput.value.trim();
        
        if (input.startsWith('#')) {
            this.setColorFromHex(input);
        } else if (input.startsWith('rgb(')) {
            const match = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                this.setColor(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
            }
        }
    }

    updateCoordinates() {
        const hex = this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        this.coordinates.textContent = hex.substring(1).toUpperCase();
    }

    updateColorValues() {
        this.colorValues.forEach((element, index) => {
            if (this.colorHistory[index]) {
                element.textContent = this.colorHistory[index].substring(1).toUpperCase();
                element.style.visibility = 'visible';
            } else {
                element.style.visibility = 'hidden';
            }
        });
    }

    copyColorValue() {
        const value = this.colorInput.value;
        navigator.clipboard.writeText(value).then(() => {
            this.showCopyFeedback();
        });
    }

    showCopyFeedback() {
        const originalText = this.copyBtn.textContent;
        this.copyBtn.textContent = 'Copied!';
        this.copyBtn.style.backgroundColor = '#27ae60';
        
        setTimeout(() => {
            this.copyBtn.textContent = originalText;
            this.copyBtn.style.backgroundColor = '#0078d4';
        }, 1000);
    }

    // Color conversion utility functions
    rgbToHex(r, g, b) {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const diff = max - min;
        const v = max * 100;
        const s = max === 0 ? 0 : (diff / max) * 100;
        
        let h;
        if (diff === 0) h = 0;
        else if (max === r) h = ((g - b) / diff) % 6;
        else if (max === g) h = (b - r) / diff + 2;
        else h = (r - g) / diff + 4;
        
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        
        return { h, s, v };
    }

    hsvToRgb(h, s, v) {
        h /= 60; s /= 100; v /= 100;
        const c = v * s;
        const x = c * (1 - Math.abs((h % 2) - 1));
        const m = v - c;
        
        let r, g, b;
        if (h >= 0 && h < 1) [r, g, b] = [c, x, 0];
        else if (h >= 1 && h < 2) [r, g, b] = [x, c, 0];
        else if (h >= 2 && h < 3) [r, g, b] = [0, c, x];
        else if (h >= 3 && h < 4) [r, g, b] = [0, x, c];
        else if (h >= 4 && h < 5) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const diff = max - min;
        const l = (max + min) / 2;
        
        if (diff === 0) return { h: 0, s: 0, l: l * 100 };
        
        const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
        
        let h;
        if (max === r) h = ((g - b) / diff) % 6;
        else if (max === g) h = (b - r) / diff + 2;
        else h = (r - g) / diff + 4;
        
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        
        return { h, s: s * 100, l: l * 100 };
    }

    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (h >= 0 && h < 1/6) [r, g, b] = [c, x, 0];
        else if (h >= 1/6 && h < 2/6) [r, g, b] = [x, c, 0];
        else if (h >= 2/6 && h < 3/6) [r, g, b] = [0, c, x];
        else if (h >= 3/6 && h < 4/6) [r, g, b] = [0, x, c];
        else if (h >= 4/6 && h < 5/6) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // TUI24 Tab Management
    setupTabs() {
        console.log('Setting up tabs...');
        this.navItems = document.querySelectorAll('.tui-nav-item');
        this.tabs = document.querySelectorAll('.tui-tab');
        this.favoritesList = document.getElementById('favoritesList');
        this.historyList = document.getElementById('historyList');
        this.saveToFavoritesBtn = document.getElementById('saveToFavorites');
        
        console.log('Found elements:', {
            navItems: this.navItems.length,
            tabs: this.tabs.length,
            favoritesList: !!this.favoritesList,
            historyList: !!this.historyList,
            saveToFavoritesBtn: !!this.saveToFavoritesBtn
        });
        
        this.favorites = JSON.parse(localStorage.getItem('colr_favorites') || '[]');
        
        // Set up favorites button
        if (this.saveToFavoritesBtn) {
            this.saveToFavoritesBtn.addEventListener('click', () => {
                console.log('Save to favorites clicked');
                this.saveCurrentColorToFavorites();
            });
        }
        
        // Tab navigation
        this.navItems.forEach(navItem => {
            navItem.addEventListener('click', () => {
                const targetTab = navItem.getAttribute('data-tab');
                console.log('Tab clicked:', targetTab);
                this.switchTab(targetTab);
            });
        });
    }
    
    switchTab(tabName) {
        // Update navigation
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            }
        });
        
        // Update tabs
        this.tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === `tab-${tabName}`) {
                tab.classList.add('active');
            }
        });
    }
    
    // Favorites Management
    saveCurrentColorToFavorites() {
        const hex = this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        const rgb = `${this.currentColor.r},${this.currentColor.g},${this.currentColor.b}`;
        
        const colorData = {
            id: Date.now(),
            hex: hex,
            rgb: rgb,
            r: this.currentColor.r,
            g: this.currentColor.g,
            b: this.currentColor.b,
            timestamp: new Date().toISOString()
        };
        
        // Check if color already exists
        if (!this.favorites.find(fav => fav.hex === hex)) {
            this.favorites.unshift(colorData); // Add to beginning
            
            // Keep only 20 most recent favorites
            if (this.favorites.length > 20) {
                this.favorites = this.favorites.slice(0, 20);
            }
            
            localStorage.setItem('colr_favorites', JSON.stringify(this.favorites));
            this.renderFavorites();
            
            // Show feedback
            this.showSaveFeedback();
        }
    }
    
    renderFavorites() {
        if (!this.favoritesList) return;
        
        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = '<div class="tui-empty">No saved colors yet</div>';
            return;
        }
        
        this.favoritesList.innerHTML = this.favorites.map(fav => `
            <div class="tui-color-item" data-color="${fav.hex}">
                <div class="tui-color-sample-small" style="background-color: ${fav.hex};"></div>
                <div class="tui-color-info">
                    <span class="tui-color-hex">${fav.hex.toUpperCase()}</span>
                    <span class="tui-color-rgb">RGB(${fav.rgb})</span>
                </div>
                <button class="tui-color-delete" data-id="${fav.id}">[X]</button>
            </div>
        `).join('');
        
        // Add event listeners
        this.favoritesList.querySelectorAll('.tui-color-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tui-color-delete')) {
                    const hex = item.getAttribute('data-color');
                    this.setColorFromHex(hex);
                    this.switchTab('picker');
                }
            });
        });
        
        this.favoritesList.querySelectorAll('.tui-color-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                this.removeFavorite(id);
            });
        });
    }
    
    removeFavorite(id) {
        this.favorites = this.favorites.filter(fav => fav.id !== id);
        localStorage.setItem('colr_favorites', JSON.stringify(this.favorites));
        this.renderFavorites();
    }
    
    renderHistory() {
        if (!this.historyList) return;
        
        if (this.colorHistory.length === 0) {
            this.historyList.innerHTML = '<div class="tui-empty">No color history yet</div>';
            return;
        }
        
        this.historyList.innerHTML = this.colorHistory.map((hex, index) => {
            const rgb = this.hexToRgb(hex);
            return `
                <div class="tui-color-item" data-color="${hex}">
                    <div class="tui-color-sample-small" style="background-color: ${hex};"></div>
                    <div class="tui-color-info">
                        <span class="tui-color-hex">${hex.toUpperCase()}</span>
                        <span class="tui-color-rgb">RGB(${rgb.r},${rgb.g},${rgb.b})</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        this.historyList.querySelectorAll('.tui-color-item').forEach(item => {
            item.addEventListener('click', () => {
                const hex = item.getAttribute('data-color');
                this.setColorFromHex(hex);
                this.switchTab('picker');
            });
        });
    }
    
    showSaveFeedback() {
        const originalText = this.saveToFavoritesBtn.innerHTML;
        this.saveToFavoritesBtn.innerHTML = '<span class="tui-bracket">[</span>SAVED!<span class="tui-bracket">]</span>';
        this.saveToFavoritesBtn.style.color = '#fff';
        
        setTimeout(() => {
            this.saveToFavoritesBtn.innerHTML = originalText;
            this.saveToFavoritesBtn.style.color = '#00ff00';
        }, 1000);
    }
    
    // Override updateColorPickingUI for TUI24 style
    updateColorPickingUI() {
        if (this.isColorPickingMode) {
            document.body.classList.add('color-picking-active');
            this.startColorPickingBtn.innerHTML = '<span class="tui-bracket">[</span>STOP PICKING<span class="tui-bracket">]</span> <span class="tui-keybind">(CTRL+SHIFT+C)</span>';
            this.startColorPickingBtn.classList.add('active');
        } else {
            document.body.classList.remove('color-picking-active');
            this.startColorPickingBtn.innerHTML = '<span class="tui-bracket">[</span>START PICKING<span class="tui-bracket">]</span> <span class="tui-keybind">(CTRL+SHIFT+C)</span>';
            this.startColorPickingBtn.classList.remove('active');
        }
    }
    
    // Override addToColorHistory to also update history tab
    addToColorHistory(hexColor) {
        if (this.colorHistory.length >= 10) {
            this.colorHistory.shift();
        }
        this.colorHistory.push(hexColor);
        this.renderHistory();
    }
    
    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Don't interfere with input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case 'escape':
                if (this.isColorPickingMode) {
                    this.toggleColorPicking();
                    e.preventDefault();
                }
                break;
                
            case ' ': // Space key
                if (this.isColorPickingMode) {
                    this.pickColorAtCursor();
                    e.preventDefault();
                }
                break;
                
            case 'f':
                if (!this.isColorPickingMode) {
                    this.saveCurrentColorToFavorites();
                    e.preventDefault();
                }
                break;
                
            case 'c':
                if (!e.ctrlKey && !e.shiftKey && !this.isColorPickingMode) {
                    this.copyColorValue();
                    e.preventDefault();
                }
                break;
        }
    }

    // Override updateColorSpaceUI for TUI24 sliders
    updateColorSpaceUI() {
        const colorSpace = document.querySelector('input[name="colorSpace"]:checked').value;
        const labels = document.querySelectorAll('.tui-slider-label');
        
        switch (colorSpace) {
            case 'RGB':
                if (labels[0]) labels[0].textContent = 'R:';
                if (labels[1]) labels[1].textContent = 'G:';
                if (labels[2]) labels[2].textContent = 'B:';
                this.component1.max = 255;
                this.component2.max = 255;
                this.component3.max = 255;
                break;
            case 'HSV':
                if (labels[0]) labels[0].textContent = 'H:';
                if (labels[1]) labels[1].textContent = 'S:';
                if (labels[2]) labels[2].textContent = 'V:';
                this.component1.max = 360;
                this.component2.max = 100;
                this.component3.max = 100;
                break;
            case 'HSL':
                if (labels[0]) labels[0].textContent = 'H:';
                if (labels[1]) labels[1].textContent = 'S:';
                if (labels[2]) labels[2].textContent = 'L:';
                this.component1.max = 360;
                this.component2.max = 100;
                this.component3.max = 100;
                break;
        }
        
        this.updateSliders();
    }
}

// Initialize the color picker when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorPicker();
});
