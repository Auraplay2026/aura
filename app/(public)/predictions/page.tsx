import { redirect } from 'next/navigation';

export default function PredictionsIndex() {
  redirect('/predictions/trending');
}
