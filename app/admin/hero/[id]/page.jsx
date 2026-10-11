import { createServerSupabase } from '@/lib/supabase-server'
import HeroSlideForm from '@/components/admin/HeroSlideForm'
import { notFound } from 'next/navigation'

export default async function AdminHeroEditPage({ params }) {
  const { id } = await params

  if (id === 'new') {
    return <HeroSlideForm initialSlide={{}} />
  }

  const supabase = await createServerSupabase()
  const { data: slide, error } = await supabase
    .from('homepage_hero_slides')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !slide) {
    notFound()
  }

  return <HeroSlideForm initialSlide={slide} />
}
