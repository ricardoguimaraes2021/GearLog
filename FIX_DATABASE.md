# 🔧 Como Corrigir o Problema da Base de Dados

Se você conseguiu acessar o frontend mas não consegue fazer login porque não existem tabelas na base de dados, siga estes passos:

## 🚨 Problema

As migrations não foram executadas durante o setup, então a base de dados está vazia (sem tabelas e sem dados).

## ✅ Solução Rápida

### Opção 1: Executar Migrations Manualmente (Recomendado)

1. **Abra um novo terminal/PowerShell**

2. **Navegue até o diretório do backend:**
   ```powershell
   cd C:\Users\Ricardo\Desktop\GearLog\backend
   ```

3. **Execute as migrations:**
   ```powershell
   php artisan migrate --seed
   ```

4. **Verifique se funcionou:**
   - Você deve ver mensagens como "Migrating: create_users_table", etc.
   - No final, deve aparecer "Database seeding completed successfully"

5. **Teste o login:**
   - Acesse: http://localhost:5173
   - Use as credenciais:
     - **Admin:** `admin@gearlog.local` / `password`
     - **Manager:** `gestor@gearlog.local` / `password`
     - **Technician:** `tecnico@gearlog.local` / `password`

### Opção 2: Executar o Script Novamente

Se preferir, você pode executar o script novamente. Ele deve detectar que o projeto já existe e executar apenas as migrations:

1. **Pare os servidores** (se estiverem rodando):
   - Feche o terminal onde os servidores estão rodando
   - Ou pressione `Ctrl+C` no terminal

2. **Execute o script novamente:**
   ```powershell
   python setup.py
   ```

3. **Quando perguntar sobre o diretório existente:**
   - Digite `y` para usar o diretório existente

4. **O script deve executar as migrations automaticamente**

## 🔍 Verificar se a Base de Dados Foi Criada

1. **Abra o MySQL:**
   ```powershell
   mysql -u root
   ```

2. **Liste as bases de dados:**
   ```sql
   SHOW DATABASES;
   ```
   - Você deve ver `gearlog` na lista

3. **Use a base de dados:**
   ```sql
   USE gearlog;
   ```

4. **Liste as tabelas:**
   ```sql
   SHOW TABLES;
   ```
   - Se estiver vazio, as migrations não foram executadas
   - Se houver tabelas (users, products, categories, etc.), as migrations foram executadas

## 🛠️ Se as Migrations Falharem

### Erro: "Access denied" ou "1045"
- **Problema:** Credenciais MySQL incorretas
- **Solução:** Edite o arquivo `.env` no diretório `backend`:
  ```
  DB_DATABASE=gearlog
  DB_USERNAME=root
  DB_PASSWORD=  (deixe vazio se não tiver senha, ou coloque a senha)
  ```

### Erro: "Unknown database" ou "1049"
- **Problema:** Base de dados não existe
- **Solução:** Crie manualmente:
  ```powershell
  mysql -u root -e "CREATE DATABASE gearlog;"
  ```
  Depois execute as migrations novamente.

### Erro: "Table already exists"
- **Problema:** Migrations foram executadas parcialmente
- **Solução:** Execute:
  ```powershell
  php artisan migrate:fresh --seed
  ```
  ⚠️ **ATENÇÃO:** Isso vai apagar todas as tabelas e dados existentes!

## 📋 Comandos Úteis

```powershell
# Verificar status do MySQL
mysql -u root -e "SELECT 1;"

# Criar base de dados manualmente
mysql -u root -e "CREATE DATABASE IF NOT EXISTS gearlog;"

# Executar migrations
cd C:\Users\Ricardo\Desktop\GearLog\backend
php artisan migrate --seed

# Verificar tabelas criadas
mysql -u root -e "USE gearlog; SHOW TABLES;"

# Verificar usuários criados
mysql -u root -e "USE gearlog; SELECT email, name FROM users;"
```

## ✅ Após Corrigir

1. **Verifique se as tabelas foram criadas:**
   ```powershell
   mysql -u root -e "USE gearlog; SHOW TABLES;"
   ```

2. **Verifique se os usuários foram criados:**
   ```powershell
   mysql -u root -e "USE gearlog; SELECT email, name FROM users;"
   ```

3. **Teste o login no frontend:**
   - Acesse: http://localhost:5173
   - Faça login com: `admin@gearlog.local` / `password`

## 🆘 Ainda com Problemas?

1. **Verifique o log do Laravel:**
   - Arquivo: `C:\Users\Ricardo\Desktop\GearLog\backend\storage\logs\laravel.log`

2. **Verifique as credenciais no .env:**
   - Arquivo: `C:\Users\Ricardo\Desktop\GearLog\backend\.env`
   - Certifique-se de que `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` estão corretos

3. **Teste a conexão MySQL:**
   ```powershell
   mysql -u root -e "SELECT 1;"
   ```

