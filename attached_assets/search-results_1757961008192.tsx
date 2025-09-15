import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Search, Filter, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchLocation {
  id: string;
  name: string;
  type: "area" | "station" | "merchant";
  address: string;
  distance: number;
  stationCount?: number;
  averagePrice?: number;
  isOpen?: boolean;
  rating?: number;
}

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchLocation[]>([]);

  useEffect(() => {
    // Get search query from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    setSearchQuery(query);
    
    // Mock search results based on query
    const mockResults: SearchLocation[] = [
      {
        id: "wuse-ii",
        name: "Wuse II",
        type: "area",
        address: "Wuse II, Abuja FCT, Nigeria",
        distance: 2.3,
        stationCount: 12,
        averagePrice: 617
      },
      {
        id: "goldcourt-estate",
        name: "Goldcourt Estate",
        type: "area", 
        address: "Goldcourt Estate, Life Camp, Abuja",
        distance: 3.8,
        stationCount: 8,
        averagePrice: 615
      },
      {
        id: "total-wuse",
        name: "Total Energies Wuse II",
        type: "station",
        address: "Plot 123, Ademola Adetokunbo Crescent, Wuse II",
        distance: 2.1,
        isOpen: true,
        rating: 4.5
      },
      {
        id: "mobil-goldcourt",
        name: "Mobil Goldcourt",
        type: "station",
        address: "Goldcourt Estate, Life Camp",
        distance: 3.5,
        isOpen: true,
        rating: 4.2
      },
      {
        id: "garki-area",
        name: "Garki Area",
        type: "area",
        address: "Garki, Abuja FCT, Nigeria",
        distance: 4.2,
        stationCount: 15,
        averagePrice: 620
      },
      {
        id: "conoil-garki",
        name: "Conoil Garki",
        type: "station",
        address: "Area 3, Garki, Abuja",
        distance: 4.8,
        isOpen: false,
        rating: 4.0
      }
    ];
    
    // Filter results based on search query
    const filtered = mockResults.filter(result =>
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.address.toLowerCase().includes(query.toLowerCase())
    );
    
    setResults(filtered);
  }, []);

  const handleLocationSelect = (location: SearchLocation) => {
    if (location.type === "area") {
      setLocation(`/merchant-search?area=${location.id}`);
    } else if (location.type === "station") {
      setLocation(`/fuel-ordering/station/${location.id}`);
    } else {
      setLocation(`/merchants/${location.id}`);
    }
  };

  const handleSearch = () => {
    // Update results based on new search query
    const urlParams = new URLSearchParams();
    urlParams.set('q', searchQuery);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "area":
        return "🏢";
      case "station":
        return "⛽";
      case "merchant":
        return "🏪";
      default:
        return "📍";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map View (Top Half) */}
      <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 relative">
        {/* Simulated map with grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        {/* Map pins for results */}
        {results.slice(0, 6).map((result, index) => (
          <div
            key={result.id}
            className={`absolute w-4 h-4 ${
              result.type === "area" ? "bg-blue-500" : "bg-red-500"
            } rounded-full animate-pulse`}
            style={{
              top: `${20 + (index * 15)}%`,
              left: `${25 + (index * 12)}%`,
            }}
          ></div>
        ))}
        
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/map-home")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 mx-4">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search locations, fuel stations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 border-[#4682b4]/30 focus:border-[#4682b4]"
                  />
                </div>
                <Button
                  onClick={() => setLocation("/search-filter")}
                  variant="outline"
                  size="icon"
                  className="border-[#4682b4] text-[#4682b4]"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/side-menu")}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results List (Bottom Half) */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 min-h-[60vh]">
        <div className="p-4">
          {/* Handle bar */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#131313]">
              Search Results
            </h2>
            <Badge variant="outline" className="text-[#4682b4] border-[#4682b4]">
              {results.length} found
            </Badge>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.map((location) => (
              <Card
                key={location.id}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => handleLocationSelect(location)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-[#4682b4]/10 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getLocationIcon(location.type)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#131313] mb-1">
                          {location.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {location.address}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{location.distance} km away</span>
                          </div>
                          {location.type === "area" && location.stationCount && (
                            <span>{location.stationCount} stations</span>
                          )}
                          {location.type === "station" && location.rating && (
                            <span>⭐ {location.rating}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {location.type === "area" && location.averagePrice && (
                        <div>
                          <p className="font-semibold text-[#4682b4]">
                            {formatCurrency(location.averagePrice)}/L
                          </p>
                          <p className="text-xs text-gray-500">avg. price</p>
                        </div>
                      )}
                      
                      {location.type === "station" && (
                        <Badge 
                          className={
                            location.isOpen 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {location.isOpen ? "Open" : "Closed"}
                        </Badge>
                      )}
                      
                      {location.type === "merchant" && (
                        <Badge className="bg-purple-100 text-purple-800">
                          Merchant
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {results.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No locations found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search terms or browse by area
              </p>
              <Button
                onClick={() => setLocation("/map-home")}
                className="bg-[#4682b4] hover:bg-[#0b1a51]"
              >
                Back to Map
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          {results.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">
                Quick Actions
              </h4>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/search-filter")}
                  className="border-[#4682b4] text-[#4682b4] hover:bg-[#4682b4]/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Results
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/map-home")}
                  className="border-[#4682b4] text-[#4682b4] hover:bg-[#4682b4]/10"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Back to Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}