import React, { useState } from "react";
import { Star, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { studentsApi } from "@/lib/api/students";

interface EvaluatorRatingProps {
  isOpen: boolean;
  onClose: () => void;
  testName: string;
  submissionId: string;
  evaluatorName?: string;
}

const EvaluatorRating: React.FC<EvaluatorRatingProps> = ({
  isOpen,
  onClose,
  testName,
  submissionId,
  evaluatorName = "Evaluator",
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: ({
      submissionId,
      feedback,
    }: {
      submissionId: string;
      feedback: { rating: number; comment?: string };
    }) => studentsApi.submitFeedback(submissionId, feedback),
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      // Reset form
      setRating(0);
      setFeedback("");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      submissionId,
      feedback: {
        rating,
        comment: feedback || undefined,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Evaluator</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Test:</strong> {testName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Evaluator:</strong> {evaluatorName}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rating (out of 5)</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with the evaluator..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitFeedbackMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {submitFeedbackMutation.isPending
                ? "Submitting..."
                : "Submit Rating"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluatorRating;
