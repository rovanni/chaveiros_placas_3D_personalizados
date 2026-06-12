@echo off
title Criador de Chaveiros 3D - Inicializador
chcp 65001 > nul

:: Garante que o script execute na pasta correta, mesmo se executado como Administrador
cd /d "%~dp0"

echo =======================================================
echo     🔑 Criador de Chaveiros 3D - Inicializador 🔑
echo =======================================================
echo.

:: Verifica se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js não foi encontrado no seu computador!
    echo.
    echo Este projeto precisa do Node.js para rodar o servidor local.
    echo.
    echo 1. Por favor, baixe e instale a versão LTS do Node.js em:
    echo    https://nodejs.org/
    echo 2. Após a instalação, feche esta janela e execute este arquivo novamente.
    echo.
    echo Pressione qualquer tecla para abrir a página de download do Node.js...
    pause > nul
    start https://nodejs.org/
    exit
)

:: Verifica se a pasta node_modules existe, caso contrário roda npm install
if not exist "node_modules\" (
    echo [INFO] Instalando dependências pela primeira vez...
    echo Isso pode levar alguns segundos. Por favor, aguarde...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERRO] Falha ao instalar as dependências. Verifique sua conexão.
        pause
        exit
    )
    echo [SUCESSO] Dependências instaladas!
    echo.
)

:: Inicia o servidor em segundo plano e abre o navegador
echo [INFO] Iniciando o servidor...
start "Servidor Chaveiro3D" cmd /k "node server.js"

:: Aguarda um momento para o servidor inicializar
timeout /t 3 /nobreak > nul

:: Abre o navegador
echo [INFO] Abrindo o aplicativo no seu navegador...
start http://localhost:3000

echo.
echo =======================================================
echo   Servidor iniciado em http://localhost:3000
echo   Mantenha a janela do "Servidor Chaveiro3D" aberta
echo   enquanto estiver utilizando o aplicativo.
echo =======================================================
echo.
pause

