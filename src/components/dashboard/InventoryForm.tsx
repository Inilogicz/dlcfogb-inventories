"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, Loader2 } from "lucide-react"

export default function InventoryForm({ centerId }: { centerId: string }) {
    const [name, setName] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [description, setDescription] = useState("")
    const [model, setModel] = useState("")
    const [modelNumber, setModelNumber] = useState("")
    const [condition, setCondition] = useState("Good")
    const [image, setImage] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            setPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        let imageUrl = null

        if (image) {
            try {
                const formData = new FormData()
                formData.append('file', image)

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })
                const data = await res.json()
                if (data.url) {
                    imageUrl = data.url
                } else {
                    throw new Error(data.error || "Upload failed")
                }
            } catch (err: any) {
                console.error("Upload error:", err)
                setMessage({ type: 'error', text: "Image upload failed" })
                setLoading(false)
                return
            }
        }

        const { error } = await supabase
            .from('inventory_items')
            .insert({
                center_id: centerId,
                name,
                quantity,
                description,
                model,
                model_number: modelNumber,
                condition,
                image_url: imageUrl
            })

        if (error) {
            setMessage({ type: 'error', text: "Something went wrong" })
        } else {
            setMessage({ type: 'success', text: "Inventory item added successfully!" })
            setName("")
            setQuantity(1)
            setDescription("")
            setModel("")
            setModelNumber("")
            setCondition("Good")
            setImage(null)
            setPreview(null)
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-brand-blue">Add Inventory Item</h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Item Name</label>
                    <input
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Model</label>
                        <input
                            className="w-full px-3 py-2 border rounded-md"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Model Number</label>
                        <input
                            className="w-full px-3 py-2 border rounded-md"
                            value={modelNumber}
                            onChange={(e) => setModelNumber(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Condition</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                        >
                            <option value="New">New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                            <option value="Non-Functional">Non-Functional</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border rounded-md h-24"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Image (Cloudinary)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative group">
                        {preview ? (
                            <div className="relative w-full h-40">
                                <img src={preview} alt="Preview" className="w-full h-full object-contain rounded" />
                                <button
                                    type="button"
                                    onClick={() => { setImage(null); setPreview(null); }}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full shadow-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-orange hover:text-brand-orange/80">
                                        <span>Upload a file</span>
                                        <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Adding Item..." : "Add to Inventory"}
                </button>
            </div>
        </form>
    )
}
