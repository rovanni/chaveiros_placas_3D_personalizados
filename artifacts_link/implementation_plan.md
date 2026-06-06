# Plano de Implementação: Customização de Cores Independentes (Base e Texto)

Este plano detalha as alterações necessárias para suportar a personalização de cores independentes para a **base** e o **texto** do chaveiro. Isso inclui a reestruturação da interface do usuário (UI), a atualização da prévia 3D (para renderizar os dois modelos com cores distintas em tempo real) e a otimização do servidor para compilar múltiplos arquivos em paralelo.

---

## Proposed Changes

### [Backend Node.js]

#### [MODIFY] [server.js](file:///d:/BACKUP/Luciano/Impressora%203D/Pe%C3%A7as%20para%20imprimir/Chaveiros/Criar_Chaveiros/server.js)
- Adicionar uma função auxiliar `execAsync` que envelopa a chamada do OpenSCAD em uma Promise.
- Refatorar o endpoint `/api/render` para rodar de forma assíncrona (`async/await`):
  - Executar as compilações do STL da Base, do STL do Texto e do STL Completo em paralelo usando `Promise.all`.
  - Tentar também a compilação do arquivo `.3mf` em paralelo. Se falhar (por exemplo, caso o formato não seja suportado em alguma versão do OpenSCAD), o endpoint retorna as URLs dos STLs com sucesso, omitindo apenas o 3MF com um aviso.
  - Retornar um JSON completo contendo: `baseUrl`, `textUrl`, `combinedUrl` (STL completo) e `threeMfUrl`.
  - Corrigir a sintaxe de chaves/parênteses duplicados no final da rota `/api/render`.

---

### [Frontend Web]

#### [MODIFY] [index.html](file:///d:/BACKUP/Luciano/Impressora%203D/Pe%C3%A7as%20para%20imprimir/Chaveiros/Criar_Chaveiros/public/index.html)
- Substituir a seção única de "Aparência do Filamento" por duas seções específicas dentro do mesmo painel:
  - **Cor da Base (Placa)**: com uma grade de cores e um seletor nativo (`<input type="color">`) para cores personalizadas.
  - **Cor do Texto**: com uma grade de cores e um seletor nativo para cores personalizadas.
- Adicionar IDs descritivos para os novos seletores e grades.

#### [MODIFY] [index.css](file:///d:/BACKUP/Luciano/Impressora%203D/Pe%C3%A7as%20para%20imprimir/Chaveiros/Criar_Chaveiros/public/index.css)
- Estilizar o elemento `.color-input-wrapper` para permitir a exibição elegante do seletor circular nativo de cores ao lado da grade de cores pré-definidas.
- Ajustar layouts para acomodar duas seções de cores de forma compacta e moderna na barra lateral.

#### [MODIFY] [app.js](file:///d:/BACKUP/Luciano/Impressora%203D/Pe%C3%A7as%20para%20imprimir/Chaveiros/Criar_Chaveiros/public/app.js)
- Atualizar o estado global `state` para gerenciar `baseColor` (padrão: preto `#212121`) e `textColor` (padrão: azul claro `#ADD8E6`).
- Vincular eventos para os seletores de cor da base e do texto (tanto os botões rápidos da grade quanto os inputs color customizados).
- Ao alterar a cor pela interface, atualizar as cores dos materiais do visualizador 3D em tempo real (`state.baseMesh.material.color.set` e `state.textMesh.material.color.set`) de forma instantânea, sem necessidade de reprocessar o OpenSCAD.
- Atualizar a função `loadStlIntoScene(baseUrl, textUrl)`:
  - Carregar ambos os arquivos STL (`baseUrl` e `textUrl`) usando o `STLLoader`.
  - Criar duas malhas (`baseMesh` e `textMesh`) com seus respectivos materiais e cores.
  - Calcular a caixa delimitadora combinada de ambas as malhas para centralizar o conjunto perfeitamente na cena 3D e ajustar a câmera de forma fluida.
- Atualizar `getParameters()` para enviar `Base_Color` e `Text_Color` para a API.
- Ajustar o botão "Baixar STL" para fazer o download do `combinedUrl` (modelo completo mesclado) e o botão "Baixar 3MF" para baixar o arquivo multicolorido (`threeMfUrl`).

---

## Verification Plan

### Automated Tests
- N/A (Verificação visual e de integridade de arquivos).

### Manual Verification
1. Iniciar o servidor local: `npm start`.
2. Acessar `http://localhost:3000`.
3. Validar se a prévia 3D inicial carrega com o texto em azul claro (`#ADD8E6`) e a base em preto (`#212121`).
4. Clicar nas cores rápidas ou escolher uma cor personalizada para a base e o texto, confirmando se o visualizador 3D é atualizado instantaneamente na tela.
5. Clicar em "Atualizar Prévia" (ou alterar algum texto) para verificar se o OpenSCAD compila os novos modelos com sucesso em paralelo.
6. Baixar o arquivo STL e o arquivo 3MF e abri-los no Bambu Studio ou PrusaSlicer para confirmar se os dois componentes aparecem como objetos de cores separadas prontos para impressão multicolorida.
