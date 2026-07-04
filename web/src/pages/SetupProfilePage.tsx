import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '@components/forms/ProfileForm';
import toast from 'react-hot-toast';
import { useUserMe } from '@/hooks/useUserMe';
import { useEffect } from 'react';
import { UpdateUserProfilePayload } from '@/types/user';

const PROMISES = [
  { title: 'Friends first', body: 'Matcha is about meeting people, not swiping. No pressure, just good company.' },
  { title: 'Messages that matter', body: 'You can message the friends you connect with — one thoughtful note a day.' },
  { title: 'Meet up for real', body: 'Join events near you and turn conversations into plans.' },
];

export const SetupProfilePage = () => {
  const { profileSetupComplete, updateUser } = useUserMe();
  const navigate = useNavigate();

  useEffect(() => {
    if (profileSetupComplete) {
      toast.success('Your profile is ready — taking you to edit it.');
      navigate('/profile/edit');
    }
  }, [profileSetupComplete, navigate]);

  const handleSubmit = async (data: UpdateUserProfilePayload) => {
    try {
      await updateUser(data);
      toast.success('You\'re all set — welcome to Matcha!');
      window.location.href = '/';
    } catch (error) {
      toast.error(`Couldn't save your profile. ${error}`);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.35fr] bg-matcha-50 dark:bg-matcha-900">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-gradient-to-br from-matcha-600 via-matcha-700 to-matcha-900 text-white px-8 py-12 lg:px-14 lg:py-16 flex flex-col justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-matcha-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-clay/20 blur-3xl"
        />

        <div className="relative">
          <span className="font-display text-2xl font-semibold tracking-tight">matcha</span>
        </div>

        <div className="relative mt-10 lg:mt-0 max-w-md">
          <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-[1.05]">
            Good things start over a cup.
          </h1>
          <p className="mt-5 text-matcha-100/90 text-lg">
            Set up your profile and start meeting people who are into the same things you are.
          </p>

          <ul className="mt-9 space-y-5">
            {PROMISES.map((p) => (
              <li key={p.title} className="flex gap-3.5">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-matcha-100/80">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 lg:mt-0 text-sm text-matcha-100/70">
          You can change any of this later from your profile.
        </p>
      </aside>

      {/* Form panel */}
      <main className="px-5 py-10 sm:px-8 lg:px-14 lg:py-16 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-matcha-500">Welcome</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-matcha-900 dark:text-matcha-50">
            Set up your profile
          </h2>
          <p className="mt-2 text-matcha-600 dark:text-matcha-300/80">
            A few details so the right people can find you.
          </p>

          <div className="mt-8">
            <ProfileForm onSubmit={handleSubmit} buttonText="Complete setup" showProgress />
          </div>
        </div>
      </main>
    </div>
  );
};
