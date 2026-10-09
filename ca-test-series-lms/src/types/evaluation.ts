
export interface CompletedEvaluation {
  id: number;
  studentName: string;
  testName: string;
  testSeries: string;
  subject: string;
  evaluatedOn: string;
  submittedOn: string;
  score: number;
  feedback: string;
  answerPdfUrl: string;
  questionPdfUrl: string;
}
