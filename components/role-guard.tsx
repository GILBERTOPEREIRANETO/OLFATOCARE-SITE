'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Role = 'admin' | 'reception' | 'polysomnography_technician' | 'technician' | 'doctor' | 'pending';

export default function RoleGuard({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.active || !allowed.includes(profile.role as Role)) {
        router.replace('/');
        return;
      }
      if (active) setReady(true);
    }
    check();
    return () => { active = false; };
  }, [allowed, router]);

  if (!ready) return <main className="wrap"><div className="card">Verificando acesso…</div></main>;
  return <>{children}</>;
}
