
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Animated,
  StatusBar,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from '../../components/AlertProvider';

const { width, height } = Dimensions.get('window');

export default function MerchantHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [userEmail, setUserEmail] = useState("");
  const [merchantData, setMerchantData] = useState({
    userId: "23 AD647",
    companyName: "Total Energy",
    tagline: "Your reliable, friendly fuel distributors.\nTrust us to deliver the best services.",
    address: "Wuse II, Abuja",
    email: "info@totalenergies.com",
    phone: "+234 8100 0000 00",
    rating: 4.2,
    openingHours: "Monday - Saturday (8:00am - 6:00pm)",
    status: "Open"
  });
  const [stats, setStats] = useState({
    totalOrders: 47,
    activeOrders: 8,
    totalRevenue: 125000,
    commoditiesListed: 15,
    pendingNotifications: 2
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-280))[0];

  useEffect(() => {
    loadUserData();
    loadMerchantStats();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "merchant@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadMerchantStats = async () => {
    try {
      // In a real app, this would load from API
      const savedStats = await AsyncStorage.getItem("merchantStats");
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error("Error loading merchant stats:", error);
    }
  };

  const toggleMenu = () => {
    const sidebarWidth = Math.min(280, width * 0.8);
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleGoBack = () => {
    router.push('/dashboard/merchant');
  };

  const handleManageOrders = () => {
    router.push('/orders/consumer-orders');
  };

  const handleManageCommodities = () => {
    router.push('/merchant/commodities');
  };

  const handleMenuItemPress = (item: string) => {
    toggleMenu();
    
    switch (item) {
      case "Profile":
        router.push("/profile");
        break;
      case "Analytics":
        router.push("/transactions");
        break;
      case "Settings":
        router.push("/profile/edit");
        break;
      case "Support":
        router.push("/support");
        break;
      case "Switch to Consumer":
        router.push("/home/consumer");
        break;
      default:
        showInfo("Navigation", `Navigating to ${item}`);
    }
  };

  const handleSignOut = async () => {
    showConfirmDialog(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        try {
          await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole"]);
          router.replace("/");
          showSuccess("Signed Out", "You have been successfully signed out.");
        } catch (error) {
          console.error("Error signing out:", error);
          showError("Sign Out Error", "There was an error signing out. Please try again.");
        }
      }
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFD700" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Profile Circle */}
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Ionicons name="business" size={40} color="#4682B4" />
          </View>
          
          <Text style={styles.userId}>User ID: {merchantData.userId}</Text>
          <Text style={styles.companyName}>{merchantData.companyName}</Text>
          <Text style={styles.tagline}>{merchantData.tagline}</Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <View style={styles.starsContainer}>
            {renderStars(merchantData.rating)}
          </View>
          <Text style={styles.ratingText}>{merchantData.rating}/5.0</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <Ionicons name="location" size={16} color="#4682B4" />
            <Text style={styles.contactLabel}>Address:</Text>
            <Text style={styles.contactValue}>{merchantData.address}</Text>
          </View>
          
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color="#4682B4" />
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>{merchantData.email}</Text>
          </View>
          
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color="#4682B4" />
            <Text style={styles.contactLabel}>Number:</Text>
            <Text style={styles.contactValue}>{merchantData.phone}</Text>
          </View>
        </View>

        {/* Opening Hours */}
        <View style={styles.hoursSection}>
          <Text style={styles.hoursTitle}>Opening Hours</Text>
          <Text style={styles.hoursText}>{merchantData.openingHours}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>{merchantData.status}</Text>
          </View>
        </View>

        {/* Stats Dashboard */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Business Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeOrders}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₦{(stats.totalRevenue / 1000).toFixed(0)}K</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.commoditiesListed}</Text>
              <Text style={styles.statLabel}>Commodities</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.manageOrdersBtn} 
          onPress={handleManageOrders}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt" size={20} color="white" />
          <Text style={styles.buttonText}>Manage Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.manageCommoditiesBtn} 
          onPress={handleManageCommodities}
          activeOpacity={0.8}
        >
          <Ionicons name="cube" size={20} color="white" />
          <Text style={styles.buttonText}>Manage Commodities</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Badge */}
      {stats.pendingNotifications > 0 && (
        <TouchableOpacity 
          style={styles.notificationBadge}
          onPress={() => router.push('/notifications')}
        >
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeNumber}>{stats.pendingNotifications}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="business" size={30} color="#4682B4" />
            </View>
            <Text style={styles.sidebarProfileName}>{merchantData.companyName}</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>
          
          {/* Menu Items */}
          <View style={styles.menuList}>
            {['Profile', 'Analytics', 'Settings', 'Support'].map((item) => (
              <TouchableOpacity 
                key={item}
                style={styles.menuItem} 
                onPress={() => handleMenuItemPress(item)}
              >
                <Text style={styles.menuItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Buttons */}
          <View style={styles.sidebarBottom}>
            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => handleMenuItemPress("Switch to Consumer")}
            >
              <Text style={styles.switchButtonText}>Switch to Consumer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <TouchableOpacity 
          style={styles.menuOverlay} 
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  logoContainer: {
    width: 75,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  profileCircle: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userId: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Montserrat-Medium',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 10,
    fontFamily: 'Montserrat-Bold',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '300',
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    fontFamily: 'Montserrat-Light',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  contactSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    minWidth: 80,
    fontFamily: 'Montserrat-SemiBold',
  },
  contactValue: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Montserrat-Regular',
  },
  hoursSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A51',
    marginBottom: 8,
    fontFamily: 'Montserrat-SemiBold',
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'Montserrat-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  statsSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Montserrat-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#4682B4',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Montserrat-Regular',
  },
  actionButtons: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    gap: 12,
  },
  manageOrdersBtn: {
    width: '100%',
    height: 54,
    borderRadius: 30,
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  manageCommoditiesBtn: {
    width: '100%',
    height: 54,
    borderRadius: 30,
    backgroundColor: '#0B1A51',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0B1A51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  notificationBadge: {
    position: 'absolute',
    right: 30,
    bottom: 150,
    zIndex: 10,
  },
  badgeCircle: {
    width: 24,
    height: 24,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Montserrat-Bold',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    width: Math.min(280, width * 0.8),
    height: '100%',
    backgroundColor: 'white',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 15,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  sidebarProfile: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  sidebarProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sidebarProfileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  sidebarProfileEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  sidebarBottom: {
    paddingBottom: 30,
  },
  switchButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  switchButtonText: {
    color: '#2f75c2',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  signOutButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 15,
  },
});
