import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/utils/toast';
import { productSchema, type ProductFormData } from '@/utils/validation';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { currentProduct, fetchProduct, createProduct, updateProduct, isLoading } =
    useProductStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand: '',
    model: '',
    serial_number: '',
    status: 'new' as const,
    quantity: 0,
    value: '',
    purchase_date: '',
    description: '',
    specs: undefined as Record<string, any> | undefined,
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [specsEntries, setSpecsEntries] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    fetchCategories();
    if (isEditing && id) {
      fetchProduct(parseInt(id));
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (isEditing && currentProduct) {
      setFormData({
        name: currentProduct.name,
        category_id: currentProduct.category_id.toString(),
        brand: currentProduct.brand || '',
        model: currentProduct.model || '',
        serial_number: currentProduct.serial_number || '',
        status: currentProduct.status,
        quantity: currentProduct.quantity,
        value: currentProduct.value?.toString() || '',
        purchase_date: currentProduct.purchase_date || '',
        description: currentProduct.description || '',
        specs: currentProduct.specs || undefined,
      });
      if (currentProduct.image_url) {
        setImagePreview(api.getStorageUrl(currentProduct.image_url) || '');
      }
      if (currentProduct.invoice_url) {
        setInvoicePreview(api.getStorageUrl(currentProduct.invoice_url) || '');
      }
      // Load specs into editable format
      if (currentProduct.specs && Object.keys(currentProduct.specs).length > 0) {
        setSpecsEntries(
          Object.entries(currentProduct.specs).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      } else {
        setSpecsEntries([]);
      }
    }
  }, [currentProduct, isEditing]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoice(file);
      // For PDFs, we can't preview, but for images we can
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setInvoicePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setInvoicePreview(null);
      }
    }
  };

  const handleRemoveInvoice = () => {
    setInvoice(null);
    setInvoicePreview(null);
    // Reset file input
    const fileInput = document.getElementById('invoice-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    try {
      const validationData = {
        ...formData,
        category_id: formData.category_id || '',
        value: formData.value || undefined,
      };
      productSchema.parse(validationData);
    } catch (error: any) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path) {
            validationErrors[err.path[0]] = err.message;
          }
        });
        setErrors(validationErrors);
        toast.error('Please fix the validation errors');
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Skip specs - we'll handle it separately
        if (key === 'specs') {
          return;
        }
        
        // Skip empty values for other fields
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Handle specs: convert specsEntries to JSON object
      const specsObject: Record<string, any> = {};
      specsEntries.forEach((entry) => {
        if (entry.key.trim() && entry.value.trim()) {
          // Try to parse value as number or boolean, otherwise keep as string
          const trimmedValue = entry.value.trim();
          if (trimmedValue === 'true' || trimmedValue === 'false') {
            specsObject[entry.key.trim()] = trimmedValue === 'true';
          } else if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
            specsObject[entry.key.trim()] = Number(trimmedValue);
          } else {
            specsObject[entry.key.trim()] = trimmedValue;
          }
        }
      });
      
      if (Object.keys(specsObject).length > 0) {
        formDataToSend.append('specs', JSON.stringify(specsObject));
      }

      if (image) {
        formDataToSend.append('image', image);
      }

      if (invoice) {
        formDataToSend.append('invoice', invoice);
      }

      if (isEditing && id) {
        await updateProduct(parseInt(id), formDataToSend);
        toast.success('Product updated successfully');
      } else {
        await createProduct(formDataToSend);
        toast.success('Product created successfully');
      }
      navigate('/inventory/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={errors.name ? 'border-red-500' : ''}
                  required
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </Label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData({ ...formData, category_id: e.target.value });
                    if (errors.category_id) setErrors({ ...errors, category_id: '' });
                  }}
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.category_id ? 'border-red-500' : 'border-input'}`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="damaged">Damaged</option>
                  <option value="repair">Repair</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <Label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 });
                    if (errors.quantity) setErrors({ ...errors, quantity: '' });
                  }}
                  className={errors.quantity ? 'border-red-500' : ''}
                  required
                />
                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <Label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Value</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => {
                    setFormData({ ...formData, value: e.target.value });
                    if (errors.value) setErrors({ ...errors, value: '' });
                  }}
                  className={errors.value ? 'border-red-500' : ''}
                />
                {errors.value && <p className="text-sm text-red-500 mt-1">{errors.value}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <Input
                  type="date"
                  max={new Date().toISOString().split('T')[0]} // Set max to today
                  value={formData.purchase_date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    if (selectedDate > today) {
                      // Prevent selecting future dates
                      return;
                    }
                    setFormData({ ...formData, purchase_date: selectedDate });
                    if (errors.purchase_date) setErrors({ ...errors, purchase_date: '' });
                  }}
                  className={errors.purchase_date ? 'border-red-500' : ''}
                />
                {errors.purchase_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.purchase_date}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <Input 
                  id="image-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
                {imagePreview && (
                  <div className="mt-2 flex items-start gap-3">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice (PDF or Image)</label>
                <Input 
                  id="invoice-input"
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={handleInvoiceChange} 
                />
                {invoicePreview && (
                  <div className="mt-2 flex items-start gap-3">
                    <img src={invoicePreview} alt="Invoice Preview" className="w-32 h-32 object-cover rounded" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveInvoice}
                      className="mt-2"
                    >
                      Remove Invoice
                    </Button>
                  </div>
                )}
                {invoice && !invoicePreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm text-gray-600">{invoice.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveInvoice}
                    >
                      Remove Invoice
                    </Button>
                  </div>
                )}
                {invoicePreview && !invoice && currentProduct?.invoice_url && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Current invoice:</p>
                    <a
                      href={invoicePreview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Invoice
                    </a>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specifications
                </label>
                <div className="space-y-2 border rounded-md p-4 bg-gray-50">
                  {specsEntries.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No specifications added. Click "Add Specification" to add one.
                    </p>
                  ) : (
                    specsEntries.map((entry, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder="Key (e.g., RAM, Storage, CPU)"
                          value={entry.key}
                          onChange={(e) => {
                            const newEntries = [...specsEntries];
                            newEntries[index].key = e.target.value;
                            setSpecsEntries(newEntries);
                          }}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value (e.g., 16GB, 512GB SSD, Intel i7)"
                          value={entry.value}
                          onChange={(e) => {
                            const newEntries = [...specsEntries];
                            newEntries[index].value = e.target.value;
                            setSpecsEntries(newEntries);
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSpecsEntries(specsEntries.filter((_, i) => i !== index));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSpecsEntries([...specsEntries, { key: '', value: '' }]);
                    }}
                    className="w-full mt-2"
                  >
                    + Add Specification
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Add key-value pairs for product specifications (e.g., RAM: 16GB, Storage: 512GB)
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Product' : 'Create Product'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/inventory/products')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

