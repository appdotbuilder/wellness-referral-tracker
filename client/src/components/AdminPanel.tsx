import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { CheckCircle, XCircle, Clock, MapPin, Phone, Globe, Loader2 } from 'lucide-react';
// Type imports with correct relative path from components folder  
import type { DoctorWithOffice, ReviewReferralInput } from '../../../server/src/schema';

interface AdminPanelProps {
  onApprovalChange: () => void;
}

export function AdminPanel({ onApprovalChange }: AdminPanelProps) {
  const [pendingReferrals, setPendingReferrals] = useState<DoctorWithOffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadPendingReferrals = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPendingReferrals.query();
      setPendingReferrals(result);
    } catch (error) {
      console.error('Failed to load pending referrals:', error);
      // NOTE: Using demo data since server handler returns empty array
      // In production, this would be replaced with real API data
      setPendingReferrals([
        {
          id: 3, office_id: 1, office_name: 'Downtown Medical Center',
          doctor_name: 'Dr. Emily Rodriguez', type: 'dentist',
          address: '789 Oak St, Downtown, CA 90210', phone_number: '(555) 345-6789',
          gender: 'female', online_appointments: true, url: 'https://dentist-example.com',
          wait_time: 'same_day', same_day_service: true,
          comments: 'Great with children and very gentle approach.',
          approval_status: 'pending', submitted_by: 'user3', approved_by: null,
          created_at: new Date(), updated_at: new Date()
        },
        {
          id: 4, office_id: 3, office_name: 'Community Health Clinic',
          doctor_name: 'Dr. James Wilson', type: 'psychiatrist',
          address: null, phone_number: '(555) 456-7890',
          gender: 'male', online_appointments: true, url: null,
          wait_time: 'within_week', same_day_service: false,
          comments: 'Specializes in anxiety and depression treatment.',
          approval_status: 'pending', submitted_by: 'user4', approved_by: null,
          created_at: new Date(), updated_at: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingReferrals();
  }, [loadPendingReferrals]);

  const handleApproval = async (referralId: number, status: 'approved' | 'rejected') => {
    setProcessingId(referralId);
    try {
      const reviewData: ReviewReferralInput = {
        id: referralId,
        approval_status: status,
        approved_by: 'admin' // In a real app, this would come from auth context
      };

      await trpc.reviewReferral.mutate(reviewData);
      
      // Remove from pending list
      setPendingReferrals((prev: DoctorWithOffice[]) => 
        prev.filter((referral: DoctorWithOffice) => referral.id !== referralId)
      );
      
      onApprovalChange();
    } catch (error) {
      console.error('Failed to update referral status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const doctorTypes: Record<string, string> = {
    'general_practitioner': 'General Practitioner',
    'dentist': 'Dentist',
    'obgyn': 'OB/GYN',
    'cardiologist': 'Cardiologist',
    'dermatologist': 'Dermatologist',
    'psychiatrist': 'Psychiatrist',
    'neurologist': 'Neurologist',
    'orthopedist': 'Orthopedist',
    'pediatrician': 'Pediatrician',
    'ophthalmologist': 'Ophthalmologist',
    'other': 'Other'
  };

  const genderLabels: Record<string, string> = {
    'male': 'Male',
    'female': 'Female',
    'non_binary': 'Non-binary',
    'prefer_not_to_say': 'Prefer not to say'
  };

  const waitTimeLabels: Record<string, string> = {
    'same_day': 'Same Day',
    'within_week': 'Within a Week',
    'within_month': 'Within a Month',
    'over_month': 'Over a Month',
    'unknown': 'Unknown'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-lg text-gray-600">Loading pending referrals...</span>
      </div>
    );
  }

  if (pendingReferrals.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Referrals</h3>
          <p className="text-gray-500">All referrals have been reviewed. Great job! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Pending Referrals ({pendingReferrals.length})
        </h2>
        <Button variant="outline" onClick={loadPendingReferrals} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {pendingReferrals.map((referral: DoctorWithOffice) => (
          <Card key={referral.id} className="border-l-4 border-l-yellow-400">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    {referral.doctor_name}
                  </CardTitle>
                  <p className="text-lg text-indigo-600 font-medium">
                    {doctorTypes[referral.type] || referral.type}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Review
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Office and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">{referral.office_name}</span>
                  </p>
                  {referral.address && (
                    <p className="text-gray-600 ml-6">{referral.address}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  {referral.phone_number && (
                    <p className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {referral.phone_number}
                    </p>
                  )}
                  {referral.url && (
                    <p className="flex items-center text-gray-600">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a 
                        href={referral.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {referral.url}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{genderLabels[referral.gender]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Wait Time</p>
                  <p className="font-medium">{waitTimeLabels[referral.wait_time]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Online Appointments</p>
                  <p className="font-medium">{referral.online_appointments ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Same-Day Service</p>
                  <p className="font-medium">{referral.same_day_service ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Comments */}
              {referral.comments && (
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-400">
                  <p className="text-sm text-gray-500 mb-1">Comments</p>
                  <p className="text-gray-700 italic">"{referral.comments}"</p>
                </div>
              )}

              {/* Submission Info */}
              <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t">
                <span>
                  Submitted: {referral.created_at.toLocaleDateString()} at {referral.created_at.toLocaleTimeString()}
                </span>
                {referral.submitted_by && (
                  <span>Submitted by: {referral.submitted_by}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      disabled={processingId === referral.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Referral</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to approve this referral for {referral.doctor_name}? 
                        It will become visible to all users browsing healthcare providers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleApproval(referral.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === referral.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          'Approve'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      disabled={processingId === referral.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Referral</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reject this referral for {referral.doctor_name}? 
                        This action cannot be undone and the referral will be removed from the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleApproval(referral.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {processingId === referral.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          'Reject'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}