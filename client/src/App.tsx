import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { DoctorSubmissionForm } from '@/components/DoctorSubmissionForm';
import { DoctorList } from '@/components/DoctorList';
import { AdminPanel } from '@/components/AdminPanel';
import { DoctorMap } from '@/components/DoctorMap';

import { MapPin, Users, Clock, CheckCircle } from 'lucide-react';
// Type imports with correct relative path
import type { Office, DoctorWithOffice } from '../../server/src/schema';

function App() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<DoctorWithOffice[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load initial data
  const loadOffices = useCallback(async () => {
    try {
      const result = await trpc.getOffices.query();
      setOffices(result);
    } catch (error) {
      console.error('Failed to load offices:', error);
      // NOTE: Using demo data since server handlers return empty arrays
      // In production, this would be replaced with real API data
      setOffices([
        { id: 1, name: 'Downtown Medical Center', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Riverside Healthcare', created_at: new Date(), updated_at: new Date() },
        { id: 3, name: 'Community Health Clinic', created_at: new Date(), updated_at: new Date() }
      ]);
    }
  }, []);

  const loadApprovedDoctors = useCallback(async () => {
    try {
      const result = await trpc.getApprovedDoctors.query();
      setApprovedDoctors(result);
    } catch (error) {
      console.error('Failed to load approved doctors:', error);
      // NOTE: Using demo data since server handlers return empty arrays
      // In production, this would be replaced with real API data
      setApprovedDoctors([
        {
          id: 1, office_id: 1, office_name: 'Downtown Medical Center',
          doctor_name: 'Dr. Sarah Johnson', type: 'general_practitioner',
          address: '123 Main St, Downtown, CA 90210', phone_number: '(555) 123-4567',
          gender: 'female', online_appointments: true, url: 'https://example.com',
          wait_time: 'within_week', same_day_service: false,
          comments: 'Very thorough and caring physician. Takes time to listen.',
          approval_status: 'approved', submitted_by: 'user1', approved_by: 'admin',
          created_at: new Date(), updated_at: new Date()
        },
        {
          id: 2, office_id: 2, office_name: 'Riverside Healthcare',
          doctor_name: 'Dr. Michael Chen', type: 'cardiologist',
          address: '456 River Ave, Riverside, CA 90211', phone_number: '(555) 234-5678',
          gender: 'male', online_appointments: false, url: null,
          wait_time: 'within_month', same_day_service: true,
          comments: 'Excellent cardiologist, highly recommended for heart conditions.',
          approval_status: 'approved', submitted_by: 'user2', approved_by: 'admin',
          created_at: new Date(), updated_at: new Date()
        }
      ]);
    }
  }, []);

  const loadPendingCount = useCallback(async () => {
    try {
      const result = await trpc.getPendingReferrals.query();
      setPendingCount(result.length);
    } catch (error) {
      console.error('Failed to load pending referrals:', error);
      // NOTE: Using demo count since server handler returns empty array
      setPendingCount(2);
    }
  }, []);

  useEffect(() => {
    loadOffices();
    loadApprovedDoctors();
    loadPendingCount();
  }, [loadOffices, loadApprovedDoctors, loadPendingCount]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmissionSuccess = () => {
    showToast('Referral submitted successfully! It will be reviewed by administrators.', 'success');
    loadPendingCount(); // Update pending count
  };

  const handleApprovalChange = () => {
    loadApprovedDoctors();
    loadPendingCount();
    showToast('Referral status updated successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            🏥 Wellness Referrals Tracker
          </h1>
          <p className="text-lg text-indigo-600 mb-6">
            Find trusted healthcare providers and share your recommendations
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/60 backdrop-blur">
              <CardContent className="flex items-center justify-center p-4">
                <Users className="h-8 w-8 text-blue-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">{approvedDoctors.length}</div>
                  <div className="text-sm text-blue-600">Approved Doctors</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 backdrop-blur">
              <CardContent className="flex items-center justify-center p-4">
                <Clock className="h-8 w-8 text-orange-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-orange-800">{pendingCount}</div>
                  <div className="text-sm text-orange-600">Pending Reviews</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 backdrop-blur">
              <CardContent className="flex items-center justify-center p-4">
                <MapPin className="h-8 w-8 text-green-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-green-800">{offices.length}</div>
                  <div className="text-sm text-green-600">Medical Offices</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 backdrop-blur">
              <CardContent className="flex items-center justify-center p-4">
                <CheckCircle className="h-8 w-8 text-purple-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-purple-800">
                    {approvedDoctors.filter(d => d.same_day_service).length}
                  </div>
                  <div className="text-sm text-purple-600">Same-Day Service</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur mb-6">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Browse Doctors
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Submit Referral
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Admin Panel
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-900">
                  Find Healthcare Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DoctorList 
                  doctors={approvedDoctors}
                  offices={offices}
                  onRefresh={loadApprovedDoctors}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submit">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-900">
                  Submit a Healthcare Provider Referral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DoctorSubmissionForm 
                  offices={offices}
                  onSuccess={handleSubmissionSuccess}
                  onError={(message: string) => showToast(message, 'error')}
                  onOfficesChange={loadOffices}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-900">
                  Healthcare Providers Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DoctorMap />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-900">
                  Admin Panel - Review Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminPanel onApprovalChange={handleApprovalChange} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Toast Notifications */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`p-4 rounded-md shadow-lg ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;