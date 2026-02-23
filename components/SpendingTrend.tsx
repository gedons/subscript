import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

export const SpendingTrend = ({ data = [20, 45, 28, 80, 99, 43, 50], width }: { data?: number[], width?: number }) => {
    const chartWidth = width || (screenWidth - 120);
    const chartHeight = 60;

    // Normalize data to fit in height
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * chartWidth,
        y: chartHeight - ((val - min) / range) * chartHeight
    }));

    const d = `M ${points[0].x},${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ');

    const areaD = `${d} L ${points[points.length - 1].x},${chartHeight} L 0,${chartHeight} Z`;

    return (
        <View style={{ height: chartHeight, width: chartWidth }}>
            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#0A192F" stopOpacity="0.3" />
                        <Stop offset="1" stopColor="#0A192F" stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                <Path
                    d={areaD}
                    fill="url(#grad)"
                />
                <Path
                    d={d}
                    stroke="#0A192F"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </Svg>
        </View>
    );
};
