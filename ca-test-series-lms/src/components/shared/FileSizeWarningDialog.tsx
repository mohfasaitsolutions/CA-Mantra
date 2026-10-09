import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface FileSizeWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  fileName: string;
  fileSize: number;
  maxSize: number;
  showContinueOption?: boolean;
}

export const FileSizeWarningDialog: React.FC<FileSizeWarningDialogProps> = ({
  isOpen,
  onClose,
  onContinue,
  fileName,
  fileSize,
  maxSize,
  showContinueOption = false,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const fileSizeFormatted = formatFileSize(fileSize);
  const maxSizeFormatted = formatFileSize(maxSize);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                File Size Limit Exceeded
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            <div className="space-y-3 mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">File:</span> {fileName}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>{" "}
                    <span className="text-red-600 font-semibold">
                      {fileSizeFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Limit:</span>{" "}
                    <span className="text-green-600 font-semibold">
                      {maxSizeFormatted}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Please reduce your file size or compress your PDF before
                uploading. Large files can cause upload failures and poor
                performance.
              </div>
              {showContinueOption && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  <strong>Warning:</strong> You can continue, but the upload may
                  fail or take a very long time.
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel onClick={onClose}>
            Choose Another File
          </AlertDialogCancel>
          {showContinueOption && onContinue && (
            <AlertDialogAction
              onClick={onContinue}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Upload Anyway
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FileSizeWarningDialog;
