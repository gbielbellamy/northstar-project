import { useEffect, useRef } from 'react';
import { useDelayedUnmount } from '../../lib/useDelayedUnmount';

type Props = { message: string | null };

/** Matches the closing animation in the stylesheet. */
const EXIT_MS = 180;

function Toast({ message }: Props) {
  const { mounted, closing } = useDelayedUnmount(message !== null, EXIT_MS);
  // The message is null while the toast animates out, so keep the last one
  // or it empties mid-exit.
  const shown = useRef('');
  useEffect(() => {
    if (message !== null) shown.current = message;
  }, [message]);

  if (!mounted) return null;

  return (
    <div className={`toast ${closing ? 'toast--closing' : ''}`.trim()} role="status">
      {message ?? shown.current}
    </div>
  );
}

export default Toast;
