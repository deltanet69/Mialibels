import { redirect } from 'next/navigation';
import { getSpmbUrl } from '@/lib/urls';

export default function PpdbLegacyPage() {
  redirect(getSpmbUrl());
}
