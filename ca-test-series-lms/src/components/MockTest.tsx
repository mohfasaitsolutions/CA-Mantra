
import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface MockTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const MockTest = ({ isOpen, onClose }: MockTestProps) => {
  const requestedFsRef = useRef(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock questions
  const questions = [
    {
      id: 1,
      question: "What is the accounting equation?",
      options: [
        "Assets = Liabilities + Equity",
        "Assets = Liabilities - Equity", 
        "Assets + Liabilities = Equity",
        "Liabilities = Assets + Equity"
      ],
      correct: 0
    },
    {
      id: 2,
      question: "Which of the following is a current asset?",
      options: [
        "Building",
        "Machinery",
        "Cash in hand",
        "Goodwill"
      ],
      correct: 2
    },
    {
      id: 3,
      question: "What is depreciation?",
      options: [
        "Increase in asset value",
        "Decrease in asset value over time",
        "Sale of asset",
        "Purchase of asset"
      ],
      correct: 1
    }
  ];

  const enterFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      return;
    }
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        requestedFsRef.current = true;
        await el.requestFullscreen();
      }
    } catch (e) {
      // Silently ignore to avoid UX noise
      requestedFsRef.current = false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      return;
    }
    try {
      await document.exitFullscreen();
    } catch (e) {
      // Ignore: occurs if document not active anymore
    } finally {
      requestedFsRef.current = false;
    }
  }, []);

  // Manage fullscreen lifecycle based on dialog open state
  useEffect(() => {
    if (isOpen) {
      enterFullscreen();
      return;
    }
    const t = setTimeout(() => exitFullscreen(), 50);
    return () => clearTimeout(t);
  }, [isOpen, enterFullscreen, exitFullscreen]);

  // Track actual fullscreen changes (user presses Esc, etc.)
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && isOpen && requestedFsRef.current) {
        // User exited manually; optionally we could auto-close test
        // For now keep dialog open without forcing re-entry to avoid loop.
        requestedFsRef.current = false;
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestion(0);
      setAnswers({});
      setTimeLeft(1800);
      setIsSubmitted(false);
      setShowResults(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correct.toString()) {
        correct++;
      }
    });
    return correct;
  };

  const handleClose = () => {
    onClose();
    // Exit fullscreen after closing to avoid dialog re-renders during transition
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Mock Test Results</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Test Completed!</h3>
              <p className="text-gray-600">Your performance summary</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-ca-primary">{percentage}%</div>
              <div className="text-sm text-gray-600">
                {score} out of {questions.length} questions correct
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={handleClose} className="w-full">
                Close Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-4xl h-[90vh] [&>button]:hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-center">
              <DialogTitle>Mock Test - CA Foundation</DialogTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-red-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="font-mono">{formatTime(timeLeft)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <Progress value={((currentQuestion + 1) / questions.length) * 100} />
            </div>
            
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">
                  Q{currentQuestion + 1}. {questions[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <RadioGroup
                  value={answers[currentQuestion] || ''}
                  onValueChange={handleAnswerChange}
                >
                  <div className="space-y-4">
                    {questions[currentQuestion].options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} />
                        <Label className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            <div className="mt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              <div className="space-x-2">
                {currentQuestion === questions.length - 1 ? (
                  <Button onClick={handleSubmit}>
                    Submit Test
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MockTest;
