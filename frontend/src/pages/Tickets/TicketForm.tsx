import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketStore } from '@/stores/ticketStore';
import { useProductStore } from '@/stores/productStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, X, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';

export default function TicketForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { currentTicket, fetchTicket, createTicket, updateTicket, isLoading } = useTicketStore();
  const { products, fetchProducts } = useProductStore();

  const [formData, setFormData] = useState({
    title: '',
    product_id: '',
    priority: 'medium' as const,
    type: 'other' as const,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts(1);
    if (isEditing && id) {
      fetchTicket(parseInt(id));
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (isEditing && currentTicket) {
      setFormData({
        title: currentTicket.title,
        product_id: currentTicket.product_id?.toString() || '',
        priority: currentTicket.priority,
        type: currentTicket.type,
        description: currentTicket.description,
      });
      setExistingAttachments(currentTicket.attachments || []);
    }
  }, [currentTicket, isEditing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has an invalid type. Allowed: images, PDF, DOC, DOCX, TXT.`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    if (!formData.description.trim()) {
      setErrors({ description: 'Description is required' });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('type', formData.type);
      
      if (formData.product_id) {
        formDataToSend.append('product_id', formData.product_id);
      }

      // Add existing attachments
      if (existingAttachments.length > 0) {
        existingAttachments.forEach((path, index) => {
          formDataToSend.append(`attachments[${index}]`, path);
        });
      }

      // Add new files
      selectedFiles.forEach((file) => {
        formDataToSend.append('attachment_files[]', file);
      });

      if (isEditing && id) {
        // For update, use FormData
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tickets/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update ticket');
        }

        toast.success('Ticket updated successfully');
        navigate(`/tickets/${id}`);
      } else {
        // For create, use FormData
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tickets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create ticket');
        }

        const ticket = await response.json();
        toast.success('Ticket created successfully');
        navigate(`/tickets/${ticket.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save ticket');
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Ticket' : 'New Ticket'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                className={errors.title ? 'border-red-500' : ''}
                required
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="damage">Damage</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="update">Update</option>
                  <option value="audit">Audit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="priority">Priority *</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="product_id">Product (Optional)</Label>
              <select
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No product selected</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) setErrors({ ...errors, description: '' });
                    }}
                    className={errors.description ? 'border-red-500' : ''}
                    rows={6}
                    required
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <Label htmlFor="attachments">Attachments</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="attachments">
                      <Button type="button" variant="outline" className="cursor-pointer">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Add Files
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 10MB per file. Allowed: Images, PDF, DOC, DOCX, TXT
                    </p>
                  </div>

                  {/* Existing attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">Existing Attachments</Label>
                      {existingAttachments.map((path, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <span className="text-sm text-gray-700">{getFileName(path)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">New Files</Label>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'} Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

