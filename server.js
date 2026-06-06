const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));

// Paths definition
const CONFIG_FILE = path.join(__dirname, 'config.json');
const FONTS_DIR = path.join(__dirname, 'fonts');
const TEMP_DIR = path.join(__dirname, 'temp');
const LIB_DIR = path.join(__dirname, 'public', 'lib');
const TEMPLATE_SCAD = path.join(__dirname, 'ParametricModelMaker.scad');

// Ensure necessary directories exist
[FONTS_DIR, TEMP_DIR, LIB_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Default configuration settings
const DEFAULT_CONFIG = {
  openscadPath: ''
};

// Common paths to search for openscad.exe on Windows
const COMMON_OPENSCAD_PATHS = [
  'C:\\Program Files\\OpenSCAD\\openscad.exe',
  'C:\\Program Files (x86)\\OpenSCAD\\openscad.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'OpenSCAD', 'openscad.exe')
];

// Helper to load config
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading config file, using default.');
    }
  }
  
  // Try to autodetect openscad.exe
  const detectedPath = COMMON_OPENSCAD_PATHS.find(p => fs.existsSync(p)) || '';
  const config = { ...DEFAULT_CONFIG, openscadPath: detectedPath };
  saveConfig(config);
  return config;
}

// Helper to save config
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing config file:', e);
  }
}

// Helper to download a file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download (Status ${response.statusCode}) from ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Pre-load essential fonts and JS libraries
const FONTS_TO_DOWNLOAD = [
  {
    name: 'BagelFatOne-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/bagelfatone/BagelFatOne-Regular.ttf'
  },
  {
    name: 'Lobster-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf'
  },
  {
    name: 'Pacifico-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf'
  },
  {
    name: 'Bangers-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/bangers/Bangers-Regular.ttf'
  },
  {
    name: 'Outfit[wght].ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf'
  },
  {
    name: 'DancingScript[wght].ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf'
  },
  {
    name: 'GreatVibes-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf'
  },
  {
    name: 'Satisfy-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/apache/satisfy/Satisfy-Regular.ttf'
  },
  {
    name: 'Parisienne-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/parisienne/Parisienne-Regular.ttf'
  },
  {
    name: 'Yellowtail-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/apache/yellowtail/Yellowtail-Regular.ttf'
  },
  {
    name: 'Playball-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/playball/Playball-Regular.ttf'
  },
  {
    name: 'Cookie-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/cookie/Cookie-Regular.ttf'
  }
];

const LIBS_TO_DOWNLOAD = [
  {
    name: 'three.min.js',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
  },
  {
    name: 'OrbitControls.js',
    url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
  },
  {
    name: 'STLLoader.js',
    url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js'
  }
];

async function initializeAssets() {
  console.log('Inicializando recursos...');
  
  const fontPromises = FONTS_TO_DOWNLOAD.map(async font => {
    const dest = path.join(FONTS_DIR, font.name);
    if (!fs.existsSync(dest)) {
      console.log(`Baixando fonte: ${font.name}...`);
      try {
        await downloadFile(font.url, dest);
        console.log(`Fonte ${font.name} baixada.`);
      } catch (err) {
        console.error(`Erro ao baixar a fonte ${font.name}:`, err.message);
      }
    }
  });

  const libPromises = LIBS_TO_DOWNLOAD.map(async lib => {
    const dest = path.join(LIB_DIR, lib.name);
    if (!fs.existsSync(dest)) {
      console.log(`Baixando biblioteca: ${lib.name}...`);
      try {
        await downloadFile(lib.url, dest);
        console.log(`Biblioteca ${lib.name} baixada.`);
      } catch (err) {
        console.error(`Erro ao baixar a biblioteca ${lib.name}:`, err.message);
      }
    }
  });

  await Promise.all([...fontPromises, ...libPromises]);
  console.log('Recursos prontos.');
}

// Clean up old temporary files in temp/
function cleanupTempFiles() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes in ms
  
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > maxAge) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}
setInterval(cleanupTempFiles, 60000); // Check every minute

// API Endpoints

// Get config settings
app.get('/api/settings', (req, res) => {
  const config = loadConfig();
  res.json({
    ...config,
    autodetectedPaths: COMMON_OPENSCAD_PATHS,
    isInstalled: config.openscadPath && fs.existsSync(config.openscadPath)
  });
});

// Update config settings
app.post('/api/settings', (req, res) => {
  const { openscadPath } = req.body;
  if (!openscadPath) {
    return res.status(400).json({ error: 'Caminho do OpenSCAD inválido.' });
  }
  
  const formattedPath = path.normalize(openscadPath.trim().replace(/^"(.*)"$/, '$1'));
  if (!fs.existsSync(formattedPath)) {
    return res.status(400).json({ error: 'O executável não foi encontrado no caminho especificado.' });
  }

  const config = { openscadPath: formattedPath };
  saveConfig(config);
  res.json({ success: true, openscadPath: formattedPath });
});

// Helper for executing command as a Promise
function execAsync(cmd, options) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Helper to generate the SCAD file content
function generateScadContent(renderPart, params, moduleCode) {
  const fnVal = params.lowResolution ? 16 : 32;
  return `// ===============================
//   PARAMETRIC KEYCHAIN - GENERATED VALUES
// ===============================

Base_Color = "${params.Base_Color.replace(/"/g, '\\"')}";
Text_Color = "${params.Text_Color.replace(/"/g, '\\"')}";
Render_Part = "${renderPart}";

Line1_Text = "${params.Line1_Text.replace(/"/g, '\\"')}";
Line2_Text = "${params.Line2_Text.replace(/"/g, '\\"')}";
Line3_Text = "${params.Line3_Text.replace(/"/g, '\\"')}";

Font_L1 = "${params.Font_L1.replace(/"/g, '\\"')}";
Font_L2 = "${params.Font_L2.replace(/"/g, '\\"')}";
Font_L3 = "${params.Font_L3.replace(/"/g, '\\"')}";

Font_Size_L1 = ${parseFloat(params.Font_Size_L1) || 20};
Font_Size_L2 = ${parseFloat(params.Font_Size_L2) || 20};
Font_Size_L3 = ${parseFloat(params.Font_Size_L3) || 20};

Font_Weight_Steps = ${parseInt(params.Font_Weight_Steps) || 0};
Font_Weight = Font_Weight_Steps / 10;

Text_Height = ${parseFloat(params.Text_Height) || 2};
Plate_Height = ${parseFloat(params.Plate_Height) || 3};
Border_Size = ${parseFloat(params.Border_Size) || 3};

Hole_Position = "${(params.Hole_Position || 'left').replace(/"/g, '\\"')}";
Hole_Radius = ${parseFloat(params.Hole_Radius) || 3};
Ring_Offset = ${parseFloat(params.Ring_Offset) || 0};
Hole_Height_Offset = ${parseFloat(params.Hole_Height_Offset) || 0};

Spacing_L2 = ${parseFloat(params.Spacing_L2) || 1.1};
Spacing_L3 = ${parseFloat(params.Spacing_L3) || 1.1};

Offset_L1 = ${parseFloat(params.Offset_L1) || 0};
Offset_L2 = ${parseFloat(params.Offset_L2) || 0};
Offset_L3 = ${parseFloat(params.Offset_L3) || 0};

Text_Left_Bound = ${parseFloat(params.Text_Left_Bound) || 0};
Text_Right_Bound = ${parseFloat(params.Text_Right_Bound) || 0};
Text_Center_X = ${parseFloat(params.Text_Center_X) || 0};
Text_Width = ${parseFloat(params.Text_Width) || 0};

$fn = ${fnVal};

${moduleCode}
`;
}

// Render keychain for 3D Preview (compiles only base and text STLs in low resolution)
app.post('/api/render', async (req, res) => {
  const config = loadConfig();
  const openscadExecutable = config.openscadPath;

  if (!openscadExecutable || !fs.existsSync(openscadExecutable)) {
    return res.status(400).json({ 
      error: 'O OpenSCAD não está configurado ou instalado.',
      setupRequired: true
    });
  }

  // Parse parameters
  const {
    Line1_Text = 'Good',
    Line2_Text = '',
    Line3_Text = '',
    Font_L1 = 'Bagel Fat One',
    Font_L2 = 'Bagel Fat One',
    Font_L3 = 'Bagel Fat One',
    Font_Size_L1 = 20,
    Font_Size_L2 = 20,
    Font_Size_L3 = 20,
    Font_Weight_Steps = 0,
    Text_Height = 2,
    Plate_Height = 3,
    Border_Size = 3,
    Hole_Radius = 3,
    Ring_Offset = 0,
    Hole_Height_Offset = 0,
    Spacing_L2 = 1.1,
    Spacing_L3 = 1.1,
    Offset_L1 = 0,
    Offset_L2 = 0,
    Offset_L3 = 0,
    Base_Color = 'Black',
    Text_Color = '#ADD8E6',
    Hole_Position = 'left',
    lowResolution = false,
    Text_Left_Bound = 0,
    Text_Right_Bound = 0,
    Text_Center_X = 0,
    Text_Width = 0
  } = req.body;

  // Read template and extract code after parameter block
  let templateContent = '';
  try {
    templateContent = fs.readFileSync(TEMPLATE_SCAD, 'utf8');
  } catch (err) {
    return res.status(500).json({ error: 'Não foi possível ler o arquivo modelo ParametricModelMaker.scad' });
  }

  // Locate the index of code starting after USER PARAMETERS (using strict multiline regex)
  let codeStartIdx = -1;
  const modelMatch = templateContent.match(/^\/\/\s*MODEL\s*$/m);
  if (modelMatch) {
    codeStartIdx = modelMatch.index;
  } else {
    const modulesMatch = templateContent.match(/^\/\/\s*MODULES\s*$/m);
    if (modulesMatch) {
      codeStartIdx = modulesMatch.index;
    } else {
      codeStartIdx = templateContent.indexOf('module generateBackPlateWithHole');
    }
  }

  if (codeStartIdx === -1) {
    return res.status(500).json({ error: 'Erro de formatação no template ParametricModelMaker.scad' });
  }

  const moduleCode = templateContent.substring(codeStartIdx);

  // Generate unique file IDs and paths
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const tempScadPathBase = path.join(TEMP_DIR, `${fileId}_base.scad`);
  const tempScadPathText = path.join(TEMP_DIR, `${fileId}_text.scad`);
  
  const tempBaseStlPath = path.join(TEMP_DIR, `${fileId}_base.stl`);
  const tempTextStlPath = path.join(TEMP_DIR, `${fileId}_text.stl`);

  const params = {
    Line1_Text, Line2_Text, Line3_Text,
    Font_L1, Font_L2, Font_L3,
    Font_Size_L1, Font_Size_L2, Font_Size_L3,
    Font_Weight_Steps,
    Text_Height, Plate_Height, Border_Size,
    Hole_Radius, Ring_Offset, Hole_Height_Offset,
    Hole_Position,
    Spacing_L2, Spacing_L3,
    Offset_L1, Offset_L2, Offset_L3,
    Base_Color, Text_Color,
    Text_Left_Bound, Text_Right_Bound, Text_Center_X, Text_Width,
    lowResolution: true
  };

  try {
    // Write SCAD files in parallel
    await Promise.all([
      fs.promises.writeFile(tempScadPathBase, generateScadContent('base', params, moduleCode), 'utf8'),
      fs.promises.writeFile(tempScadPathText, generateScadContent('text', params, moduleCode), 'utf8')
    ]);

    // Build compilation commands
    const baseCommand = `"${openscadExecutable}" -o "${tempBaseStlPath}" "${tempScadPathBase}"`;
    const textCommand = `"${openscadExecutable}" -o "${tempTextStlPath}" "${tempScadPathText}"`;

    const env = { ...process.env, OPENSCAD_FONT_PATH: FONTS_DIR };

    // Run core compilations in parallel
    await Promise.all([
      execAsync(baseCommand, { env }),
      execAsync(textCommand, { env })
    ]);

    // Clean up temporary SCAD files
    [tempScadPathBase, tempScadPathText].forEach(p => {
      fs.unlink(p, () => {});
    });

    // Check if files exist
    if (!fs.existsSync(tempBaseStlPath) || !fs.existsSync(tempTextStlPath)) {
      throw new Error('O OpenSCAD falhou em gerar os arquivos do modelo 3D para prévia.');
    }

    res.json({
      success: true,
      baseUrl: `/temp/${fileId}_base.stl`,
      textUrl: `/temp/${fileId}_text.stl`,
      fileId: fileId
    });

  } catch (err) {
    console.error('Render API error:', err);
    // Cleanup any temporary files
    [tempScadPathBase, tempScadPathText, tempBaseStlPath, tempTextStlPath].forEach(p => {
      fs.unlink(p, () => {});
    });
    res.status(500).json({ error: 'Erro ao compilar a prévia 3D usando OpenSCAD.', details: err.message || err.stderr });
  }
});

// Compile and Download combined STL or 3MF on-demand
app.post('/api/compile-download', async (req, res) => {
  const config = loadConfig();
  const openscadExecutable = config.openscadPath;

  if (!openscadExecutable || !fs.existsSync(openscadExecutable)) {
    return res.status(400).json({ error: 'O OpenSCAD não está configurado.' });
  }

  const { format, fileId, ...restParams } = req.body;
  if (!format || !fileId) {
    return res.status(400).json({ error: 'Formato ou ID do arquivo inválidos.' });
  }

  // Force lowResolution = false for high-quality production download files
  const params = { ...restParams, lowResolution: false };

  // Read template
  let templateContent = '';
  try {
    templateContent = fs.readFileSync(TEMPLATE_SCAD, 'utf8');
  } catch (err) {
    return res.status(500).json({ error: 'Não foi possível ler o modelo.' });
  }

  let codeStartIdx = -1;
  const modelMatch = templateContent.match(/^\/\/\s*MODEL\s*$/m);
  if (modelMatch) {
    codeStartIdx = modelMatch.index;
  } else {
    codeStartIdx = templateContent.indexOf('module generateBackPlateWithHole');
  }

  const moduleCode = templateContent.substring(codeStartIdx);
  const tempScadPathAll = path.join(TEMP_DIR, `${fileId}_all.scad`);
  const env = { ...process.env, OPENSCAD_FONT_PATH: FONTS_DIR };

  try {
    await fs.promises.writeFile(tempScadPathAll, generateScadContent('all', params, moduleCode), 'utf8');

    if (format === 'stl') {
      const tempCombinedStlPath = path.join(TEMP_DIR, `${fileId}_completo.stl`);
      const combinedCommand = `"${openscadExecutable}" -o "${tempCombinedStlPath}" "${tempScadPathAll}"`;
      
      await execAsync(combinedCommand, { env });
      fs.unlink(tempScadPathAll, () => {});

      if (!fs.existsSync(tempCombinedStlPath)) {
        throw new Error('Falha ao compilar o STL unificado.');
      }
      res.json({ success: true, downloadUrl: `/temp/${fileId}_completo.stl` });

    } else if (format === '3mf') {
      const temp3mfPath = path.join(TEMP_DIR, `${fileId}.3mf`);
      const threeMfCommand = `"${openscadExecutable}" -o "${temp3mfPath}" "${tempScadPathAll}"`;
      
      await execAsync(threeMfCommand, { env });
      fs.unlink(tempScadPathAll, () => {});

      if (!fs.existsSync(temp3mfPath)) {
        throw new Error('Falha ao compilar o arquivo 3MF.');
      }
      res.json({ success: true, downloadUrl: `/temp/${fileId}.3mf` });
    } else {
      res.status(400).json({ error: 'Formato desconhecido.' });
    }

  } catch (err) {
    console.error('Download compilation error:', err);
    fs.unlink(tempScadPathAll, () => {});
    res.status(500).json({ error: 'Erro ao compilar o arquivo para download.', details: err.message });
  }
});

// Get list of system fonts (optimized for Windows, covering both system and user fonts)
app.get('/api/system-fonts', (req, res) => {
  const psCommand = `Add-Type -AssemblyName System.Drawing; [System.Drawing.Text.InstalledFontCollection]::new().Families.Name`;
  
  exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
    // Standard fallback list in case query fails or runs on non-Windows
    const fallbackFonts = [
      'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 
      'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 
      'Microsoft Sans Serif', 'Segoe UI', 'Tahoma', 'Times New Roman', 
      'Trebuchet MS', 'Verdana'
    ];

    if (error) {
      console.warn('Could not query system fonts via InstalledFontCollection, using fallback.');
      return res.json(fallbackFonts);
    }

    const lines = stdout.split(/\r?\n/);
    const fontSet = new Set();

    lines.forEach(line => {
      const name = line.trim();
      if (name) fontSet.add(name);
    });

    // Merge fallback fonts to ensure basic fonts are present
    fallbackFonts.forEach(f => fontSet.add(f));

    const fonts = Array.from(fontSet).sort();
    res.json(fonts);
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  await initializeAssets();
});
