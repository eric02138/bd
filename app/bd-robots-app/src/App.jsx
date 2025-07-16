import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import FilterControls from './components/FilterControls';
import RecordsTable from './components/RecordsTable';

// Main App Component
const BDRobotsApp = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // State for records, loading, and error handling
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API configuration
  const API_BASE_URL = 'https://api.example.com'; // Replace with your actual API URL
  const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;
  const RECORDS_ENDPOINT = `${API_BASE_URL}/records`;

  // Login function
  const handleLogin = async (credentials) => {
    try {
      setAuthLoading(true);
      setAuthError(null);

      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Invalid credentials`);
      }

      const data = await response.json();
      
      // Assuming API returns { user: {...}, token: "..." }
      setUser(data.user);
      
      // Store token for future requests (optional)
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Fetch records after successful login
      fetchRecords(data.token);
    } catch (err) {
      setAuthError(err.message);
      
      // Demo fallback - remove in production
      if (credentials.username === 'admin' && credentials.password === 'password') {
        setUser({ username: 'admin', id: 1 });
        fetchRecords();
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setRecords([]);
    localStorage.removeItem('authToken');
  };

  // Fetch records from API
  const fetchRecords = async (token = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const authToken = token || localStorage.getItem('authToken');
      
      const response = await fetch(RECORDS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if token exists
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Assuming the API returns an array of records directly
      setRecords(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token is still valid (optional)
      setUser({ username: 'admin', id: 1 }); // Demo user
      fetchRecords(token);
    }
  }, []);

  // Sample data fallback (remove this in production)
  const sampleRecords = [
    {
      id: 1,
      name: "User Account System",
      timeCreated: "2024-01-15T10:30:00",
      status: "active",
      description: "Main user authentication system",
      lastModified: "2024-02-20T14:22:00"
    },
    {
      id: 2,
      name: "Payment Gateway",
      timeCreated: "2024-01-20T09:15:00",
      status: "inactive",
      description: "Payment processing service",
      lastModified: "2024-02-18T11:45:00"
    },
    {
      id: 3,
      name: "Inventory Management",
      timeCreated: "2024-02-01T16:20:00",
      status: "active",
      description: "Product inventory tracking",
      lastModified: "2024-02-25T13:30:00"
    },
    {
      id: 4,
      name: "Analytics Dashboard",
      timeCreated: "2024-02-10T08:45:00",
      status: "pending",
      description: "Business intelligence dashboard",
      lastModified: "2024-02-24T16:15:00"
    },
    {
      id: 5,
      name: "Email Service",
      timeCreated: "2024-01-25T12:00:00",
      status: "active",
      description: "Email notification system",
      lastModified: "2024-02-22T09:20:00"
    },
    {
      id: 6,
      name: "File Storage",
      timeCreated: "2024-02-05T14:30:00",
      status: "maintenance",
      description: "Cloud file storage service",
      lastModified: "2024-02-23T10:55:00"
    }
  ];

  // Use sample data if API fails (for demo purposes)
  const displayRecords = error ? sampleRecords : records;

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  // Filtered records based on current filters
  const filteredRecords = useMemo(() => {
    return displayRecords.filter(record => {
      const matchesName = record.name.toLowerCase().includes(filters.name.toLowerCase());
      
      const createdDate = new Date(record.timeCreated);
      const matchesDateFrom = !filters.dateFrom || createdDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || createdDate <= new Date(filters.dateTo);
      
      const matchesStatus = filters.status === 'all' || record.status === filters.status;
      
      return matchesName && matchesDateFrom && matchesDateTo && matchesStatus;
    });
  }, [displayRecords, filters]);

  // Update filter functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    });
  };

  // Export functions
  const handleExportJSON = () => {
    const exportData = {
      filters,
      records: filteredRecords,
      exportDate: new Date().toISOString(),
      totalRecords: filteredRecords.length
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bd-robots-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Time Created', 'Status', 'Description', 'Last Modified'];
    const csvData = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.id,
        `"${record.name}"`,
        record.timeCreated,
        record.status,
        `"${record.description}"`,
        record.lastModified
      ].join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bd-robots-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // If user is not logged in, show login screen
  if (!user) {
      return (<LoginScreen 
               onLogin={handleLogin}
               loading={authLoading}
               error={authError}/>
              );
  // Otherwise, show the app
  } else {
      return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
          <div className="bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">BD Robot Events</h1>
                  <p className="text-gray-600 mt-1">Search, filter, and export robot event records</p>
                </div>
                <div className="flex items-center space-x-4">
                  {loading && (
                    <div className="flex items-center text-blue-600">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Using sample data</span>
                    </div>
                  )}
                  <button
                    onClick={fetchRecords}
                    disabled={loading}
                    className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Controls Component */}
            <FilterControls
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              recordCount={filteredRecords.length}
              totalCount={displayRecords.length}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              user={user}
              onLogout={handleLogout}
            />

            {/* Records Table Component */}
            <RecordsTable records={filteredRecords} />
          </div>
        </div>
      );
    }
  }

export default BDRobotsApp;