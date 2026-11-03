/**
 * Real-time Web Audio API Vocal Reducer (Karaoke Mode).
 *
 * Uses a 3-band Mid/Side DSP topology on the playing <video>/<audio> element:
 *   1. Stereo Side path (L - R on Left, R - L on Right) cancels center-panned
 *      lead vocals while preserving stereo width for panned instruments.
 *   2. Steep 24 dB/oct Center Low-Pass (< 190 Hz) restores mono sub-bass &
 *      kick drum punch without leaking vocal fundamentals.
 *   3. Center High-Pass (> 5500 Hz) restores hi-hat / cymbal air.
 *
 * Dry/Wet crossfade uses exponential smoothing (~25ms time constant) so
 * toggling has no clicks.
 */

interface KaraokeAudioGraph {
  ctx: AudioContext;
  dryGain: GainNode;
  wetGain: GainNode;
}

const mediaGraphs = new WeakMap<HTMLMediaElement, KaraokeAudioGraph>();

const CROSSFADE_TIME_CONSTANT_SEC = 0.025;
const BASS_CUTOFF_HZ = 190;
const TREBLE_CUTOFF_HZ = 5500;
const BUTTERWORTH_Q = Math.SQRT1_2;
const SIDE_LEVEL = 0.9;
const BASS_LEVEL = 1.25;
const TREBLE_LEVEL = 0.6;
const MAKEUP_LEVEL = 1.15;

function gain(ctx: AudioContext, value: number): GainNode {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

function filter(
  ctx: AudioContext,
  type: BiquadFilterType,
  hz: number,
): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = hz;
  node.Q.value = BUTTERWORTH_Q;
  return node;
}

/** Wires the karaoke DSP between `source` and `out`. */
function connectWetPath(
  ctx: AudioContext,
  source: AudioNode,
  out: AudioNode,
): void {
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  source.connect(splitter);

  // 1. Side = SIDE_LEVEL * (L - R) → Left, and its inverse (R - L) → Right
  const side = gain(ctx, SIDE_LEVEL);
  const negateR = gain(ctx, -1);
  const invertSide = gain(ctx, -1);
  splitter.connect(side, 0);
  splitter.connect(negateR, 1);
  negateR.connect(side);
  side.connect(merger, 0, 0);
  side.connect(invertSide);
  invertSide.connect(merger, 0, 1);

  // 2. Mid = 0.5 * (L + R): both channels summed into one node
  const mid = gain(ctx, 0.5);
  splitter.connect(mid, 0);
  splitter.connect(mid, 1);

  // 2a. Two cascaded Butterworth low-passes = 24 dB/oct, keeps kick & bass
  const bass = gain(ctx, BASS_LEVEL);
  const bassLp2 = filter(ctx, "lowpass", BASS_CUTOFF_HZ);
  mid.connect(filter(ctx, "lowpass", BASS_CUTOFF_HZ)).connect(bassLp2);
  bassLp2.connect(bass);

  // 2b. High-pass keeps hi-hats & top-end air
  const treble = gain(ctx, TREBLE_LEVEL);
  mid.connect(filter(ctx, "highpass", TREBLE_CUTOFF_HZ)).connect(treble);

  for (const band of [bass, treble]) {
    band.connect(merger, 0, 0);
    band.connect(merger, 0, 1);
  }

  // 3. Output makeup gain
  merger.connect(gain(ctx, MAKEUP_LEVEL)).connect(out);
}

function buildKaraokeGraph(media: HTMLMediaElement): KaraokeAudioGraph | null {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  try {
    // Throws if the element is already attached to another source node
    const source = ctx.createMediaElementSource(media);

    // Dry path: original audio, audible when karaoke mode is off
    const dryGain = gain(ctx, 1);
    source.connect(dryGain).connect(ctx.destination);

    const wetGain = gain(ctx, 0);
    wetGain.connect(ctx.destination);
    connectWetPath(ctx, source, wetGain);

    return { ctx, dryGain, wetGain };
  } catch (err) {
    void ctx.close().catch(() => {});
    throw err;
  }
}

/**
 * Enables or disables real-time vocal reduction on the given media element.
 * Returns true if the desired state is active.
 */
export function setMediaKaraokeMode(
  media: HTMLMediaElement | null,
  enabled: boolean,
): boolean {
  if (!media) return false;

  let graph = mediaGraphs.get(media);
  if (!graph) {
    // Lazy: never touch Web Audio until the user first enables karaoke
    if (!enabled) return false;
    try {
      graph = buildKaraokeGraph(media) ?? undefined;
    } catch (err) {
      console.error("[Lyrics] Failed to initialize Karaoke audio graph:", err);
      return false;
    }
    if (!graph) return false;
    mediaGraphs.set(media, graph);
  }

  // Once routed through Web Audio, the dry path also dies if the context is suspended
  if (graph.ctx.state === "suspended") {
    void graph.ctx.resume().catch(() => {});
  }

  const now = graph.ctx.currentTime;
  const t = CROSSFADE_TIME_CONSTANT_SEC;
  graph.dryGain.gain.setTargetAtTime(enabled ? 0 : 1, now, t);
  graph.wetGain.gain.setTargetAtTime(enabled ? 1 : 0, now, t);

  return enabled;
}
