import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CHARS = "*$#%&80";

export function EncryptionAnimation() {
    const [displayChars, setDisplayChars] = useState("****");

    useEffect(() => {
        const interval = setInterval(() => {
            let result = "";
            for (let i = 0; i < 4; i++) {
                result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
            }
            setDisplayChars(result);
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-xl"
        >
            {displayChars}
        </motion.span>
    );
}
