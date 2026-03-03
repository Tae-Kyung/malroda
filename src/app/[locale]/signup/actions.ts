'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { defaultLocale } from '@/i18n/config'

async function getLocale() {
    const cookieStore = await cookies()
    return cookieStore.get('NEXT_LOCALE')?.value || defaultLocale
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const locale = await getLocale()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validation
    if (!fullName || fullName.trim().length < 2) {
        redirect(`/${locale}/signup?error=${encodeURIComponent('Please enter your full name')}`)
    }

    if (!email || !email.includes('@')) {
        redirect(`/${locale}/signup?error=${encodeURIComponent('Please enter a valid email address')}`)
    }

    if (!password || password.length < 6) {
        redirect(`/${locale}/signup?error=${encodeURIComponent('Password must be at least 6 characters')}`)
    }

    if (password !== confirmPassword) {
        redirect(`/${locale}/signup?error=${encodeURIComponent('Passwords do not match')}`)
    }

    // Sign up with Supabase
    const { error, data: authData } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName.trim(),
            }
        }
    })

    if (error) {
        console.error("Signup error:", error.message)
        redirect(`/${locale}/signup?error=${encodeURIComponent(error.message)}`)
    }

    // Check if email already exists (identities array is empty)
    if (authData?.user && authData?.user?.identities?.length === 0) {
        redirect(`/${locale}/signup?error=${encodeURIComponent('An account with this email already exists')}`)
    }

    // Check if email confirmation is required
    if (authData?.session === null) {
        redirect(`/${locale}/login?message=${encodeURIComponent('Account created! Please check your email to confirm your account.')}`)
    }

    // Success - user is logged in
    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard`)
}
