# 🔑 Criador de Chaveiros 3D Paramétrico

Um customizador web local para criação e exportação de **chaveiros 3D personalizados** com texto, fontes cursivas e impressão multicolorida. Gerado e renderizado através do **OpenSCAD**, com pré-visualização 3D em tempo real no navegador.

> **Modelo base 3D original por:** Vanessa Matos — [Customizable Name Keychains no MakerWorld](https://makerworld.com/pt/models/2679660-customizable-name-keychains)

---

## ✨ Funcionalidades

- 🖊️ **Texto com até 3 linhas** com fonte, tamanho e espaçamento independentes
- 🎨 **12+ fontes** incluindo cursivas: Dancing Script, Great Vibes, Parisienne, Satisfy, Yellowtail, Playball, Cookie e mais
- 🎨 **Duas cores independentes** para a base (placa) e para o texto (filamento)
- 🖨️ **Exportação multicolorida** em formato `.3MF` (compatível com Bambu AMS, Prusa MMU, etc.)
- 🏷️ **Dois modos**: Chaveiro (com furo e alça) ou Letreiro/Placa de Mesa (sem furo)
- ⚡ **Prévia 3D rápida** (~2–3 segundos) com Three.js + STLLoader
- 💻 **100% local** — roda na sua máquina, sem nuvem, sem dados enviados
- 🌙 **Tema escuro/claro** com design glassmorphism

---

## 📋 Pré-requisitos

1. **[Node.js](https://nodejs.org/)** (versão 18 ou superior)
2. **[OpenSCAD](https://openscad.org/downloads.html)** instalado no seu sistema

---

## 🚀 Instalação e Uso

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/criador-chaveiros-3d.git
cd criador-chaveiros-3d

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start
```

4. Abra o navegador em: **[http://localhost:3000](http://localhost:3000)**

> Na primeira inicialização, o servidor baixa automaticamente as fontes Google e as bibliotecas Three.js. Aguarde a mensagem **"Recursos prontos."** no terminal.

5. **Configure o caminho do OpenSCAD** clicando no ícone ⚙️ no canto superior direito (se não for detectado automaticamente).

---

## 🗂️ Estrutura do Projeto

```
criador-chaveiros-3d/
├── server.js                  # Servidor Node.js + API REST
├── ParametricModelMaker.scad  # Template paramétrico OpenSCAD
├── package.json
├── public/
│   ├── index.html             # Interface do customizador
│   ├── index.css              # Estilos (dark mode, glassmorphism)
│   └── app.js                 # Lógica frontend + Three.js
├── fonts/                     # Fontes TTF (criada automaticamente)
├── temp/                      # Arquivos STL/3MF temporários (criada automaticamente)
└── public/lib/                # Bibliotecas JS (criada automaticamente)
```

---

## 🖨️ Fontes Disponíveis

| Fonte | Estilo | Tipo |
|-------|--------|------|
| Bagel Fat One | Grossa e divertida | Display |
| Lobster | Cursiva bold | Script |
| Pacifico | Descontraída | Script |
| Dancing Script | Cursiva moderna | Script Cursivo |
| Great Vibes | Caligrafia elegante | Script Cursivo |
| Satisfy | Pincel orgânico | Script Cursivo |
| Parisienne | Clássica francesa | Script Cursivo |
| Yellowtail | Retro bold | Script Cursivo |
| Playball | Esportiva | Script Cursivo |
| Cookie | Manuscrita | Script Cursivo |
| Bangers | Quadrinhos | Display |
| Outfit | Moderna sem-serifa | Sans-Serif |
| + Fontes do Sistema Windows | Todas instaladas | Variado |

---

## 🔧 Parâmetros Disponíveis

| Parâmetro | Descrição |
|-----------|-----------|
| Linha 1/2/3 | Texto de cada linha |
| Fonte L1/L2/L3 | Fonte independente por linha |
| Tamanho L1/L2/L3 | Tamanho em mm |
| Espessura (Negrito) | Engrossamento via `offset()` |
| Alt. Base / Texto | Altura de extrusão em mm |
| Largura da Borda | Margem ao redor do texto |
| Tipo de Modelo | Chaveiro (furo) ou Letreiro (sem furo) |
| Raio do Furo | Tamanho do furo da alça |
| Offsets Horizontais | Centralização por linha |
| Espaçamento Vertical | Entre linhas |
| Cor da Base | Cor do filamento da placa |
| Cor do Texto | Cor do filamento das letras |

---

## 📤 Formatos de Exportação

- **STL Completo** — modelo único mesclado, para impressão monocolor
- **3MF Multicolorido** — dois corpos separados com cores definidas, para impressoras com AMS/MMU (Bambu Lab, Prusa, etc.)

---

## 🏗️ Arquitetura Técnica

- **Backend**: Node.js + Express
  - `/api/render` — Compilação rápida (prévia, `$fn=16`, só base+texto)
  - `/api/compile-download` — Compilação de qualidade (`$fn=32`, sob demanda)
  - `/api/system-fonts` — Lista fontes instaladas via PowerShell (.NET)
- **Frontend**: HTML + CSS + JavaScript vanilla
  - Visualização 3D com Three.js r128 + OrbitControls + STLLoader
  - Atualização automática (debounce 700ms) e sem bloqueio de UI
- **OpenSCAD**: Template paramétrico com injeção de variáveis pelo servidor

---

## ⚠️ Notas Importantes

- **Fontes cursivas**: O projeto usa a técnica *expand-then-contract* (`offset(0.1)` + `offset(-0.1)`) para unir contornos sobrepostos em fontes cursivas, eliminando defeitos de renderização (buracos entre letras ligadas).
- **config.json**: Criado automaticamente com o caminho do OpenSCAD. Não é versionado pois é específico de cada máquina.
- **Pastas auto-criadas**: `fonts/`, `temp/` e `public/lib/` são criadas e populadas automaticamente na inicialização.

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

O modelo base 3D (geometria OpenSCAD) foi adaptado de [Customizable Name Keychains](https://makerworld.com/pt/models/2679660-customizable-name-keychains) por **Vanessa Matos**.

As fontes Google Fonts são distribuídas sob a **SIL Open Font License (OFL)** e **Apache License 2.0**.

---

## 👤 Autor

**Luciano Rovanni do Nascimento**

*Feito com ☕ e muito OpenSCAD!*
