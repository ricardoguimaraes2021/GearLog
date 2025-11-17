# 🚀 Guia Rápido: Criar Release no GitHub

## Passo a Passo Visual

### 1. Acessar a Página de Releases

1. Vá para o seu repositório no GitHub:
   ```
   https://github.com/ricardoguimaraes2021/GearLog
   ```

2. Clique em **"Releases"** (no menu lateral direito, ou na barra superior)

3. Ou acesse diretamente:
   ```
   https://github.com/ricardoguimaraes2021/GearLog/releases
   ```

### 2. Criar Novo Release

1. Clique no botão **"Draft a new release"** ou **"Create a new release"**

### 3. Preencher Informações do Release

#### Tag Version (Importante!)
1. Clique em **"Choose a tag"**
2. Digite: `v1.0.0` (ou outra versão, ex: `v1.0.1`)
3. Selecione: **"Create new tag: v1.0.0 on publish"**
   - Isso cria uma nova tag quando você publicar

#### Release Title
```
GearLog Setup v1.0.0
```

#### Description (Descrição do Release)
Cole este texto ou adapte:

```markdown
## 🎉 GearLog Automated Setup v1.0.0

### ✨ O que é?
Script de instalação automatizada para Windows que configura todo o projeto GearLog.

### 🚀 Como usar?
1. Baixe o arquivo `GearLogSetup.exe`
2. Execute o arquivo (duplo clique)
3. Siga as instruções na tela
4. Aguarde a instalação automática

### 📋 O que o script faz automaticamente?
- ✅ Instala PHP 8.3+, Composer, MySQL, Node.js
- ✅ Clona o repositório para o Desktop
- ✅ Configura backend (Laravel)
- ✅ Configura frontend (React)
- ✅ Cria e configura o banco de dados
- ✅ Executa migrações e seeders

### ⚙️ Requisitos
- Windows 10/11
- Privilégios de administrador (para instalar dependências)
- Conexão com a internet

### 📝 Notas
- O script funciona apenas no Windows
- Para macOS/Linux, use o script Python: `setup.py`
- Primeira execução pode levar alguns minutos

### 🔗 Links Úteis
- [Documentação Completa](https://github.com/ricardoguimaraes2021/GearLog#readme)
- [Guia de Instalação Manual](https://github.com/ricardoguimaraes2021/GearLog/blob/main/docs/SETUP.md)
```

### 4. Fazer Upload do Arquivo .exe

1. **Opção A: Arrastar e Soltar**
   - Role a página até a seção **"Attach binaries by dropping them here or selecting them"**
   - Arraste o arquivo `GearLogSetup.exe` para a área de upload
   - Aguarde o upload completar

2. **Opção B: Selecionar Arquivo**
   - Clique em **"selecting them"**
   - Navegue até o arquivo `GearLogSetup.exe`
   - Selecione o arquivo
   - Aguarde o upload completar

**Importante:** O arquivo deve estar nomeado exatamente como `GearLogSetup.exe`

### 5. Publicar o Release

1. Verifique se todas as informações estão corretas:
   - ✅ Tag criada
   - ✅ Título preenchido
   - ✅ Descrição adicionada
   - ✅ Arquivo .exe anexado

2. Clique no botão verde **"Publish release"** (no canto inferior direito)

3. Aguarde alguns segundos enquanto o GitHub processa

### 6. Verificar o Release

Após publicar, você verá:

1. **Página do Release:**
   - Mostra todas as informações
   - Link de download do .exe
   - Histórico de versões

2. **URLs de Download:**
   - **Última versão (automático):**
     ```
     https://github.com/ricardoguimaraes2021/GearLog/releases/latest/download/GearLogSetup.exe
     ```
   - **Versão específica:**
     ```
     https://github.com/ricardoguimaraes2021/GearLog/releases/download/v1.0.0/GearLogSetup.exe
     ```

### 7. Testar o Download

1. Acesse a landing page do projeto
2. Clique no botão "Download for Windows (.exe)"
3. Verifique se o download funciona

## ✅ Checklist Final

Antes de publicar, verifique:

- [ ] Tag version criada (ex: `v1.0.0`)
- [ ] Release title preenchido
- [ ] Description adicionada
- [ ] Arquivo `GearLogSetup.exe` anexado
- [ ] Tamanho do arquivo correto (aproximadamente 10-15 MB)
- [ ] Todas as informações estão corretas

## 🔄 Para Futuras Versões

Quando precisar criar uma nova versão:

1. Gere o novo .exe
2. Crie um novo release com uma nova tag (ex: `v1.0.1`)
3. Faça upload do novo arquivo
4. O link `/latest/download/` automaticamente apontará para a versão mais recente

## 🆘 Problemas Comuns

### "Tag already exists"
- Use uma versão diferente (ex: `v1.0.1` em vez de `v1.0.0`)

### Upload falha
- Verifique o tamanho do arquivo (máximo 2GB)
- Verifique sua conexão com a internet
- Tente novamente

### Link 404 após publicar
- Aguarde alguns minutos (pode levar tempo para propagar)
- Verifique se o release está publicado (não está como draft)
- Verifique se o nome do arquivo está correto: `GearLogSetup.exe`

## 📸 Screenshots de Referência

### Tela de Criação de Release
```
┌─────────────────────────────────────────┐
│ Choose a tag                            │
│ [v1.0.0 ▼] [Create new tag on publish] │
├─────────────────────────────────────────┤
│ Release title                           │
│ [GearLog Setup v1.0.0              ]    │
├─────────────────────────────────────────┤
│ Describe this release                   │
│ [                                    ]  │
│ [                                    ]  │
│ [                                    ]  │
├─────────────────────────────────────────┤
│ Attach binaries                         │
│ [Drag & Drop GearLogSetup.exe here]    │
│                                         │
│ [Publish release] [Save draft]         │
└─────────────────────────────────────────┘
```

## 🎯 Próximos Passos

Após criar o release:

1. ✅ Teste o download do .exe
2. ✅ Verifique se a landing page funciona
3. ✅ Compartilhe o link com usuários
4. ✅ Monitore feedback e issues

---

**Precisa de ajuda?** Abra uma issue no repositório ou consulte a documentação completa em `GITHUB_RELEASE_GUIDE.md`

