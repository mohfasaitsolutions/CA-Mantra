import React, { useRef, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import MathText from "@/components/shared/MathText";
import MathToolbar from "@/components/shared/MathToolbar";

export interface MCQQuestion {
  id?: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  marks: number;
  negativeMarks?: number;
}

interface MCQCreatorProps {
  questions: MCQQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<MCQQuestion[]>>;
}

const MCQCreator: React.FC<MCQCreatorProps> = ({ questions, setQuestions }) => {
  // Store refs for each question's textarea (keyed by question id)
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const addMCQQuestion = () => {
    const newQuestion: MCQQuestion = {
      id: Date.now().toString(),
      questionText: "",
      options: {
        A: "",
        B: "",
        C: "",
        D: "",
      },
      correctAnswer: "A",
      marks: 2,
      negativeMarks: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateMCQQuestion = (
    id: string,
    field: keyof MCQQuestion,
    value: unknown
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateMCQOption = (
    questionId: string,
    optionKey: "A" | "B" | "C" | "D",
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: { ...q.options, [optionKey]: value } }
          : q
      )
    );
  };

  const removeMCQQuestion = (id?: string) => {
    if (!id) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Callback for MathToolbar to insert at cursor for question text
  const makeQuestionTextInsert = useCallback(
    (questionId: string) => (newValue: string) => {
      updateMCQQuestion(questionId, "questionText", newValue);
    },
    []
  );

  // Check if text has any math expressions
  const hasMath = (text: string) => /\$[^$]+\$/.test(text);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>MCQ Questions</CardTitle>
          <Button onClick={addMCQQuestion} variant="outline" type="button">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <Card
            key={question.id || index}
            className="border-l-4 border-l-blue-500"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold">Question {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeMCQQuestion(question.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Question Text with Math Toolbar */}
                <div>
                  <Label>Question Text</Label>
                  <MathToolbar
                    textareaRef={{
                      current: textareaRefs.current[question.id || ""],
                    } as React.RefObject<HTMLTextAreaElement>}
                    onInsert={makeQuestionTextInsert(question.id!)}
                  />
                  <Textarea
                    ref={(el) => {
                      if (question.id) textareaRefs.current[question.id] = el;
                    }}
                    value={question.questionText}
                    onChange={(e) =>
                      updateMCQQuestion(
                        question.id!,
                        "questionText",
                        e.target.value
                      )
                    }
                    placeholder="Enter your question here... Use $...$ for math, e.g. $x^2 + \sqrt{y}$"
                    className="mt-2"
                  />
                  {/* Live Math Preview */}
                  {hasMath(question.questionText) && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-xs text-blue-600 font-medium mb-1">
                        Preview:
                      </div>
                      <div className="text-sm leading-relaxed">
                        <MathText text={question.questionText} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Options with Math Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["A", "B", "C", "D"] as const).map((optKey) => (
                    <div key={optKey}>
                      <Label>Option {optKey}</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={question.options[optKey]}
                          onChange={(e) =>
                            updateMCQOption(
                              question.id!,
                              optKey,
                              e.target.value
                            )
                          }
                          placeholder={`Option ${optKey} — use $...$ for math`}
                        />
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === optKey}
                          onChange={() =>
                            updateMCQQuestion(
                              question.id!,
                              "correctAnswer",
                              optKey
                            )
                          }
                          className="w-4 h-4 text-ca-primary focus:ring-ca-primary"
                        />
                      </div>
                      {/* Option Math Preview */}
                      {hasMath(question.options[optKey]) && (
                        <div className="mt-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-sm">
                          <MathText text={question.options[optKey]} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(e) =>
                        updateMCQQuestion(
                          question.id!,
                          "marks",
                          parseInt(e.target.value) || 2
                        )
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Negative Marks</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={question.negativeMarks ?? 0}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        updateMCQQuestion(
                          question.id!,
                          "negativeMarks",
                          isNaN(parsed) ? 0 : parsed
                        );
                      }}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded-md">
                      Selected: Option {question.correctAnswer}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            <p>No questions added yet.</p>
            <p className="text-sm">
              Click "Add Question" to create your first MCQ.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCQCreator;
