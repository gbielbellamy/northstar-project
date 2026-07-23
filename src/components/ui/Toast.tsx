import { AnimatePresence, motion } from 'framer-motion';

type Props = { message: string | null };

function Toast({ message }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
