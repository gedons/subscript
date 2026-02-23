import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, DollarSign, Tag, Clock, ChevronDown } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { hapticFeedback } from "../lib/haptics";
import { scheduleSubscriptionReminder, cancelSubscriptionReminder } from "../lib/notifications";
import { getCurrencySymbol } from "../lib/currency";
import Toast from "react-native-toast-message";
import { MotiView, AnimatePresence } from "moti";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddSubscriptionScreen({ navigation, route }: any) {
    const { user, profile } = useAuth();
    const editSubscription = route.params?.subscription;
    const isEditing = !!editSubscription;

    const [name, setName] = useState(editSubscription?.name || "");
    const [cost, setCost] = useState(editSubscription?.cost?.toString() || "");
    const [date, setDate] = useState(editSubscription ? new Date(editSubscription.renewal_date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
    const [category, setCategory] = useState(editSubscription?.category || "Entertainment");
    const [billingCycle, setBillingCycle] = useState(editSubscription?.billing_cycle || "Monthly");
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState<{ type: 'category' | 'cycle' | null }>({ type: null });

    const nameRef = useRef<TextInput>(null);

    const categories = ["Entertainment", "Productivity", "Utility", "Food", "Health", "Shopping", "Finance"];
    const cycles = ["Weekly", "Monthly", "Yearly"];

    useEffect(() => {
        if (!isEditing) {
            const timer = setTimeout(() => {
                nameRef.current?.focus();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
        hapticFeedback.selection();
    };

    async function handleSave() {
        if (!name || !cost) {
            hapticFeedback.warning();
            Toast.show({
                type: "error",
                text1: "Missing Fields",
                text2: "Please fill in all details.",
            });
            return;
        }

        setLoading(true);
        try {
            // We use full ISO string to support time. Note: DB column MUST be updated to TIMESTAMPTZ for this to persist perfectly.
            const formattedDate = date.toISOString();
            let result;

            if (isEditing) {
                result = await supabase
                    .from("subscriptions")
                    .update({
                        name,
                        cost: parseFloat(cost),
                        renewal_date: formattedDate,
                        category,
                        billing_cycle: billingCycle,
                    })
                    .eq("id", editSubscription.id);
            } else {
                result = await supabase
                    .from("subscriptions")
                    .insert({
                        user_id: user?.id,
                        name,
                        cost: parseFloat(cost),
                        renewal_date: formattedDate,
                        category,
                        billing_cycle: billingCycle,
                    })
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            const subId = isEditing ? editSubscription.id : result.data.id;
            if (isEditing) {
                await cancelSubscriptionReminder(subId);
            }
            await scheduleSubscriptionReminder(subId, name, date);

            hapticFeedback.success();
            Toast.show({
                type: "success",
                text1: isEditing ? "Updated!" : "Added!",
                text2: isEditing ? `${name} details saved.` : "Subscription tracker created.",
            });

            navigation.goBack();
        } catch (error: any) {
            hapticFeedback.error();
            Toast.show({
                type: "error",
                text1: "Error saving",
                text2: error.message,
            });
        } finally {
            setLoading(false);
        }
    }

    const CustomPicker = () => (
        <Modal
            visible={showPicker.type !== null}
            transparent={true}
            animationType="slide"
        >
            <View className="flex-1 justify-end bg-black/60">
                <MotiView
                    from={{ translateY: 300 }}
                    animate={{ translateY: 0 }}
                    className="bg-[#0D1F3D] border-t border-white/10 rounded-t-[40px] px-8 pt-6 pb-12"
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-jakarta-bold uppercase tracking-widest text-xs">
                            Select {showPicker.type === 'category' ? 'Category' : 'Billing Cycle'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowPicker({ type: null })}>
                            <Text className="text-teal font-inter-bold">Done</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-3">
                        {(showPicker.type === 'category' ? categories : cycles).map((item) => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => {
                                    hapticFeedback.selection();
                                    if (showPicker.type === 'category') setCategory(item);
                                    else setBillingCycle(item);
                                }}
                                className={`px-5 py-3 rounded-2xl border ${(showPicker.type === 'category' ? category : billingCycle) === item
                                    ? 'bg-teal border-teal'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <Text className={`${(showPicker.type === 'category' ? category : billingCycle) === item
                                    ? 'text-navy font-inter-bold'
                                    : 'text-white font-inter-medium'
                                    }`}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </MotiView>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
            <CustomPicker />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 overflow-visible">
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="py-6"
                    >
                        <View className="flex-row items-center mb-10">
                            <TouchableOpacity
                                onPress={() => {
                                    hapticFeedback.light();
                                    navigation.goBack();
                                }}
                                className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 active:bg-white/10"
                            >
                                <ArrowLeft size={24} color="#14C6B2" />
                            </TouchableOpacity>
                            <Text className="text-white text-3xl font-jakarta-bold ml-6">
                                {isEditing ? "Edit Tracking" : "New Tracker"}
                            </Text>
                        </View>

                        {/* Amount Input */}
                        <View className="items-center mb-12">
                            <Text className="text-white/40 mb-3 font-inter-medium uppercase tracking-widest text-xs">Monthly Cost</Text>
                            <View className="flex-row items-center">
                                <Text className="text-teal text-4xl font-jakarta-bold mr-2">{getCurrencySymbol(profile?.currency)}</Text>
                                <TextInput
                                    className="text-white text-6xl font-jakarta-bold"
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(255,255,255,0.1)"
                                    keyboardType="decimal-pad"
                                    value={cost}
                                    onChangeText={setCost}
                                    autoFocus={!isEditing}
                                />
                            </View>
                        </View>

                        <View className="space-y-8">
                            {/* Name Input */}
                            <View className="mb-8">
                                <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Service Name</Text>
                                <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-6">
                                    <Tag size={20} color="#14C6B2" />
                                    <TextInput
                                        ref={nameRef}
                                        className="flex-1 text-white py-5 px-4 font-inter text-lg"
                                        placeholder="e.g. Netflix, Spotify"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>

                            {/* Renewal Date & Time */}
                            <View className="flex-row gap-4 mb-8">
                                <View className="flex-[1.5]">
                                    <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Renewal Date</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticFeedback.light();
                                            setDatePickerMode('date');
                                            setShowDatePicker(true);
                                        }}
                                        activeOpacity={0.7}
                                        className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-4 py-4"
                                    >
                                        <Calendar size={18} color="#14C6B2" />
                                        <Text className="text-white text-sm ml-2 font-inter">
                                            {date.toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-1">
                                    <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Time</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticFeedback.light();
                                            setDatePickerMode('time');
                                            setShowDatePicker(true);
                                        }}
                                        activeOpacity={0.7}
                                        className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-4 py-4"
                                    >
                                        <Clock size={18} color="#14C6B2" />
                                        <Text className="text-white text-sm ml-2 font-inter">
                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode={datePickerMode}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    themeVariant="dark"
                                />
                            )}

                            {/* Settings Row */}
                            <View className="flex-row gap-4 mb-10">
                                <View className="flex-1">
                                    <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Category</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticFeedback.light();
                                            setShowPicker({ type: 'category' });
                                        }}
                                        className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row justify-between items-center active:bg-white/10"
                                    >
                                        <Text className="text-white font-inter-medium">{category}</Text>
                                        <ChevronDown size={16} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Cycle</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticFeedback.light();
                                            setShowPicker({ type: 'cycle' });
                                        }}
                                        className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row justify-between items-center active:bg-white/10"
                                    >
                                        <Text className="text-white font-inter-medium">{billingCycle}</Text>
                                        <ChevronDown size={16} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="h-4" />

                        {/* Primary CTA */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            className="bg-teal py-5 rounded-[28px] shadow-2xl shadow-teal/30 mb-20 active:scale-95 transition-all"
                            onPress={() => {
                                hapticFeedback.heavy();
                                handleSave();
                            }}
                            disabled={loading}
                        >
                            <Text className="text-navy text-center font-jakarta-bold text-xl">
                                {loading ? "Saving..." : isEditing ? "Update Tracker" : "Create Tracker"}
                            </Text>
                        </TouchableOpacity>
                    </MotiView>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
