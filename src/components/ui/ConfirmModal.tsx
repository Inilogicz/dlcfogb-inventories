"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, X } from "lucide-react"
import { Loader2 } from "lucide-react"

interface ConfirmModal {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
    onConfirm: () => void | Promise<void>
    onCancel: () => void
}

interface ConfirmModalProps extends ConfirmModal {
    isOpen: boolean
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Prevent scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden"
        else document.body.style.overflow = ""
        return () => { document.body.style.overflow = "" }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
                onClick={onCancel}
            />
            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-xl shrink-0 ${destructive ? 'bg-red-50' : 'bg-amber-50'}`}>
                            <AlertTriangle className={`w-6 h-6 ${destructive ? 'text-red-500' : 'text-amber-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{message}</p>
                        </div>
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-200 transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-5 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-60 ${destructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-200 shadow-md'
                                : 'bg-brand-blue hover:bg-brand-blue/90 shadow-blue-200 shadow-md'
                            }`}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Processing..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
