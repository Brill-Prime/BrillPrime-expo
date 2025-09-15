import { useState } from "react";
import { Bell, Check, X, Clock, Package, CreditCard, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  type: "payment" | "delivery" | "order" | "security" | "promotion";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionButton?: {
    text: string;
    route: string;
  };
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "payment",
      title: "Payment Successful",
      message: "Your payment of ₦15,000 to Lagos Fuel Station has been processed successfully.",
      timestamp: "2 minutes ago",
      read: false,
      priority: "high",
      actionButton: { text: "View Receipt", route: "/transactions" }
    },
    {
      id: "2",
      type: "delivery",
      title: "Delivery Confirmation Required",
      message: "Your fuel delivery is complete. Please scan the QR code to confirm receipt.",
      timestamp: "5 minutes ago",
      read: false,
      priority: "high",
      actionButton: { text: "Scan QR Code", route: "/qr-scanner" }
    },
    {
      id: "3",
      type: "order",
      title: "Order Status Update",
      message: "Your order #BP12345 has been dispatched and is on the way to your location.",
      timestamp: "1 hour ago",
      read: false,
      priority: "medium"
    },
    {
      id: "4",
      type: "security",
      title: "Security Alert",
      message: "New device login detected from Lagos, Nigeria. If this wasn't you, please secure your account.",
      timestamp: "3 hours ago",
      read: true,
      priority: "high",
      actionButton: { text: "Review Security", route: "/account-settings" }
    },
    {
      id: "5",
      type: "promotion",
      title: "Special Offer Available",
      message: "Get 10% off your next fuel purchase. Valid until midnight today!",
      timestamp: "1 day ago",
      read: true,
      priority: "low",
      actionButton: { text: "View Offers", route: "/commodities" }
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment": return <CreditCard className="w-5 h-5" />;
      case "delivery": return <Package className="w-5 h-5" />;
      case "order": return <Clock className="w-5 h-5" />;
      case "security": return <X className="w-5 h-5" />;
      case "promotion": return <Bell className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-600";
    switch (type) {
      case "payment": return "bg-green-100 text-green-600";
      case "delivery": return "bg-blue-100 text-blue-600";
      case "order": return "bg-yellow-100 text-yellow-600";
      case "security": return "bg-red-100 text-red-600";
      case "promotion": return "bg-purple-100 text-purple-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100/50 animate-fade-in">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/consumer-home")}
              className="transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="w-5 h-5 text-[#131313]" />
            </Button>
            <div className="animate-slide-up">
              <h1 className="text-lg font-semibold text-[#131313]">Notifications</h1>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              onClick={markAllAsRead}
              className="text-[#4682b4] hover:text-[#0b1a51] transition-all duration-300 hover:scale-105"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-3xl border-2 border-blue-100/50">
            <TabsTrigger value="all" className="rounded-2xl">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-2xl">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="rounded-2xl">
              Read ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {notifications.map((notification, index) => (
              <Card
                key={notification.id}
                className={`rounded-3xl border-2 transition-all duration-300 hover:shadow-md animate-slide-up ${
                  notification.read ? "border-gray-200/50 bg-gray-50/50" : "border-blue-100/50 bg-white"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-[#131313] text-sm">{notification.title}</h3>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#4682b4] rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          {notification.actionButton && (
                            <Button
                              size="sm"
                              className="mt-2 bg-[#4682b4] hover:bg-[#0b1a51] text-white rounded-2xl transition-all duration-300 hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(notification.actionButton!.route);
                              }}
                            >
                              {notification.actionButton.text}
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3 mt-4">
            {unreadNotifications.length === 0 ? (
              <Card className="rounded-3xl border-2 border-blue-100/50 bg-white animate-fade-in-up">
                <CardContent className="p-8 text-center">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#131313] mb-2">All caught up!</h3>
                  <p className="text-gray-600">You have no unread notifications.</p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification, index) => (
                <Card
                  key={notification.id}
                  className="rounded-3xl border-2 border-blue-100/50 bg-white transition-all duration-300 hover:shadow-md animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-[#131313] text-sm">{notification.title}</h3>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                              <div className="w-2 h-2 bg-[#4682b4] rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">{notification.timestamp}</p>
                            {notification.actionButton && (
                              <Button
                                size="sm"
                                className="mt-2 bg-[#4682b4] hover:bg-[#0b1a51] text-white rounded-2xl transition-all duration-300 hover:scale-105"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(notification.actionButton!.route);
                                }}
                              >
                                {notification.actionButton.text}
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-3 mt-4">
            {readNotifications.length === 0 ? (
              <Card className="rounded-3xl border-2 border-blue-100/50 bg-white animate-fade-in-up">
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#131313] mb-2">No read notifications</h3>
                  <p className="text-gray-600">Your read notifications will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              readNotifications.map((notification, index) => (
                <Card
                  key={notification.id}
                  className="rounded-3xl border-2 border-gray-200/50 bg-gray-50/50 transition-all duration-300 hover:shadow-md animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-[#131313] text-sm">{notification.title}</h3>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">{notification.timestamp}</p>
                            {notification.actionButton && (
                              <Button
                                size="sm"
                                className="mt-2 bg-[#4682b4] hover:bg-[#0b1a51] text-white rounded-2xl transition-all duration-300 hover:scale-105"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(notification.actionButton!.route);
                                }}
                              >
                                {notification.actionButton.text}
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}