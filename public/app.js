// ==========================================================================
//   CLIENT APP - 3D PARAMETRIC KEYCHAIN CUSTOMIZER
// ==========================================================================

// Global App State
const state = {
  currentBaseUrl: null,
  currentTextUrl: null,
  fileId: null,
  openscadConnected: false,
  renderingInProgress: false,
  baseColor: '#212121', // Default base color: Black
  textColor: '#ADD8E6', // Default text color: Light Blue
  baseMesh: null,
  textMesh: null,
  renderDebounceTimer: null
};

// DOM Elements
const elements = {
  // Inputs
  Line1_Text: document.getElementById('Line1_Text'),
  Line2_Text: document.getElementById('Line2_Text'),
  Line3_Text: document.getElementById('Line3_Text'),
  Font_L1: document.getElementById('Font_L1'),
  Font_L2: document.getElementById('Font_L2'),
  Font_L3: document.getElementById('Font_L3'),
  Font_Size_L1: document.getElementById('Font_Size_L1'),
  Font_Size_L2: document.getElementById('Font_Size_L2'),
  Font_Size_L3: document.getElementById('Font_Size_L3'),
  Font_Weight_Steps: document.getElementById('Font_Weight_Steps'),
  Offset_L1: document.getElementById('Offset_L1'),
  Offset_L2: document.getElementById('Offset_L2'),
  Offset_L3: document.getElementById('Offset_L3'),
  Spacing_L2: document.getElementById('Spacing_L2'),
  Spacing_L3: document.getElementById('Spacing_L3'),
  Plate_Height: document.getElementById('Plate_Height'),
  Text_Height: document.getElementById('Text_Height'),
  Border_Size: document.getElementById('Border_Size'),
  Hole_Radius: document.getElementById('Hole_Radius'),
  Ring_Offset: document.getElementById('Ring_Offset'),
  Hole_Height_Offset: document.getElementById('Hole_Height_Offset'),
  Hole_Position: document.getElementById('Hole_Position'),

  // Displays
  Font_Weight_val: document.getElementById('Font_Weight_val'),
  Offset_L1_val: document.getElementById('Offset_L1_val'),
  Offset_L2_val: document.getElementById('Offset_L2_val'),
  Offset_L3_val: document.getElementById('Offset_L3_val'),
  Spacing_L2_val: document.getElementById('Spacing_L2_val'),
  Spacing_L3_val: document.getElementById('Spacing_L3_val'),
  Border_Size_val: document.getElementById('Border_Size_val'),
  Hole_Radius_val: document.getElementById('Hole_Radius_val'),
  Ring_Offset_val: document.getElementById('Ring_Offset_val'),
  Hole_Height_Offset_val: document.getElementById('Hole_Height_Offset_val'),

  // Status & Actions
  openscadStatus: document.getElementById('openscad-status'),
  warningBanner: document.getElementById('openscad-warning-banner'),
  btnFixWarning: document.getElementById('btn-fix-warning'),
  btnRender: document.getElementById('btn-render'),
  btnDownload: document.getElementById('btn-download'),
  btnDownload3mf: document.getElementById('btn-download-3mf'),
  btnToggleTheme: document.getElementById('btn-toggle-theme'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  renderLoader: document.getElementById('render-loader'),

  // Modal
  settingsModal: document.getElementById('settings-modal'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  openscadPathInput: document.getElementById('openscad-path-input'),
  modalErrorMsg: document.getElementById('modal-error-msg'),
  modalSuccessMsg: document.getElementById('modal-success-msg'),

  // Canvas
  canvasContainer: document.getElementById('canvas-container')
};

// Three.js Variables
let scene, camera, renderer, controls, gridHelper;

/* ==========================================================================
   INITIALIZATION & 3D SCENE SETUP
   ========================================================================== */
function init3D() {
  const width = elements.canvasContainer.clientWidth;
  const height = elements.canvasContainer.clientHeight;

  // Scene
  scene = new THREE.Scene();
  const isLight = document.body.classList.contains('light-theme');
  scene.background = new THREE.Color(isLight ? '#f1f5f9' : '#0b0d19');
  
  // Grid / Helper
  gridHelper = new THREE.GridHelper(
    200, 
    50, 
    isLight ? 0x0071c5 : 0x00c7fd, 
    isLight ? 0xcbced4 : 0x1e293b
  );
  gridHelper.position.y = -10;
  scene.add(gridHelper);

  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
  camera.position.set(0, 100, 150);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  elements.canvasContainer.appendChild(renderer.domElement);

  // Orbit Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit panning under the floor
  controls.minDistance = 20;
  controls.maxDistance = 400;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight1.position.set(80, 120, 50);
  dirLight1.castShadow = true;
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00c7fd, 0.35); // Intel cyan fill light
  dirLight2.position.set(-80, -50, -50);
  scene.add(dirLight2);

  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const width = elements.canvasContainer.clientWidth;
  const height = elements.canvasContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

/* ==========================================================================
   UI BINDINGS & INTERACTIONS
   ========================================================================== */
function setupUIListeners() {
  // Sliders display values auto-update
  const sliders = [
    { el: elements.Font_Weight_Steps, valEl: elements.Font_Weight_val, format: (v) => (v / 10).toFixed(1) },
    { el: elements.Offset_L1, valEl: elements.Offset_L1_val },
    { el: elements.Offset_L2, valEl: elements.Offset_L2_val },
    { el: elements.Offset_L3, valEl: elements.Offset_L3_val },
    { el: elements.Spacing_L2, valEl: elements.Spacing_L2_val, format: (v) => parseFloat(v).toFixed(1) },
    { el: elements.Spacing_L3, valEl: elements.Spacing_L3_val, format: (v) => parseFloat(v).toFixed(1) },
    { el: elements.Border_Size, valEl: elements.Border_Size_val, format: (v) => parseFloat(v).toFixed(1) },
    { el: elements.Hole_Radius, valEl: elements.Hole_Radius_val, format: (v) => parseFloat(v).toFixed(1) },
    { el: elements.Ring_Offset, valEl: elements.Ring_Offset_val },
    { el: elements.Hole_Height_Offset, valEl: elements.Hole_Height_Offset_val }
  ];

  sliders.forEach(slider => {
    slider.el.addEventListener('input', (e) => {
      const val = e.target.value;
      slider.valEl.textContent = slider.format ? slider.format(val) : val;
      triggerAutoRender();
    });
  });

  // Regular input/select changes trigger render
  const inputs = [
    elements.Line1_Text, elements.Line2_Text, elements.Line3_Text,
    elements.Font_L1, elements.Font_L2, elements.Font_L3,
    elements.Font_Size_L1, elements.Font_Size_L2, elements.Font_Size_L3,
    elements.Plate_Height, elements.Text_Height
  ];

  inputs.forEach(input => {
    input.addEventListener('input', triggerAutoRender);
    input.addEventListener('change', triggerAutoRender);
  });

  // Collapsible sections
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('active');
      const content = header.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // PLA Color Pickers (Base Color)
  document.querySelectorAll('.base-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.base-color-btn.active').classList.remove('active');
      btn.classList.add('active');
      state.baseColor = btn.dataset.color;
      document.getElementById('base-custom-color').value = btn.dataset.color;
      updateBaseMeshMaterial();
    });
  });

  document.getElementById('base-custom-color').addEventListener('input', (e) => {
    state.baseColor = e.target.value;
    document.querySelectorAll('.base-color-btn').forEach(btn => btn.classList.remove('active'));
    const matchingBtn = Array.from(document.querySelectorAll('.base-color-btn')).find(btn => btn.dataset.color.toLowerCase() === state.baseColor.toLowerCase());
    if (matchingBtn) {
      matchingBtn.classList.add('active');
    }
    updateBaseMeshMaterial();
  });

  // PLA Color Pickers (Text Color)
  document.querySelectorAll('.text-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.text-color-btn.active').classList.remove('active');
      btn.classList.add('active');
      state.textColor = btn.dataset.color;
      document.getElementById('text-custom-color').value = btn.dataset.color;
      updateTextMeshMaterial();
    });
  });

  document.getElementById('text-custom-color').addEventListener('input', (e) => {
    state.textColor = e.target.value;
    document.querySelectorAll('.text-color-btn').forEach(btn => btn.classList.remove('active'));
    const matchingBtn = Array.from(document.querySelectorAll('.text-color-btn')).find(btn => btn.dataset.color.toLowerCase() === state.textColor.toLowerCase());
    if (matchingBtn) {
      matchingBtn.classList.add('active');
    }
    updateTextMeshMaterial();
  });

  // Action Buttons
  elements.btnRender.addEventListener('click', () => renderModel(false));
  elements.btnDownload.addEventListener('click', downloadSTL);
  elements.btnDownload3mf.addEventListener('click', download3MF);
  
  // Settings Modal Controls
  elements.btnOpenSettings.addEventListener('click', openSettingsModal);
  elements.btnFixWarning.addEventListener('click', openSettingsModal);
  elements.btnCloseModal.addEventListener('click', closeSettingsModal);
  elements.btnSaveSettings.addEventListener('click', saveSettings);
  elements.btnToggleTheme.addEventListener('click', toggleTheme);

  // Hole Position Compass Picker
  const updateHoleControlsVisibility = () => {
    const isNone = elements.Hole_Position.value === 'none';
    document.getElementById('box-hole-radius').style.display = isNone ? 'none' : 'block';
    document.getElementById('box-ring-offset').style.display = isNone ? 'none' : 'block';
    document.getElementById('box-hole-height-offset').style.display = isNone ? 'none' : 'block';
  };

  document.querySelectorAll('.hole-pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.hole-pos-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Update hidden input
      elements.Hole_Position.value = btn.dataset.pos;
      // Update visibility of sliders
      updateHoleControlsVisibility();
      // Trigger re-render
      triggerAutoRender();
    });
  });

  updateHoleControlsVisibility();

  // Change select element font family dynamically when option is selected
  [elements.Font_L1, elements.Font_L2, elements.Font_L3].forEach(select => {
    const updateSelectFontStyle = () => {
      const val = select.value;
      if (val === 'Outfit' || val === 'Inter') {
        select.style.fontFamily = 'var(--font-sans)';
      } else {
        select.style.fontFamily = `'${val}', var(--font-sans)`;
      }
    };
    select.addEventListener('change', updateSelectFontStyle);
    updateSelectFontStyle(); // Apply on start
  });
}

/* ==========================================================================
   MODEL RENDERING & STL LOADING
   ========================================================================== */
function triggerAutoRender() {
  if (!state.openscadConnected) return;

  if (state.renderDebounceTimer) {
    clearTimeout(state.renderDebounceTimer);
  }
  
  // Render automatically 700ms after user finishes editing
  state.renderDebounceTimer = setTimeout(() => {
    renderModel(true); // lowResolution = true for faster real-time rendering
  }, 700);
}

// Get all parameters from HTML inputs
function getParameters(lowResolution = false) {
  // Let's measure text bounds in browser
  const getLineWidth = (text, font, size) => {
    if (!text) return 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${size}px "${font}", sans-serif`;
    return ctx.measureText(text).width * 1.33; // 1.33 scaling factor
  };

  const t1 = elements.Line1_Text.value;
  const t2 = elements.Line2_Text.value;
  const t3 = elements.Line3_Text.value;

  const font1 = elements.Font_L1.value || 'Liberation Sans';
  const font2 = elements.Font_L2.value || 'Liberation Sans';
  const font3 = elements.Font_L3.value || 'Liberation Sans';

  const size1 = parseFloat(elements.Font_Size_L1.value) || 20;
  const size2 = parseFloat(elements.Font_Size_L2.value) || 20;
  const size3 = parseFloat(elements.Font_Size_L3.value) || 20;

  const off1 = parseFloat(elements.Offset_L1.value) || 0;
  const off2 = parseFloat(elements.Offset_L2.value) || 0;
  const off3 = parseFloat(elements.Offset_L3.value) || 0;

  const w1 = getLineWidth(t1, font1, size1);
  const w2 = t2 ? getLineWidth(t2, font2, size2) : 0;
  const w3 = t3 ? getLineWidth(t3, font3, size3) : 0;

  const left1 = off1;
  const right1 = off1 + w1;

  let left2 = left1;
  let right2 = right1;
  if (t2) {
    left2 = off2;
    right2 = off2 + w2;
  }

  let left3 = left1;
  let right3 = right1;
  if (t3) {
    left3 = off3;
    right3 = off3 + w3;
  }

  const layoutLeft = Math.min(left1, left2, left3);
  const layoutRight = Math.max(right1, right2, right3);
  const layoutWidth = layoutRight - layoutLeft;
  const layoutCenter = (layoutLeft + layoutRight) * 0.5;

  return {
    Line1_Text: t1,
    Line2_Text: t2,
    Line3_Text: t3,
    Font_L1: font1,
    Font_L2: font2,
    Font_L3: font3,
    Font_Size_L1: size1,
    Font_Size_L2: size2,
    Font_Size_L3: size3,
    Font_Weight_Steps: parseInt(elements.Font_Weight_Steps.value) || 0,
    Offset_L1: off1,
    Offset_L2: off2,
    Offset_L3: off3,
    Spacing_L2: parseFloat(elements.Spacing_L2.value) || 1.1,
    Spacing_L3: parseFloat(elements.Spacing_L3.value) || 1.1,
    Plate_Height: parseFloat(elements.Plate_Height.value) || 3,
    Text_Height: parseFloat(elements.Text_Height.value) || 2,
    Border_Size: parseFloat(elements.Border_Size.value) || 3,
    Hole_Radius: parseFloat(elements.Hole_Radius.value) || 3,
    Ring_Offset: parseFloat(elements.Ring_Offset.value) || 0,
    Hole_Height_Offset: parseFloat(elements.Hole_Height_Offset.value) || 0,
    Hole_Position: elements.Hole_Position.value || 'left',
    Base_Color: state.baseColor,
    Text_Color: state.textColor,
    Text_Left_Bound: layoutLeft,
    Text_Right_Bound: layoutRight,
    Text_Center_X: layoutCenter,
    Text_Width: layoutWidth,
    lowResolution: lowResolution
  };
}

async function renderModel(lowResolution = false) {
  if (state.renderingInProgress) return;
  
  state.renderingInProgress = true;
  
  // Show full overlay only on first render when scene is empty
  const isFirstRender = !state.baseMesh && !state.textMesh;
  if (isFirstRender) {
    elements.renderLoader.classList.remove('hidden');
  } else {
    elements.btnRender.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
  }

  try {
    const params = getParameters(lowResolution);
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Falha ao renderizar o modelo.');
    }

    state.currentBaseUrl = data.baseUrl;
    state.currentTextUrl = data.textUrl;
    state.fileId = data.fileId;

    // Enable buttons - downloads will be compiled on demand when clicked
    elements.btnDownload.disabled = false;
    elements.btnDownload3mf.disabled = false;
    
    // Load STL base and text meshes
    loadStlIntoScene(data.baseUrl, data.textUrl);

  } catch (err) {
    console.error('Rendering error:', err);
    // Only show popup alert on non-automatic actions
    if (!lowResolution) {
      alert(`Erro na renderização:\n${err.message}`);
    }
  } finally {
    state.renderingInProgress = false;
    elements.renderLoader.classList.add('hidden');
    elements.btnRender.innerHTML = '<i class="fa-solid fa-rotate"></i> Atualizar Prévia';
  }
}

function loadStlIntoScene(baseUrl, textUrl) {
  const loader = new THREE.STLLoader();
  
  // Remove previous meshes
  if (state.baseMesh) {
    scene.remove(state.baseMesh);
    state.baseMesh.geometry.dispose();
    state.baseMesh.material.dispose();
    state.baseMesh = null;
  }
  if (state.textMesh) {
    scene.remove(state.textMesh);
    state.textMesh.geometry.dispose();
    state.textMesh.material.dispose();
    state.textMesh = null;
  }

  // Create high-quality plastic PLA Materials
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.baseColor),
    roughness: 0.25,
    metalness: 0.1,
    flatShading: false
  });

  const textMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.textColor),
    roughness: 0.25,
    metalness: 0.1,
    flatShading: false
  });

  let baseLoaded = false;
  let textLoaded = false;

  function adjustCombinedScene() {
    if (baseLoaded && textLoaded) {
      // Calculate union of bounding boxes to center them combined
      const combinedBox = new THREE.Box3();
      if (state.baseMesh) combinedBox.expandByObject(state.baseMesh);
      if (state.textMesh) combinedBox.expandByObject(state.textMesh);
      
      const center = new THREE.Vector3();
      combinedBox.getCenter(center);
      
      // Shift both meshes to align and center at (0, 0, 0)
      if (state.baseMesh) state.baseMesh.position.sub(center);
      if (state.textMesh) state.textMesh.position.sub(center);

      // Adjust camera to fit combined size
      const size = new THREE.Vector3();
      combinedBox.getSize(size);
      const radius = size.length() / 2;
      
      controls.target.set(0, 0, 0);
      const distance = radius * 2.2;
      camera.position.set(0, distance * 0.8, distance * 1.2);
      controls.update();
    }
  }

  // Load Base STL
  loader.load(baseUrl, function (geometry) {
    geometry.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geometry, baseMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2; // Lie flat on the grid

    scene.add(mesh);
    state.baseMesh = mesh;
    baseLoaded = true;
    adjustCombinedScene();
  }, undefined, function (error) {
    console.error('Error loading Base STL:', error);
  });

  // Load Text STL
  loader.load(textUrl, function (geometry) {
    geometry.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geometry, textMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2; // Lie flat on the grid

    scene.add(mesh);
    state.textMesh = mesh;
    textLoaded = true;
    adjustCombinedScene();
  }, undefined, function (error) {
    console.error('Error loading Text STL:', error);
  });
}

function updateBaseMeshMaterial() {
  if (state.baseMesh) {
    state.baseMesh.material.color.set(state.baseColor);
  }
}

function updateTextMeshMaterial() {
  if (state.textMesh) {
    state.textMesh.material.color.set(state.textColor);
  }
}

async function downloadFile(format) {
  if (!state.fileId) return;

  const btn = format === 'stl' ? elements.btnDownload : elements.btnDownload3mf;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...';

  try {
    const params = getParameters(false);
    const response = await fetch('/api/compile-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, fileId: state.fileId, ...params })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Erro ao compilar o arquivo ${format.toUpperCase()}.`);
    }

    // Use blob URL for reliable cross-browser download
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Sanitize the text to create a safe Windows filename
    const cleanText = (elements.Line1_Text.value || 'personalizado')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z0-9_\-\s]/g, '') // remove invalid filename characters
      .trim()
      .replace(/\s+/g, '_'); // replace spaces with underscores
    
    const filename = `chaveiro_${cleanText || 'personalizado'}.${format}`;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  } catch (err) {
    console.error(`Error downloading ${format.toUpperCase()}:`, err);
    alert(`Erro ao gerar o arquivo ${format.toUpperCase()}:\n${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function downloadSTL() {
  return downloadFile('stl');
}

async function download3MF() {
  return downloadFile('3mf');
}


/* ==========================================================================
   SETTINGS & SYSTEM CONFIG
   ========================================================================== */
async function checkSystemStatus() {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    
    state.openscadConnected = data.isInstalled;
    
    if (data.isInstalled) {
      elements.openscadStatus.className = 'status-badge connected';
      elements.openscadStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> OpenSCAD Conectado';
      elements.warningBanner.classList.add('hidden');
      elements.openscadPathInput.value = data.openscadPath;
      
      // Auto-render first load preview
      renderModel(false);
    } else {
      elements.openscadStatus.className = 'status-badge disconnected';
      elements.openscadStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> OpenSCAD Indisponível';
      elements.warningBanner.classList.remove('hidden');
      elements.btnDownload.disabled = true;
      
      // Try to suggest first auto-detected path in modal input field
      const autofill = data.autodetectedPaths.find(p => p) || '';
      elements.openscadPathInput.value = autofill;
    }
  } catch (err) {
    console.error('Error checking backend status:', err);
    elements.openscadStatus.className = 'status-badge disconnected';
    elements.openscadStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Servidor Offline';
  }
}

function openSettingsModal() {
  elements.settingsModal.classList.remove('hidden');
  elements.modalErrorMsg.classList.add('hidden');
  elements.modalSuccessMsg.classList.add('hidden');
}

function closeSettingsModal() {
  elements.settingsModal.classList.add('hidden');
}

async function saveSettings() {
  const pathVal = elements.openscadPathInput.value;
  elements.modalErrorMsg.classList.add('hidden');
  elements.modalSuccessMsg.classList.add('hidden');
  
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openscadPath: pathVal })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao validar o executável.');
    }

    elements.modalSuccessMsg.classList.remove('hidden');
    setTimeout(() => {
      closeSettingsModal();
      checkSystemStatus();
    }, 1200);

  } catch (err) {
    elements.modalErrorMsg.textContent = err.message;
    elements.modalErrorMsg.classList.remove('hidden');
  }
}

// Toggle between Light and Dark Theme
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');

  // Update Three.js scene background and grid color
  if (scene) {
    scene.background.set(isLight ? '#f1f5f9' : '#0b0d19');
    
    if (gridHelper) {
      scene.remove(gridHelper);
      gridHelper = new THREE.GridHelper(
        200, 
        50, 
        isLight ? 0x0071c5 : 0x00c7fd, 
        isLight ? 0xcbced4 : 0x1e293b
      );
      gridHelper.position.y = -10;
      scene.add(gridHelper);
    }
  }

  // Update theme button icon
  const icon = elements.btnToggleTheme.querySelector('i');
  if (icon) {
    icon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

// Fetch system fonts from API and populate the dropdown selects
async function loadSystemFonts() {
  try {
    const response = await fetch('/api/system-fonts');
    if (!response.ok) throw new Error('Failed to load system fonts.');
    const fonts = await response.json();

    const selectL1 = elements.Font_L1;
    const selectL2 = elements.Font_L2;
    const selectL3 = elements.Font_L3;

    [selectL1, selectL2, selectL3].forEach(select => {
      if (!select) return;

      // Clean up previous system fonts optgroup specifically
      const existingGroup = select.querySelector('optgroup[label="Fontes do Sistema"]');
      if (existingGroup) {
        existingGroup.remove();
      }

      const optGroup = document.createElement('optgroup');
      optGroup.label = "Fontes do Sistema";

      fonts.forEach(font => {
        // Skip if already exists in Google Fonts
        const exists = Array.from(select.options).some(opt => opt.value === font);
        if (!exists) {
          const option = document.createElement('option');
          option.value = font;
          option.textContent = font;
          optGroup.appendChild(option);
        }
      });

      select.appendChild(optGroup);
    });

    console.log(`${fonts.length} fontes do sistema adicionadas aos seletores.`);
  } catch (err) {
    console.error('Error loading system fonts list:', err);
  }
}

// ==========================================================================
//   BOOTSTRAP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check user saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
  
  init3D();
  
  // Update button icon on start if light theme
  if (savedTheme === 'light') {
    const icon = elements.btnToggleTheme.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-moon';
  }

  setupUIListeners();
  checkSystemStatus();
  loadSystemFonts();
});
