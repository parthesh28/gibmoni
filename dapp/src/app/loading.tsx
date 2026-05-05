import { BrutalistLoader } from "@/components/brutalistLoader";

export default function Loading() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300">
            <BrutalistLoader text="LOADING_SYSTEM_STATE // AWAIT" />
        </main>
    )
}
