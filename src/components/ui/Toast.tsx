"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

export type ToastType = "success" | "error" | "info"

interface ToastProps {
    id: string
    type: ToastType
    message: string
    onRemove: (id: string) => void
}

function Toast({ id, type, message, onRemove }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(id), 4000)
        return () => clearTimeout(timer)
    }, [id, onRemove])

    const styles = {
        success: { bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-500", text: "text-emerald-800" },
        error: { bg: "bg-red-50 border-red-200", icon: XCircle, iconColor: "text-red-500", text: "text-red-800" },
        info: { bg: "bg-blue-50 border-blue-200", icon: Info, iconColor: "text-blue-500", text: "text-blue-800" },
    }[type]

    const Icon = styles.icon

    return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right backdrop-blur-sm ${styles.bg} max-w-sm w-full`}>
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${styles.iconColor}`} />
            <p className={`text-sm font-medium flex-1 ${styles.text}`}>{message}</p>
            <button onClick={() => onRemove(id)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

interface ToastContainerProps {
    toasts: { id: string; type: ToastType; message: string }[]
    onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    return createPortal(
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <Toast id={t.id} type={t.type} message={t.message} onRemove={onRemove} />
                </div>
            ))}
        </div>,
        document.body
    )
}

// Hook
let toastCallback: ((type: ToastType, message: string) => void) | null = null

export function useToast() {
    const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([])

    const addToast = (type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev, { id, type, message }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return { toasts, addToast, removeToast }
}
