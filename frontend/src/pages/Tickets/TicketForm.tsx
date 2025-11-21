import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTicketStore } from '@/stores/ticketStore';
import { useProductStore } from '@/stores/productStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, X, Paperclip, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';

export default function TicketForm() {
  const { user } = useAuthStore();
  
  // Check if user is viewer - viewers cannot access tickets
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  
  // Show access denied message for viewers
  if (isViewer) {
    return (
      <div className="space-y-6">
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-warning" />
              <div>
                <CardTitle className="text-text-primary">Access Restricted</CardTitle>
                <CardDescription className="text-text-secondary">
                  Your current role does not allow access to tickets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                <AlertCircle className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-text-primary font-medium mb-2">
                    Viewer Role Limitations
                  </p>
                  <p className="text-text-secondary text-sm mb-3">
                    As a Viewer, you have read-only access. To create or manage tickets, please contact your company owner or administrator to update your role.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/tickets">Back to Tickets</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { currentTicket, fetchTicket, createTicket, updateTicket, isLoading } = useTicketStore();
  const { products, fetchProducts } = useProductStore();
  const { employees, fetchEmployees } = useEmployeeStore();

  const [formData, setFormData] = useState({
    title: '',
    product_id: '',
    employee_id: '',
    priority: 'medium' as const,
    type: 'other' as const,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts(1);
    fetchEmployees(1);
    if (isEditing && id) {
      fetchTicket(parseInt(id));
    }
  }, [id, isEditing, fetchProducts, fetchEmployees]);

  useEffect(() => {
    if (isEditing && currentTicket) {
      setFormData({
        title: currentTicket.title,
        product_id: currentTicket.product_id?.toString() || '',
        employee_id: (currentTicket as any).employee_id?.toString() || '',
        priority: currentTicket.priority,
        type: currentTicket.type,
        description: currentTicket.description,
      });
      setExistingAttachments(currentTicket.attachments || []);
    }
  }, [currentTicket, isEditing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'];
    
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Check MIME type
      if (!allowedTypes.includes(file.type)) {
        // Also check by extension as fallback (some browsers may not detect MIME type correctly)
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          toast.error(
            `File "${file.name}" has an invalid format. ` +
            `Allowed formats: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, TXT. ` +
            `Maximum size: 10MB per file.`
          );
          return false;
        }
      }
      
      return true;
    });
    
    if (validFiles.length < files.length) {
      toast.warning(`${files.length - validFiles.length} file(s) were rejected. Please check the allowed formats.`);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
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
      if (formData.employee_id) {
        formDataToSend.append('employee_id', formData.employee_id);
      }

      // Add existing attachments
      if (existingAttachments.length > 0) {
        existingAttachments.forEach((path, index) => {
          formDataToSend.append(`attachments[${index}]`, path);
        });
      }

      // Add new files - Laravel expects array format without brackets in the key
      selectedFiles.forEach((file) => {
        formDataToSend.append('attachment_files[]', file);
      });
      
      // Debug: Log FormData contents
      console.log('FormData files:', selectedFiles.length);
      for (const [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`File: ${key}`, value.name, value.size, value.type);
        }
      }

      if (isEditing && id) {
        // For update, use FormData with api client (Content-Type will be set automatically)
        try {
          const response = await api.client.put(`/tickets/${id}`, formDataToSend);
          toast.success('Ticket updated successfully');
          navigate(`/tickets/${id}`);
        } catch (error: any) {
          // Handle validation errors with more detail
          if (error.response?.status === 422 && error.response?.data?.errors) {
            const validationErrors = error.response.data.errors;
            const errorMessages: string[] = [];
            
            // Extract file validation errors
            if (validationErrors['attachment_files.0']) {
              errorMessages.push(...validationErrors['attachment_files.0']);
            }
            if (validationErrors['attachment_files.*']) {
              errorMessages.push(...validationErrors['attachment_files.*']);
            }
            
            // Extract other validation errors
            Object.keys(validationErrors).forEach(key => {
              if (!key.startsWith('attachment_files')) {
                errorMessages.push(...validationErrors[key]);
              }
            });
            
            if (errorMessages.length > 0) {
              errorMessages.forEach(msg => toast.error(msg));
            } else {
              toast.error(error.response?.data?.message || 'Validation failed. Please check your input.');
            }
          } else {
            throw new Error(error.response?.data?.error || 'Failed to update ticket');
          }
        }
      } else {
        // For create, use FormData with api client (Content-Type will be set automatically)
        try {
          const response = await api.client.post('/tickets', formDataToSend);
          toast.success('Ticket created successfully');
          navigate(`/tickets/${response.data.id}`);
        } catch (error: any) {
          // Handle validation errors with more detail
          if (error.response?.status === 422 && error.response?.data?.errors) {
            const validationErrors = error.response.data.errors;
            const errorMessages: string[] = [];
            
            // Extract file validation errors
            if (validationErrors['attachment_files.0']) {
              errorMessages.push(...validationErrors['attachment_files.0']);
            }
            if (validationErrors['attachment_files.*']) {
              errorMessages.push(...validationErrors['attachment_files.*']);
            }
            
            // Extract other validation errors
            Object.keys(validationErrors).forEach(key => {
              if (!key.startsWith('attachment_files')) {
                errorMessages.push(...validationErrors[key]);
              }
            });
            
            if (errorMessages.length > 0) {
              errorMessages.forEach(msg => toast.error(msg));
            } else {
              toast.error(error.response?.data?.message || 'Validation failed. Please check your input.');
            }
          } else {
            throw new Error(error.response?.data?.error || 'Failed to create ticket');
          }
        }
      }
    } catch (error: any) {
      if (!error.message || !error.message.includes('Validation failed')) {
        toast.error(error.message || 'Failed to save ticket');
      }
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
        <h1 className="text-3xl font-bold text-text-primary">
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
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="block text-sm font-medium text-text-primary">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
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
                <Label htmlFor="priority" className="block text-sm font-medium text-text-primary">Priority *</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
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
              <Label htmlFor="product_id" className="block text-sm font-medium text-text-primary">Product (Optional)</Label>
              <select
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
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
              <Label htmlFor="employee_id" className="block text-sm font-medium text-text-primary">Employee (Optional)</Label>
              <select
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
              >
                <option value="">No employee selected</option>
                {employees.filter(emp => emp.status === 'active').map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_code})
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
                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <Label htmlFor="attachments">Attachments</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="attachments"
                      ref={(input) => {
                        if (input) {
                          (window as any).ticketFileInput = input;
                        }
                      }}
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => {
                        const input = document.getElementById('attachments') as HTMLInputElement;
                        if (input) {
                          input.click();
                        }
                      }}
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Add Files
                    </Button>
                    <p className="text-xs text-text-secondary mt-1">
                      <strong>Allowed formats:</strong> JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, TXT
                      <br />
                      <strong>Maximum size:</strong> 10MB per file
                    </p>
                  </div>

                  {/* Existing attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">Existing Attachments</Label>
                      {existingAttachments.map((path, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-surface-alt dark:bg-surface-alt rounded border border-border">
                          <span className="text-sm text-text-primary">{getFileName(path)}</span>
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
                        <div key={index} className="flex items-center justify-between p-2 bg-accent-primary/10 dark:bg-accent-primary/20 rounded border border-border">
                          <span className="text-sm text-text-primary">{file.name}</span>
                          <span className="text-xs text-text-secondary">
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

