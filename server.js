const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const zlib = require('zlib');

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

// -----------------------------------------------------------------------
// STL / 3MF helpers
// -----------------------------------------------------------------------

// CRC32 lookup table (needed for ZIP / 3MF creation)
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC32_TABLE[(c ^ buf[i]) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Merge two binary STL buffers into a single binary STL
function mergeBinarySTLs(buf1, buf2) {
  const c1 = buf1.readUInt32LE(80);
  const c2 = buf2.readUInt32LE(80);
  const out = Buffer.alloc(84 + (c1 + c2) * 50);
  Buffer.from('Binary STL - Criador de Chaveiros 3D').copy(out, 0);
  out.writeUInt32LE(c1 + c2, 80);
  buf1.copy(out, 84, 84, 84 + c1 * 50);
  buf2.copy(out, 84 + c1 * 50, 84, 84 + c2 * 50);
  return out;
}

// Parse binary STL → { vertices: [[x,y,z],...], triangles: [[i,j,k],...] }
function parseBinarySTL(buf) {
  const n = buf.readUInt32LE(80);
  const vertices = [];
  const triangles = [];
  for (let i = 0; i < n; i++) {
    const off = 84 + i * 50;
    const b = vertices.length;
    vertices.push(
      [buf.readFloatLE(off + 12), buf.readFloatLE(off + 16), buf.readFloatLE(off + 20)],
      [buf.readFloatLE(off + 24), buf.readFloatLE(off + 28), buf.readFloatLE(off + 32)],
      [buf.readFloatLE(off + 36), buf.readFloatLE(off + 40), buf.readFloatLE(off + 44)]
    );
    triangles.push([b, b + 1, b + 2]);
  }
  return { vertices, triangles };
}

// Build a minimal valid ZIP buffer from an array of { name, data (Buffer) }
function buildZipBuffer(files) {
  const entries = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = Buffer.from(file.name, 'utf8');
    const compressed = zlib.deflateRawSync(file.data);
    const checksum = crc32(file.data);

    const lhdr = Buffer.alloc(30 + nameBytes.length);
    lhdr.writeUInt32LE(0x04034b50, 0);
    lhdr.writeUInt16LE(20, 4);
    lhdr.writeUInt16LE(0, 6);
    lhdr.writeUInt16LE(8, 8);          // DEFLATE
    lhdr.writeUInt16LE(0, 10);
    lhdr.writeUInt16LE(0, 12);
    lhdr.writeUInt32LE(checksum, 14);
    lhdr.writeUInt32LE(compressed.length, 18);
    lhdr.writeUInt32LE(file.data.length, 22);
    lhdr.writeUInt16LE(nameBytes.length, 26);
    lhdr.writeUInt16LE(0, 28);
    nameBytes.copy(lhdr, 30);

    entries.push({ lhdr, compressed, nameBytes, checksum, uncompressed: file.data.length, offset });
    offset += lhdr.length + compressed.length;
  }

  const cdParts = entries.map(e => {
    const cd = Buffer.alloc(46 + e.nameBytes.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8); cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12); cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(e.checksum, 16);
    cd.writeUInt32LE(e.compressed.length, 20);
    cd.writeUInt32LE(e.uncompressed, 24);
    cd.writeUInt16LE(e.nameBytes.length, 28);
    cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34); cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38); cd.writeUInt32LE(e.offset, 42);
    e.nameBytes.copy(cd, 46);
    return cd;
  });

  const cdSize = cdParts.reduce((s, p) => s + p.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  const parts = [];
  for (const e of entries) parts.push(e.lhdr, e.compressed);
  for (const cd of cdParts) parts.push(cd);
  parts.push(eocd);
  return Buffer.concat(parts);
}

// Build a slicer-compatible 3MF buffer from two STL buffers (base + text)
function build3MFBuffer(baseBuf, textBuf) {
  const buildObjectXml = (id, mesh) => {
    const rows = [
      `    <object id="${id}" type="model">`,
      `      <mesh>`,
      `        <vertices>`
    ];
    for (const [x, y, z] of mesh.vertices)
      rows.push(`          <vertex x="${x.toFixed(6)}" y="${y.toFixed(6)}" z="${z.toFixed(6)}"/>`);
    rows.push(`        </vertices>`, `        <triangles>`);
    for (const [v1, v2, v3] of mesh.triangles)
      rows.push(`          <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`);
    rows.push(`        </triangles>`, `      </mesh>`, `    </object>`);
    return rows.join('\n');
  };

  const base = parseBinarySTL(baseBuf);
  const text = parseBinarySTL(textBuf);

  const model = Buffer.from([
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">`,
    `  <resources>`,
    buildObjectXml(1, base),
    buildObjectXml(2, text),
    `  </resources>`,
    `  <build>`,
    `    <item objectid="1"/>`,
    `    <item objectid="2"/>`,
    `  </build>`,
    `</model>`
  ].join('\n'));

  const contentTypes = Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n` +
    `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n` +
    `  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n` +
    `</Types>`
  );

  const rels = Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
    `  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n` +
    `</Relationships>`
  );

  return buildZipBuffer([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels',         data: rels },
    { name: '3D/3dmodel.model',    data: model }
  ]);
}

// -----------------------------------------------------------------------

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

    // Run core compilations in parallel and wait for all to settle to prevent orphaned unhandled rejections
    const compileResults = await Promise.allSettled([
      execAsync(baseCommand, { env }),
      execAsync(textCommand, { env })
    ]);

    const rejected = compileResults.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      throw rejected[0].reason;
    }

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

// Compile and Download — compiles base + text separately (same as render, high quality)
// then merges them: STL via binary concat, 3MF via a proper ZIP/XML container.
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
  if (format !== 'stl' && format !== '3mf') {
    return res.status(400).json({ error: 'Formato desconhecido. Use "stl" ou "3mf".' });
  }

  const params = { ...restParams, lowResolution: false };

  const safeText = (params.Line1_Text || 'personalizado')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'personalizado';
  const downloadFilename = `chaveiro_${safeText}.${format}`;

  // High-quality STL paths (separate from preview which uses _base/_text)
  const hqBasePath = path.join(TEMP_DIR, `${fileId}_hq_base.stl`);
  const hqTextPath = path.join(TEMP_DIR, `${fileId}_hq_text.stl`);
  const env = { ...process.env, OPENSCAD_FONT_PATH: FONTS_DIR };

  const scadBase = path.join(TEMP_DIR, `${fileId}_hq_base.scad`);
  const scadText = path.join(TEMP_DIR, `${fileId}_hq_text.scad`);

  try {
    // Only recompile if high-quality STLs are not cached yet
    if (!fs.existsSync(hqBasePath) || !fs.existsSync(hqTextPath)) {
      let templateContent;
      try {
        templateContent = fs.readFileSync(TEMPLATE_SCAD, 'utf8');
      } catch {
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

      await Promise.all([
        fs.promises.writeFile(scadBase, generateScadContent('base', params, moduleCode), 'utf8'),
        fs.promises.writeFile(scadText, generateScadContent('text', params, moduleCode), 'utf8')
      ]);

      const results = await Promise.allSettled([
        execAsync(`"${openscadExecutable}" -o "${hqBasePath}" "${scadBase}"`, { env }),
        execAsync(`"${openscadExecutable}" -o "${hqTextPath}" "${scadText}"`, { env })
      ]);

      [scadBase, scadText].forEach(p => fs.unlink(p, () => {}));

      for (const r of results) {
        if (r.status === 'rejected') console.error('OpenSCAD error:', r.reason?.stderr);
      }
    }

    if (!fs.existsSync(hqBasePath) || !fs.existsSync(hqTextPath)) {
      return res.status(500).json({ error: 'Falha ao compilar os componentes do chaveiro.' });
    }

    const [baseBuf, textBuf] = await Promise.all([
      fs.promises.readFile(hqBasePath),
      fs.promises.readFile(hqTextPath)
    ]);

    // Validate: a binary STL needs at least header (80) + count (4) + 1 triangle (50) = 134 bytes
    if (baseBuf.length < 134 || textBuf.length < 134) {
      return res.status(500).json({
        error: 'OpenSCAD gerou geometria vazia. Verifique se o texto está preenchido e a fonte está disponível.'
      });
    }

    const outputBuf = format === 'stl'
      ? mergeBinarySTLs(baseBuf, textBuf)
      : build3MFBuffer(baseBuf, textBuf);

    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', outputBuf.length);
    res.end(outputBuf);

  } catch (err) {
    console.error('Download compilation error:', err);
    [scadBase, scadText].forEach(p => fs.unlink(p, () => {}));
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro ao compilar o arquivo para download.',
        details: err.message || String(err)
      });
    }
  }
});

// Serves generated files as attachments to force correct file extension downloads
app.get('/api/download', (req, res) => {
  const { fileId, format, text } = req.query;
  if (!fileId || !format) {
    return res.status(400).send('Parâmetros inválidos');
  }

  // Clean the text to make a safe filename
  const safeText = (text || 'personalizado')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9_\-\s]/g, '') // remove special characters except spaces/hyphens
    .trim()
    .replace(/\s+/g, '_'); // replace spaces with underscores

  const filename = `chaveiro_${safeText || 'personalizado'}.${format}`;

  let filePath = '';
  if (format === 'stl') {
    filePath = path.join(TEMP_DIR, `${fileId}_completo.stl`);
  } else if (format === '3mf') {
    filePath = path.join(TEMP_DIR, `${fileId}.3mf`);
  } else {
    return res.status(400).send('Formato inválido');
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Arquivo não encontrado. Por favor, gere o arquivo novamente.');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  const filestream = fs.createReadStream(filePath);
  filestream.pipe(res);
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
