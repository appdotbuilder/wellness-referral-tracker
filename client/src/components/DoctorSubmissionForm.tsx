import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { trpc } from '@/utils/trpc';
import { Loader2 } from 'lucide-react';
import { OfficeManager } from '@/components/OfficeManager';
// Type imports with correct relative path from components folder
import type { 
  Office, 
  SubmitDoctorReferralInput, 
  DoctorType, 
  Gender, 
  WaitTime 
} from '../../../server/src/schema';

interface DoctorSubmissionFormProps {
  offices: Office[];
  onSuccess: () => void;
  onError: (message: string) => void;
  onOfficesChange: () => void;
}

export function DoctorSubmissionForm({ offices, onSuccess, onError, onOfficesChange }: DoctorSubmissionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SubmitDoctorReferralInput>({
    office_id: 0,
    doctor_name: '',
    type: 'general_practitioner',
    address: null,
    phone_number: null,
    gender: 'prefer_not_to_say',
    online_appointments: false,
    url: null,
    wait_time: 'unknown',
    same_day_service: false,
    comments: null,
    submitted_by: null
  });

  const doctorTypes: { value: DoctorType; label: string }[] = [
    { value: 'general_practitioner', label: 'General Practitioner' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'obgyn', label: 'OB/GYN' },
    { value: 'cardiologist', label: 'Cardiologist' },
    { value: 'dermatologist', label: 'Dermatologist' },
    { value: 'psychiatrist', label: 'Psychiatrist' },
    { value: 'neurologist', label: 'Neurologist' },
    { value: 'orthopedist', label: 'Orthopedist' },
    { value: 'pediatrician', label: 'Pediatrician' },
    { value: 'ophthalmologist', label: 'Ophthalmologist' },
    { value: 'other', label: 'Other' }
  ];

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  const waitTimeOptions: { value: WaitTime; label: string }[] = [
    { value: 'same_day', label: 'Same Day' },
    { value: 'within_week', label: 'Within a Week' },
    { value: 'within_month', label: 'Within a Month' },
    { value: 'over_month', label: 'Over a Month' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.office_id || formData.office_id === 0) {
      onError('Please select an office');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.submitDoctorReferral.mutate(formData);
      
      // Reset form
      setFormData({
        office_id: 0,
        doctor_name: '',
        type: 'general_practitioner',
        address: null,
        phone_number: null,
        gender: 'prefer_not_to_say',
        online_appointments: false,
        url: null,
        wait_time: 'unknown',
        same_day_service: false,
        comments: null,
        submitted_by: null
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to submit referral:', error);
      onError('Failed to submit referral. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Office Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="office">Medical Office *</Label>
            <OfficeManager 
              offices={offices}
              onOfficeCreated={onOfficesChange}
              onError={onError}
            />
          </div>
          <Select 
            value={formData.office_id > 0 ? formData.office_id.toString() : ''} 
            onValueChange={(value: string) => 
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                office_id: parseInt(value) || 0 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an office" />
            </SelectTrigger>
            <SelectContent>
              {offices.map((office: Office) => (
                <SelectItem key={office.id} value={office.id.toString()}>
                  {office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Doctor Name */}
        <div className="space-y-2">
          <Label htmlFor="doctor_name">Doctor Name *</Label>
          <Input
            id="doctor_name"
            value={formData.doctor_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                doctor_name: e.target.value 
              }))
            }
            placeholder="Dr. Jane Smith"
            required
          />
        </div>

        {/* Doctor Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Specialty *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: DoctorType) => 
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                type: value 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {doctorTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select 
            value={formData.gender} 
            onValueChange={(value: Gender) => 
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                gender: value 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                address: e.target.value || null 
              }))
            }
            placeholder="123 Main St, City, State 12345"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            value={formData.phone_number || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                phone_number: e.target.value || null 
              }))
            }
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                url: e.target.value || null 
              }))
            }
            placeholder="https://www.doctorwebsite.com"
          />
        </div>

        {/* Wait Time */}
        <div className="space-y-2">
          <Label htmlFor="wait_time">Typical Wait Time for Appointment</Label>
          <Select 
            value={formData.wait_time} 
            onValueChange={(value: WaitTime) => 
              setFormData((prev: SubmitDoctorReferralInput) => ({ 
                ...prev, 
                wait_time: value 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {waitTimeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="online_appointments"
              checked={formData.online_appointments}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: SubmitDoctorReferralInput) => ({ 
                  ...prev, 
                  online_appointments: checked 
                }))
              }
            />
            <Label htmlFor="online_appointments">Offers online appointments</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="same_day_service"
              checked={formData.same_day_service}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: SubmitDoctorReferralInput) => ({ 
                  ...prev, 
                  same_day_service: checked 
                }))
              }
            />
            <Label htmlFor="same_day_service">Offers same-day service</Label>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments">Additional Comments</Label>
        <Textarea
          id="comments"
          value={formData.comments || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: SubmitDoctorReferralInput) => ({ 
              ...prev, 
              comments: e.target.value || null 
            }))
          }
          placeholder="Any additional information about this healthcare provider..."
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 min-w-32"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Referral'
          )}
        </Button>
      </div>
    </form>
  );
}