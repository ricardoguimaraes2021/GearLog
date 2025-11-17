# Demo Data Seeder

Este seeder popula a base de dados com dados fictícios realistas para demonstração da plataforma GearLog.

## O que é criado:

### Produtos (30+ produtos)
- Laptops (Dell, HP, Apple, Lenovo, ASUS)
- Desktops (Dell, HP, Lenovo)
- Monitores (Dell, HP, LG, Samsung)
- Teclados (Logitech, Microsoft, Corsair)
- Ratos (Logitech, Microsoft, Razer)
- Equipamentos de rede (Cisco, Ubiquiti, Netgear)
- Armazenamento (Samsung, Western Digital, Seagate)

**Status variados:**
- Produtos novos (new)
- Produtos usados (used)
- Produtos avariados (damaged)
- Produtos em reparação (repair)
- Produtos reservados (reserved)
- Produtos com stock baixo (quantity <= 1)

### Movimentos
- Movimentos de entrada (entrada)
- Movimentos de saída (saida)
- Alocações (alocacao)
- Devoluções (devolucao)
- Histórico de movimentos para vários produtos

### Atribuições de Ativos (Asset Assignments)
- 15+ atribuições de produtos a funcionários
- Algumas atribuições ativas (não devolvidas)
- Algumas atribuições já devolvidas
- Datas de atribuição e devolução realistas

### Tickets (12+ tickets)
- Tickets críticos (critical) - abertos e em progresso
- Tickets de alta prioridade (high)
- Tickets de média prioridade (medium)
- Tickets de baixa prioridade (low)
- Tickets com diferentes status:
  - Abertos (open)
  - Em progresso (in_progress)
  - À espera de peças (waiting_parts)
  - Resolvidos (resolved)
  - Fechados (closed)
- Tickets com SLA violado (para demonstrar alertas)
- Tickets com SLA em risco (80% do tempo decorrido)
- Tickets não atribuídos (para demonstrar alertas)
- Comentários em tickets ativos

## Como executar:

### Opção 1: Executar apenas o DemoDataSeeder
```bash
cd backend
php artisan db:seed --class=DemoDataSeeder
```

### Opção 2: Adicionar ao DatabaseSeeder (recomendado)
Adicione ao método `run()` do `DatabaseSeeder.php`:

```php
$this->call([
    DepartmentSeeder::class,
    EmployeeSeeder::class,
    DemoDataSeeder::class, // Adicione esta linha
]);
```

Depois execute:
```bash
cd backend
php artisan db:seed
```

### Opção 3: Limpar e recriar tudo
Se quiser limpar os dados existentes e recriar tudo:

```bash
cd backend
php artisan migrate:fresh --seed
```

**Nota:** Se usar `migrate:fresh`, todos os dados serão apagados, incluindo utilizadores. O `DatabaseSeeder` será executado primeiro, criando utilizadores, categorias, departamentos e funcionários, e depois o `DemoDataSeeder` criará os dados de demonstração.

## Dados de Login:

Após executar o seeder, pode usar estas credenciais:

- **Admin:** admin@gearlog.local / password
- **Gestor:** gestor@gearlog.local / password
- **Técnico:** tecnico@gearlog.local / password

## Funcionalidades Demonstradas:

Com estes dados, pode demonstrar:

1. **Dashboard:**
   - KPIs de produtos, tickets e funcionários
   - Alertas (stock baixo, produtos avariados, SLA violado, etc.)
   - Gráficos e estatísticas

2. **Gestão de Inventário:**
   - Lista de produtos com diferentes status
   - Filtros e pesquisa
   - Detalhes de produtos
   - Movimentos de stock

3. **Atribuições:**
   - Produtos atribuídos a funcionários
   - Histórico de atribuições
   - Devoluções

4. **Tickets:**
   - Lista de tickets com diferentes prioridades e status
   - Tickets críticos
   - Tickets não atribuídos
   - SLA tracking
   - Comentários

5. **Funcionários e Departamentos:**
   - Lista de funcionários
   - Departamentos com gestores
   - Atribuições por funcionário

## Notas:

- Os dados são criados respeitando as business rules do sistema
- Produtos avariados não podem ser alocados
- Stock não pode ficar negativo
- Tickets têm deadlines de SLA calculados corretamente
- Alguns tickets têm SLA violado para demonstrar alertas

