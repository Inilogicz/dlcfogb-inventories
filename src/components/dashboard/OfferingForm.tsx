"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ServiceType } from "@/types/database"

export default function OfferingForm({ centerId }: { centerId: string }) {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
    const [selectedType, setSelectedType] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [amount, setAmount] = useState<number>(0)
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

    const amount80 = amount * 0.8
    const amount20 = amount * 0.2

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase
            .from('offering_submissions')
            .insert({
                center_id: centerId,
                service_type_id: selectedType,
                service_date: date,
                amount_100: amount
            })

        if (error) {
            if (error.code === '23505') {
                setMessage({ type: 'error', text: "A submission already exists for this date and service type." })
            } else {
                setMessage({ type: 'error', text: "Something went wrong" })
            }
        } else {
            setMessage({ type: 'success', text: "Offering submitted successfully!" })
            setAmount(0)
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-brand-blue">Submit Offering</h2>

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

            <div className="space-y-2">
                <label className="text-sm font-medium">Total Offering (100%)</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">₦</span>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full pl-8 pr-3 py-2 border rounded-md"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">80% Remittance</p>
                    <p className="text-lg font-bold text-green-800">₦{amount80.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-brand-blue font-medium">20% Local Retention</p>
                    <p className="text-lg font-bold text-brand-blue">₦{amount20.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
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
                {loading ? "Submitting..." : "Submit Offering"}
            </button>
        </form>
    )
}
