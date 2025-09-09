import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { 
  Search, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  CheckCircle, 
  Filter,
  RefreshCw
} from 'lucide-react';
// Type imports with correct relative path from components folder  
import type { 
  Office, 
  DoctorWithOffice, 
  DoctorType, 
  Gender, 
  WaitTime,
  FilterDoctorsInput 
} from '../../../server/src/schema';

interface DoctorListProps {
  doctors: DoctorWithOffice[];
  offices: Office[];
  onRefresh: () => void;
}

export function DoctorList({ doctors, offices, onRefresh }: DoctorListProps) {
  const [filters, setFilters] = useState<FilterDoctorsInput>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Filter doctors based on current filters and search term
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor: DoctorWithOffice) => {
      // Text search across multiple fields
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          doctor.doctor_name.toLowerCase().includes(searchLower) ||
          doctor.office_name.toLowerCase().includes(searchLower) ||
          (doctor.address && doctor.address.toLowerCase().includes(searchLower)) ||
          (doctor.comments && doctor.comments.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Office filter
      if (filters.office_id && doctor.office_id !== filters.office_id) {
        return false;
      }

      // Doctor name filter
      if (filters.doctor_name && !doctor.doctor_name.toLowerCase().includes(filters.doctor_name.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type && doctor.type !== filters.type) {
        return false;
      }

      // Gender filter
      if (filters.gender && doctor.gender !== filters.gender) {
        return false;
      }

      // Online appointments filter
      if (filters.online_appointments !== undefined && doctor.online_appointments !== filters.online_appointments) {
        return false;
      }

      // Wait time filter
      if (filters.wait_time && doctor.wait_time !== filters.wait_time) {
        return false;
      }

      // Same day service filter
      if (filters.same_day_service !== undefined && doctor.same_day_service !== filters.same_day_service) {
        return false;
      }

      return true;
    });
  }, [doctors, filters, searchTerm]);

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getWaitTimeColor = (waitTime: WaitTime) => {
    switch (waitTime) {
      case 'same_day': return 'bg-green-100 text-green-800';
      case 'within_week': return 'bg-blue-100 text-blue-800';
      case 'within_month': return 'bg-yellow-100 text-yellow-800';
      case 'over_month': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDoctorType = (type: string) => {
    return doctorTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search doctors, offices, addresses..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle and Refresh */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
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

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="bg-gray-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Office Filter */}
                <div className="space-y-2">
                  <Label>Medical Office</Label>
                  <Select 
                    value={filters.office_id?.toString() || 'all'} 
                    onValueChange={(value: string) => 
                      setFilters((prev: FilterDoctorsInput) => ({ 
                        ...prev, 
                        office_id: value === 'all' ? undefined : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All offices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All offices</SelectItem>
                      {offices.map((office: Office) => (
                        <SelectItem key={office.id} value={office.id.toString()}>
                          {office.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialty Filter */}
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select 
                    value={filters.type || 'all'} 
                    onValueChange={(value: string) => 
                      setFilters((prev: FilterDoctorsInput) => ({ 
                        ...prev, 
                        type: value === 'all' ? undefined : value as DoctorType 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All specialties</SelectItem>
                      {doctorTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender Filter */}
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={filters.gender || 'all'} 
                    onValueChange={(value: string) => 
                      setFilters((prev: FilterDoctorsInput) => ({ 
                        ...prev, 
                        gender: value === 'all' ? undefined : value as Gender 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any gender</SelectItem>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Wait Time Filter */}
                <div className="space-y-2">
                  <Label>Wait Time</Label>
                  <Select 
                    value={filters.wait_time || 'all'} 
                    onValueChange={(value: string) => 
                      setFilters((prev: FilterDoctorsInput) => ({ 
                        ...prev, 
                        wait_time: value === 'all' ? undefined : value as WaitTime 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any wait time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any wait time</SelectItem>
                      {waitTimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Boolean Filters */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="online_appointments"
                      checked={filters.online_appointments || false}
                      onCheckedChange={(checked: boolean) =>
                        setFilters((prev: FilterDoctorsInput) => ({ 
                          ...prev, 
                          online_appointments: checked || undefined 
                        }))
                      }
                    />
                    <Label htmlFor="online_appointments">Online appointments only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same_day_service"
                      checked={filters.same_day_service || false}
                      onCheckedChange={(checked: boolean) =>
                        setFilters((prev: FilterDoctorsInput) => ({ 
                          ...prev, 
                          same_day_service: checked || undefined 
                        }))
                      }
                    />
                    <Label htmlFor="same_day_service">Same-day service only</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Showing {filteredDoctors.length} of {doctors.length} healthcare providers
        </p>
      </div>

      <Separator />

      {/* Doctor Cards */}
      {filteredDoctors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">No healthcare providers found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDoctors.map((doctor: DoctorWithOffice) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-900 mb-1">
                      {doctor.doctor_name}
                    </h3>
                    <p className="text-indigo-600 font-medium">{formatDoctorType(doctor.type)}</p>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
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
                    <Badge className={getWaitTimeColor(doctor.wait_time)}>
                      <Clock className="w-3 h-3 mr-1" />
                      {waitTimeOptions.find(w => w.value === doctor.wait_time)?.label}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <p className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {doctor.office_name}
                    </p>
                    {doctor.address && (
                      <p className="text-gray-600 ml-6">{doctor.address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {doctor.phone_number && (
                      <p className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {doctor.phone_number}
                      </p>
                    )}
                    {doctor.url && (
                      <p className="flex items-center text-gray-600">
                        <Globe className="w-4 h-4 mr-2" />
                        <a 
                          href={doctor.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Visit Website
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {doctor.comments && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-700 italic">"{doctor.comments}"</p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-400">
                  Added: {doctor.created_at.toLocaleDateString()} • 
                  Gender: {genderOptions.find(g => g.value === doctor.gender)?.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}