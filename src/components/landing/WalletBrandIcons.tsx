type WalletIconProps = {
  className?: string;
};

export function MetaMaskIcon({ className }: WalletIconProps) {
  return (
    <img
      src="/images/wallets/metamask.png"
      alt=""
      aria-hidden
      className={className}
      draggable={false}
    />
  );
}

export function WalletConnectIcon({ className }: WalletIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#3B99FC" />
      <path
        fill="#fff"
        d="M8.5 13.5c3.5-3.5 9.2-3.5 12.7 0l.4.4c.2.2.2.5 0 .7l-1.4 1.4c-.2.2-.5.2-.7 0l-.6-.6c-2.4-2.4-6.4-2.4-8.8 0l-.6.6c-.2.2-.5.2-.7 0l-1.4-1.4c-.2-.2-.2-.5 0-.7l.4-.4Zm15.6 2.9 1.2 1.2c.2.2.2.5 0 .7l-5.5 5.5c-.2.2-.5.2-.7 0l-3.9-3.9c-.1-.1-.2-.1-.3 0l-3.9 3.9c-.2.2-.5.2-.7 0l-5.5-5.5c-.2-.2-.2-.5 0-.7l1.2-1.2c.2-.2.5-.2.7 0l3.9 3.9c.1.1.2.1.3 0l3.9-3.9c.2-.2.5-.2.7 0l3.9 3.9c.1.1.2.1.3 0l3.9-3.9c.2-.2.5-.2.7 0Z"
      />
    </svg>
  );
}

export function CoinbaseWalletIcon({ className }: WalletIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path
        fill="#fff"
        d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm-1.2 12.8H13c-.7 0-1.2-.5-1.2-1.2v-7.2c0-.7.5-1.2 1.2-1.2h1.8c.7 0 1.2.5 1.2 1.2v7.2c0 .7-.5 1.2-1.2 1.2Z"
      />
    </svg>
  );
}
