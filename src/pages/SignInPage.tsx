import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, LogIn, UserPlus } from 'lucide-react';
import { auth, type User } from '../lib/api';
import Checkbox from '../components/ui/Checkbox';
import NorthstarMark from '../components/ui/NorthstarMark';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';

type Mode = 'signin' | 'signup';
type Props = { onSignedIn: (user: User) => void };

function SignInPage({ onSignedIn }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [withPlan, setWithPlan] = useState(true);
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<User>, which: 'form' | 'guest') {
    setBusy(which);
    setError(null);
    try {
      onSignedIn(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(null);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    run(
      () =>
        mode === 'signin'
          ? auth.login(email, password)
          : auth.register(email, password, withPlan),
      'form',
    );
  }

  return (
    <div className="auth">
      <div className="auth__card rise-in">
        <div className="auth__brand">
          <NorthstarMark size={30} />
          <span>Northstar</span>
        </div>
        <p className="auth__tagline">
          Plan the day, track the search, and see whether any of it is working.
        </p>

        {/* The demo comes first on purpose: most people arriving here want to
            look, not to sign up. */}
        <button
          type="button"
          className="auth__demo"
          onClick={() => run(auth.guest, 'guest')}
          disabled={busy !== null}
        >
          {busy === 'guest' ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
          {busy === 'guest' ? 'Setting up your demo…' : 'Try it without an account'}
          <span>Loads a private copy filled with sample data. Nothing to fill in.</span>
        </button>

        <div className="auth__or">
          <span>or</span>
        </div>

        <div className="auth__tabs" role="tablist">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`auth__tab ${mode === m ? 'auth__tab--on' : ''}`.trim()}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="auth__form">
          <Field label="Email">
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            label="Password"
            hint={mode === 'signup' ? 'At least 8 characters.' : undefined}
          >
            <input
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {mode === 'signup' && (
            <Checkbox
              checked={withPlan}
              onChange={setWithPlan}
              label="Start with the ten-week plan"
            />
          )}
          {mode === 'signup' && (
            <p className="auth__hint">
              {withPlan
                ? 'A roadmap, a timetable and the skill paths, ready to edit. No sample companies or applications.'
                : 'An empty app. You build the roadmap and the timetable yourself.'}
            </p>
          )}

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={busy !== null}>
            {busy === 'form' ? (
              <Loader2 size={14} className="spin" />
            ) : mode === 'signin' ? (
              <LogIn size={14} />
            ) : (
              <UserPlus size={14} />
            )}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="auth__note">
          Your data is yours. Delete the account from Settings and everything in it goes with it.
        </p>
      </div>
    </div>
  );
}

export default SignInPage;
