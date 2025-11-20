<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\TicketLog;
use Illuminate\Support\Facades\DB;

class TicketService
{
    public function __construct(
        protected SlaService $slaService
    ) {
    }

    public function createTicket(array $data, int $userId): Ticket
    {
        return DB::transaction(function () use ($data, $userId) {
            // Validate that assigned user belongs to the same company as the creator
            if (!empty($data['assigned_to'])) {
                $opener = \App\Models\User::find($userId);
                $assignedUser = \App\Models\User::find($data['assigned_to']);
                
                if (!$assignedUser) {
                    throw new BusinessRuleException(
                        'The specified user does not exist.',
                        "User {$data['assigned_to']} not found",
                        ['assigned_to' => $data['assigned_to']]
                    );
                }
                
                if ($opener && $opener->company_id && $assignedUser->company_id !== $opener->company_id) {
                    throw new BusinessRuleException(
                        'Cannot assign ticket to a user from a different company.',
                        "User {$data['assigned_to']} belongs to company {$assignedUser->company_id}, but creator belongs to company {$opener->company_id}",
                        [
                            'assigned_user_id' => $data['assigned_to'],
                            'assigned_user_company_id' => $assignedUser->company_id,
                            'creator_company_id' => $opener->company_id,
                        ]
                    );
                }
            }
            
            $opener = \App\Models\User::find($userId);
            $ticket = Ticket::create([
                'title' => $data['title'],
                'product_id' => $data['product_id'] ?? null,
                'opened_by' => $userId,
                'company_id' => $opener->company_id ?? null, // Set company_id from opener
                'assigned_to' => $data['assigned_to'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'type' => $data['type'] ?? 'other',
                'status' => 'open',
                'description' => $data['description'],
                'attachments' => $data['attachments'] ?? [],
            ]);

            // Calculate and set SLA deadlines
            $deadlines = $this->slaService->calculateDeadlines($ticket);
            $ticket->update([
                'first_response_deadline' => $deadlines['first_response_deadline'],
                'resolution_deadline' => $deadlines['resolution_deadline'],
            ]);

            // If ticket is for damage and has a product, mark product as damaged
            if ($ticket->type === 'damage' && $ticket->product_id) {
                $product = Product::find($ticket->product_id);
                if ($product && $product->status !== 'damaged') {
                    $product->update(['status' => 'damaged']);
                }
            }

            // Create log entry
            TicketLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action' => 'created',
                'new_value' => ['status' => 'open'],
            ]);

            // Fire event for notifications
            event(new \App\Events\TicketCreated($ticket));

            // If assigned, fire assignment event
            if ($ticket->assigned_to) {
                event(new \App\Events\TicketAssigned($ticket, $ticket->assignedTo));
            }

            return $ticket->load(['product', 'openedBy', 'assignedTo']);
        });
    }

    public function updateTicket(Ticket $ticket, array $data, int $userId): Ticket
    {
        if (!$ticket->canBeEdited()) {
            throw new BusinessRuleException(
                'Cannot edit a closed ticket.',
                "Ticket {$ticket->id} is closed and cannot be edited"
            );
        }

        return DB::transaction(function () use ($ticket, $data, $userId) {
            $oldValues = [];
            $newValues = [];

            $allowedFields = ['title', 'description', 'priority', 'type', 'product_id'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field]) && $ticket->$field !== $data[$field]) {
                    $oldValues[$field] = $ticket->$field;
                    $newValues[$field] = $data[$field];
                    $ticket->$field = $data[$field];
                }
            }

            if (!empty($newValues)) {
                $ticket->save();
                
                TicketLog::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'status_changed',
                    'old_value' => $oldValues,
                    'new_value' => $newValues,
                ]);
            }

            return $ticket->load(['product', 'openedBy', 'assignedTo']);
        });
    }

    public function updateStatus(Ticket $ticket, string $status, int $userId, ?string $resolution = null): Ticket
    {
        if ($status === 'closed' && !$ticket->canBeClosed()) {
            throw new BusinessRuleException(
                'Cannot close this ticket in its current state.',
                "Ticket {$ticket->id} cannot be closed"
            );
        }

        if ($status === 'closed' && $ticket->status !== 'resolved' && empty($resolution)) {
            throw new BusinessRuleException(
                'Resolution is required before closing a ticket.',
                "Ticket {$ticket->id} requires resolution before closing"
            );
        }

        if ($status === 'resolved' && empty($resolution)) {
            throw new BusinessRuleException(
                'Resolution description is required when resolving a ticket.',
                "Ticket {$ticket->id} requires resolution description"
            );
        }

            return DB::transaction(function () use ($ticket, $status, $userId, $resolution) {
            $oldStatus = $ticket->status;
            $ticket->status = $status;
            
            if ($resolution) {
                $ticket->resolution = $resolution;
            }

            $ticket->save();

            TicketLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action' => 'status_changed',
                'old_value' => ['status' => $oldStatus],
                'new_value' => ['status' => $status, 'resolution' => $resolution],
            ]);

            // If closing, create closed log
            if ($status === 'closed') {
                TicketLog::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'closed',
                    'old_value' => ['status' => $oldStatus],
                    'new_value' => ['status' => 'closed'],
                ]);
            }

            // Fire status changed event
            if ($oldStatus !== $status) {
                event(new \App\Events\TicketStatusChanged($ticket, $oldStatus, $status));
            }

            return $ticket->load(['product', 'openedBy', 'assignedTo']);
        });
    }

    public function assignTicket(Ticket $ticket, ?int $assignedTo, int $userId): Ticket
    {
        return DB::transaction(function () use ($ticket, $assignedTo, $userId) {
            // Validate that assigned user belongs to the same company as the ticket
            if ($assignedTo) {
                $assignedUser = \App\Models\User::find($assignedTo);
                if (!$assignedUser) {
                    throw new BusinessRuleException(
                        'The specified user does not exist.',
                        "User {$assignedTo} not found",
                        ['assigned_to' => $assignedTo]
                    );
                }

                // Ensure assigned user belongs to the same company as the ticket
                if ($ticket->company_id && $assignedUser->company_id !== $ticket->company_id) {
                    throw new BusinessRuleException(
                        'Cannot assign ticket to a user from a different company.',
                        "User {$assignedTo} belongs to company {$assignedUser->company_id}, but ticket belongs to company {$ticket->company_id}",
                        [
                            'assigned_user_id' => $assignedTo,
                            'assigned_user_company_id' => $assignedUser->company_id,
                            'ticket_company_id' => $ticket->company_id,
                        ]
                    );
                }
            }

            $oldAssignedTo = $ticket->assigned_to;
            $ticket->assigned_to = $assignedTo;
            $ticket->save();

            $action = $assignedTo ? 'assigned' : 'unassigned';
            TicketLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action' => $action,
                'old_value' => ['assigned_to' => $oldAssignedTo],
                'new_value' => ['assigned_to' => $assignedTo],
            ]);

            // Refresh the ticket to get updated relationships
            $ticket->refresh();
            $ticket->load(['product', 'openedBy', 'assignedTo']);

            // Fire assignment event
            $assignedUser = $assignedTo ? \App\Models\User::find($assignedTo) : null;
            event(new \App\Events\TicketAssigned($ticket, $assignedUser));

            return $ticket;
        });
    }

    public function assignTicketToEmployee(Ticket $ticket, int $employeeId, int $userId): Ticket
    {
        return DB::transaction(function () use ($ticket, $employeeId, $userId) {
            // Validate that assigned employee belongs to the same company as the ticket
            $assignedEmployee = \App\Models\Employee::find($employeeId);
            if (!$assignedEmployee) {
                throw new BusinessRuleException(
                    'The specified employee does not exist.',
                    "Employee {$employeeId} not found",
                    ['employee_id' => $employeeId]
                );
            }

            // Ensure assigned employee belongs to the same company as the ticket
            if ($ticket->company_id && $assignedEmployee->company_id !== $ticket->company_id) {
                throw new BusinessRuleException(
                    'Cannot assign ticket to an employee from a different company.',
                    "Employee {$employeeId} belongs to company {$assignedEmployee->company_id}, but ticket belongs to company {$ticket->company_id}",
                    [
                        'assigned_employee_id' => $employeeId,
                        'assigned_employee_company_id' => $assignedEmployee->company_id,
                        'ticket_company_id' => $ticket->company_id,
                    ]
                );
            }

            $oldEmployeeId = $ticket->employee_id;
            $ticket->employee_id = $employeeId;
            $ticket->save();

            $action = 'assigned_to_employee';
            TicketLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action' => $action,
                'old_value' => ['employee_id' => $oldEmployeeId],
                'new_value' => ['employee_id' => $employeeId],
            ]);

            // Refresh the ticket to get updated relationships
            $ticket->refresh();
            $ticket->load(['product', 'openedBy', 'assignedTo', 'employee']);

            return $ticket;
        });
    }

    public function deleteTicket(Ticket $ticket, int $userId): bool
    {
        // Only admin can delete tickets
        $user = \App\Models\User::find($userId);
        if (!$user || !$user->hasRole('admin')) {
            throw new BusinessRuleException(
                'Only administrators can delete tickets.',
                "User {$userId} does not have permission to delete tickets"
            );
        }

        return DB::transaction(function () use ($ticket) {
            // Delete related records
            $ticket->comments()->delete();
            $ticket->logs()->delete();
            return $ticket->delete();
        });
    }
}

