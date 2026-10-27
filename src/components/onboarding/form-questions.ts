import type { Question } from "@/domain/questionnaires";

export function answerError(q: Question) {
  return q.type === "choice" || q.type === "multi" ? "Choose an answer" : "Answer this question";
}
