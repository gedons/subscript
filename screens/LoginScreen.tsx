import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { hapticFeedback } from "../lib/haptics";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const emailRef = useRef<TextInput>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            emailRef.current?.focus();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    async function signInWithEmail() {
        if (!email || !password) {
            hapticFeedback.warning();
            Toast.show({
                type: "error",
                text1: "Required",
                text2: "Please enter your email and password.",
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            hapticFeedback.error();
            Toast.show({
                type: "error",
                text1: "Login Error",
                text2: error.message,
            });
        } else {
            hapticFeedback.success();
        }
        setLoading(false);
    }

    async function signInWithGoogle() {
        hapticFeedback.medium();
        setLoading(true);

        try {
            const redirectUri = AuthSession.makeRedirectUri({
                scheme: 'subscript',
                path: 'google-auth'
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

            if (res.type === 'success' && res.url) {
                // Handling both hash (#) and search (?) and making it robust
                const url = res.url.replace('#', '?');
                const params = new URL(url).searchParams;

                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token && refresh_token) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token,
                        refresh_token,
                    });
                    if (sessionError) throw sessionError;
                    hapticFeedback.success();
                }
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Google Auth Error',
                text2: error.message,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-navy">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="px-8"
                    keyboardShouldPersistTaps="handled"
                >
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="flex-1 justify-center py-10"
                    >
                        <View className="mb-12 items-center">
                            <MotiView
                                from={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', delay: 200 }}
                                className="w-24 h-24 bg-teal/20 rounded-[32px] items-center justify-center mb-6 border border-teal/30 shadow-2xl shadow-teal/20"
                            >
                                <Text className="text-teal text-5xl font-jakarta-bold">S</Text>
                            </MotiView>
                            <Text className="text-white text-4xl font-jakarta-bold mb-2">Welcome Back</Text>
                            <Text className="text-white/60 text-lg text-center font-inter">Manage your subs, save your cash</Text>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Email Address</Text>
                                <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-1">
                                    <Mail size={20} color="#14C6B2" />
                                    <TextInput
                                        ref={emailRef}
                                        style={{ fontFamily: 'Inter_400Regular' }}
                                        className="flex-1 text-white py-4 px-3"
                                        placeholder="you@example.com"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-white/40 mb-3 ml-1 font-inter-medium uppercase tracking-widest text-[10px]">Password</Text>
                                <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-1">
                                    <Lock size={20} color="#14C6B2" />
                                    <TextInput
                                        style={{ fontFamily: 'Inter_400Regular' }}
                                        className="flex-1 text-white py-4 px-3"
                                        placeholder="••••••••"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticFeedback.selection();
                                            setShowPassword(!showPassword);
                                        }}
                                    >
                                        <Text className="text-teal text-xs font-inter-bold">{showPassword ? "HIDE" : "SHOW"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                className="bg-teal py-5 rounded-[24px] mt-6 shadow-xl shadow-teal/30 active:scale-[0.98]"
                                onPress={signInWithEmail}
                                disabled={loading}
                            >
                                <Text className="text-navy text-center font-jakarta-bold text-xl">
                                    {loading ? "Signing In..." : "Log In"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-12">
                            <View className="flex-row items-center mb-8 px-4">
                                <View className="flex-1 h-[1px] bg-white/10" />
                                <Text className="text-white/40 px-6 font-inter text-xs uppercase tracking-widest">or continue with</Text>
                                <View className="flex-1 h-[1px] bg-white/10" />
                            </View>

                            <View className="flex-row justify-between" style={{ gap: 16 }}>
                                <TouchableOpacity
                                    onPress={signInWithGoogle}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-[20px] py-4 items-center active:bg-white/10"
                                >
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-inter-medium text-lg">Google</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-white/5 border border-white/10 rounded-[20px] py-4 items-center active:bg-white/10 opacity-50"
                                    onPress={() => Toast.show({ type: 'info', text1: 'Not Available', text2: 'Apple sign-in is coming soon.' })}
                                >
                                    <Text className="text-white font-inter-medium text-lg">Apple</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row justify-center mt-12 mb-6">
                            <Text className="text-white/60 text-base font-inter">Don't have an account? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("SignUp")}
                                className="active:opacity-50"
                            >
                                <Text className="text-teal font-inter-bold text-base">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </MotiView>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
