<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        // Ensure user has a company
        if ($user->company_id === null) {
            return false;
        }
        
        // Admin, Manager, Technician can view all
        // Viewer can only view their own
        return $user->hasAnyRole(['admin', 'gestor', 'tecnico', 'viewer']);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        // Ensure ticket belongs to user's company
        if ($user->company_id === null || $ticket->company_id !== $user->company_id) {
            return false;
        }
        
        // Admin and Manager can view all
        if ($user->hasAnyRole(['admin', 'gestor'])) {
            return true;
        }

        // Technician can view assigned tickets or tickets they opened
        if ($user->hasRole('tecnico')) {
            return $ticket->assigned_to === $user->id || $ticket->opened_by === $user->id;
        }

        // Viewer can only view tickets they opened
        if ($user->hasRole('viewer')) {
            return $ticket->opened_by === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        // Ensure user has a company
        return $user->company_id !== null;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        // Ensure ticket belongs to user's company
        if ($user->company_id === null || $ticket->company_id !== $user->company_id) {
            return false;
        }
        
        // Cannot update closed tickets
        if ($ticket->status === 'closed') {
            return false;
        }

        // Admin and Manager can update all
        if ($user->hasAnyRole(['admin', 'gestor'])) {
            return true;
        }

        // The person who created the ticket can always update it (edit, add comments)
        if ($ticket->opened_by === $user->id) {
            return true;
        }

        // Technician can update assigned tickets
        if ($user->hasRole('tecnico')) {
            return $ticket->assigned_to === $user->id;
        }

        // Viewer can only update tickets they opened
        if ($user->hasRole('viewer')) {
            return $ticket->opened_by === $user->id;
        }

        return false;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        // Ensure ticket belongs to user's company
        if ($user->company_id === null || $ticket->company_id !== $user->company_id) {
            return false;
        }
        
        // Only admin can delete
        return $user->hasRole('admin');
    }

    public function assign(User $user, Ticket $ticket): bool
    {
        // Ensure ticket belongs to user's company
        if ($user->company_id === null || $ticket->company_id !== $user->company_id) {
            return false;
        }
        
        // Admin and Manager can assign
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function changeStatus(User $user, Ticket $ticket): bool
    {
        // Ensure ticket belongs to user's company
        if ($user->company_id === null || $ticket->company_id !== $user->company_id) {
            return false;
        }
        
        // Cannot change status of closed tickets
        if ($ticket->status === 'closed') {
            return false;
        }

        // Admin and Manager can always change status (they have full permissions)
        if ($user->hasAnyRole(['admin', 'gestor'])) {
            return true;
        }

        // For other roles, only the assigned person can change status
        // Check if user is assigned to the ticket (assigned_to)
        if ($ticket->assigned_to === $user->id) {
            // Only users with technician role or higher can change status when assigned
            // This ensures only people with proper permissions can change status
            return $user->hasAnyRole(['tecnico', 'admin', 'gestor']);
        }

        // If ticket is assigned to an employee (not a user), we check if the user's email matches the employee's email
        // This allows users who are linked to employees (via email) to change status
        if ($ticket->employee_id) {
            $employee = \App\Models\Employee::find($ticket->employee_id);
            if ($employee && $employee->email === $user->email) {
                // User's email matches employee's email, allow status change if they have proper role
                return $user->hasAnyRole(['tecnico', 'admin', 'gestor']);
            }
        }
        
        return false;
    }

    public function close(User $user, Ticket $ticket): bool
    {
        // Ensure ticket belongs to user's company
        if ($user->company_id === null || $ticket->company_id !== $user->company_id) {
            return false;
        }
        
        // Admin and Manager can close
        return $user->hasAnyRole(['admin', 'gestor']);
    }
}
