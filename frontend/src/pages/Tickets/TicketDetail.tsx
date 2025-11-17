import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTicketStore, type TicketComment } from '@/stores/ticketStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, MessageSquare, Send, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import type { User as UserType } from '@/types';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTicket, fetchTicket, updateStatus, assignTicket, resolveTicket, closeTicket, addComment, isLoading } = useTicketStore();
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchTicket(parseInt(id));
    }
    // Load users if user can assign
    const userRoles = user?.roles?.map(r => r.name) || [];
    if (userRoles.some(r => ['admin', 'gestor'].includes(r))) {
      loadUsers();
    }
  }, [id, user]);

  const loadUsers = async () => {
    try {
      const usersList = await api.getUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_parts: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;

    await addComment(parseInt(id), commentText);
    setCommentText('');
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await updateStatus(parseInt(id), status);
  };

  const handleResolve = async () => {
    if (!id || !resolutionText.trim()) {
      toast.error('Resolution description is required');
      return;
    }
    await resolveTicket(parseInt(id), resolutionText);
    setShowResolveForm(false);
    setResolutionText('');
  };

  const handleClose = async () => {
    if (!id) return;
    await closeTicket(parseInt(id), currentTicket?.resolution);
  };

  const handleAssign = async () => {
    if (!id) return;
    await assignTicket(parseInt(id), selectedUserId);
    // Force refresh the ticket to show updated assignment
    await fetchTicket(parseInt(id));
    setShowAssignForm(false);
    setSelectedUserId(null);
  };

  const handleUnassign = async () => {
    if (!id) return;
    await assignTicket(parseInt(id), null);
    // Force refresh the ticket to show updated assignment
    await fetchTicket(parseInt(id));
  };

  const canEdit = currentTicket && currentTicket.status !== 'closed';
  // Check permissions based on user roles
  const userRoles = user?.roles?.map(r => r.name) || [];
  const canChangeStatus = userRoles.some(r => ['admin', 'gestor', 'tecnico'].includes(r));
  const canAssign = userRoles.some(r => ['admin', 'gestor'].includes(r));
  const canClose = userRoles.some(r => ['admin', 'gestor'].includes(r));

  if (isLoading || !currentTicket) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentTicket.title}</h1>
            <p className="text-sm text-gray-500">Ticket #{currentTicket.id}</p>
          </div>
        </div>
        {canEdit && (
          <Link to={`/tickets/${currentTicket.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{currentTicket.description}</p>
            </CardContent>
          </Card>

          {currentTicket.resolution && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{currentTicket.resolution}</p>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({currentTicket.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTicket.comments && currentTicket.comments.length > 0 ? (
                currentTicket.comments.map((comment: TicketComment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{comment.user?.name || 'Unknown'}</span>
                      <span className="text-sm text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}

              {canEdit && (
                <form onSubmit={handleAddComment} className="pt-4 border-t">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="mb-2"
                  />
                  <Button type="submit" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500">Status</Label>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentTicket.status)}`}>
                    {formatStatus(currentTicket.status)}
                  </span>
                </div>
                {canChangeStatus && canEdit && (
                  <div className="mt-2 space-y-1">
                    {['open', 'in_progress', 'waiting_parts'].includes(currentTicket.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleStatusChange('in_progress')}
                      >
                        Mark In Progress
                      </Button>
                    )}
                    {currentTicket.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleStatusChange('waiting_parts')}
                      >
                        Mark Waiting Parts
                      </Button>
                    )}
                    {!currentTicket.resolution && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowResolveForm(true)}
                      >
                        Resolve
                      </Button>
                    )}
                    {currentTicket.status === 'resolved' && canClose && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleClose}
                      >
                        Close Ticket
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-500">Priority</Label>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(currentTicket.priority)}`}>
                    {currentTicket.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Type</Label>
                <p className="mt-1 capitalize">{currentTicket.type}</p>
              </div>

              {currentTicket.product && (
                <div>
                  <Label className="text-gray-500">Product</Label>
                  <Link to={`/products/${currentTicket.product.id}`} className="mt-1 text-blue-600 hover:underline block">
                    {currentTicket.product.name}
                  </Link>
                </div>
              )}

              <div>
                <Label className="text-gray-500">Opened By</Label>
                <p className="mt-1">{currentTicket.openedBy?.name || 'Unknown'}</p>
              </div>

              <div>
                <Label className="text-gray-500">Assigned To</Label>
                {currentTicket.assignedTo ? (
                  <div className="mt-1">
                    <p className="mb-2">{currentTicket.assignedTo.name}</p>
                    {canAssign && canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleUnassign}
                      >
                        Unassign
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-1">
                    <p className="text-gray-400 mb-2">Not assigned</p>
                    {canAssign && canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedUserId(null);
                          setShowAssignForm(true);
                        }}
                      >
                        Assign User
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-500">Created</Label>
                <p className="mt-1">{new Date(currentTicket.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {showResolveForm && (
            <Card>
              <CardHeader>
                <CardTitle>Resolve Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Resolution Description *</Label>
                  <Textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe how the ticket was resolved..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleResolve} className="flex-1">
                    Resolve
                  </Button>
                  <Button variant="outline" onClick={() => setShowResolveForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showAssignForm && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select User *</Label>
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Select a user...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAssign} 
                    className="flex-1"
                    disabled={!selectedUserId}
                  >
                    Assign
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAssignForm(false);
                    setSelectedUserId(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

