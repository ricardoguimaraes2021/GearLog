## 🎉 GearLog Automated Setup v1.0.0

### ✨ O que é?
Script de instalação automatizada para Windows que configura todo o projeto GearLog de forma rápida e simples. Não é necessário conhecimento técnico - apenas execute e siga as instruções!

### 🚀 Como usar?
1. Baixe o arquivo `GearLogSetup.exe`
2. Execute o arquivo (duplo clique)
3. Siga as instruções na tela
4. Aguarde a instalação automática (pode levar alguns minutos)

### 📋 O que o script faz automaticamente?
- ✅ Instala PHP 8.3+, Composer, MySQL, Node.js
- ✅ Clona o repositório para o Desktop
- ✅ Configura backend (Laravel)
- ✅ Configura frontend (React)
- ✅ Cria e configura o banco de dados
- ✅ Executa migrações e seeders
- ✅ Cria usuários padrão (admin, gestor, técnico)

### ⚙️ Requisitos
- **Sistema Operacional:** Windows 10/11
- **Privilégios:** Administrador (necessário para instalar dependências)
- **Conexão:** Internet (para baixar dependências e clonar repositório)
- **Espaço em disco:** ~500 MB (para dependências e projeto)

### 📝 Notas Importantes
- ⚠️ O script funciona apenas no **Windows**
- 💻 Para **macOS/Linux**, use o script Python: `setup.py`
- ⏱️ A primeira execução pode levar **5-10 minutos** (dependendo da velocidade da internet)
- 🔒 Alguns antivírus podem alertar - é um falso positivo comum com executáveis Python

### 🔗 Links Úteis
- 📖 [Documentação Completa](https://github.com/ricardoguimaraes2021/GearLog#readme)
- 📚 [Guia de Instalação Manual](https://github.com/ricardoguimaraes2021/GearLog/blob/main/docs/SETUP.md)
- 🐛 [Reportar Problemas](https://github.com/ricardoguimaraes2021/GearLog/issues)
- 💬 [Suporte](https://github.com/ricardoguimaraes2021/GearLog/discussions)

### 🎯 Após a Instalação
Após o script completar, você terá:
- **Backend rodando em:** http://localhost:8000
- **Frontend rodando em:** http://localhost:5173
- **API Docs em:** http://localhost:8000/api/documentation

### 🔑 Credenciais Padrão
Após a instalação, você pode fazer login com:
- **Admin:** `admin@gearlog.local` / `password`
- **Gestor:** `gestor@gearlog.local` / `password`
- **Técnico:** `tecnico@gearlog.local` / `password`

### ⚡ Iniciar o Projeto
Para iniciar o projeto após a instalação:

**Terminal 1 - Backend:**
```bash
cd ~/Desktop/GearLog/backend
php artisan serve
```

**Terminal 2 - Frontend:**
```bash
cd ~/Desktop/GearLog/frontend
npm run dev
```

Depois acesse: http://localhost:5173

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de equipamentos de TI**

