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

export async function login(formData: FormData) {
    const supabase = await createClient()
    const locale = await getLocale()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect(`/${locale}/login?error=${encodeURIComponent('Please enter email and password')}`)
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        console.error("Login error:", error.message)
        redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard`)
}

export async function signout() {
    const supabase = await createClient()
    const locale = await getLocale()
    await supabase.auth.signOut()
    redirect(`/${locale}/login`)
}
