import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { estimateTokens } from './token-estimator.js';

export interface CompressionEvent {
  tool: string;
  inputBytes: number;
  outputBytes: number;
  inputTokens: number;
  outputTokens: number;
  strategy: string;
  timestamp: Date;
}

export interface ToolStats {
  tool: string;
  events: number;
  inputBytes: number;
  outputBytes: number;
  inputTokens: number;
  outputTokens: number;
  bytesSaved: number;
  tokensSaved: number;
  savingsRatio: number;
}

export interface SessionStats {
  startedAt: Date;
  generatedAt: Date;
  totalInputBytes: number;
  totalOutputBytes: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEvents: number;
  bytesSaved: number;
  tokensSaved: number;
  savingsRatio: number;
  byTool: ToolStats[];
  events: CompressionEvent[];
}

class StatsTracker {
  private readonly startedAt: Date = new Date();
  private events: CompressionEvent[] = [];

  record(tool: string, inputText: string, outputText: string, strategy: string): CompressionEvent {
    const inputBytes = Buffer.byteLength(inputText, 'utf8');
    const outputBytes = Buffer.byteLength(outputText, 'utf8');
    const inputTokens = estimateTokens(inputText).tokens;
    const outputTokens = estimateTokens(outputText).tokens;

    const event: CompressionEvent = {
      tool,
      inputBytes,
      outputBytes,
      inputTokens,
      outputTokens,
      strategy,
      timestamp: new Date(),
    };
    this.events.push(event);
    return event;
  }

  getSessionStats(): SessionStats {
    const totalInputBytes = this.events.reduce((s, e) => s + e.inputBytes, 0);
    const totalOutputBytes = this.events.reduce((s, e) => s + e.outputBytes, 0);
    const totalInputTokens = this.events.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutputTokens = this.events.reduce((s, e) => s + e.outputTokens, 0);
    const bytesSaved = totalInputBytes - totalOutputBytes;
    const tokensSaved = totalInputTokens - totalOutputTokens;
    const savingsRatio = totalInputBytes > 0 ? (bytesSaved / totalInputBytes) * 100 : 0;

    const byToolMap = new Map<string, ToolStats>();
    for (const event of this.events) {
      const existing =
        byToolMap.get(event.tool) ??
        ({
          tool: event.tool,
          events: 0,
          inputBytes: 0,
          outputBytes: 0,
          inputTokens: 0,
          outputTokens: 0,
          bytesSaved: 0,
          tokensSaved: 0,
          savingsRatio: 0,
        } as ToolStats);

      existing.events += 1;
      existing.inputBytes += event.inputBytes;
      existing.outputBytes += event.outputBytes;
      existing.inputTokens += event.inputTokens;
      existing.outputTokens += event.outputTokens;
      existing.bytesSaved = existing.inputBytes - existing.outputBytes;
      existing.tokensSaved = existing.inputTokens - existing.outputTokens;
      existing.savingsRatio =
        existing.inputBytes > 0 ? (existing.bytesSaved / existing.inputBytes) * 100 : 0;
      byToolMap.set(event.tool, existing);
    }

    const byTool = [...byToolMap.values()].sort((a, b) => b.bytesSaved - a.bytesSaved);

    return {
      startedAt: this.startedAt,
      generatedAt: new Date(),
      totalInputBytes,
      totalOutputBytes,
      totalInputTokens,
      totalOutputTokens,
      totalEvents: this.events.length,
      bytesSaved,
      tokensSaved,
      savingsRatio,
      byTool,
      events: [...this.events],
    };
  }

  formatStatsFooter(inputText: string, outputText: string, strategy: string): string {
    const inputBytes = Buffer.byteLength(inputText, 'utf8');
    const outputBytes = Buffer.byteLength(outputText, 'utf8');
    const saved = inputBytes - outputBytes;
    const ratio = inputBytes > 0 ? ((saved / inputBytes) * 100).toFixed(0) : '0';
    const inputKB = (inputBytes / 1024).toFixed(1);
    const outputKB = (outputBytes / 1024).toFixed(1);
    const inputTokens = estimateTokens(inputText).tokens.toLocaleString();
    const outputTokens = estimateTokens(outputText).tokens.toLocaleString();

    return (
      '\n---\n' +
      `[windows-context-mode] Compressed: ${inputKB}KB/${inputTokens} tokens -> ` +
      `${outputKB}KB/${outputTokens} tokens (${ratio}% saved, strategy: ${strategy})`
    );
  }

  formatSessionStatsText(): string {
    const stats = this.getSessionStats();
    const lines = [
      '=== Windows Context Mode Session Stats ===',
      `Events: ${stats.totalEvents}`,
      `Input: ${(stats.totalInputBytes / 1024).toFixed(1)} KB (${stats.totalInputTokens.toLocaleString()} tokens)`,
      `Output: ${(stats.totalOutputBytes / 1024).toFixed(1)} KB (${stats.totalOutputTokens.toLocaleString()} tokens)`,
      `Saved: ${(stats.bytesSaved / 1024).toFixed(1)} KB (${stats.tokensSaved.toLocaleString()} tokens, ${stats.savingsRatio.toFixed(0)}%)`,
    ];
    if (stats.byTool.length > 0) {
      lines.push('', 'Top tools by bytes saved:');
      for (const t of stats.byTool.slice(0, 5)) {
        lines.push(
          `- ${t.tool}: ${(t.bytesSaved / 1024).toFixed(1)} KB saved (${t.savingsRatio.toFixed(0)}%, ${t.events} event${t.events === 1 ? '' : 's'})`
        );
      }
    }
    return lines.join('\n');
  }

  async exportToFile(path?: string): Promise<string> {
    const targetPath =
      path ??
      join(tmpdir(), `wcm-stats-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    const stats = this.getSessionStats();
    await writeFile(targetPath, JSON.stringify(stats, null, 2), 'utf8');
    return targetPath;
  }

  reset(): void {
    this.events = [];
  }
}

export const statsTracker = new StatsTracker();

