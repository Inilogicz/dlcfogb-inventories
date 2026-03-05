import LoginForm from "@/components/auth/LoginForm"
import { Cross } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex bg-[#F4F6FB]">
            {/* Left Brand Panel */}
            <div className="hidden lg:flex w-1/2 bg-brand-blue flex-col justify-between p-12 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-orange/20 rounded-full" />
                <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/5 rounded-full" />

                {/* Logo */}
                <div className="relative flex items-center gap-3">
                    <Image src="/dlcf-logo.png" alt="dlcf-logo" width={50} height={50} />
                    <div>
                        <p className="text-white font-bold text-lg leading-tight">DLCF Oyo South</p>
                        <p className="text-white/40 text-xs font-medium">Raising Saintly Scholars</p>
                    </div>
                </div>

                {/* Hero section with Image */}
                <div className="relative flex-1 flex flex-col justify-center items-center text-center space-y-8">
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse" />
                        <Image
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl8KrUtKMR-FCPaZQBhIySAVmKvQGazRJMoA&s"
                            alt="Brand Logo"
                            fill
                            className="object-contain relative drop-shadow-2xl"
                            priority
                        />
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                            <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">DLCF OYO SOUTH</span>
                        </div>
                        <h1 className="text-3xl font-black text-white leading-tight">
                            Raising Saintly <span className="text-brand-orange">Scholars</span>
                        </h1>
                        <p className="text-white/60 text-sm font-medium leading-relaxed">
                            A centralized portal for attendance entry, inventory management, and regional reporting for DLCF Oyo South.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="relative text-white/20 text-xs font-bold tracking-widest uppercase">
                    © {new Date().getFullYear()} DLCF Oyo South
                </p>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <Image src="/dlcf-logo.png" alt="dlcf-logo" width={50} height={50} />
                        <p className="font-bold text-brand-blue">DLCF Oyo South Portal</p>
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Welcome back</h2>
                        <p className="text-gray-500 mt-2 text-sm">Sign in to continue to your dashboard.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <LoginForm />
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        Need access? Contact your Pastor.
                    </p>
                </div>
            </div>
        </div>
    )
}
