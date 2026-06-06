# Customizador e Criador de Chaveiros 3D Paramétricos (Multicolorido)

O site local para criação e personalização de chaveiros 3D com nomes foi aprimorado. Agora ele suporta **personalização de duas cores independentes (Base e Texto)**, **renderização de alta performance com OpenSCAD em paralelo**, exportação direta em **3MF multicolorido**, correção para a letra "o", e uma **interface unificada e completa para fontes do sistema**.

---

## 3D Preview da Interface (Tema Claro, Tema Escuro e Nova Seleção de Fontes)

Abaixo estão as novas capturas de tela demonstrando a customização em tempo real e a seleção unificada de fontes:

````carousel
![Gravação da tela: Letreiro sem Furo e Prévias de Fonte no Dropdown](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\nameplate_flow_1780705184992.webp)
<!-- slide -->
![Modelo Sem Furo (Placa de Nome / Letreiro)](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\no_hole_preview_1780705230523.png)
<!-- slide -->
![Fundo Azul com Fonte Manuscrita Great Vibes no seletor e no 3D](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\great_vibes_font_preview_1780705255825.png)
<!-- slide -->
![Exemplo de fonte cursiva: Dancing Script](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_dancing_script_1780703640752.png)
<!-- slide -->
![Exemplo de fonte cursiva: Great Vibes](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_great_vibes_1780703652164.png)
<!-- slide -->
![Exemplo de fonte cursiva: Satisfy](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_satisfy_1780703663095.png)
<!-- slide -->
![Exemplo de fonte cursiva: Parisienne](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_parisienne_1780703674315.png)
<!-- slide -->
![Exemplo de fonte cursiva: Yellowtail](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_yellowtail_1780703686450.png)
<!-- slide -->
![Exemplo de fonte cursiva: Playball](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_playball_1780703697925.png)
<!-- slide -->
![Exemplo de fonte cursiva: Cookie](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\font_cookie_1780703710315.png)
<!-- slide -->
![Demonstração da velocidade de prévia (2s) e download sob demanda (STL/3MF)](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\preview_and_download_flow_1780702147401.webp)
<!-- slide -->
![Customizador com base preta, letras em azul claro original e fonte Segoe UI](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\unified_font_selection_verified_1780699606147.png)
<!-- slide -->
![Atualização de cores em tempo real (base verde e texto vermelho)](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\live_color_change_verified_1780698476833.png)
<!-- slide -->
![Customizador em Dark Mode com a cor azul profissional da Intel](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\dark_mode_initial_1780695967222.png)
<!-- slide -->
![Vídeo da verificação em tempo real da seleção de cores e visualização 3D](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\verify_live_color_update_1780698453079.webp)
<!-- slide -->
![Gravação de tela demonstrando a seleção unificada de fontes e navegação no navegador](C:\Users\lucia\.gemini\antigravity-ide\brain\3426a2e2-d0f6-4d57-bf7e-b8aff5ce07d6\verify_unified_fonts_1780699356819.webp)
````

---

## Novos Recursos e Melhorias Implementadas

A aplicação foi aprimorada com as seguintes implementações:

1. **Seleção Unificada e Completa de Fontes do Sistema (Melhoria de UX)**:
   - **População dinâmica no Select**: Em vez do antigo botão "Escrever Fonte do Sistema..." que abria um input de texto separado e exigia apagar o campo de texto para ver a lista completa (comportamento padrão de filtragem do datalist HTML5), agora **todas as fontes do sistema são injetadas diretamente nos seletores de fonte principais (`<select>`)**.
   - As fontes do sistema ficam organizadas sob um grupo visual claro `<optgroup label="Fontes do Sistema">` logo abaixo das fontes pré-definidas (Google Fonts).
   - O usuário pode trocar de fonte e navegar na lista completa a qualquer momento, sem precisar digitar nada ou limpar campos de texto.
   - **Consulta de fontes via .NET**: No backend (`server.js`), substituímos a consulta ao registro local de máquina (`HKLM`) pelo uso do objeto .NET `InstalledFontCollection` via PowerShell. Isso permite coletar de forma completa e instantânea todos os nomes de famílias de fontes instaladas no Windows (tanto fontes de sistema quanto fontes instaladas apenas para o usuário atual). No ambiente de testes, isso aumentou a lista de fontes encontradas de apenas 17 para **162 fontes do sistema**.

2. **Correção do Bug das Letras (Furos Preenchidos)**:
   - No arquivo [ParametricModelMaker.scad](file:///d:/BACKUP/Luciano/Impressora%203D/Pe%C3%A7as%20para%20imprimir/Chaveiros/Criar_Chaveiros/ParametricModelMaker.scad), adicionamos a função `generateTextLine` para evitar a chamada do módulo `offset(delta = 0)` quando o peso da fonte for 0. O OpenSCAD tem um bug conhecido onde aplicar um `offset` de valor zero a caminhos de texto 2D pode preencher ou fechar os buracos internos de letras como `o`, `a`, `d`, `e`. Com essa correção, as letras do texto renderizam perfeitamente com seus furos centrais limpos e vazados!

3. **Customização de Duas Cores Independentes (Base e Texto)**:
   - **Interface com duas grades de cores**: Criamos duas seções de paletas de filamento na barra lateral. O usuário pode clicar nos botões rápidos de cor ou usar o seletor nativo para definir cores personalizadas para a placa e para o texto de forma independente.
   - **Atualização Instantânea**: O visualizador 3D Three.js atualiza as cores dos materiais das malhas (`baseMesh` e `textMesh`) **instantaneamente na tela**, sem necessidade de reprocessar o OpenSCAD, gerando uma experiência fluida.

4. **Resolução Otimizada e Compilação sob Demanda (Aceleração de Performance)**:
   - **Prévia Rápida (`$fn = 16`)**: As compilações de visualização no navegador (`/api/render`) agora utilizam obrigatoriamente a resolução `$fn = 16`, gerando apenas os arquivos STL da base e do texto em paralelo. O tempo de renderização caiu para **apenas ~2 a 3 segundos** (em contraste com os 21-30+ segundos anteriores).
   - **Geração do STL e 3MF Final sob Demanda**: Os botões "Baixar STL" e "Baixar 3MF" agora compilam a geometria do modelo unificado com qualidade de impressão final de alta resolução (`$fn = 32`) apenas no momento do clique. A interface exibe um indicador "Gerando..." no próprio botão sem travar a navegação.
   - **Navegação Sem Bloqueio**: A tela inteira de carregamento (`render-loader` overlay) agora é restrita apenas ao primeiro carregamento da página. Durante as alterações subsequentes dos parâmetros da barra lateral, o customizador renderiza as alterações em segundo plano, mantendo os controles interativos o tempo todo.

5. **Opção de Modelo Sem Furo (Letreiros / Placas de Mesa)**:
   - Adicionada a opção de alternar o tipo de modelo entre **Chaveiro (com furo alça)** e **Letreiro / Placa de Mesa (sem furo)**.
   - Ao desativar o furo, o OpenSCAD remove a alça externa (`hull()`) e o furo do cilindro. A interface esconde dinamicamente os sliders de ajuste do furo, deixando a barra lateral mais limpa e organizada.

6. **Prévia de Tipografia nos Seletores do Dropdown**:
   - Carregadas as fontes tipográficas do Google Fonts no navegador.
   - Customizado o seletor com estilos CSS dinâmicos via JavaScript. Cada dropdown de fonte agora exibe o texto selecionado na tipografia correta de sua própria fonte, fornecendo um feedback visual imediato antes mesmo da renderização.

---

## Como Executar e Testar

1. O servidor Node.js já está rodando localmente na porta **3000** em seu computador.
2. Acesse: [http://localhost:3000](http://localhost:3000).
3. Modifique qualquer parâmetro na barra lateral (ex: mude o texto na Linha 1). A prévia será atualizada em segundo plano de forma instantânea e sem bloquear a tela.
4. Clique em "Baixar STL" ou "Baixar 3MF" para gerar o arquivo final sob demanda e baixar o arquivo compilado com qualidade máxima.
