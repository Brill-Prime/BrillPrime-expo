import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MapPin, Car, Clock, CreditCard, Navigation, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TollGate {
  id: string;
  name: string;
  location: string;
  highway: string;
  distance: number;
  pricePerVehicle: {
    car: number;
    suv: number;
    truck: number;
    motorcycle: number;
  };
  operatingHours: string;
  isOpen: boolean;
  estimatedTime: string;
  paymentMethods: string[];
}

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function TollPayments() {
  const [, setLocation] = useLocation();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("car");
  const [selectedTollGate, setSelectedTollGate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const vehicleTypes: VehicleType[] = [
    {
      id: "motorcycle",
      name: "Motorcycle", 
      icon: "🏍️",
      description: "2-wheeled vehicles"
    },
    {
      id: "car",
      name: "Car",
      icon: "🚗", 
      description: "Private cars & sedans"
    },
    {
      id: "suv",
      name: "SUV/Bus",
      icon: "🚙",
      description: "SUVs, vans & small buses"
    },
    {
      id: "truck",
      name: "Truck",
      icon: "🚛",
      description: "Heavy vehicles & trailers"
    }
  ];

  const [tollGates] = useState<TollGate[]>([
    {
      id: "lagos-ibadan-1",
      name: "Lagos-Ibadan Toll Plaza",
      location: "Km 20, Lagos-Ibadan Expressway",
      highway: "Lagos-Ibadan Expressway",
      distance: 18.5,
      pricePerVehicle: {
        motorcycle: 300,
        car: 600,
        suv: 1000,
        truck: 1500
      },
      operatingHours: "24 hours",
      isOpen: true,
      estimatedTime: "22 mins",
      paymentMethods: ["Cash", "Card", "Mobile"]
    },
    {
      id: "abuja-kaduna-1",
      name: "Abuja-Kaduna Toll Gate",
      location: "Km 15, Abuja-Kaduna Highway",
      highway: "Abuja-Kaduna Highway", 
      distance: 28.2,
      pricePerVehicle: {
        motorcycle: 200,
        car: 400,
        suv: 700,
        truck: 1200
      },
      operatingHours: "24 hours",
      isOpen: true,
      estimatedTime: "35 mins",
      paymentMethods: ["Cash", "Card", "Mobile"]
    },
    {
      id: "lekki-toll",
      name: "Lekki Toll Gate",
      location: "Lekki-Epe Expressway, Lagos",
      highway: "Lekki-Epe Expressway",
      distance: 12.1,
      pricePerVehicle: {
        motorcycle: 150,
        car: 300,
        suv: 500,
        truck: 800
      },
      operatingHours: "5:00 AM - 11:00 PM",
      isOpen: true,
      estimatedTime: "18 mins",
      paymentMethods: ["Card", "Mobile"]
    },
    {
      id: "kara-bridge",
      name: "Kara Bridge Toll",
      location: "Kara, Lagos-Ibadan Expressway",
      highway: "Lagos-Ibadan Expressway",
      distance: 25.8,
      pricePerVehicle: {
        motorcycle: 250,
        car: 500,
        suv: 800,
        truck: 1200
      },
      operatingHours: "24 hours",
      isOpen: false,
      estimatedTime: "32 mins",
      paymentMethods: ["Cash", "Card"]
    }
  ]);

  const filteredTollGates = tollGates.filter(gate =>
    gate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gate.highway.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gate.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleTollSelection = (tollGate: TollGate) => {
    setSelectedTollGate(tollGate.id);
  };

  const handlePurchase = () => {
    if (selectedTollGate) {
      const selectedGate = tollGates.find(g => g.id === selectedTollGate);
      const amount = selectedGate?.pricePerVehicle[selectedVehicle as keyof TollGate['pricePerVehicle']];
      setLocation(`/payment/confirm?type=toll&gate=${selectedTollGate}&vehicle=${selectedVehicle}&amount=${amount}`);
    }
  };

  const getSelectedTollGate = () => {
    return tollGates.find(g => g.id === selectedTollGate);
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-2 sm:px-4">{/*Responsive container*/}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/consumer-home")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-[#131313]">Toll Gates</h1>
              <p className="text-sm text-gray-600">Pay toll fees in advance</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <Input
            placeholder="Search toll gates or highways..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-[#4682b4]/30 focus:border-[#4682b4]"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Vehicle Selection */}
        <Card>
          <CardContent className="p-6">
            <Label className="text-base font-semibold text-[#131313] mb-4 block">
              Select Vehicle Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {vehicleTypes.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`border rounded-2xl p-3 cursor-pointer transition-colors ${
                    selectedVehicle === vehicle.id
                      ? "border-[#4682b4] bg-[#4682b4]/5"
                      : "border-gray-200 hover:border-[#4682b4]/50"
                  }`}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{vehicle.icon}</div>
                    <h4 className="font-medium text-[#131313] text-sm">{vehicle.name}</h4>
                    <p className="text-xs text-gray-500">{vehicle.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Toll Gates List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#131313]">Available Toll Gates</h2>
            <Badge variant="outline" className="text-[#4682b4] border-[#4682b4]">
              {filteredTollGates.filter(g => g.isOpen).length} open
            </Badge>
          </div>

          {filteredTollGates.map((gate) => (
            <Card
              key={gate.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTollGate === gate.id ? "ring-2 ring-[#4682b4] ring-opacity-50" : ""
              } ${!gate.isOpen ? "opacity-60" : ""}`}
              onClick={() => gate.isOpen && handleTollSelection(gate)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Gate Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#131313] mb-1">{gate.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{gate.location}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{gate.distance} km away</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{gate.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={gate.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {gate.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </div>

                  {/* Highway and Hours */}
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-[#131313]">{gate.highway}</p>
                      <p className="text-xs text-gray-500">Operating: {gate.operatingHours}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#4682b4]">
                        {formatCurrency(gate.pricePerVehicle[selectedVehicle as keyof typeof gate.pricePerVehicle])}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vehicleTypes.find(v => v.id === selectedVehicle)?.name}
                      </p>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {gate.paymentMethods.map((method) => (
                        <Badge key={method} variant="secondary" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#4682b4] text-[#4682b4] hover:bg-[#4682b4]/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://maps.google.com/?q=${encodeURIComponent(gate.location)}`, '_blank');
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Purchase Summary */}
        {selectedTollGate && (
          <Card className="border-[#4682b4]">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#131313] mb-4">Purchase Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Toll Gate:</span>
                  <span className="font-medium">{getSelectedTollGate()?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle Type:</span>
                  <span className="font-medium">
                    {vehicleTypes.find(v => v.id === selectedVehicle)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{getSelectedTollGate()?.distance} km</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-[#4682b4]">
                    {getSelectedTollGate() && formatCurrency(
                      getSelectedTollGate()!.pricePerVehicle[selectedVehicle as keyof TollGate['pricePerVehicle']]
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredTollGates.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No toll gates found</h3>
            <p className="text-gray-500">Try adjusting your search or check back later</p>
          </div>
        )}
      </div>

      {/* Bottom Action Button */}
      {selectedTollGate && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            className="w-full h-12 bg-[#4682b4] hover:bg-[#0b1a51]"
            onClick={handlePurchase}
          >
            <Ticket className="w-5 h-5 mr-2" />
            Purchase Toll Pass
          </Button>
        </div>
      )}
    </div>
  );
}