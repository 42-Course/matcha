import React, { useEffect, useMemo, useState } from 'react';
import { useUserMe } from '@/hooks/useUserMe';
import { Gender } from '@/types/user';
import { TagEditor } from '@components/profile/TagEditor';
import { PictureManager } from '@components/profile/PictureManager';

type ProfileFormProps = {
  onSubmit: (data: {
    username: string;
    first_name: string;
    last_name: string;
    gender: 'male' | 'female' | 'other';
    biography: string;
    birth_year: number;
    background_type?: string;
    background_url?: string;
  }) => void;
  buttonText?: string;
  /** Show the "steeping" readiness meter — welcoming during first-time setup. */
  showProgress?: boolean;
};

const fieldClass =
  'w-full rounded-xl border border-matcha-200 dark:border-matcha-700 bg-white dark:bg-matcha-900/40 ' +
  'px-4 py-2.5 text-matcha-900 dark:text-matcha-50 placeholder:text-matcha-400/70 ' +
  'focus:border-matcha-500 focus:ring-2 focus:ring-matcha-400/40 focus:outline-none transition';

const labelClass = 'block text-sm font-medium text-matcha-900 dark:text-matcha-100 mb-1.5';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 13 - 1920 + 1 }, (_, i) => CURRENT_YEAR - 13 - i);

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-matcha-100 dark:border-matcha-800 bg-white/70 dark:bg-matcha-900/20 p-5 sm:p-6">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-display text-sm font-semibold text-matcha-500">{step}</span>
        <div>
          <h3 className="font-display text-lg font-semibold text-matcha-900 dark:text-matcha-50">{title}</h3>
          {hint && <p className="text-sm text-matcha-600 dark:text-matcha-300/80">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export const ProfileForm = ({ onSubmit, buttonText = 'Save', showProgress = false }: ProfileFormProps) => {
  const { user } = useUserMe();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [biography, setBiography] = useState('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [backgroundType, setBackgroundType] = useState('none');
  const [backgroundUrl, setBackgroundUrl] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setGender(user.gender);
      setBiography(user.biography || '');
      setBirthYear(user.birth_year || '');
      setBackgroundType(user.background_type || 'none');
      setBackgroundUrl(user.background_url || '');
    }
  }, [user]);

  const canSubmit = Boolean(username && gender && birthYear);

  const progress = useMemo(() => {
    const filled = [username, firstName, lastName, gender, biography, birthYear].filter(Boolean).length;
    return Math.round((filled / 6) * 100);
  }, [username, firstName, lastName, gender, biography, birthYear]);

  const steepLabel =
    progress >= 100 ? 'Ready to pour' : progress >= 67 ? 'Almost steeped' : progress >= 34 ? 'Coming along' : 'Just getting started';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      first_name: firstName,
      last_name: lastName,
      gender: gender as 'male' | 'female' | 'other',
      biography,
      birth_year: Number(birthYear),
      background_type: backgroundType,
      background_url: backgroundType === 'custom' ? backgroundUrl : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showProgress && (
        <div className="rounded-2xl border border-matcha-200/70 dark:border-matcha-800 bg-matcha-50 dark:bg-matcha-900/40 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-base font-semibold text-matcha-800 dark:text-matcha-100">
              Your profile is steeping
            </span>
            <span className="font-display text-sm font-semibold text-matcha-600 dark:text-matcha-300">{progress}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-matcha-200/70 dark:bg-matcha-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-matcha-400 to-matcha-600 transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-matcha-600 dark:text-matcha-300/80">{steepLabel} — a fuller profile helps people say hi.</p>
        </div>
      )}

      <Section step="01" title="Your photos" hint="A friendly face goes a long way. Add at least one.">
        <PictureManager />
      </Section>

      <Section step="02" title="The basics" hint="How you'll show up around Matcha.">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="username" className={labelClass}>Username</label>
            <input
              id="username" name="username" value={username}
              onChange={(e) => setUsername(e.target.value)} required
              placeholder="matcha_fan" className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className={labelClass}>First name</label>
              <input id="first_name" name="first_name" value={firstName}
                onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClass}>Last name</label>
              <input id="last_name" name="last_name" value={lastName}
                onChange={(e) => setLastName(e.target.value)} placeholder="Rivera" className={fieldClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className={labelClass}>Gender</label>
              <select id="gender" name="gender" value={gender} required
                onChange={(e) => setGender(e.target.value as Gender)} className={fieldClass}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="birth_year" className={labelClass}>Birth year</label>
              <select id="birth_year" name="birth_year" value={birthYear} required
                onChange={(e) => setBirthYear(Number(e.target.value))} className={fieldClass}>
                <option value="">Select</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Section>

      <Section step="03" title="About you" hint="A line or two so people have something to open with.">
        <textarea
          id="biography" name="biography" value={biography} rows={4}
          onChange={(e) => setBiography(e.target.value)}
          placeholder="Board games, long walks, and hunting for the best ramen in town…"
          className={`${fieldClass} resize-none`}
        />
      </Section>

      <Section step="04" title="What you're into" hint="Interests help us connect you with like-minded people.">
        <TagEditor />
      </Section>

      <Section step="05" title="Make it yours" hint="Pick a backdrop for your profile.">
        <label htmlFor="background_type" className={labelClass}>Background theme</label>
        <select id="background_type" name="background_type" value={backgroundType}
          onChange={(e) => setBackgroundType(e.target.value)} className={fieldClass}>
          <option value="none">None (Default)</option>
          <option value="earth">3D Earth Globe</option>
          <option value="gradient-purple">Purple Gradient</option>
          <option value="gradient-ocean">Ocean Gradient</option>
          <option value="gradient-sunset">Sunset Gradient</option>
          <option value="custom">Custom URL</option>
        </select>
        {backgroundType === 'custom' && (
          <div className="mt-4">
            <label htmlFor="background_url" className={labelClass}>Custom background URL</label>
            <input id="background_url" name="background_url" value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              placeholder="https://example.com/background.jpg" className={fieldClass} />
          </div>
        )}
      </Section>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-matcha-600 py-3 px-4 font-display text-base font-semibold text-white shadow-sm
          transition hover:bg-matcha-700 focus:outline-none focus:ring-2 focus:ring-matcha-400/60
          disabled:cursor-not-allowed disabled:bg-matcha-300 disabled:text-white/70"
      >
        {buttonText}
      </button>
      {!canSubmit && (
        <p className="text-center text-sm text-matcha-500">Add a username, gender and birth year to continue.</p>
      )}
    </form>
  );
};
