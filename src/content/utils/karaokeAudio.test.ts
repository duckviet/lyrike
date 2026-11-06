import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { setMediaKaraokeMode } from "./karaokeAudio";

type Edge = { from: MockNode; to: MockNode; output: number; input: number };

class MockParam {
  constructor(public value = 0) {}
  setTargetAtTime = vi.fn((v: number) => {
    this.value = v;
  });
}

class MockNode {
  gain = new MockParam(1);
  frequency = new MockParam();
  Q = new MockParam();
  type = "";
  constructor(
    public kind: string,
    public ctx: MockAudioContext,
  ) {}
  connect(to: MockNode, output = 0, input = 0) {
    this.ctx.edges.push({ from: this, to, output, input });
    return to;
  }
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];
  static failSource = false;
  edges: Edge[] = [];
  nodes: MockNode[] = [];
  state: AudioContextState = "suspended";
  currentTime = 1;
  destination = new MockNode("destination", this);
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {});

  constructor() {
    MockAudioContext.instances.push(this);
  }
  private make(kind: string) {
    const n = new MockNode(kind, this);
    this.nodes.push(n);
    return n;
  }
  createMediaElementSource() {
    if (MockAudioContext.failSource) throw new Error("already connected");
    return this.make("source");
  }
  createGain() {
    return this.make("gain");
  }
  createBiquadFilter() {
    return this.make("filter");
  }
  createChannelSplitter() {
    return this.make("splitter");
  }
  createChannelMerger() {
    return this.make("merger");
  }

  /**
   * Linear evaluation of the wet path for a stereo input sample.
   * Filters are modelled as fixed passthrough gains by type.
   */
  evalWet(L: number, R: number, pass: { lowpass: number; highpass: number }) {
    const value = (node: MockNode, output = 0): number => {
      if (node.kind === "splitter") return output === 0 ? L : R;
      const sum = this.edges
        .filter((e) => e.to === node)
        .reduce((acc, e) => acc + value(e.from, e.output), 0);
      if (node.kind === "filter")
        return sum * pass[node.type as "lowpass" | "highpass"];
      return node.gain.value * sum;
    };
    const merger = this.nodes.find((n) => n.kind === "merger")!;
    const makeup = this.edges.find((e) => e.from === merger)!.to;
    const channel = (c: number) =>
      makeup.gain.value *
      this.edges
        .filter((e) => e.to === merger && e.input === c)
        .reduce((acc, e) => acc + value(e.from, e.output), 0);
    return [channel(0), channel(1)];
  }
}

const media = () => ({}) as HTMLMediaElement;
const ctx = () =>
  MockAudioContext.instances[MockAudioContext.instances.length - 1];

beforeEach(() => {
  MockAudioContext.instances = [];
  MockAudioContext.failSource = false;
  vi.stubGlobal("window", { AudioContext: MockAudioContext });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("setMediaKaraokeMode", () => {
  test("returns false for null media", () => {
    expect(setMediaKaraokeMode(null, true)).toBe(false);
  });

  test("disabling before first enable does not create an AudioContext", () => {
    expect(setMediaKaraokeMode(media(), false)).toBe(false);
    expect(MockAudioContext.instances).toHaveLength(0);
  });

  test("returns false when Web Audio is unavailable", () => {
    vi.stubGlobal("window", {});
    expect(setMediaKaraokeMode(media(), true)).toBe(false);
  });

  test("enable builds graph once, resumes context and crossfades", () => {
    const m = media();
    expect(setMediaKaraokeMode(m, true)).toBe(true);
    expect(MockAudioContext.instances).toHaveLength(1);
    expect(ctx().resume).toHaveBeenCalled();

    const [dry, wet] = ctx().edges.filter((e) => e.to === ctx().destination);
    expect(dry.from.gain.value).toBe(0);
    expect(wet.from.gain.value).toBe(1);
    expect(dry.from.gain.setTargetAtTime).toHaveBeenCalledWith(0, 1, 0.025);

    expect(setMediaKaraokeMode(m, false)).toBe(false);
    expect(MockAudioContext.instances).toHaveLength(1);
    expect(dry.from.gain.value).toBe(1);
    expect(wet.from.gain.value).toBe(0);
  });

  test("resumes a suspended context even when disabling", () => {
    const m = media();
    setMediaKaraokeMode(m, true);
    ctx().state = "suspended";
    ctx().resume.mockClear();
    setMediaKaraokeMode(m, false);
    expect(ctx().resume).toHaveBeenCalled();
  });

  test("closes the context and returns false when source creation fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    MockAudioContext.failSource = true;
    const m = media();
    expect(setMediaKaraokeMode(m, true)).toBe(false);
    expect(ctx().close).toHaveBeenCalled();

    // Not cached: a later attempt retries
    MockAudioContext.failSource = false;
    expect(setMediaKaraokeMode(m, true)).toBe(true);
  });
});

describe("karaoke wet path DSP", () => {
  const noFilters = { lowpass: 0, highpass: 0 };

  test("cancels center-panned signal (vocals)", () => {
    setMediaKaraokeMode(media(), true);
    const [l, r] = ctx().evalWet(1, 1, noFilters);
    expect(l).toBeCloseTo(0);
    expect(r).toBeCloseTo(0);
  });

  test("keeps side signal as L-R / R-L", () => {
    setMediaKaraokeMode(media(), true);
    const [l, r] = ctx().evalWet(1, 0, noFilters);
    expect(l).toBeCloseTo(1.15 * 0.9);
    expect(r).toBeCloseTo(-1.15 * 0.9);
  });

  test("restores center bass and treble on both channels", () => {
    setMediaKaraokeMode(media(), true);
    const [lBass, rBass] = ctx().evalWet(1, 1, { lowpass: 1, highpass: 0 });
    expect(lBass).toBeCloseTo(1.15 * 1.25);
    expect(rBass).toBeCloseTo(1.15 * 1.25);

    const [lTreble] = ctx().evalWet(1, 1, { lowpass: 0, highpass: 1 });
    expect(lTreble).toBeCloseTo(1.15 * 0.6);
  });

  test("configures 24 dB/oct bass and treble filters", () => {
    setMediaKaraokeMode(media(), true);
    const filters = ctx().nodes.filter((n) => n.kind === "filter");
    expect(
      filters.map((f) => [f.type, f.frequency.value, f.Q.value]),
    ).toEqual(
      expect.arrayContaining([
        ["lowpass", 190, Math.SQRT1_2],
        ["lowpass", 190, Math.SQRT1_2],
        ["highpass", 5500, Math.SQRT1_2],
      ]),
    );
    expect(filters).toHaveLength(3);
  });
});
