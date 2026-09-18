# 🚓 CONTROLE DE VIATURAS (VTR) - FROTA 1ª CIA DO 1º BPTRAN

Sistema completo e otimizado de gestão de frota, controle de status operacional, histórico de baixas, motivos mecânicos/elétricos, gerenciamento de rádios/placas e relatórios em tempo real.

---

## ✨ Principais Melhorias Implementadas

1. **⚡ Fluidez e Desempenho Máximo**:
   - **Sincronização Não-Destrutiva**: Polling inteligente que não recria elementos do DOM enquanto o usuário digita.
   - **Gráficos em Tempo Real (Chart.js)**: Atualização suave em memória (`chart.update('none')`) sem piscar a tela ou causar vazamento de memória.
   - **Salvamento Automático com Debounce**: Grava alterações instantaneamente com proteção contra congestionamento de rede.
   - **Modo Offline e Nuvem Híbrida**: Acesso instantâneo local via `localStorage` com sincronização automática com o servidor Render e Firebase Realtime.

2. **🚀 Otimizado para Hospedagem no Render**:
   - Servidor Node.js leve, com suporte a Express e fallback nativo de zero dependências.
   - Binds corretos em `0.0.0.0` e portas dinâmicas (`process.env.PORT`).
   - Rotas de health check (`/healthz` e `/api/status`) para monitoramento automático de uptime.
   - Gravação atômica do banco `database.json` prevenindo perda de dados em reinicializações.
   - Arquivo `render.yaml` incluso para deploy em 1 clique.

3. **🛡️ Segurança e Funcionalidades Militares**:
   - **Gestão Granular de Usuários e Permissões por Setor com Ticks Verdes (✅)**:
     - No setor **Comandos e Ações do Banco de Dados**, o botão **👥 Usuários e Permissões** permite ao administrador cadastrar e excluir múltiplos operadores com credenciais e senhas individuais.
     - Cada usuário pode ter permissões ativadas/desativadas setor por setor através de **ticks verdes (✅)**:
       - *Editar Status e Destino* (Tabela, cards e formulário).
       - *Acrescentar Viaturas* (Painel rápido de inclusão).
       - *Edição Completa de Viatura* (Prefixo, placa, patrimônio e rádio).
       - *Excluir Viaturas* (Remoção da frota).
       - *Gerenciar Parâmetros* (Cias, Pelotões, Modelos, Status, Locais, Motivos).
       - *Importar e Conectar Planilha* (Excel, CSV, Google Sheets).
       - *Comandos Avançados de Banco* (Base original, restauração e reset).
       - *Configurações do Servidor* (Conexão e URLs de API).
       - *Gerenciar Usuários e Permissões* (Criação e edição de operadores).
       - *Editar Título* (Nome do sistema no cabeçalho).
     - **Com o tick verde (✅)**: O operador tem acesso liberado ao setor.
     - **Sem o tick**: O sistema bloqueia o acesso e impede modificações no setor.
   - **Perfil VISITANTE (Modo Visualizador Automático)**:
     - O sistema inicia por padrão em modo **VISITANTE** sem exigir senha, mantendo a interface limpa (o botão de usuário no cabeçalho fica oculto e só surge quando alguém se autentica com senha). possui acesso apenas para visualização da página, tabelas e gráficos, sem permissão para efetuar qualquer alteração.
   - **Primeiro Acesso com Troca Obrigatória de Senha**:
     - Ao ser criado pelo administrador com uma senha inicial provisória, no primeiro login o usuário é automaticamente direcionado para a janela **"Crie sua própria senha"** e **"Confirme novamente"**, salvando sua senha definitiva e sincronizando com o servidor.
   - **Personalização de Conta e Troca de Senha (`👤 Editar Conta`)**:
     - Posicionado no cabeçalho entre o nome do usuário e o botão de Modo Noturno, o botão **Editar Conta** permite ao operador:
       - Fazer upload de uma **foto própria** para personalizar seu perfil.
       - Alterar sua senha a qualquer momento informando a senha original, a nova senha e a confirmação.
       - A janela fecha automaticamente ao salvar.
   - **Visibilidade Administrativa**:
     - Mesmo com a senha alterada pelo usuário, o Administrador Geral pode visualizar e editar a senha de qualquer operador a qualquer momento no painel **👥 Usuários e Permissões**.
   - **Gestão Granular de Usuários e Permissões por Setor com Ticks Verdes (✅)**:
     - No setor **Comandos e Ações do Banco de Dados**, o novo botão **👥 Usuários e Permissões** permite ao administrador cadastrar e excluir múltiplos operadores com credenciais e senhas individuais.
     - Cada usuário pode ter permissões ativadas/desativadas setor por setor através de **ticks verdes (✅)**:
       - *Editar Status e Destino* (Tabela, cards e formulário).
       - *Acrescentar Viaturas* (Painel rápido de inclusão).
       - *Edição Completa de Viatura* (Prefixo, placa, patrimônio e rádio).
       - *Excluir Viaturas* (Remoção da frota).
       - *Gerenciar Parâmetros* (Cias, Pelotões, Modelos, Status, Locais, Motivos).
       - *Importar e Conectar Planilha* (Excel, CSV, Google Sheets).
       - *Comandos Avançados de Banco* (Base original, restauração e reset).
       - *Configurações do Servidor* (Conexão e URLs de API).
       - *Gerenciar Usuários* (Criação e edição de operadores).
       - *Editar Título* (Nome do sistema no cabeçalho).
     - **Com o tick verde (✅)**: O operador tem acesso liberado ao setor.
     - **Sem o tick**: O sistema bloqueia o acesso e impede modificações no setor.
   - **Autenticação com Seletor de Usuário e Alternância Rápida**:
     - Ao clicar para editar qualquer setor restrito, surge o modal solicitando **selecionar o usuário (dropdown)** e digitar a **senha individual**.
     - Uma vez autenticado, o nome do operador surge no cabeçalho (`🔓 [Nome]`), mantendo a permissão ativa durante a navegação.
     - É possível alternar entre usuários a qualquer momento clicando no botão do topo (`🔄 Alternar Usuário`).
   - **Bloqueio Automático ao Sair**: Assim que você fechar a página ou aba do navegador, a sessão é automaticamente finalizada. Ao reabrir o sistema, a senha será solicitada novamente para qualquer ação restrita.
   - **Indicador Visual no Cabeçalho (`🔓 ADM Ativo`)**: Um botão discreto surge no topo indicando que o modo administrador está ativo. Se desejar encerrar o modo de administração manualmente sem fechar a página, basta clicar no botão para bloquear novamente.
   - Visualização por Nível Batalhão ou Nível Companhia.
   - Ocultação/Exibição dinâmica de colunas da tabela.
   - Exportação direta para Excel (.xlsx) e Backup JSON.
   - Importação unificada (Google Sheets via link web, arquivo XLSX/CSV ou JSON).
   - Suporte completo a Tema Noturno (Dark Mode) e Tema Claro.

---

## 🚀 Como Hospedar no Render (Passo a Passo)

### 1️⃣ Subir para o GitHub
1. Crie um repositório no seu GitHub (ex: `controle-vtr-frota-1cia-1bptran`).
2. Envie os arquivos desta pasta:
   - `index.html`
   - `server.js`
   - `package.json`
   - `database.json`
   - `.gitignore`
   - `render.yaml`
   - `README.md`

### 2️⃣ Criar o Web Service no Render
1. Acesse sua conta no [Render](https://render.com/).
2. Clique em **New +** -> **Web Service**.
3. Conecte o repositório do GitHub.
4. Preencha as configurações:
   - **Name**: `controle-vtr-frota-1cia-1bptran`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Clique em **Deploy Web Service**.

---

## 💻 Como Executar Localmente

```bash
# 1. Instalar dependências (opcional, o servidor roda nativamente também)
npm install

# 2. Iniciar servidor
node server.js
```
Acesse no navegador: `http://localhost:3000`

---

## 👮 Informações do Sistema
- **Unidade**: 1ª Cia do 1º BPTran - Polícia Militar do Estado de São Paulo
- **Desenvolvido por**: Sd Vagner - Telemática
- **Contato**: vagnerdjs@policiamilitar.sp.gov.br

---

## 🔄 Como Funciona a Sincronização: Render vs GitHub

Para entender o fluxo de funcionamento e gravação das informações:

1. **🌐 RENDER (Servidor em Produção e Banco de Dados em Tempo Real)**:
   - O **Render** é onde o sistema está hospedado e rodando ao vivo para todos os policiais e operadores.
   - Toda alteração operacional (mudança de status de viatura, inclusão de operador, nova senha pessoal, foto de perfil, etc.) é enviada via API REST e salva diretamente no arquivo `database.json` no **Render**.
   - A sincronização entre todos os computadores que acessam o link acontece no **Render** em tempo real.

2. **🐙 GITHUB (Repositório de Código-Fonte e Versionamento)**:
   - O **GitHub** guarda o código-fonte do projeto (`index.html`, `server.js`, `package.json`, etc.).
   - Você só envia dados para o **GitHub** (`git push`) quando faz melhorias ou atualizações no código do sistema.
   - Ao fazer um `git push` para o GitHub, o **Render** detecta a atualização do código e reconstrói o serviço automaticamente (*deploy contínuo*).
