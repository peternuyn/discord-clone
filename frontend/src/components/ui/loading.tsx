import Image from 'next/image';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ size = 'md', text = 'Loading...' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <Image
          src="/logo.png"
          alt="Discord Clone Logo"
          width={64}
          height={64}
          className="w-full h-full object-contain"
        />
      </div>
      {text && (
        <p className="text-gray-400 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-purple-600`} />
  );
} 