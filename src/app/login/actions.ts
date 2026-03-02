'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signUp(data)

    if (error) {
        console.error("Signup error:", error.message)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (authData?.user && authData?.user?.identities?.length === 0) {
        // If identity is 0, it means the email already exists or is soft-deleted.
        redirect(`/login?error=이미 사용 중인 이메일입니다.`)
    }

    // Checking if email confirmation is required
    if (authData?.session === null) {
        redirect(`/login?message=회원가입 완료! 확인 이메일을 확인해주세요. (이메일 인증이 꺼져있다면 관리자에게 문의하세요)`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
