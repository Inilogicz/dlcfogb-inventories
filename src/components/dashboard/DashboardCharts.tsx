"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'

const CustomTooltipStyle = {
    contentStyle: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #F1F5F9',
        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
        fontSize: '12px',
        fontWeight: 600,
    }
}

export function AttendanceChart({ data }: { data: any[] }) {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={28}>
                    <defs>
                        <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F28C28" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#F28C28" stopOpacity={0.6} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94A3B8', fontWeight: 700 }}
                    />
                    <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#CBD5E1', fontWeight: 600 }}
                    />
                    <Tooltip {...CustomTooltipStyle} cursor={{ fill: '#F8FAFC', radius: 8 }} />
                    <Bar dataKey="attendance" fill="url(#attGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export function OfferingChart({ data }: { data: any[] }) {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="offGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94A3B8', fontWeight: 700 }}
                    />
                    <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#CBD5E1', fontWeight: 600 }}
                    />
                    <Tooltip {...CustomTooltipStyle} cursor={{ stroke: '#1E3A8A', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#1E3A8A"
                        strokeWidth={2.5}
                        fill="url(#offGrad)"
                        dot={{ fill: '#1E3A8A', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#F28C28' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
