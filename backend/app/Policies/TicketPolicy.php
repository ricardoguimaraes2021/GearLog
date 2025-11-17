<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        // Admin, Manager, Technician can view all
        // Consulta can only view their own
        return $user->hasAnyRole(['admin', 'gestor', 'tecnico', 'consulta']);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        // Admin and Manager can view all
        if ($user->hasAnyRole(['admin', 'gestor'])) {
            return true;
        }

        // Technician can view assigned tickets or tickets they opened
        if ($user->hasRole('tecnico')) {
            return $ticket->assigned_to === $user->id || $ticket->opened_by === $user->id;
        }

        // Consulta can only view tickets they opened
        if ($user->hasRole('consulta')) {
            return $ticket->opened_by === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        // All authenticated users can create tickets
        return true;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        // Cannot update closed tickets
        if ($ticket->status === 'closed') {
            return false;
        }

        // Admin and Manager can update all
        if ($user->hasAnyRole(['admin', 'gestor'])) {
            return true;
        }

        // Technician can update assigned tickets or tickets they opened
        if ($user->hasRole('tecnico')) {
            return $ticket->assigned_to === $user->id || $ticket->opened_by === $user->id;
        }

        // Consulta can only update tickets they opened (but not change status)
        if ($user->hasRole('consulta')) {
            return $ticket->opened_by === $user->id;
        }

        return false;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        // Only admin can delete
        return $user->hasRole('admin');
    }

    public function assign(User $user, Ticket $ticket): bool
    {
        // Admin and Manager can assign
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function changeStatus(User $user, Ticket $ticket): bool
    {
        // Cannot change status of closed tickets
        if ($ticket->status === 'closed') {
            return false;
        }

        // Admin, Manager, and Technician can change status
        return $user->hasAnyRole(['admin', 'gestor', 'tecnico']);
    }

    public function close(User $user, Ticket $ticket): bool
    {
        // Admin and Manager can close
        return $user->hasAnyRole(['admin', 'gestor']);
    }
}
