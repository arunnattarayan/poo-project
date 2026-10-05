CREATE TABLE IF NOT EXISTS public.store_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_urls JSONB DEFAULT '{"facebook": "", "twitter": "", "instagram": "", "pinterest": ""}'::jsonb,
    show_floating_social_bar BOOLEAN DEFAULT true,
    show_footer_social_icons BOOLEAN DEFAULT true,
    newsletter_header TEXT DEFAULT 'JOIN OUR COMMUNITY',
    newsletter_subheader TEXT DEFAULT 'Get early access to our collections.',
    payment_providers TEXT[] DEFAULT ARRAY['visa', 'mastercard', 'amex', 'paypal']::TEXT[],
    footer_about_links JSONB DEFAULT '[{"label":"Our Story","url":"#"},{"label":"Ethical Practices","url":"#"}]'::jsonb,
    footer_contact_links JSONB DEFAULT '[{"label":"Contact","url":"#"},{"label":"Press","url":"#"},{"label":"Wholesale","url":"#"}]'::jsonb,
    footer_support_links JSONB DEFAULT '[{"label":"Size Guide","url":"#"},{"label":"Shipping & Returns","url":"#"},{"label":"FAQ","url":"#"}]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS store_configurations_single_row ON public.store_configurations ((1));

INSERT INTO public.store_configurations (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.store_configurations);

ALTER TABLE public.store_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_configurations_public_read" ON public.store_configurations;
CREATE POLICY "store_configurations_public_read" ON public.store_configurations FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_configurations_admin_all" ON public.store_configurations;
CREATE POLICY "store_configurations_admin_all" ON public.store_configurations FOR ALL USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
