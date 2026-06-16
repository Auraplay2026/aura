import { redirect } from 'next/navigation';

export default function ExternalSlotPage({ params }: { params: { id: string } }) {
  redirect(`/casino/game/${params.id}`);
}
