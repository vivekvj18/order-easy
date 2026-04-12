const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`${sizes[size]} border-primary-200 border-t-brand-green rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <LoadingSpinner size="xl" />
    <p className="text-gray-500 text-sm font-medium animate-pulse">Loading…</p>
  </div>
);

export default LoadingSpinner;
