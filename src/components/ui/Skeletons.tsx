// Skeleton loading components for dashboard sections

export function StatCardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-7 bg-gray-200 rounded w-20" />
                </div>
            </div>
        </div>
    )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                </td>
            ))}
        </tr>
    )
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-100" />
            <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse flex items-end gap-2 p-4">
            {[40, 60, 45, 80, 55, 70, 50].map((h, i) => (
                <div key={i} className="bg-gray-200 rounded-t flex-1" style={{ height: `${h}%` }} />
            ))}
        </div>
    )
}

export function FormSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-10 bg-gray-100 rounded-lg w-full" />
                </div>
            ))}
            <div className="h-10 bg-gray-200 rounded-lg w-full" />
        </div>
    )
}

export function PageHeaderSkeleton() {
    return (
        <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-4 bg-gray-100 rounded w-48" />
        </div>
    )
}
