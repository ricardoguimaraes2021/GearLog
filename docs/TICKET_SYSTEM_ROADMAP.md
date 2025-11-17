# Ticket System - Roadmap & Next Steps

## ✅ Implementado

### Backend
- ✅ Database migrations (tickets, ticket_comments, ticket_logs)
- ✅ Models com relacionamentos
- ✅ TicketService com lógica de negócio
- ✅ TicketController com CRUD completo
- ✅ TicketCommentController
- ✅ TicketPolicy com permissões baseadas em roles
- ✅ Rotas API completas
- ✅ Atualização automática do status do produto quando ticket de avaria é criado
- ✅ Histórico de logs (backend)

### Frontend
- ✅ Store Zustand para tickets
- ✅ Página de lista de tickets com filtros
- ✅ Página de detalhes do ticket
- ✅ Formulário de criação/edição
- ✅ Sistema de comentários
- ✅ Atribuição de tickets a usuários
- ✅ Gestão de estados
- ✅ Integração no menu principal
- ✅ Menu mobile

## 🚧 Próximos Passos (Prioritários)

### 1. **Dashboard de Tickets** (Alta Prioridade)
**Descrição:** Criar um dashboard específico para tickets com métricas e estatísticas.

**Funcionalidades:**
- Cards com métricas:
  - Total de tickets abertos
  - Tickets por prioridade (low, medium, high, critical)
  - Tickets por status
  - Tickets atribuídos a cada técnico
  - Tempo médio de resolução
  - Taxa de resolução (% tickets resolvidos vs abertos)
- Gráficos:
  - Tickets por tipo (damage, maintenance, etc.)
  - Tickets por técnico
  - Evolução temporal de tickets
- Lista de tickets recentes
- Tickets urgentes (critical priority, open)

**Arquivos a criar/modificar:**
- `backend/app/Http/Controllers/Api/TicketDashboardController.php`
- `frontend/src/pages/Tickets/TicketDashboard.tsx`
- Adicionar endpoint `/api/v1/tickets/dashboard`

---

### 2. **Upload de Anexos** (Alta Prioridade)
**Descrição:** Permitir upload de imagens/arquivos em tickets e comentários.

**Funcionalidades:**
- Upload de múltiplos arquivos ao criar ticket
- Upload de arquivos em comentários
- Visualização de anexos (imagens, PDFs, etc.)
- Download de anexos
- Validação de tipo e tamanho de arquivo

**Arquivos a criar/modificar:**
- `backend/app/Http/Controllers/Api/TicketAttachmentController.php`
- Adicionar campo de upload no `TicketForm.tsx`
- Adicionar upload no formulário de comentários
- Criar componente para visualizar anexos

---

### 3. **Histórico de Logs no Frontend** (Média Prioridade)
**Descrição:** Exibir o histórico completo de ações do ticket na página de detalhes.

**Funcionalidades:**
- Timeline de eventos (criado, status alterado, atribuído, comentado, fechado)
- Mostrar quem fez cada ação e quando
- Mostrar valores antigos e novos em mudanças
- Filtros por tipo de ação

**Arquivos a modificar:**
- `frontend/src/pages/Tickets/TicketDetail.tsx` - adicionar seção de histórico
- Criar componente `TicketHistory.tsx`

---

### 4. **Atualização do Status do Produto ao Resolver/Fechar** (Média Prioridade)
**Descrição:** Quando um ticket é resolvido ou fechado, perguntar se quer atualizar o status do produto.

**Funcionalidades:**
- Modal/dialog ao resolver ticket de avaria
- Opções: reparado, usado, standby, outro
- Atualizar status do produto automaticamente
- Apenas para tickets do tipo "damage"

**Arquivos a modificar:**
- `frontend/src/pages/Tickets/TicketDetail.tsx` - adicionar modal
- `backend/app/Services/TicketService.php` - adicionar lógica

---

### 5. **Export de Tickets** (Média Prioridade)
**Descrição:** Permitir exportar tickets em CSV, Excel ou PDF.

**Funcionalidades:**
- Export de lista de tickets filtrada
- Export de ticket individual (PDF)
- Incluir comentários e histórico no export
- Formato similar ao export de produtos

**Arquivos a criar/modificar:**
- Adicionar método `export` no `TicketController.php`
- Adicionar botão de export na página de tickets
- Usar Laravel Excel e DomPDF (já instalados)

---

### 6. **Integração no Dashboard Principal** (Média Prioridade)
**Descrição:** Adicionar métricas de tickets no dashboard principal.

**Funcionalidades:**
- Card com total de tickets abertos
- Card com tickets críticos pendentes
- Link para página de tickets
- Lista de tickets recentes

**Arquivos a modificar:**
- `backend/app/Http/Controllers/Api/DashboardController.php`
- `frontend/src/pages/Dashboard/Dashboard.tsx`

---

### 7. **Filtros Avançados** (Baixa Prioridade)
**Descrição:** Melhorar os filtros na lista de tickets.

**Funcionalidades:**
- Filtro por técnico atribuído
- Filtro por data (criado, atualizado)
- Filtro por produto
- Filtro combinado (múltiplos critérios)
- Salvar filtros favoritos

**Arquivos a modificar:**
- `frontend/src/pages/Tickets/Tickets.tsx`

---

### 8. **Métricas Avançadas** (Baixa Prioridade)
**Descrição:** Adicionar métricas mais detalhadas.

**Funcionalidades:**
- Tempo médio até primeira resposta
- Tempo total de resolução
- Número de tickets por produto
- Número de tickets por técnico
- Número de avarias por categoria
- Gráficos de tendências

**Arquivos a criar/modificar:**
- `backend/app/Http/Controllers/Api/TicketDashboardController.php`
- `frontend/src/pages/Tickets/TicketDashboard.tsx`

---

### 9. **Notificações Internas** (Baixa Prioridade)
**Descrição:** Sistema de notificações quando tickets são atribuídos ou atualizados.

**Funcionalidades:**
- Badge com número de notificações no menu
- Notificar técnico quando ticket é atribuído
- Notificar quando há novo comentário
- Painel de notificações
- Marcar como lida

**Arquivos a criar:**
- `backend/app/Models/Notification.php`
- `backend/database/migrations/create_notifications_table.php`
- `frontend/src/components/Notifications.tsx`

---

### 10. **Melhorias de UX** (Baixa Prioridade)
**Descrição:** Pequenas melhorias na experiência do usuário.

**Funcionalidades:**
- Atalhos de teclado
- Busca avançada
- Ordenação por colunas na tabela
- Visualização em cards vs tabela
- Dark mode (opcional)

---

## 📋 Resumo de Prioridades

### 🔴 Alta Prioridade
1. Dashboard de Tickets
2. Upload de Anexos

### 🟡 Média Prioridade
3. Histórico de Logs no Frontend
4. Atualização do Status do Produto ao Resolver/Fechar
5. Export de Tickets
6. Integração no Dashboard Principal

### 🟢 Baixa Prioridade
7. Filtros Avançados
8. Métricas Avançadas
9. Notificações Internas
10. Melhorias de UX

---

## 🎯 Recomendação de Implementação

**Sugestão de ordem:**
1. **Dashboard de Tickets** - Fornece visão geral e métricas essenciais
2. **Upload de Anexos** - Funcionalidade muito solicitada pelos usuários
3. **Histórico de Logs no Frontend** - Melhora a rastreabilidade
4. **Atualização do Status do Produto** - Completa o fluxo de trabalho
5. **Export de Tickets** - Útil para relatórios
6. **Integração no Dashboard Principal** - Conecta tickets ao sistema principal

