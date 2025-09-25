
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Activity, 
  TrendingUp, 
  Users, 
  Truck, 
  AlertTriangle, 
  Cpu, 
  Database, 
  Wifi, 
  Server,
  RefreshCw,
  Filter,
  Eye,
  Maximize,
  Navigation,
  Clock,
  Battery,
  Signal
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface DriverLocation {
  driverId: number;
  driverName: string;
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE';
  lastUpdate: string;
  orderId?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  database: number;
  activeConnections: number;
  requestsPerSecond: number;
  responseTime: number;
  uptime: number;
  errors: number;
}

interface LiveMetrics {
  activeUsers: number;
  onlineDrivers: number;
  activeOrders: number;
  completedOrdersToday: number;
  totalRevenue: number;
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export function AdminMonitoring() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    database: 0,
    activeConnections: 0,
    requestsPerSecond: 0,
    responseTime: 0,
    uptime: 0,
    errors: 0
  });
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    activeUsers: 0,
    onlineDrivers: 0,
    activeOrders: 0,
    completedOrdersToday: 0,
    totalRevenue: 0,
    systemHealth: 'HEALTHY'
  });
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapView, setMapView] = useState<'satellite' | 'roadmap'>('roadmap');
  const [filters, setFilters] = useState({
    status: '',
    showBattery: true,
    showSignal: true
  });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('ws://localhost:5000', {
      path: '/ws',
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Monitoring dashboard connected');
      setIsConnected(true);
      newSocket.emit('join_admin_room', 'monitoring');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for driver location updates
    newSocket.on('driver_location_update', (data) => {
      setDrivers(prev => {
        const existingIndex = prev.findIndex(d => d.driverId === data.driverId);
        const driverData = {
          driverId: data.driverId,
          driverName: data.driverName || `Driver ${data.driverId}`,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status,
          lastUpdate: new Date(data.timestamp).toISOString(),
          orderId: data.orderId,
          batteryLevel: data.batteryLevel,
          signalStrength: data.signalStrength
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = driverData;
          return updated;
        } else {
          return [driverData, ...prev];
        }
      });
    });

    // Listen for system metrics
    newSocket.on('system_metric_update', (data) => {
      setSystemMetrics(data.metrics);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const [driversRes, metricsRes, liveRes] = await Promise.all([
        fetch('/api/admin/monitoring/drivers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/monitoring/system-metrics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/monitoring/live-metrics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.data);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setSystemMetrics(metricsData.data);
      }
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        setLiveMetrics(liveData.data);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'BUSY': return 'bg-blue-500';
      case 'IDLE': return 'bg-yellow-500';
      case 'OFFLINE': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    if (filters.status && driver.status !== filters.status) return false;
    return true;
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Real-time Monitoring
          </h1>
          <p className="text-sm text-gray-600 mt-1">Live system monitoring and driver tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={fetchMonitoringData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-lg font-semibold text-gray-900">{liveMetrics.activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Online Drivers</p>
              <p className="text-lg font-semibold text-gray-900">{liveMetrics.onlineDrivers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Orders</p>
              <p className="text-lg font-semibold text-gray-900">{liveMetrics.activeOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-lg font-semibold text-gray-900">{liveMetrics.completedOrdersToday.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="text-indigo-500 text-2xl font-bold">₦</div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Revenue Today</p>
              <p className="text-lg font-semibold text-gray-900">₦{liveMetrics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">System Health</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(liveMetrics.systemHealth)}`}>
                {liveMetrics.systemHealth}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Server className="h-5 w-5 mr-2 text-gray-500" />
              System Metrics
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Cpu className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${systemMetrics.cpu > 80 ? 'bg-red-500' : systemMetrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${systemMetrics.cpu}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{systemMetrics.cpu}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${systemMetrics.memory > 80 ? 'bg-red-500' : systemMetrics.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${systemMetrics.memory}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{systemMetrics.memory}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${systemMetrics.database > 80 ? 'bg-red-500' : systemMetrics.database > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${systemMetrics.database}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{systemMetrics.database}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Active Connections</p>
                <p className="text-lg font-semibold text-gray-900">{systemMetrics.activeConnections}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Requests/sec</p>
                <p className="text-lg font-semibold text-gray-900">{systemMetrics.requestsPerSecond}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Response Time</p>
                <p className="text-lg font-semibold text-gray-900">{systemMetrics.responseTime}ms</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-lg font-semibold text-gray-900">{formatUptime(systemMetrics.uptime)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Status Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-gray-500" />
                Driver Status Overview
              </h3>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="">All Status</option>
                <option value="ONLINE">Online</option>
                <option value="BUSY">Busy</option>
                <option value="IDLE">Idle</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'ONLINE').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Busy</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'BUSY').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Idle</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'IDLE').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Offline</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'OFFLINE').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Location Tracking Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-500" />
                  Driver Location Tracking
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMapView(mapView === 'roadmap' ? 'satellite' : 'roadmap')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {mapView === 'roadmap' ? 'Satellite' : 'Roadmap'}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="relative h-96">
              <div 
                ref={mapRef}
                className="w-full h-full bg-gray-100 rounded-b-lg flex items-center justify-center"
              >
                {/* Mock map interface */}
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Interactive map showing {filteredDrivers.length} drivers</p>
                  <p className="text-sm text-gray-400 mt-2">Map integration would show real locations here</p>
                </div>
                
                {/* Driver markers overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {filteredDrivers.slice(0, 5).map((driver, index) => (
                    <div
                      key={driver.driverId}
                      className="absolute"
                      style={{
                        left: `${20 + (index * 15)}%`,
                        top: `${30 + (index * 10)}%`
                      }}
                    >
                      <div className="relative">
                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${getStatusColor(driver.status)}`}></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-90 whitespace-nowrap">
                          {driver.driverName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Driver List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Navigation className="h-5 w-5 mr-2 text-blue-500" />
                Active Drivers ({filteredDrivers.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredDrivers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No drivers found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => (
                    <li 
                      key={driver.driverId}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedDriver?.driverId === driver.driverId ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(driver.status)}`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{driver.driverName}</p>
                            <p className="text-xs text-gray-500">ID: {driver.driverId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            driver.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                            driver.status === 'BUSY' ? 'bg-blue-100 text-blue-800' :
                            driver.status === 'IDLE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {driver.status}
                          </span>
                        </div>
                      </div>
                      
                      {filters.showBattery && driver.batteryLevel && (
                        <div className="mt-2 flex items-center space-x-2">
                          <Battery className="h-3 w-3 text-gray-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${
                                driver.batteryLevel > 50 ? 'bg-green-500' :
                                driver.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${driver.batteryLevel}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{driver.batteryLevel}%</span>
                        </div>
                      )}
                      
                      {filters.showSignal && driver.signalStrength && (
                        <div className="mt-1 flex items-center space-x-2">
                          <Signal className="h-3 w-3 text-gray-400" />
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4].map((bar) => (
                              <div
                                key={bar}
                                className={`w-1 h-2 rounded-sm ${
                                  bar <= (driver.signalStrength || 0) / 25 ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              ></div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{driver.signalStrength}%</span>
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Last update: {new Date(driver.lastUpdate).toLocaleTimeString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
