import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const CHARS = "*$#%&80";

export function CipherName({ length = 8, className }: { length?: number; className?: string }) {
    const [displayChars, setDisplayChars] = useState("****");

    useEffect(() => {
        const interval = setInterval(() => {
            let result = "";
            for (let i = 0; i < length; i++) {
                result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
            }
            setDisplayChars(result);
        }, 150);

        return () => clearInterval(interval);
    }, [length]);

    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={className}
        >
            {displayChars}
        </motion.span>
    );
}
