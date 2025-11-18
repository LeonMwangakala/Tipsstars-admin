import React from 'react';

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {src ? (
        <>
          <img
            src={src}
            alt={alt}
            className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
            onError={handleImageError}
            onClick={onClick}
          />
          <div 
            className="hidden w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold items-center justify-center text-sm border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={onClick}
          >
            {getInitials(alt)}
          </div>
        </>
      ) : (
        <div 
          className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center text-sm border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={onClick}
        >
          {getInitials(alt)}
        </div>
      )}
    </div>
  );
};

export default ProfileImage; 