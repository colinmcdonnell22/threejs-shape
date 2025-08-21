import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GUI } from 'lil-gui';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(6, 8, 14);
camera.lookAt(scene.position);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Audio setup
let audioContext;
let audioSource;
let analyser;
let micStream;
let isListening = false;

// Fullscreen state
let isFullscreen = false;

// Toolbar visibility state
let isToolbarVisible = true;
let toolbarAutoHideTimeout;

// Logo setup
let logoMesh;
let logoTexture;

// GUI parameters
const params = {
  red: 1.0,
  green: 0.5,
  blue: 1.0,
  threshold: 0.5,
  strength: 0.8,
  radius: 0.8,
  sensitivity: 1.5, // Added sensitivity control
  toolbarVisible: true, // Added toolbar visibility control
  logoOpacity: 0.7, // Logo opacity control
  logoSize: 2.5, // Logo size control
};

// Initialize uniforms for the shader material
const uniforms = {
  u_time: { value: 0.0 },
  u_frequency: { value: 0.0 },
  u_red: { value: params.red },
  u_green: { value: params.green },
  u_blue: { value: params.blue },
};

// Logo uniforms
const logoUniforms = {
  u_time: { value: 0.0 },
  u_frequency: { value: 0.0 },
  u_red: { value: params.red },
  u_green: { value: params.green },
  u_blue: { value: params.blue },
  u_logoTexture: { value: null },
  u_opacity: { value: params.logoOpacity },
};

// Create shader material
const shaderMaterial = new THREE.ShaderMaterial({
  wireframe: true,
  uniforms: uniforms,
  vertexShader: document.getElementById('vertexShader').textContent,
  fragmentShader: document.getElementById('fragmentShader').textContent,
});

// Create sphere geometry using IcosahedronGeometry
const geometry = new THREE.IcosahedronGeometry(4, 30);
const mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

// Load logo texture and create logo mesh
const textureLoader = new THREE.TextureLoader();
textureLoader.load('/s_logo.webp', function(texture) {
  logoTexture = texture;
  logoTexture.flipY = true; // Fix texture orientation
  
  // Create logo geometry (plane)
  const logoGeometry = new THREE.PlaneGeometry(params.logoSize, params.logoSize);
  
  // Create logo material with custom shader
  const logoMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...logoUniforms,
      u_logoTexture: { value: logoTexture }
    },
    vertexShader: document.getElementById('logoVertexShader').textContent,
    fragmentShader: document.getElementById('logoFragmentShader').textContent,
    transparent: true,
    blending: THREE.AdditiveBlending, // Additive blending for better integration
    depthWrite: false,
  });
  
  logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
  logoMesh.position.set(0, 0, 0); // Center position
  scene.add(logoMesh);
  
  console.log('Logo loaded and added to scene');
}, undefined, function(error) {
  console.error('Error loading logo texture:', error);
});



// Post-processing setup
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight)
);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);
bloomComposer.addPass(outputPass);

// GUI setup
const gui = new GUI();
gui.close(); // Start with the GUI closed for cleaner interface

const colorsFolder = gui.addFolder('Colors');
colorsFolder.add(params, 'red', 0, 1, 0.01).onChange(function (value) {
  uniforms.u_red.value = Number(value);
  if (logoMesh) logoMesh.material.uniforms.u_red.value = Number(value);
});
colorsFolder.add(params, 'green', 0, 1, 0.01).onChange(function (value) {
  uniforms.u_green.value = Number(value);
  if (logoMesh) logoMesh.material.uniforms.u_green.value = Number(value);
});
colorsFolder.add(params, 'blue', 0, 1, 0.01).onChange(function (value) {
  uniforms.u_blue.value = Number(value);
  if (logoMesh) logoMesh.material.uniforms.u_blue.value = Number(value);
});

const bloomFolder = gui.addFolder('Bloom');
bloomFolder.add(params, 'threshold', 0, 1, 0.01).onChange(function (value) {
  bloomPass.threshold = Number(value);
});
bloomFolder.add(params, 'strength', 0, 3, 0.01).onChange(function (value) {
  bloomPass.strength = Number(value);
});
bloomFolder.add(params, 'radius', 0, 1, 0.01).onChange(function (value) {
  bloomPass.radius = Number(value);
});

// Audio Controls
const audioFolder = gui.addFolder('Audio');
audioFolder.add(params, 'sensitivity', 0.1, 5, 0.1).name('Mic Sensitivity');

// Logo Controls
const logoFolder = gui.addFolder('Logo');
logoFolder.add(params, 'logoOpacity', 0, 1, 0.01).name('Logo Opacity').onChange(function(value) {
  if (logoMesh) {
    logoMesh.material.uniforms.u_opacity.value = Number(value);
  }
});
logoFolder.add(params, 'logoSize', 0.5, 5, 0.1).name('Logo Size').onChange(function(value) {
  if (logoMesh) {
    logoMesh.scale.setScalar(Number(value) / 2.5); // Use original size as base
  }
});

// Interface Controls
const interfaceFolder = gui.addFolder('Interface');
interfaceFolder.add(params, 'toolbarVisible').name('Show Toolbar').onChange(function(value) {
  toggleToolbarVisibility(value);
});

// Initialize toolbar and shortcut hint
const toolbar = document.querySelector('.audio-controls');
const shortcutHint = document.querySelector('.shortcut-hint');

// Add a hide button to the toolbar
const hideToolbarButton = document.createElement('button');
hideToolbarButton.id = 'hideToolbarButton';
hideToolbarButton.innerHTML = 'Hide Toolbar';
hideToolbarButton.addEventListener('click', function() {
  toggleToolbarVisibility(false);
  params.toolbarVisible = false;
  // Update GUI control to match
  for (let controller of interfaceFolder.controllers) {
    if (controller.property === 'toolbarVisible') {
      controller.updateDisplay();
      break;
    }
  }
});
toolbar.appendChild(hideToolbarButton);

// Mouse tracking for camera movement
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', function (e) {
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  mouseX = (e.clientX - windowHalfX) / 100;
  mouseY = (e.clientY - windowHalfY) / 100;
  
  // Show toolbar on mouse movement near bottom of screen
  const bottomThreshold = window.innerHeight - 100;
  if (e.clientY > bottomThreshold && !isToolbarVisible) {
    showToolbar();
    startToolbarAutoHideTimer();
  }
});

// Function to toggle toolbar visibility
function toggleToolbarVisibility(visible) {
  isToolbarVisible = visible;
  toolbar.style.opacity = visible ? '1' : '0';
  toolbar.style.pointerEvents = visible ? 'auto' : 'none';
  
  // Also toggle the shortcut hint visibility
  if (shortcutHint) {
    shortcutHint.style.opacity = visible ? '0.3' : '0';
  }
  
  // Update button text in the GUI
  if (visible) {
    clearTimeout(toolbarAutoHideTimeout);
  }
}

// Function to show toolbar temporarily
function showToolbar() {
  toolbar.style.opacity = '1';
  toolbar.style.pointerEvents = 'auto';
  
  // Also show the shortcut hint
  if (shortcutHint) {
    shortcutHint.style.opacity = '0.3';
  }
  
  isToolbarVisible = true;
}

// Function to start auto-hide timer for toolbar
function startToolbarAutoHideTimer() {
  clearTimeout(toolbarAutoHideTimeout);
  toolbarAutoHideTimeout = setTimeout(() => {
    if (!params.toolbarVisible) {
      toolbar.style.opacity = '0';
      toolbar.style.pointerEvents = 'none';
      isToolbarVisible = false;
    }
  }, 3000); // Hide after 3 seconds of inactivity
}

// Initialize microphone capture
async function initMicrophone() {
  if (audioContext) {
    // If we already have an AudioContext but we're not listening
    if (!isListening) {
      try {
        await startMicrophone();
      } catch (error) {
        console.error('Error starting microphone:', error);
        showError(error.message);
      }
    }
    return;
  }

  try {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create analyzer
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.connect(audioContext.destination);
    
    await startMicrophone();
    
  } catch (error) {
    console.error('Error initializing audio:', error);
    showError(error.message);
  }
}

// Start microphone capture
async function startMicrophone() {
  try {
    // Get microphone access
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Connect microphone to audio context
    audioSource = audioContext.createMediaStreamSource(micStream);
    audioSource.connect(analyser);
    
    isListening = true;
    updateMicStatus(true);
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
  } catch (error) {
    console.error('Microphone access error:', error);
    isListening = false;
    updateMicStatus(false);
    throw error;
  }
}

// Stop microphone capture
function stopMicrophone() {
  if (micStream) {
    // Stop all microphone tracks
    micStream.getTracks().forEach(track => track.stop());
    
    // Disconnect audio source if it exists
    if (audioSource) {
      audioSource.disconnect();
    }
    
    isListening = false;
    updateMicStatus(false);
  }
}

// Update the status text in the UI
function updateMicStatus(active) {
  const statusElement = document.getElementById('micStatus');
  const toggleButton = document.getElementById('micToggle');
  
  if (statusElement) {
    statusElement.textContent = active ? 'Microphone Active' : 'Microphone Inactive';
    statusElement.className = active ? 'active' : 'inactive';
  }
  
  if (toggleButton) {
    toggleButton.textContent = active ? 'Stop Microphone' : 'Start Microphone';
    if (active) {
      toggleButton.classList.add('active');
    } else {
      toggleButton.classList.remove('active');
    }
  }
}

// Show error message
function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!isFullscreen) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
      document.documentElement.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  }
}

// Update fullscreen button state
function updateFullscreenButton() {
  const fullscreenButton = document.getElementById('fullscreenToggle');
  if (fullscreenButton) {
    fullscreenButton.textContent = isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
  }
  
  // Toggle GUI visibility
  if (isFullscreen) {
    gui.domElement.style.display = 'none';
    
    // Hide toolbar in fullscreen if it's set to hidden
    if (!params.toolbarVisible) {
      toggleToolbarVisibility(false);
    }
  } else {
    gui.domElement.style.display = '';
  }
}

// Event listeners for fullscreen changes
document.addEventListener('fullscreenchange', function() {
  isFullscreen = !!document.fullscreenElement;
  updateFullscreenButton();
});

document.addEventListener('webkitfullscreenchange', function() {
  isFullscreen = !!document.webkitFullscreenElement;
  updateFullscreenButton();
});

document.addEventListener('mozfullscreenchange', function() {
  isFullscreen = !!document.mozFullscreenElement;
  updateFullscreenButton();
});

document.addEventListener('MSFullscreenChange', function() {
  isFullscreen = !!document.msFullscreenElement;
  updateFullscreenButton();
});

// Keyboard event listener for shortcuts
document.addEventListener('keydown', function(e) {
  // 'T' key to toggle toolbar
  if (e.key === 't' || e.key === 'T') {
    params.toolbarVisible = !params.toolbarVisible;
    toggleToolbarVisibility(params.toolbarVisible);
    
    // Update GUI control to match
    for (let controller of interfaceFolder.controllers) {
      if (controller.property === 'toolbarVisible') {
        controller.updateDisplay();
        break;
      }
    }
  }
  
  // 'F' key for fullscreen
  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  }
});

// Event listeners for audio controls
document.getElementById('micToggle').addEventListener('click', async function() {
  if (!isListening) {
    try {
      await initMicrophone();
    } catch (error) {
      // Error is already handled in initMicrophone
    }
  } else {
    stopMicrophone();
  }
});

// Event listener for fullscreen toggle
document.getElementById('fullscreenToggle').addEventListener('click', function() {
  toggleFullscreen();
});

// Animation loop with clock for time tracking
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  // Update uniforms
  uniforms.u_time.value = clock.getElapsedTime();
  
  // Update frequency data if microphone is active
  let frequency = 0;
  if (analyser && isListening) {
    frequency = getAverageFrequency() * params.sensitivity;
    uniforms.u_frequency.value = frequency;
  } else {
    // Provide default animation when microphone is not active
    frequency = Math.sin(clock.getElapsedTime()) * 10 + 10;
    uniforms.u_frequency.value = frequency;
  }
  
  // Update logo uniforms if logo exists
  if (logoMesh) {
    logoMesh.material.uniforms.u_time.value = clock.getElapsedTime();
    logoMesh.material.uniforms.u_frequency.value = frequency;
    logoMesh.material.uniforms.u_red.value = uniforms.u_red.value;
    logoMesh.material.uniforms.u_green.value = uniforms.u_green.value;
    logoMesh.material.uniforms.u_blue.value = uniforms.u_blue.value;
    
    // Add subtle rotation and scale animation based on audio
    logoMesh.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    const scale = 1.0 + (frequency / 500); // Subtle scaling based on audio
    logoMesh.scale.setScalar(scale * (params.logoSize / 2.5));
  }
  

  
  // Update camera position based on mouse
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);
  
  // Render scene
  bloomComposer.render();
}

// Function to get average frequency from the audio analyser
function getAverageFrequency() {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  
  return sum / dataArray.length;
}

// Handle window resize
window.addEventListener('resize', function() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  bloomComposer.setSize(width, height);
});

// Start animation loop
animate(); 