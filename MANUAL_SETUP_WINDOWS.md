# Guia de Configuração Manual - Windows

Este guia explica as alterações manuais que você precisa fazer no seu PC Windows para que o script de setup funcione corretamente.

## 🔧 Problemas Identificados e Soluções

### 1. ✅ Habilitar Extensões PHP no php.ini

**Problema:** As extensões `fileinfo`, `gd` e `zip` não estão habilitadas no PHP.

**Solução:**

1. **Localizar o arquivo php.ini:**
   - Abra o PowerShell ou CMD
   - Execute: `php --ini`
   - Anote o caminho mostrado em "Loaded Configuration File"
   - Exemplo: `C:\Program Files\php\php.ini`

2. **Editar o php.ini:**
   - **IMPORTANTE:** Clique com botão direito no arquivo `php.ini`
   - Selecione "Abrir com" → Escolha um editor de texto (Notepad++, VS Code, ou até mesmo o Bloco de Notas)
   - **Se pedir permissões:** Clique em "Executar como administrador" no editor

3. **Habilitar as extensões:**
   - Procure por estas linhas (use Ctrl+F para buscar):
     ```
     ;extension=fileinfo
     ;extension=gd
     ;extension=zip
     ```
   - Remova o `;` do início de cada linha:
     ```
     extension=fileinfo
     extension=gd
     extension=zip
     ```
   - **OU** se não encontrar essas linhas, adicione-as na seção de extensões (procure por `[Extensions]` ou `;extension=`)

4. **Salvar o arquivo:**
   - Salve o arquivo (Ctrl+S)
   - Se não conseguir salvar, certifique-se de que está executando o editor como administrador

5. **Reiniciar o terminal:**
   - Feche completamente o PowerShell/CMD
   - Abra um novo terminal
   - Execute: `php -m` para verificar se as extensões aparecem na lista

### 2. ✅ Verificar se MySQL está Rodando

**Problema:** O MySQL pode não estar em execução.

**Solução:**

1. **Verificar status do serviço MySQL:**
   - Pressione `Win + R`
   - Digite: `services.msc` e pressione Enter
   - Procure por "MySQL" ou "MySQL80" ou "MySQL84"
   - Verifique se o status está como "Em execução"

2. **Se não estiver rodando:**
   - Clique com botão direito no serviço MySQL
   - Selecione "Iniciar"
   - Se pedir permissões, clique em "Sim"

3. **Configurar para iniciar automaticamente (opcional):**
   - Clique com botão direito no serviço MySQL
   - Selecione "Propriedades"
   - Em "Tipo de inicialização", selecione "Automático"
   - Clique em "OK"

4. **Testar conexão:**
   - Abra o PowerShell/CMD
   - Execute: `mysql -u root -e "SELECT 1;"`
   - Se funcionar, o MySQL está OK
   - Se pedir senha, você pode configurar no script ou criar um usuário sem senha

### 3. ✅ Configurar Senha do MySQL (se necessário)

**Se o MySQL pedir senha e você não souber:**

1. **Opção 1: Redefinir senha do root (recomendado para desenvolvimento):**
   - Abra o PowerShell como Administrador
   - Execute:
     ```powershell
     net stop MySQL80
     # ou
     net stop MySQL84
     ```
   - Execute o MySQL em modo seguro:
     ```powershell
     mysqld --skip-grant-tables
     ```
   - Em outro terminal, execute:
     ```powershell
     mysql -u root
     ```
   - No MySQL, execute:
     ```sql
     USE mysql;
     UPDATE user SET authentication_string='' WHERE User='root';
     FLUSH PRIVILEGES;
     EXIT;
     ```
   - Pare o MySQL e inicie normalmente

2. **Opção 2: Criar novo usuário sem senha:**
   - Abra o MySQL Workbench ou execute `mysql -u root -p` (com a senha atual)
   - Execute:
     ```sql
     CREATE USER 'gearlog'@'localhost' IDENTIFIED BY '';
     GRANT ALL PRIVILEGES ON gearlog.* TO 'gearlog'@'localhost';
     FLUSH PRIVILEGES;
     ```
   - Depois, edite o `.env` do backend para usar este usuário

### 4. ✅ Verificar Permissões de Administrador

**Para editar o php.ini, você precisa de permissões de administrador:**

1. **Executar editor como administrador:**
   - Clique com botão direito no Notepad, VS Code, ou outro editor
   - Selecione "Executar como administrador"
   - Abra o arquivo `php.ini` através deste editor

2. **OU executar o script como administrador:**
   - Clique com botão direito no PowerShell
   - Selecione "Executar como administrador"
   - Execute o script de setup novamente

### 5. ✅ Verificar se PHP está no PATH

**Se o comando `php` não funcionar:**

1. **Verificar se PHP está no PATH:**
   - Abra o PowerShell
   - Execute: `php -v`
   - Se não funcionar, o PHP não está no PATH

2. **Adicionar PHP ao PATH:**
   - Pressione `Win + X` e selecione "Sistema"
   - Clique em "Configurações avançadas do sistema"
   - Clique em "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path" e clique em "Editar"
   - Clique em "Novo" e adicione o caminho do PHP (ex: `C:\Program Files\php`)
   - Clique em "OK" em todas as janelas
   - **Reinicie o terminal** para aplicar as alterações

## 📋 Checklist Rápido

Antes de executar o script novamente, verifique:

- [ ] Extensões PHP habilitadas (`fileinfo`, `gd`, `zip`)
- [ ] MySQL está rodando
- [ ] PHP está no PATH
- [ ] Terminal foi reiniciado após alterações
- [ ] Permissões de administrador (se necessário)

## 🚀 Após Fazer as Alterações

1. **Feche completamente o terminal atual**
2. **Abra um novo terminal** (PowerShell ou CMD)
3. **Execute o script novamente:**
   ```powershell
   python setup.py
   # ou
   python3 setup.py
   ```

## 🆘 Se Ainda Tiver Problemas

1. **Verifique o log:**
   - Abra: `Desktop\GearLog_Setup_Log.txt`
   - Procure por erros específicos

2. **Teste manualmente:**
   ```powershell
   # Testar PHP
   php -v
   php -m  # Deve mostrar fileinfo, gd, zip
   
   # Testar Composer
   composer --version
   
   # Testar MySQL
   mysql -u root -e "SELECT 1;"
   
   # Testar Node
   node -v
   npm -v
   ```

3. **Se precisar de ajuda:**
   - Compartilhe o conteúdo do arquivo de log
   - Indique qual passo específico está falhando

## 📝 Notas Importantes

- **Sempre reinicie o terminal** após fazer alterações no PATH ou php.ini
- **Use permissões de administrador** quando necessário
- **O MySQL deve estar rodando** antes de executar migrations
- **As extensões PHP só são carregadas** quando o PHP é iniciado (por isso precisa reiniciar o terminal)

