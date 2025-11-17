# Real-time Notifications System - Implementation Plan

## 🎯 Overview

Implementação de um sistema completo de notificações em tempo real usando **Laravel Broadcasting** com **Pusher** ou **Laravel Echo Server**, **Laravel Echo** no frontend, e componentes React para exibir notificações.

## 📋 Funcionalidades que Podem Ser Implementadas

### 1. **Notificações de Tickets** 🎫

#### Eventos que Disparam Notificações:
- ✅ **Novo Ticket Criado**
  - Notificar: Admin, Manager, e usuários com permissão de visualizar tickets
  - Badge: Incrementar contador de tickets não lidos
  - Pop-up: "Novo ticket #123 criado: [Título]"

- ✅ **Ticket Atribuído**
  - Notificar: Usuário que recebeu a atribuição
  - Badge: Incrementar contador de tickets atribuídos
  - Pop-up: "Ticket #123 foi atribuído a você"

- ✅ **Novo Comentário em Ticket**
  - Notificar: Criador do ticket, usuário atribuído, e todos que comentaram
  - Badge: Incrementar contador de comentários não lidos
  - Pop-up: "[Usuário] comentou no ticket #123"

- ✅ **Mudança de Status**
  - Notificar: Criador do ticket, usuário atribuído, Admin, Manager
  - Pop-up: "Ticket #123 mudou de status: [Status Anterior] → [Novo Status]"

- ✅ **SLA Violado ou em Risco**
  - Notificar: Admin, Manager, usuário atribuído
  - Badge: Badge especial vermelho para SLA violado
  - Pop-up: "⚠️ SLA do ticket #123 foi violado!" ou "⚠️ SLA do ticket #123 está em risco!"

- ✅ **Ticket Resolvido/Fechado**
  - Notificar: Criador do ticket, Admin, Manager
  - Pop-up: "Ticket #123 foi resolvido/fechado"

### 2. **Notificações de Inventário** 📦

#### Eventos que Disparam Notificações:
- ✅ **Estoque Baixo**
  - Notificar: Admin, Manager
  - Badge: Badge de alerta no menu
  - Pop-up: "⚠️ Produto [Nome] está com estoque baixo (Quantidade: X)"

- ✅ **Produto Marcado como Danificado**
  - Notificar: Admin, Manager
  - Pop-up: "Produto [Nome] foi marcado como danificado"

- ✅ **Novo Movimento de Produto**
  - Notificar: Admin, Manager (opcional, pode ser desabilitado)
  - Pop-up: "Novo movimento: [Tipo] de [Quantidade] unidades do produto [Nome]"

- ✅ **Produto sem Movimento há 30+ Dias**
  - Notificar: Admin, Manager
  - Badge: Badge de alerta
  - Pop-up: "Produto [Nome] não teve movimentos nos últimos 30 dias"

- ✅ **Tentativa de Movimento com Estoque Insuficiente**
  - Notificar: Usuário que tentou fazer o movimento
  - Pop-up: "❌ Erro: Estoque insuficiente para o produto [Nome]"

### 3. **Notificações de Sistema** ⚙️

#### Eventos que Disparam Notificações:
- ✅ **Novo Usuário Criado**
  - Notificar: Admin
  - Pop-up: "Novo usuário criado: [Nome] ([Email])"

- ✅ **Permissões Alteradas**
  - Notificar: Usuário afetado, Admin
  - Pop-up: "Suas permissões foram atualizadas"

- ✅ **Export Concluído**
  - Notificar: Usuário que solicitou o export
  - Pop-up: "Export concluído! Clique para baixar"

### 4. **Badge no Menu Lateral** 🏷️

#### Contadores:
- **Tickets Não Lidos**: Contador de tickets novos ou com comentários não lidos
- **Tickets Atribuídos**: Contador de tickets atribuídos ao usuário atual
- **SLA Violado**: Badge vermelho para tickets com SLA violado
- **Alertas**: Contador de alertas (estoque baixo, produtos inativos, etc.)
- **Notificações Gerais**: Contador total de notificações não lidas

### 5. **Feed Interno de Eventos** 📰

#### Timeline de Atividades:
- **Atividades Recentes**: Últimas 50 atividades do sistema
- **Filtros**:
  - Por tipo (Tickets, Produtos, Movimentos, Sistema)
  - Por usuário
  - Por data
- **Visualização**:
  - Timeline vertical com ícones
  - Agrupamento por data
  - Links para itens relacionados
- **Atualização em Tempo Real**: Novos eventos aparecem automaticamente

## 🏗️ Arquitetura Técnica

### Backend (Laravel)

#### 1. **Broadcasting Setup**
```php
// config/broadcasting.php
'connections' => [
    'pusher' => [
        'driver' => 'pusher',
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'app_id' => env('PUSHER_APP_ID'),
        'options' => [
            'cluster' => env('PUSHER_APP_CLUSTER'),
            'encrypted' => true,
        ],
    ],
    // Ou usar Laravel Echo Server (self-hosted)
]
```

#### 2. **Event Classes**
```php
// app/Events/TicketCreated.php
// app/Events/TicketAssigned.php
// app/Events/TicketCommented.php
// app/Events/TicketStatusChanged.php
// app/Events/SlaViolated.php
// app/Events/LowStockAlert.php
// app/Events/ProductDamaged.php
// app/Events/MovementCreated.php
// etc.
```

#### 3. **Notification Model**
```php
// app/Models/Notification.php
- id
- user_id (destinatário)
- type (ticket_created, ticket_assigned, etc.)
- title
- message
- data (JSON com dados adicionais)
- read_at
- created_at
```

#### 4. **Notification Channels**
- **Database**: Armazenar notificações no banco
- **Broadcast**: Enviar via WebSocket em tempo real
- **Mail** (opcional): Enviar email para notificações importantes

### Frontend (React)

#### 1. **Laravel Echo Setup**
```typescript
// src/services/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  encrypted: true,
  authEndpoint: '/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});

export default echo;
```

#### 2. **Notification Store (Zustand)**
```typescript
// src/stores/notificationStore.ts
- notifications: Notification[]
- unreadCount: number
- ticketUnreadCount: number
- alertsCount: number
- fetchNotifications()
- markAsRead()
- markAllAsRead()
- listenToBroadcasts()
```

#### 3. **Notification Components**
- **NotificationBell**: Ícone com badge no menu
- **NotificationDropdown**: Dropdown com lista de notificações
- **NotificationToast**: Pop-up toast para notificações importantes
- **NotificationFeed**: Página com feed completo de eventos
- **NotificationBadge**: Badge para contadores

#### 4. **Real-time Listeners**
```typescript
// Escutar eventos específicos
echo.private(`user.${userId}`)
  .notification((notification) => {
    // Adicionar notificação ao store
    // Mostrar toast
    // Atualizar badges
  });

echo.private('tickets')
  .listen('.ticket.created', (event) => {
    // Notificar usuários relevantes
  });
```

## 📦 Dependências Necessárias

### Backend
```bash
composer require pusher/pusher-php-server
# Ou para self-hosted:
composer require beyondcode/laravel-websockets
```

### Frontend
```bash
npm install laravel-echo pusher-js
```

## 🎨 UI/UX Features

### 1. **Notification Bell**
- Ícone de sino no menu superior
- Badge com contador de não lidas
- Animação quando nova notificação chega
- Cores diferentes por tipo (vermelho para urgente, amarelo para aviso, azul para info)

### 2. **Notification Dropdown**
- Lista de últimas 10-20 notificações
- Agrupamento por data
- Botão "Marcar todas como lidas"
- Link "Ver todas" para feed completo
- Indicador visual de não lidas

### 3. **Notification Toast**
- Pop-up não intrusivo no canto da tela
- Auto-dismiss após 5 segundos
- Botão para fechar manualmente
- Link para item relacionado
- Som opcional (configurável)

### 4. **Notification Feed Page**
- Timeline completa de eventos
- Filtros e busca
- Paginação infinita
- Marcar como lida ao clicar
- Ações rápidas (ir para ticket, produto, etc.)

### 5. **Badges no Menu**
- Badge no item "Tickets" com contador
- Badge no item "Dashboard" com alertas
- Cores dinâmicas (vermelho para urgente)

## 🔔 Exemplos de Notificações

### Ticket Criado
```
🎫 Novo Ticket Criado
Ticket #123: Laptop não liga
Criado por: João Silva
Há 2 minutos
[Ver Ticket]
```

### SLA Violado
```
⚠️ SLA Violado
Ticket #123: Laptop não liga
O SLA de resolução foi violado!
Há 1 hora
[Ver Ticket]
```

### Estoque Baixo
```
📦 Estoque Baixo
Produto: Mouse Logitech MX Master 3
Quantidade atual: 2 unidades
Há 5 minutos
[Ver Produto]
```

### Novo Comentário
```
💬 Novo Comentário
Maria comentou no ticket #123
"Verifiquei o problema, precisa de peça..."
Há 10 minutos
[Ver Ticket]
```

## 🚀 Implementação em Fases

### Fase 1: Setup Básico
1. Instalar dependências (Pusher/Laravel Echo Server)
2. Configurar broadcasting
3. Criar modelo de Notification
4. Criar eventos básicos (TicketCreated, TicketAssigned)

### Fase 2: Frontend Básico
1. Configurar Laravel Echo
2. Criar NotificationStore
3. Criar NotificationBell component
4. Implementar listeners básicos

### Fase 3: Notificações de Tickets
1. Implementar todos os eventos de tickets
2. Criar NotificationDropdown
3. Implementar badges no menu
4. Criar página de feed

### Fase 4: Notificações de Inventário
1. Implementar eventos de produtos
2. Implementar eventos de movimentos
3. Adicionar alertas de estoque

### Fase 5: Polimento
1. Adicionar sons (opcional)
2. Melhorar animações
3. Adicionar filtros no feed
4. Implementar preferências de notificação

## 📊 Benefícios

1. **Melhor Colaboração**: Equipe fica informada em tempo real
2. **Resposta Mais Rápida**: Notificações imediatas de tickets e alertas
3. **Melhor UX**: Usuários não precisam atualizar a página
4. **Aumento de Produtividade**: Menos tempo procurando informações
5. **Transparência**: Todos veem o que está acontecendo no sistema

## 🔒 Segurança

- Autenticação via Laravel Sanctum
- Canais privados por usuário
- Validação de permissões antes de enviar notificações
- Rate limiting para prevenir spam
- Sanitização de dados antes de enviar

## 📝 Notas

- **Pusher**: Serviço pago, mas fácil de configurar
- **Laravel Echo Server**: Self-hosted, gratuito, mas requer mais configuração
- **Redis + Socket.io**: Alternativa open-source completa
- **WebSockets nativos**: Mais complexo, mas mais controle

