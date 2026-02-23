import React from 'react';
import { View } from 'react-native';
import { Skeleton as MotiSkeleton } from 'moti/skeleton';

interface SkeletonProps {
    width?: any;
    height?: any;
    radius?: number | 'square' | 'round';
}

export const Skeleton = ({ width, height, radius = 24 }: SkeletonProps) => {
    return (
        <MotiSkeleton
            colorMode="dark"
            width={width}
            height={height}
            radius={radius}
            backgroundColor="rgba(255,255,255,0.05)"
            colors={['rgba(255,255,255,0.05)', 'rgba(20, 198, 178, 0.1)', 'rgba(255,255,255,0.05)']}
        />
    );
};

export const SubscriptionSkeleton = () => {
    return (
        <View className="bg-white/5 mb-4 p-5 rounded-[40px] flex-row items-center border border-white/5">
            <Skeleton width={64} height={64} radius={24} />
            <View className="flex-1 ml-4">
                <Skeleton width="60%" height={24} radius={8} />
                <View className="h-3" />
                <Skeleton width="40%" height={16} radius={8} />
            </View>
            <View className="items-end">
                <Skeleton width={80} height={32} radius={12} />
            </View>
        </View>
    );
};
