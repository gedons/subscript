import React, { useState, useEffect, useRef } from "react";
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
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { hapticFeedback } from "../lib/haptics";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";

export default function SignUpScreen({ navigation }: any) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const nameRef = useRef<TextInput>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            nameRef.current?.focus();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    async function signUpWithEmail() {
        if (!email || !password || !fullName) {
            hapticFeedback.warning();
            Toast.show({
                type: "error",
                text1: "Missing Fields",
                text2: "Please fill in all details.",
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            hapticFeedback.error();
            Toast.show({
                type: "error",
                text1: "Sign Up Failed",
                text2: error.message,
            });
        } else {
            hapticFeedback.success();
            Toast.show({
                type: "success",
                text1: "Account Created!",
                text2: "Please check your email for verification.",
            });
            navigation.navigate("Login");
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-navy">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8">
                    <MotiView
                        from={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 justify-center py-10"
                    >
                        <TouchableOpacity
                            onPress={() => {
                                hapticFeedback.light();
                                navigation.goBack();
                            }}
                            className="mb-8 w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 active:bg-white/10"
                        >
                            <ArrowLeft size={24} color="#14C6B2" />
                        </TouchableOpacity>

                        <View className="mb-10">
                            <Text className="text-white text-4xl font-jakarta-bold mb-2">Create Account</Text>
                            <Text className="text-white/60 text-lg font-inter">
                                Start tracking your subscriptions today
                            </Text>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-white/80 mb-2 ml-1 font-inter-medium">Full Name</Text>
                                <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-1">
                                    <User size={20} color="#14C6B2" />
                                    <TextInput
                                        ref={nameRef}
                                        style={{ fontFamily: 'Inter_400Regular' }}
                                        className="flex-1 text-white py-4 px-3"
                                        placeholder="John Doe"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-white/80 mb-2 ml-1 font-inter-medium">Email Address</Text>
                                <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-1">
                                    <Mail size={20} color="#14C6B2" />
                                    <TextInput
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
                                <Text className="text-white/80 mb-2 ml-1 font-inter-medium">Password</Text>
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
                                        {showPassword ? (
                                            <EyeOff size={20} color="#14C6B2" />
                                        ) : (
                                            <Eye size={20} color="#14C6B2" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                className="bg-teal py-5 rounded-[24px] mt-6 shadow-xl shadow-teal/30 active:scale-[0.98]"
                                onPress={() => {
                                    hapticFeedback.medium();
                                    signUpWithEmail();
                                }}
                                disabled={loading}
                            >
                                <Text className="text-navy text-center font-jakarta-bold text-xl">
                                    {loading ? "Creating Account..." : "Sign Up"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-center mt-12">
                            <Text className="text-white/60 font-inter text-base">Already have an account? </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    hapticFeedback.medium();
                                    navigation.navigate("Login");
                                }}
                                className="active:opacity-50"
                            >
                                <Text className="text-teal font-inter-bold text-base">Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </MotiView>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
