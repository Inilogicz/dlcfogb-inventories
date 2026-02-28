"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ServiceType } from "@/types/database"

export default function AttendanceForm({ centerId }: { centerId: string }) {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
    const [selectedType, setSelectedType] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [adultBrothers, setAdultBrothers] = useState(0)
    const [adultSisters, setAdultSisters] = useState(0)
    const [youthBrothers, setYouthBrothers] = useState(0)
    const [youthSisters, setYouthSisters] = useState(0)
    const [childrenBrothers, setChildrenBrothers] = useState(0)
    const [childrenSisters, setChildrenSisters] = useState(0)
    const [visitorsBrothers, setVisitorsBrothers] = useState(0)
    const [visitorsSisters, setVisitorsSisters] = useState(0)
    const [loading, setLoading] = useState(false)
    const [fetchingServices, setFetchingServices] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        async function fetchServiceTypes() {
            setFetchingServices(true)
            const { data, error } = await supabase.from('service_types').select('*').order('name')
            if (error) {
                console.error("Error fetching service types:", error)
            } else if (data) {
                setServiceTypes(data)
            }
            setFetchingServices(false)
        }
        fetchServiceTypes()
    }, [])

    const grandTotal = adultBrothers + adultSisters + youthBrothers + youthSisters +
        childrenBrothers + childrenSisters + visitorsBrothers + visitorsSisters

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase
            .from('attendance_submissions')
            .insert({
                center_id: centerId,
                service_type_id: selectedType,
                service_date: date,
                adult_brothers: adultBrothers,
                adult_sisters: adultSisters,
                youth_brothers: youthBrothers,
                youth_sisters: youthSisters,
                children_brothers: childrenBrothers,
                children_sisters: childrenSisters,
                visitors_brothers: visitorsBrothers,
                visitors_sisters: visitorsSisters
            })

        if (error) {
            if (error.code === '23505') {
                setMessage({ type: 'error', text: "A submission already exists for this date and service type." })
            } else {
                setMessage({ type: 'error', text: error.message })
            }
        } else {
            setMessage({ type: 'success', text: "Attendance submitted successfully!" })
            // Reset form
            setAdultBrothers(0)
            setAdultSisters(0)
            setYouthBrothers(0)
            setYouthSisters(0)
            setChildrenBrothers(0)
            setChildrenSisters(0)
            setVisitorsBrothers(0)
            setVisitorsSisters(0)
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-brand-blue">Submit Attendance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Service Type</label>
                    <select
                        required
                        disabled={fetchingServices || serviceTypes.length === 0}
                        className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:text-gray-400"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        {fetchingServices ? (
                            <option>Loading services...</option>
                        ) : serviceTypes.length === 0 ? (
                            <option>No service types available. Contact Admin.</option>
                        ) : (
                            <>
                                <option value="">Select Service Type</option>
                                {serviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </>
                        )}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Adult (Bro)", val: adultBrothers, set: setAdultBrothers },
                    { label: "Adult (Sis)", val: adultSisters, set: setAdultSisters },
                    { label: "Youth (Bro)", val: youthBrothers, set: setYouthBrothers },
                    { label: "Youth (Sis)", val: youthSisters, set: setYouthSisters },
                    { label: "Children (Bro)", val: childrenBrothers, set: setChildrenBrothers },
                    { label: "Children (Sis)", val: childrenSisters, set: setChildrenSisters },
                    { label: "Visitors (Bro)", val: visitorsBrothers, set: setVisitorsBrothers },
                    { label: "Visitors (Sis)", val: visitorsSisters, set: setVisitorsSisters },
                ].map((field, idx) => (
                    <div key={idx} className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">{field.label}</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border rounded-md"
                            value={field.val}
                            onChange={(e) => field.set(parseInt(e.target.value) || 0)}
                        />
                    </div>
                ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <span className="font-medium text-brand-blue">Grand Total</span>
                <span className="text-2xl font-bold text-brand-orange">{grandTotal}</span>
            </div>

            {message && (
                <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !selectedType}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3 rounded-md transition-colors disabled:opacity-50"
            >
                {loading ? "Submitting..." : "Submit Attendance"}
            </button>
        </form>
    )
}
