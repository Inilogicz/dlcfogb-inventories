"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '2xl'
}: ModalProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden"
        else document.body.style.overflow = ""
        return () => { document.body.style.overflow = "" }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />
            {/* Dialog */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all shrink-0">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}
