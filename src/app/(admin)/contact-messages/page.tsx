import { createClient } from '@supabase/supabase-js';
import ContactClient from './ContactClient';

export const dynamic = 'force-dynamic';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default async function ContactPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: messages, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch contact messages:', error);
  }

  return (
    <div className="p-6 max-w-full mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-headline">Kotak Masuk Pesan</h1>
        <p className="text-gray-500 mt-2 font-body">
          Kelola pesan yang dikirim melalui form kontak website.
        </p>
      </div>

      <ContactClient initialMessages={(messages as ContactMessage[]) || []} />
    </div>
  );
}
