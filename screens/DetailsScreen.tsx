import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Edit2, Trash2, LayoutDashboard, Calendar, CreditCard, Tag } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { hapticFeedback } from "../lib/haptics";
import { cancelSubscriptionReminder } from "../lib/notifications";
import { getCurrencySymbol } from "../lib/currency";
import { useAuth } from "../context/AuthContext";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";
import { useFocusEffect } from "@react-navigation/native";

export default function DetailsScreen({ route, navigation }: any) {
    const { profile } = useAuth();
    const [subscription, setSubscription] = React.useState(route.params.subscription);

    // Backup Refresh: Pull fresh data whenever screen is focused
    useFocusEffect(
        React.useCallback(() => {
            const fetchFreshData = async () => {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('id', subscription.id)
                    .single();

                if (data && !error) {
                    setSubscription(data);
                }
            };
            fetchFreshData();
        }, [subscription.id])
    );

    // Realtime listener
    React.useEffect(() => {
        const channel = supabase
            .channel(`sub-updates-${subscription.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'subscriptions',
                    filter: `id=eq.${subscription.id}`,
                },
                (payload) => {
                    setSubscription(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [subscription.id]);

    async function handleCancel() {
        hapticFeedback.warning();
        const { error } = await supabase
            .from("subscriptions")
            .delete()
            .eq("id", subscription.id);

        if (error) {
            hapticFeedback.error();
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message,
            });
        } else {
            hapticFeedback.success();
            // Cancel notifications
            await cancelSubscriptionReminder(subscription.id);

            Toast.show({
                type: "success",
                text1: "Removed",
                text2: `${subscription.name} has been deleted.`,
            });
            navigation.goBack();
        }
    }

    const DetailBlock = ({ label, value, icon: Icon, delay = 0 }: any) => (
        <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 400, delay }}
            className="bg-white/5 border border-white/10 rounded-[28px] p-5 mb-4 flex-row items-center"
        >
            <View className="w-12 h-12 bg-teal/10 rounded-2xl items-center justify-center mr-4">
                <Icon size={22} color="#14C6B2" />
            </View>
            <View>
                <Text className="text-white/40 text-[10px] mb-1 font-inter uppercase tracking-widest">{label}</Text>
                <Text className="text-white text-lg font-jakarta-bold">{value}</Text>
            </View>
        </MotiView>
    );

    return (
        <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
            {/* Top Header */}
            <View className="flex-row justify-between items-center px-6 py-4">
                <TouchableOpacity
                    onPress={() => {
                        hapticFeedback.light();
                        navigation.goBack();
                    }}
                    className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 active:bg-white/10"
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        hapticFeedback.light();
                        navigation.navigate("AddSubscription", { subscription });
                    }}
                    className="w-12 h-12 bg-teal/20 rounded-2xl items-center justify-center border border-teal/30 active:bg-teal/30"
                >
                    <Edit2 size={24} color="#14C6B2" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-8">
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="items-center py-10"
                >
                    <View className="w-32 h-32 bg-teal/10 rounded-[48px] items-center justify-center mb-8 border-2 border-teal/20 shadow-2xl shadow-teal/10">
                        <LayoutDashboard size={64} color="#14C6B2" />
                    </View>
                    <Text className="text-white text-4xl font-jakarta-bold mb-3 text-center">{subscription.name}</Text>
                    <View className="bg-teal/20 px-6 py-3 rounded-full border border-teal/30">
                        <Text className="text-teal font-jakarta-bold text-2xl">{getCurrencySymbol(profile?.currency)}{Number(subscription.cost).toFixed(2)}</Text>
                    </View>
                    <Text className="text-white/40 font-inter mt-3 uppercase tracking-widest">Billed {subscription.billing_cycle}</Text>
                </MotiView>

                <View className="mt-4">
                    <DetailBlock
                        label="Next Renewal Date"
                        value={subscription.renewal_date.includes('T')
                            ? new Date(subscription.renewal_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : new Date(subscription.renewal_date).toLocaleDateString()}
                        icon={Calendar}
                        delay={100}
                    />
                    <DetailBlock label="Subscription Category" value={subscription.category} icon={Tag} delay={200} />
                    <DetailBlock label="Default Payment" value="Visa •••• 4242" icon={CreditCard} delay={300} />
                </View>

                <View className="h-12" />

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', delay: 400 }}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="border border-red-500/30 bg-red-500/5 py-5 rounded-[28px] flex-row justify-center items-center mb-10 active:bg-red-500/10 active:scale-95 transition-all"
                        onPress={handleCancel}
                    >
                        <Trash2 size={22} color="#FF4B4B" style={{ marginRight: 12 }} />
                        <Text className="text-red-500 font-jakarta-bold text-xl">Cancel Tracker</Text>
                    </TouchableOpacity>
                </MotiView>
            </ScrollView>
        </SafeAreaView>
    );
}
