# COLR Identifier 🎨

**A professional desktop color picker application built with Electron**

COLR Identifier is a modern, feature-rich color picker tool designed for designers, developers, and digital artists. Pick colors from anywhere on your screen with real-time cursor tracking, work with multiple color spaces, and manage your color workflow efficiently.

![COLR Identifier Interface](https://img.shields.io/badge/COLR%20Identifier-Interface%20Preview-brightgreen?style=for-the-badge&logo=electron&logoColor=white)

## ✨ Features

### 🎯 **Advanced Color Picking**
- **Real-time cursor tracking** - See colors update as you move your mouse
- **Global hotkeys** - Pick colors with `Ctrl+Shift+C` from anywhere
- **Precise selection** - Click to pick or use `Space` to capture current color
- **Screen capture integration** - Works across all applications and windows

### 🌈 **Multiple Color Formats**
- **HEX** - `#FF5733`
- **RGB** - `rgb(255, 87, 51)`
- **HSV** - `hsv(9, 80%, 100%)`
- **HSL** - `hsl(9, 100%, 60%)`
- **One-click copying** to clipboard for any format

### 🎛️ **Interactive Color Controls**
- **Live sliders** for RGB, HSV, and HSL color spaces
- **Direct input** - Type color values manually
- **Instant preview** with real-time updates
- **Color space switching** on the fly

### 📚 **Color Management**
- **Favorites system** - Save colors for future use (F key)
- **Color history** - Track recently picked colors
- **Persistent storage** - Your favorites are saved between sessions
- **Quick access tabs** - Switch between picker, favorites, and history

### 🖥️ **Professional Interface**
- **TUI24-inspired design** - Terminal-like aesthetic with modern functionality
- **Always-on-top mode** during color picking
- **Responsive layout** - Works on different screen sizes
- **Dark theme** - Easy on the eyes during long work sessions

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SFRoze/COLR_IDENTIFIER.git
   cd COLR_IDENTIFIER
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Launch the application**
   ```bash
   npm start
   ```

## 📖 Usage Guide

### Basic Color Selection
1. **Manual adjustment**: Use the RGB/HSV/HSL sliders to fine-tune colors
2. **Direct input**: Type color values in the input field (supports HEX, RGB formats)
3. **Format switching**: Use the dropdown to change between color formats

### Screen Color Picking
1. **Start picking**: Click `[START PICKING]` or press `Ctrl+Shift+C`
2. **Live preview**: Move your cursor to see colors update in real-time
3. **Capture color**: Press `Space` or click to pick the current color
4. **Exit mode**: Press `Escape` or `Ctrl+Shift+C` to stop picking

### Managing Colors
- **Save favorites**: Press `F` or click `[SAVE FAV]` to add current color to favorites
- **Access history**: Switch to the `[HIST]` tab to see recently picked colors
- **Copy colors**: Press `C` or click `[COPY]` to copy current color value
- **Load colors**: Click any color in favorites or history to load it

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Toggle color picking mode |
| `Space` | Pick color at cursor (during picking mode) |
| `Escape` | Exit color picking mode |
| `F` | Save current color to favorites |
| `C` | Copy current color value |
| `Enter` | Apply manual color input |

## 🔧 Development

### Project Structure
```
COLR_IDENTIFIER/
├── main.js           # Electron main process
├── renderer.js       # Frontend logic and UI interactions
├── index.html        # Application layout
├── styles.css        # TUI24-inspired styling
├── package.json      # Project configuration
└── assets/           # Icons and resources
```

### Building for Distribution

**Windows:**
```bash
npm run build-win
```

**All platforms:**
```bash
npm run build
```

Built applications will be in the `dist/` directory.

## 🛠️ Technical Details

- **Framework**: Electron 27.x for cross-platform desktop apps
- **Renderer**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS with terminal-inspired design
- **Screen capture**: Electron's `desktopCapturer` API
- **Color conversion**: Custom algorithms for RGB↔HSV↔HSL
- **Persistence**: localStorage for favorites and settings
- **Global shortcuts**: Electron's `globalShortcut` module

### Browser Support
As an Electron app, COLR Identifier uses Chromium and doesn't require browser compatibility considerations.

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Verify Node.js installation: `node --version`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for port conflicts or antivirus interference

**Color picking not working**
- Grant screen recording permissions (macOS)
- Disable conflicting screen capture software
- Try running as administrator (Windows)

**Colors appear incorrect**
- Check display color profile settings
- Ensure proper screen scaling (Windows)
- Verify multi-monitor setup configuration

### Platform-Specific Notes

**Windows**: May require administrator privileges for global shortcuts
**macOS**: Requires screen recording permission in System Preferences
**Linux**: Needs X11 display server (Wayland support limited)

## 🚧 Roadmap

### Upcoming Features
- [ ] **Color harmony generator** - Complementary, triadic, analogous color schemes
- [ ] **Palette export** - Save color palettes as ASE, ACO, GPL files
- [ ] **Multi-monitor optimization** - Better handling of different displays
- [ ] **Color blindness simulation** - Preview colors with different types of color blindness
- [ ] **Integration plugins** - Direct export to Photoshop, Figma, VS Code
- [ ] **Advanced picker modes** - Average color from area, gradient sampling
- [ ] **Batch operations** - Process multiple colors simultaneously

### Performance Improvements
- [ ] Optimized screen capture for high-DPI displays
- [ ] Reduced memory usage for long-running sessions
- [ ] Faster color space conversions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Inspired by professional color picker tools
- TUI24 design aesthetic for the terminal-like interface
- Community feedback and feature suggestions

---

<div align="center">

**Made with ❤️ for designers and developers**

[⭐ Star this repo](https://github.com/SFRoze/COLR_IDENTIFIER) • [🐛 Report Bug](https://github.com/SFRoze/COLR_IDENTIFIER/issues) • [✨ Request Feature](https://github.com/SFRoze/COLR_IDENTIFIER/issues)

</div>
