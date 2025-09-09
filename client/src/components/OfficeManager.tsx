import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Building, Loader2 } from 'lucide-react';
// Type imports with correct relative path from components folder
import type { Office, CreateOfficeInput } from '../../../server/src/schema';

interface OfficeManagerProps {
  offices: Office[];
  onOfficeCreated: () => void;
  onError: (message: string) => void;
}

export function OfficeManager({ offices, onOfficeCreated, onError }: OfficeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOfficeInput>({
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      onError('Office name is required');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.createOffice.mutate(formData);
      
      // Reset form and close dialog
      setFormData({ name: '' });
      setIsOpen(false);
      onOfficeCreated();
    } catch (error) {
      console.error('Failed to create office:', error);
      onError('Failed to create office. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Office
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            Add New Medical Office
          </DialogTitle>
          <DialogDescription>
            Add a new medical office to the system. This will be available for selection when submitting referrals.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="office-name">Office Name *</Label>
              <Input
                id="office-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateOfficeInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Downtown Medical Center"
                required
                disabled={isLoading}
              />
            </div>
            
            {/* Show existing offices for reference */}
            {offices.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Offices:</Label>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1 text-sm text-gray-600">
                    {offices.map((office: Office) => (
                      <div key={office.id} className="flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        {office.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Office'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}