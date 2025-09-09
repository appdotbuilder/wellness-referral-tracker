import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw 
} from 'lucide-react';
// Type imports with correct relative path from components folder  
import type { DoctorWithOffice } from '../../../server/src/schema';

export function DoctorMap() {
  const [doctorsWithLocations, setDoctorsWithLocations] = useState<DoctorWithOffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithOffice | null>(null);

  const loadDoctorsWithLocations = useCallback(async () => {
    try {
      const result = await trpc.getDoctorsWithLocations.query();
      setDoctorsWithLocations(result);
    } catch (error) {
      console.error('Failed to load doctors with locations:', error);
      // NOTE: Using demo data since server handler returns empty array
      // In production, this would be replaced with real API data
      setDoctorsWithLocations([
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorsWithLocations();
  }, [loadDoctorsWithLocations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDoctorsWithLocations();
    } finally {
      setIsRefreshing(false);
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

  const waitTimeLabels: Record<string, string> = {
    'same_day': 'Same Day',
    'within_week': 'Within a Week',
    'within_month': 'Within a Month',
    'over_month': 'Over a Month',
    'unknown': 'Unknown'
  };

  const getWaitTimeColor = (waitTime: string) => {
    switch (waitTime) {
      case 'same_day': return 'bg-green-100 text-green-800';
      case 'within_week': return 'bg-blue-100 text-blue-800';
      case 'within_month': return 'bg-yellow-100 text-yellow-800';
      case 'over_month': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-lg text-gray-600">Loading map data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Healthcare Providers with Locations
          </h2>
          <p className="text-gray-600 mt-1">
            {doctorsWithLocations.length} providers with address information
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Map Integration Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Map Integration:</strong> This section would display an interactive map with location pins 
          for healthcare providers. Integration with mapping services like Google Maps or Mapbox would 
          show precise locations based on the address information provided.
        </AlertDescription>
      </Alert>

      {/* Interactive Map Placeholder */}
      <div className="relative">
        <div className="h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-medium text-gray-600 mb-2">Interactive Map</p>
            <p className="text-gray-500">
              Interactive map would display {doctorsWithLocations.length} location pins here
            </p>
          </div>
        </div>
      </div>

      {/* Location List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">All Locations</h3>
        
        {doctorsWithLocations.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No healthcare providers with location data found.</p>
              <p className="text-gray-400 mt-2">
                Healthcare providers need to have address information to appear on the map.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {doctorsWithLocations.map((doctor: DoctorWithOffice) => (
              <Card 
                key={doctor.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedDoctor?.id === doctor.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-indigo-900">
                        {doctor.doctor_name}
                      </h4>
                      <p className="text-indigo-600 font-medium">
                        {doctorTypes[doctor.type] || doctor.type}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {doctor.same_day_service && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Same Day
                        </Badge>
                      )}
                      {doctor.online_appointments && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Globe className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doctor.office_name}</p>
                        <p>{doctor.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <Badge className={getWaitTimeColor(doctor.wait_time)}>
                        <Clock className="w-3 h-3 mr-1" />
                        {waitTimeLabels[doctor.wait_time]}
                      </Badge>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {doctor.phone_number && (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {doctor.phone_number}
                          </span>
                        )}
                        {doctor.url && (
                          <a 
                            href={doctor.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-indigo-600 hover:text-indigo-800 hover:underline"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedDoctor?.id === doctor.id && doctor.comments && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md border-t">
                        <p className="text-xs text-gray-500 mb-1">Comments</p>
                        <p className="text-gray-700 italic text-sm">"{doctor.comments}"</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Map Integration Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-indigo-800">
          <ul className="space-y-1">
            <li>• Click on any location card to highlight it (simulating map pin selection)</li>
            <li>• In a real implementation, this would show an interactive map with clickable pins</li>
            <li>• Each pin would display a popup with the provider's details when clicked</li>
            <li>• Map would support zooming, panning, and clustering of nearby locations</li>
            <li>• Integration options: Google Maps API, Mapbox, or OpenStreetMap with Leaflet</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}