import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Modal,
    Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, ChevronRight, LayoutDashboard, TrendingUp, Bell, User, LogOut, Settings as SettingsIcon, X, Eye, EyeOff } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { hapticFeedback } from "../lib/haptics";
import { getCurrencySymbol } from "../lib/currency";
import { SubscriptionSkeleton } from "../components/Skeleton";
import Toast from "react-native-toast-message";
import { MotiView, AnimatePresence } from "moti";
import { useFocusEffect } from "@react-navigation/native";
import { SpendingTrend } from "../components/SpendingTrend";

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
    const { user, profile } = useAuth();
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [totalSpending, setTotalSpending] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [chartContainerWidth, setChartContainerWidth] = useState(0);

    // Automatically refresh when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                // FORCE REFRESH: Always get fresh data from DB, but don't show 
                // the skeleton if we already have cache (prevents UI flicker).
                fetchSubscriptions(subscriptions.length === 0, true);

                import('../lib/notifications').then(({ registerForPushNotificationsAsync }) => {
                    registerForPushNotificationsAsync();
                });
            }
        }, [user])
    );

    const fetchSubscriptions = async (showLoadingSkeleton = false, forceRefresh = false) => {
        if (showLoadingSkeleton) setLoading(true);

        try {
            const { data, error } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", user?.id)
                .order("renewal_date", { ascending: true });

            if (error) throw error;

            setSubscriptions(data || []);
            const total = (data || []).reduce((sum, sub: any) => sum + Number(sub.cost), 0);
            setTotalSpending(total);
        } catch (error: any) {
            hapticFeedback.error();
            Toast.show({
                type: "error",
                text1: "Sync Error",
                text2: error.message || "Failed to fetch data",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        hapticFeedback.medium();
        setRefreshing(true);
        fetchSubscriptions();
    };

    const handleLogout = async () => {
        hapticFeedback.heavy();
        const { error } = await supabase.auth.signOut();
        if (error) {
            Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center z-10">
                <View>
                    <Text className="text-white/60 text-base font-inter">Your spending,</Text>
                    <Text className="text-white text-3xl font-jakarta-bold">Dashboard</Text>
                </View>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => {
                            hapticFeedback.light();
                            // Notification logic here
                        }}
                        className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 active:bg-white/10"
                    >
                        <Bell size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            hapticFeedback.medium();
                            setShowAccountMenu(true);
                        }}
                        className="w-12 h-12 bg-teal/10 rounded-2xl items-center justify-center border border-teal/20 active:bg-teal/20 overflow-hidden"
                    >
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <User size={24} color="#14C6B2" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14C6B2" />
                }
            >
                {/* Spending Card - Visual Hierarchy High Point */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 100 }}
                    className="mx-6 mt-4 mb-10 overflow-hidden rounded-[40px] shadow-2xl shadow-teal/20"
                >
                    <View className="bg-teal p-8">
                        <View className="flex-row justify-between items-start mb-10">
                            <View className="flex-1 mr-4">
                                <Text className="text-navy/60 font-inter-semibold mb-1 uppercase tracking-tighter text-[10px]">Total Monthly Budget</Text>
                                <View className="flex-row items-center flex-wrap">
                                    <Text className="text-navy text-4xl font-jakarta-bold mr-3" numberOfLines={1} adjustsFontSizeToFit>
                                        {showBalance ? `${getCurrencySymbol(profile?.currency)}${totalSpending.toFixed(2)}` : "••••••"}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticFeedback.selection();
                                            setShowBalance(!showBalance);
                                        }}
                                        className="bg-navy/10 p-2 rounded-xl"
                                    >
                                        {showBalance ? <Eye size={18} color="#0A192F" /> : <EyeOff size={18} color="#0A192F" />}
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View className="bg-navy/10 p-3 rounded-2xl">
                                <TrendingUp size={24} color="#0A192F" />
                            </View>
                        </View>

                        <View className="flex-row items-center bg-navy/5 p-5 rounded-[32px]">
                            <View
                                className="flex-1 mr-4"
                                onLayout={(e) => setChartContainerWidth(e.nativeEvent.layout.width)}
                            >
                                <Text className="text-navy/40 text-[9px] font-inter-bold uppercase mb-2">Spending Trend</Text>
                                {chartContainerWidth > 0 && <SpendingTrend width={chartContainerWidth} />}
                            </View>
                            <View className="items-center bg-navy/10 px-4 py-3 rounded-2xl min-w-[70px]">
                                <Text className="text-navy text-xl font-jakarta-bold">{subscriptions.length}</Text>
                                <Text className="text-navy/60 text-[8px] font-inter-bold uppercase">Trackers</Text>
                            </View>
                        </View>
                    </View>
                </MotiView>

                {/* Section Heading */}
                <View className="px-6 flex-row justify-between items-center mb-6">
                    <Text className="text-white text-2xl font-jakarta-bold">Active Subscriptions</Text>
                    <TouchableOpacity
                        onPress={() => {
                            hapticFeedback.light();
                            // Could navigate to a list view
                        }}
                        className="active:opacity-50"
                    >
                        <Text className="text-teal font-inter-semibold">Manage</Text>
                    </TouchableOpacity>
                </View>

                {/* Subscriptions List with Skeleton & Micro-interactions */}
                <View className="px-6">
                    <AnimatePresence>
                        {loading ? (
                            // Skeleton States
                            [1, 2, 3, 4].map((i) => (
                                <MotiView key={i} from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <SubscriptionSkeleton />
                                </MotiView>
                            ))
                        ) : subscriptions.length === 0 ? (
                            <MotiView
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="items-center py-10"
                            >
                                <Text className="text-white/40 font-inter text-center">No subscriptions found.{"\n"}Tap the + button to add one.</Text>
                            </MotiView>
                        ) : (
                            subscriptions.map((item, index) => (
                                <MotiView
                                    key={item.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ type: 'timing', duration: 400, delay: index * 100 }}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        className="bg-white/5 mb-4 p-5 rounded-[32px] flex-row items-center border border-white/5 active:bg-white/10 active:scale-[0.98]"
                                        onPress={() => {
                                            hapticFeedback.light();
                                            navigation.navigate("Details", { subscription: item });
                                        }}
                                    >
                                        <View className="w-14 h-14 bg-teal/10 rounded-2xl items-center justify-center mr-4">
                                            <LayoutDashboard size={28} color="#14C6B2" />
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-white font-jakarta-bold text-lg mb-1">{item.name}</Text>
                                            <Text className="text-white/40 text-sm font-inter">
                                                Renews {new Date(item.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </Text>
                                        </View>

                                        <View className="items-end mr-2">
                                            <Text className="text-teal font-jakarta-bold text-xl">{getCurrencySymbol(profile?.currency)}{Number(item.cost).toFixed(2)}</Text>
                                            <Text className="text-white/40 text-[10px] font-inter uppercase tracking-widest">monthly</Text>
                                        </View>

                                        <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                                    </TouchableOpacity>
                                </MotiView>
                            ))
                        )}
                    </AnimatePresence>
                </View>
            </ScrollView>

            {/* Modern FAB - Thumb Zone Primary CTA */}
            <MotiView
                from={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 500 }}
                style={{ position: 'absolute', bottom: 40, right: 30 }}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    className="bg-teal w-18 h-18 rounded-[28px] items-center justify-center shadow-2xl shadow-teal/50 border-4 border-navy active:scale-90"
                    style={{ width: 72, height: 72 }}
                    onPress={() => {
                        hapticFeedback.heavy();
                        navigation.navigate("AddSubscription");
                    }}
                >
                    <Plus size={36} color="#0A192F" strokeWidth={3} />
                </TouchableOpacity>
            </MotiView>

            {/* Account Menu Modal */}
            <Modal
                visible={showAccountMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAccountMenu(false)}
            >
                <View className="flex-1 bg-navy/80 justify-end">
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowAccountMenu(false)}
                    />
                    <MotiView
                        from={{ translateY: 300 }}
                        animate={{ translateY: 0 }}
                        className="bg-[#0D1F3D] rounded-t-[40px] px-8 pt-6 pb-12 border-t border-white/10"
                    >
                        <View className="w-12 h-1 bg-white/10 rounded-full self-center mb-8" />

                        <View className="flex-row items-center mb-10">
                            <View className="w-16 h-16 bg-teal/20 rounded-2xl items-center justify-center border border-teal/30 mr-5 overflow-hidden">
                                {profile?.avatar_url ? (
                                    <Image source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <User size={32} color="#14C6B2" />
                                )}
                            </View>
                            <View>
                                <Text className="text-white text-2xl font-jakarta-bold">{profile?.full_name || user?.email?.split('@')[0] || 'Member'}</Text>
                                <Text className="text-white/40 font-inter">{user?.email}</Text>
                            </View>
                        </View>

                        <View className="space-y-6">
                            <TouchableOpacity
                                onPress={() => {
                                    hapticFeedback.light();
                                    setShowAccountMenu(false);
                                    navigation.navigate("Settings");
                                }}
                                className="bg-white/5 flex-row items-center p-6 rounded-[24px] border border-white/5 active:bg-white/10"
                            >
                                <SettingsIcon size={24} color="#14C6B2" />
                                <Text className="text-white font-inter-medium text-lg ml-4">Account Settings</Text>
                                <View className="flex-1" />
                                <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setShowAccountMenu(false);
                                    handleLogout();
                                }}
                                className="bg-red-500/10 flex-row items-center p-6 rounded-[24px] border border-red-500/20 active:bg-red-500/20"
                            >
                                <LogOut size={24} color="#FF4B4B" />
                                <Text className="text-red-500 font-inter-medium text-lg ml-4">Log Out</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowAccountMenu(false)}
                            className="mt-8 bg-white/5 p-5 rounded-[24px] items-center active:bg-white/10"
                        >
                            <Text className="text-white/60 font-inter-medium">Close</Text>
                        </TouchableOpacity>
                    </MotiView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
