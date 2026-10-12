import { redirect } from 'next/navigation';
import { getSpmbUrl } from '@/lib/urls';

export default function SpmbPage() {
  redirect(getSpmbUrl());
}
