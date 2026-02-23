import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    Modal,
    TextInput,
    ActivityIndicator,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, User, Bell, Shield, CircleHelp, Info, LogOut, ChevronRight, Moon, Sparkles, X, Check, DollarSign, Coins, Camera } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { hapticFeedback } from "../lib/haptics";
import { MotiView, AnimatePresence } from "moti";
import Toast from "react-native-toast-message";
import { CURRENCIES } from "../lib/currency";
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen({ navigation }: any) {
    const { user, profile, refreshProfile } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notification_enabled ?? true);
    const [darkMode, setDarkMode] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [newName, setNewName] = useState(profile?.full_name || "");
    const [updating, setUpdating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Sync notification setting with profile
    useEffect(() => {
        if (profile) {
            setNotificationsEnabled(profile.notification_enabled);
        }
    }, [profile]);

    const handleLogout = async () => {
        hapticFeedback.heavy();
        const { error } = await supabase.auth.signOut();
        if (error) {
            Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
        } else {
            navigation.replace("Login");
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setUpdating(true);
        hapticFeedback.medium();

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: newName, updated_at: new Date() })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            setShowEditModal(false);
            Toast.show({ type: 'success', text1: 'Profile Updated', text2: 'Your name has been updated successfully.' });
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateCurrency = async (currencyCode: string) => {
        if (!user) return;
        hapticFeedback.medium();

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ currency: currencyCode, updated_at: new Date() })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            setShowCurrencyModal(false);
            Toast.show({ type: 'success', text1: 'Currency Updated', text2: `Primary currency set to ${currencyCode}` });
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
        }
    };

    const pickAndUploadAvatar = async () => {
        if (!user) return;
        hapticFeedback.selection();

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (result.canceled || !result.assets[0].uri) return;

            setUploadingAvatar(true);
            const asset = result.assets[0];
            const fileExt = asset.uri.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                name: fileName,
                type: `image/${fileExt}`,
            } as any);

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, formData);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date() })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            Toast.show({ type: 'success', text1: 'Success', text2: 'Profile picture updated!' });
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.message || 'Check your internet connection' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const toggleNotifications = async (val: boolean) => {
        setNotificationsEnabled(val);
        hapticFeedback.selection();

        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ notification_enabled: val, updated_at: new Date() })
                .eq('id', user.id);

            if (error) throw error;
            await refreshProfile();
        } catch (error: any) {
            console.error('Error updating notification setting:', error);
            Toast.show({ type: 'error', text1: 'Settings Error', text2: 'Could not sync notification preference.' });
            // Revert on error
            setNotificationsEnabled(!val);
        }
    };

    const SettingItem = ({ icon: Icon, title, subtitle, value, onValueChange, type = "link", delay = 0 }: any) => (
        <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 400, delay }}
            className="mb-4"
        >
            <TouchableOpacity
                activeOpacity={type === "link" ? 0.7 : 1}
                onPress={() => {
                    if (type === "link") {
                        hapticFeedback.light();
                    }
                }}
                className="bg-white/5 border border-white/5 rounded-[28px] p-5 flex-row items-center"
            >
                <View className="w-12 h-12 bg-teal/10 rounded-2xl items-center justify-center mr-4">
                    <Icon size={22} color="#14C6B2" />
                </View>
                <View className="flex-1">
                    <Text className="text-white font-inter-bold text-lg">{title}</Text>
                    {subtitle && <Text className="text-white/40 text-xs font-inter mt-0.5">{subtitle}</Text>}
                </View>
                {type === "switch" ? (
                    <Switch
                        value={value}
                        onValueChange={onValueChange}
                        trackColor={{ false: "#1A2B42", true: "#14C6B2" }}
                        thumbColor={value ? "#FFFFFF" : "#94A3B8"}
                    />
                ) : (
                    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                )}
            </TouchableOpacity>
        </MotiView>
    );

    return (
        <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        className="bg-navy-light w-full border border-white/10 rounded-[40px] p-8 shadow-2xl"
                    >
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-white text-2xl font-jakarta-bold">Edit Profile</Text>
                            <TouchableOpacity
                                onPress={() => setShowEditModal(false)}
                                className="w-10 h-10 bg-white/5 rounded-full items-center justify-center"
                            >
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-white/40 ml-1 mb-2 font-inter-medium text-xs uppercase tracking-widest">Full Name</Text>
                        <View className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-8">
                            <TextInput
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="Enter your full name"
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                className="text-white font-inter text-lg"
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdateProfile}
                            disabled={updating}
                            className="bg-teal py-5 rounded-2xl flex-row justify-center items-center shadow-lg shadow-teal/20"
                        >
                            {updating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Check size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-jakarta-bold text-lg">Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </MotiView>
                </View>
            </Modal>

            {/* Currency Selection Modal */}
            <Modal
                visible={showCurrencyModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCurrencyModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        className="bg-navy-light w-full border border-white/10 rounded-[40px] p-8 shadow-2xl"
                    >
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-white text-2xl font-jakarta-bold">Primary Currency</Text>
                            <TouchableOpacity
                                onPress={() => setShowCurrencyModal(false)}
                                className="w-10 h-10 bg-white/5 rounded-full items-center justify-center"
                            >
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-3">
                            {CURRENCIES.map((curr) => {
                                const isSelected = profile?.currency === curr.code;
                                return (
                                    <TouchableOpacity
                                        key={curr.code}
                                        onPress={() => handleUpdateCurrency(curr.code)}
                                        className={`flex-row items-center p-5 rounded-2xl border mb-3 ${isSelected ? 'bg-teal border-teal shadow-lg shadow-teal/20' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isSelected ? 'bg-white/20' : 'bg-teal/10'}`}>
                                            <Text className={`text-lg font-jakarta-bold ${isSelected ? 'text-white' : 'text-teal'}`}>{curr.symbol}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-inter-bold text-base">{curr.label}</Text>
                                            <Text className={`text-xs ${isSelected ? 'text-white/60' : 'text-white/40'}`}>{curr.code}</Text>
                                        </View>
                                        {isSelected && <Check size={20} color="white" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </MotiView>
                </View>
            </Modal>

            {/* Header */}
            <View className="flex-row items-center px-6 py-4">
                <TouchableOpacity
                    onPress={() => {
                        hapticFeedback.light();
                        navigation.goBack();
                    }}
                    className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 active:bg-white/10"
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-jakarta-bold ml-6">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-8 pt-6">
                {/* Profile Header */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="items-center mb-10"
                >
                    <View className="relative">
                        <TouchableOpacity
                            onPress={pickAndUploadAvatar}
                            disabled={uploadingAvatar}
                            activeOpacity={0.8}
                            className="w-24 h-24 bg-teal/20 rounded-[32px] items-center justify-center mb-4 border border-teal/40 overflow-hidden"
                        >
                            {uploadingAvatar ? (
                                <ActivityIndicator color="#14C6B2" />
                            ) : profile?.avatar_url ? (
                                <Image
                                    source={{ uri: profile.avatar_url }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <User size={48} color="#14C6B2" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={pickAndUploadAvatar}
                            className="absolute bottom-2 right-0 bg-teal w-8 h-8 rounded-full items-center justify-center border-2 border-navy"
                        >
                            <Camera size={16} color="#0A192F" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-white text-xl font-jakarta-bold">
                        {profile?.full_name || user?.email?.split('@')[0] || 'Member'}
                    </Text>
                    <Text className="text-white/40 font-inter text-sm">{user?.email}</Text>

                    <TouchableOpacity
                        className="mt-4 bg-teal/10 border border-teal/20 px-6 py-2 rounded-full active:bg-teal/20"
                        onPress={() => {
                            hapticFeedback.selection();
                            setNewName(profile?.full_name || "");
                            setShowEditModal(true);
                        }}
                    >
                        <Text className="text-teal font-inter-semibold text-xs">Edit Profile</Text>
                    </TouchableOpacity>
                </MotiView>

                <Text className="text-white/40 mb-4 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Account & Security</Text>
                <SettingItem icon={Shield} title="Privacy Policy" subtitle="How we handle your data" delay={100} />
                <TouchableOpacity onPress={() => { hapticFeedback.light(); setShowCurrencyModal(true); }}>
                    <SettingItem
                        icon={DollarSign}
                        title="Primary Currency"
                        subtitle={`Default: ${profile?.currency || 'USD'}`}
                        delay={150}
                    />
                </TouchableOpacity>
                <SettingItem
                    icon={Bell}
                    title="Push Notifications"
                    subtitle="Renewal alerts"
                    type="switch"
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                    delay={200}
                />

                {/* Appearance */}
                <Text className="text-white/40 mt-6 mb-4 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Appearance</Text>
                <SettingItem icon={Moon} title="Dark Mode" subtitle="Easier on your eyes" type="switch" value={darkMode} onValueChange={(v: boolean) => { hapticFeedback.selection(); setDarkMode(v); }} delay={300} />
                <SettingItem icon={Sparkles} title="Custom App Icon" subtitle="Premium only" delay={400} />

                {/* Support & Legal */}
                <Text className="text-white/40 mt-6 mb-4 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Support</Text>
                <SettingItem icon={CircleHelp} title="Help Center" subtitle="FAQs and guides" delay={500} />
                <SettingItem icon={Info} title="About SubScript" subtitle="Version 1.0.0 (Build 42)" delay={600} />

                <View className="h-4" />

                {/* Logout */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', delay: 700 }}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="bg-red-500/10 border border-red-500/20 py-5 rounded-[28px] flex-row justify-center items-center mb-12 active:bg-red-500/20"
                        onPress={handleLogout}
                    >
                        <LogOut size={22} color="#FF4B4B" style={{ marginRight: 12 }} />
                        <Text className="text-red-500 font-jakarta-bold text-lg">Sign Out</Text>
                    </TouchableOpacity>
                </MotiView>

                <View className="items-center mb-10">
                    <Text className="text-white/20 font-inter text-[10px] uppercase tracking-widest">Designed with ❤️ for SubScript</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
