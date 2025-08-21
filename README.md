# Three.js Audio Visualizer with Microphone Input

A 3D audio visualizer created with Three.js that responds to microphone input in real-time, creating a dynamic and visually appealing experience based on your voice, music, or any ambient sound.

## Features

- Real-time audio visualization using microphone input
- 3D mesh animation reacting to audio frequencies
- Integrated logo display that blends with the visualization
- Customizable colors via GUI controls
- Bloom effect with adjustable parameters
- Audio sensitivity controls
- Interactive camera movement based on mouse position
- Fullscreen mode for immersive experience
- Hideable interface elements for distraction-free viewing
- Keyboard shortcuts for quick control

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- A browser that supports the Web Audio API and MediaStream API
- A microphone connected to your device
- Your logo file named `s_logo.webp` placed in the project root directory

### Installation

1. Clone this repository or download the source code
2. **Place your `s_logo.webp` file in the project root directory**
3. Install dependencies:

```bash
npm install
```

or

```bash
yarn
```

### Running the Application

Start the development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

Then open your browser to the URL displayed in the terminal (usually http://localhost:5173).

## How to Use

1. Click the "Start Microphone" button to activate your microphone
2. Allow microphone access when prompted by your browser
3. Speak, sing, or play music near your microphone to see the visualization react
4. Move your mouse around to control the camera angle
5. Use the GUI controls to adjust colors, bloom effect, and microphone sensitivity
6. Click the "Enter Fullscreen" button for an immersive experience
7. Click "Hide Toolbar" or press the "T" key to hide the bottom toolbar
8. Move your mouse to the bottom of the screen to temporarily reveal the hidden toolbar
9. Press ESC or click "Exit Fullscreen" to return to normal view
10. Click the microphone button again to stop microphone capture

## Keyboard Shortcuts

- **T**: Toggle toolbar visibility
- **F**: Toggle fullscreen mode
- **ESC**: Exit fullscreen mode (browser default)

## Customization

The GUI in the top-right corner allows you to customize:

- **Colors**: Adjust the red, green, and blue values of the visualizer
- **Bloom Effect**: Modify threshold, strength, and radius of the glow effect
- **Audio**: Adjust microphone sensitivity to fine-tune the visualization response
- **Logo**: Control logo opacity and size
- **Interface**: Toggle toolbar visibility

Note: In fullscreen mode, the GUI controls are hidden to provide a cleaner view. Exit fullscreen to access them again.

## Logo Integration

The visualizer features an integrated logo display that:
- Blends seamlessly with the main visualization
- Responds to audio input with subtle animations
- Matches the color scheme of the main visualization
- Scales and rotates subtly based on audio frequency
- Can be customized for opacity and size
- Uses additive blending for a glowing effect

**Important**: Make sure to place your `s_logo.webp` file in the project root directory. The logo should have a transparent background for best results.

## Smart Interface

- The toolbar automatically hides when in fullscreen mode if it was set to hidden
- Move your mouse to the bottom of the screen to temporarily reveal the toolbar
- The toolbar will automatically hide again after 3 seconds of inactivity
- Use the "Show Toolbar" option in the GUI controls to keep it permanently visible

## Technologies Used

- Three.js
- WebGL Shaders (GLSL)
- Web Audio API
- MediaStream API for microphone capture
- lil-gui for controls
- Fullscreen API
- Custom shader materials for logo integration

## Browser Compatibility

This project works best in modern browsers that support the Web Audio API and MediaStream API:
- Chrome
- Firefox
- Edge
- Safari (14 or newer)

Note: When using the app for the first time, you'll need to grant microphone permissions.

## Credits

This project was inspired by [Wael Yasmina's tutorial](https://waelyasmina.net/articles/how-to-create-a-3d-audio-visualizer-using-three-js), but enhanced with real-time microphone input capabilities, fullscreen mode, smart interface features, and integrated logo visualization. 