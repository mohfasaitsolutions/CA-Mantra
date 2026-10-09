/**
 * Compresses an image file to ensure it's under the specified size limit
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in KB (default: 300)
 * @param quality - Initial quality (0-1, default: 0.9)
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = async (
  file: File, 
  maxSizeKB: number = 300, 
  quality: number = 0.9
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const maxDimension = 400;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      const tryCompress = (currentQuality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const sizeKB = blob.size / 1024;
            
            if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
              // Convert blob to file
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Try with lower quality
              tryCompress(currentQuality - 0.1);
            }
          },
          'image/jpeg',
          currentQuality
        );
      };
      
      tryCompress(quality);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates if a file is a valid image
 * @param file - The file to validate
 * @returns boolean - True if valid image
 */
export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Formats file size in human readable format
 * @param bytes - Size in bytes
 * @returns string - Formatted size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
