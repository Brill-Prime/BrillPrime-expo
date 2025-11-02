
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';

export default function ScheduledDelivery() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showError, showConfirmDialog } = useAlert();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = [
    { id: '8-10', label: '8:00 AM - 10:00 AM', available: true },
    { id: '10-12', label: '10:00 AM - 12:00 PM', available: true },
    { id: '12-14', label: '12:00 PM - 2:00 PM', available: true },
    { id: '14-16', label: '2:00 PM - 4:00 PM', available: true },
    { id: '16-18', label: '4:00 PM - 6:00 PM', available: false },
    { id: '18-20', label: '6:00 PM - 8:00 PM', available: true },
  ];

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const scheduleDelivery = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      showError('Missing Information', 'Please select a date and time slot');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual API call
      // await orderService.scheduleDelivery({
      //   orderId: params.orderId,
      //   scheduledDate: selectedDate,
      //   timeSlot: selectedTimeSlot,
      //   instructions
      // });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      showConfirmDialog(
        'Delivery Scheduled',
        `Your delivery has been scheduled for ${selectedDate.toLocaleDateString()} during ${timeSlots.find(t => t.id === selectedTimeSlot)?.label}`,
        () => router.back()
      );
    } catch (error) {
      console.error('Error scheduling delivery:', error);
      showError('Error', 'Failed to schedule delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0B1A51" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Delivery</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#4682B4" />
          <Text style={styles.infoText}>
            Schedule your delivery for a convenient time. We'll notify you 30 minutes before arrival.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {getNextSevenDays().map((date, index) => {
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                  {date.getDate()}
                </Text>
                <Text style={[styles.monthName, isSelected && styles.monthNameSelected]}>
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Select Time Slot</Text>
        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timeSlot,
                selectedTimeSlot === slot.id && styles.timeSlotSelected,
                !slot.available && styles.timeSlotDisabled,
              ]}
              onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
              disabled={!slot.available}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={
                  !slot.available
                    ? '#D1D5DB'
                    : selectedTimeSlot === slot.id
                    ? '#FFFFFF'
                    : '#4682B4'
                }
              />
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot.id && styles.timeSlotTextSelected,
                  !slot.available && styles.timeSlotTextDisabled,
                ]}
              >
                {slot.label}
              </Text>
              {!slot.available && (
                <Text style={styles.unavailableText}>Full</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
        <TextInput
          style={styles.instructionsInput}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g., Leave at the front door, Ring doorbell twice"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {selectedDate && selectedTimeSlot && (
          <View style={styles.summaryCard}>
            <Ionicons name="calendar" size={24} color="#10B981" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Scheduled For</Text>
              <Text style={styles.summaryText}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.summaryTime}>
                {timeSlots.find((t) => t.id === selectedTimeSlot)?.label}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.scheduleButton,
            (!selectedDate || !selectedTimeSlot || submitting) && styles.scheduleButtonDisabled,
          ]}
          onPress={scheduleDelivery}
          disabled={!selectedDate || !selectedTimeSlot || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.scheduleButtonText}>Confirm Schedule</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1A51',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 12,
  },
  dateScroll: {
    marginBottom: 24,
  },
  dateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dateCardSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  dayName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1A51',
    marginVertical: 4,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  monthName: {
    fontSize: 12,
    color: '#6B7280',
  },
  monthNameSelected: {
    color: '#FFFFFF',
  },
  timeSlotsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeSlotText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#0B1A51',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  instructionsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0B1A51',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    marginBottom: 24,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 2,
  },
  summaryTime: {
    fontSize: 14,
    color: '#047857',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    padding: 16,
    borderRadius: 12,
  },
  scheduleButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  scheduleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
