import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, X, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUploadConfig } from "@/constants/uploadLimits";
import FileSizeWarningDialog from "./FileSizeWarningDialog";

interface FileUploadWithLimitsProps {
  config: FileUploadConfig;
  onFileSelect: (files: File[]) => void;
  selectedFiles?: File[];
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  customLabel?: string;
}

export const FileUploadWithLimits: React.FC<FileUploadWithLimitsProps> = ({
  config,
  onFileSelect,
  selectedFiles = [],
  disabled = false,
  className = "",
  showPreview = true,
  customLabel,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!config.acceptedTypes.includes(file.type)) {
      const acceptedTypesDisplay = config.acceptedTypes
        .map((type) => {
          if (type.startsWith("image/"))
            return type.split("/")[1].toUpperCase();
          if (type === "application/pdf") return "PDF";
          return type;
        })
        .join(", ");
      return `Invalid file type. Only ${acceptedTypesDisplay} files are allowed.`;
    }

    return null;
  };

  const handleFileSizeValidation = (file: File): boolean => {
    // Check file size
    if (file.size > config.maxSizeInBytes) {
      // For PDF files over 20MB, show detailed warning dialog
      if (file.type === "application/pdf" && config.maxSizeInMB >= 20) {
        setPendingFile(file);
        setShowSizeWarning(true);
        return false;
      }

      // For other files or smaller limits, show toast
      toast({
        title: "File Size Limit Exceeded",
        description: `File size (${(file.size / (1024 * 1024)).toFixed(
          1
        )}MB) exceeds ${config.maxSizeInMB}MB limit.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];

    fileArray.forEach((file) => {
      const typeError = validateFile(file);
      if (typeError) {
        fileErrors.push(`${file.name}: ${typeError}`);
        return;
      }

      const sizeValid = handleFileSizeValidation(file);
      if (sizeValid) {
        validFiles.push(file);
      }
    });

    setErrors(fileErrors);

    if (fileErrors.length > 0) {
      toast({
        title: "File Upload Error",
        description: `${fileErrors.length} file(s) failed validation. Check file requirements.`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      if (config.multiple) {
        onFileSelect([...selectedFiles, ...validFiles]);
      } else {
        onFileSelect([validFiles[0]]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFileSelect(newFiles);
  };

  const handleSizeWarningClose = () => {
    setShowSizeWarning(false);
    setPendingFile(null);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinueWithLargeFile = () => {
    if (pendingFile) {
      if (config.multiple) {
        onFileSelect([...selectedFiles, pendingFile]);
      } else {
        onFileSelect([pendingFile]);
      }
    }
    setShowSizeWarning(false);
    setPendingFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-8 w-8 text-primary" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const acceptString = config.acceptedTypes.join(",");

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Requirements Info */}
      <div className="bg-primary/10 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-primary">
            <p className="font-medium mb-1">Upload Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li>• {config.description}</li>
              <li>• Maximum file size: {config.maxSizeInMB}MB</li>
              {config.acceptedTypes.includes("application/pdf") && (
                <>
                  <li>• Ensure all pages are clearly visible</li>
                  <li>• Single PDF file per upload</li>
                </>
              )}
              {config.acceptedTypes.some((type) =>
                type.startsWith("image/")
              ) && (
                <>
                  <li>• High quality images recommended</li>
                  <li>• Images will be automatically optimized</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? "border-primary bg-primary/10" : "border-gray-300"}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-primary/50 hover:bg-gray-50"
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

        {selectedFiles.length === 0 ? (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {customLabel ||
                `Choose ${config.multiple ? "files" : "file"} or drag and drop`}
            </p>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}{" "}
              selected
            </p>
            <p className="text-sm text-gray-500">
              Click to change or drag new files
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptString}
          multiple={config.multiple}
          onChange={handleFileInput}
          disabled={disabled}
        />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 mb-2">Upload Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Size Warning Dialog */}
      {pendingFile && (
        <FileSizeWarningDialog
          isOpen={showSizeWarning}
          onClose={handleSizeWarningClose}
          onContinue={handleContinueWithLargeFile}
          fileName={pendingFile.name}
          fileSize={pendingFile.size}
          maxSize={config.maxSizeInBytes}
          showContinueOption={true}
        />
      )}
    </div>
  );
};

export default FileUploadWithLimits;
