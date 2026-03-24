import type {
  AnalysisRequest,
  AnalysisResult,
  Analyzer,
} from "../../shared/contracts/services";

export class StubAnalyzer implements Analyzer {
  async analyze(_request: AnalysisRequest): Promise<AnalysisResult> {
    return {
      diff: {},
    };
  }
}
