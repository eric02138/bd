import React, { useState, useMemo } from 'react';
import { Loader2, AlertCircle, CircleUserRound } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import FilterControls from './components/FilterControls';
import RobotEventsTable from './components/RobotEventsTable';

// Main App Component
const BDRobotsApp = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // State for robotEvents, loading, and error handling
  const [robotEvents, setRobotEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API configuration
  const API_BASE_URL = 'http://127.0.0.1:8000/v1';
  const BDUSER_ENDPOINT = `${API_BASE_URL}/bduser`;
  const ROBOT_EVENTS_ENDPOINT = `${API_BASE_URL}/robot_event`;
  const EXPORT_ROBOT_EVENTS_ENDPOINT = `${API_BASE_URL}/export_robot_event`;
  const EXPORT_ROBOT_EVENTS_BY_USERNAME_ENDPOINT = `${API_BASE_URL}/export_robot_event_by_username`;

  // Login function
  const handleLogin = async (credentials) => {
    try {
      setAuthLoading(true);
      setAuthError(null);

      const response = await fetch(BDUSER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Invalid credentials`);
      }

      const userdata = await response.json();
      setUser(userdata);
      fetchRobotEvents();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setRobotEvents([]);
  };

  // Fetch robotEvents from API
  const fetchRobotEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(ROBOT_EVENTS_ENDPOINT);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRobotEvents(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching Robot Events:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayRobotEvents = robotEvents;

  // Filter state
  const [filters, setFilters] = useState({
    robot: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    description: ''
  });

  // Filtered robotEvents based on current filters
  const filteredRobotEvents = useMemo(() => {
    return displayRobotEvents.filter(robotEvent => {
      const matchesName = robotEvent.robot.toLowerCase().includes(filters.robot.toLowerCase());
      
      const createdAt = new Date(robotEvent.createdAt);
      const matchesDateFrom = !filters.dateFrom || createdAt >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || createdAt <= new Date(filters.dateTo);
      const matchesStatus = !filters.status || robotEvent.status === filters.status;
      const matchesDescription = !filters.description || robotEvent.description.includes(filters.description);
      
      return matchesName && matchesDateFrom && matchesDateTo && matchesStatus && matchesDescription;
    });
  }, [displayRobotEvents, filters]);

  // Update filter functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      robot: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      description: ''
    });
  };

  // Export functions
  const handleExportJSON = () => {
    const queryString = new URLSearchParams(filters).toString();
    const url = `${EXPORT_ROBOT_EVENTS_ENDPOINT}?${queryString}&format=json`;
    window.open(url);
  };

  const handleExportCSV = () => {
    const queryString = new URLSearchParams(filters).toString();
    const url = `${EXPORT_ROBOT_EVENTS_ENDPOINT}?${queryString}&format=csv`;
    window.location.replace(url);
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
                  <p className="text-gray-600 mt-1">Search, filter, and export robot events</p>
                </div>
                <div className="flex items-center space-x-4">
                  {user && (
                    <div className="flex items-center text-blue-600">
                      <CircleUserRound className="h-4 w-4 mr-2" />
                      { user.username }
                    </div>
                  )}
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
                    onClick={fetchRobotEvents}
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
              robotEventCount={filteredRobotEvents.length}
              totalCount={displayRobotEvents.length}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
            />

            {/* Robot Events Table Component */}
            <RobotEventsTable robotEvents={filteredRobotEvents} />
          </div>
        </div>
      );
    }
  }

export default BDRobotsApp;