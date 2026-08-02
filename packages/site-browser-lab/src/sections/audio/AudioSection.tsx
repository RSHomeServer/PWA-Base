import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Label } from "@platform/ui";
import { SectionHeader } from "../../components/SectionHeader.js";
import { StatGrid, type StatItem } from "../../components/StatGrid.js";
import { formatMs, formatNumber } from "../../lib/format.js";
import styles from "./AudioSection.module.css";

type OscWave = OscillatorType;

export function AudioSection() {
  const barsRef = useRef<HTMLCanvasElement>(null);
  const micRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);

  const [baseLatency, setBaseLatency] = useState<number | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [freq, setFreq] = useState(440);
  const [wave, setWave] = useState<OscWave>("sine");
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const ensureContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      setBaseLatency(audioCtxRef.current.baseLatency ?? null);
      setSampleRate(audioCtxRef.current.sampleRate);
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const bars = barsRef.current;
    if (!bars) return;
    const ctx = bars.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const analyser = analyserRef.current;
      bars.width = bars.clientWidth * devicePixelRatio;
      bars.height = bars.clientHeight * devicePixelRatio;
      ctx.fillStyle = "#060a0c";
      ctx.fillRect(0, 0, bars.width, bars.height);

      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const barW = bars.width / data.length;
        for (let i = 0; i < data.length; i += 1) {
          const h = (data[i]! / 255) * bars.height;
          ctx.fillStyle = `rgba(45, 212, 191, ${0.35 + data[i]! / 400})`;
          ctx.fillRect(i * barW, bars.height - h, Math.max(1, barW - 1), h);
        }
      } else {
        ctx.fillStyle = "rgba(45, 212, 191, 0.12)";
        ctx.fillRect(0, bars.height * 0.7, bars.width, 2);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      oscRef.current = null;
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    };
  }, []);

  const startOsc = useCallback(async () => {
    const ac = await ensureContext();
    if (oscRef.current) {
      oscRef.current.stop();
      oscRef.current.disconnect();
    }
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    gain.gain.value = 0.08;
    osc.type = wave;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(analyserRef.current!);
    analyserRef.current!.connect(ac.destination);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    setPlaying(true);
  }, [ensureContext, freq, wave]);

  const stopOsc = useCallback(() => {
    oscRef.current?.stop();
    oscRef.current?.disconnect();
    oscRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || !oscRef.current) return;
    oscRef.current.type = wave;
    oscRef.current.frequency.setValueAtTime(freq, audioCtxRef.current!.currentTime);
  }, [freq, wave, playing]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicOn(false);
      return;
    }
    setMicError(null);
    try {
      const ac = await ensureContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const source = ac.createMediaStreamSource(stream);
      const micAnalyser = ac.createAnalyser();
      micAnalyser.fftSize = 256;
      source.connect(micAnalyser);
      setMicOn(true);

      const canvas = micRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const drawMic = () => {
        if (!micStreamRef.current) return;
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        const data = new Uint8Array(micAnalyser.frequencyBinCount);
        micAnalyser.getByteFrequencyData(data);
        ctx.fillStyle = "#060a0c";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barW = canvas.width / data.length;
        for (let i = 0; i < data.length; i += 1) {
          const h = (data[i]! / 255) * canvas.height;
          ctx.fillStyle = `rgba(251, 191, 36, ${0.4 + data[i]! / 400})`;
          ctx.fillRect(i * barW, canvas.height - h, Math.max(1, barW - 1), h);
        }
        requestAnimationFrame(drawMic);
      };
      requestAnimationFrame(drawMic);
    } catch {
      setMicError("Microphone permission denied or unavailable.");
      setMicOn(false);
    }
  }, [ensureContext, micOn]);

  const items: StatItem[] = [
    {
      key: "latency",
      label: "AudioContext base latency",
      value: baseLatency === null ? "Start audio to measure" : formatMs(baseLatency * 1000),
    },
    {
      key: "rate",
      label: "Sample rate",
      value: sampleRate === null ? "—" : `${formatNumber(sampleRate)} Hz`,
    },
  ];

  return (
    <section aria-labelledby="lab-audio-title">
      <SectionHeader
        eyebrow="Acoustics Bay"
        title="Audio"
        description="AudioContext latency, a muted-by-default oscillator playground with live analyser bars, and an optional permission-gated mic visualiser."
      />

      <StatGrid items={items} />

      <div className={styles.grid}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Analyser bars</h3>
          <canvas ref={barsRef} className={styles.bars} aria-label="Audio analyser bars" />
          <div className={styles.oscControls}>
            <div className={styles.field}>
              <Label htmlFor="lab-osc-freq">Frequency ({freq} Hz)</Label>
              <input
                id="lab-osc-freq"
                type="range"
                min={80}
                max={1200}
                value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.field}>
              <Label htmlFor="lab-osc-wave">Waveform</Label>
              <select
                id="lab-osc-wave"
                value={wave}
                onChange={(e) => setWave(e.target.value as OscWave)}
                className={styles.select}
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>
            <Button type="button" size="sm" onClick={playing ? stopOsc : startOsc}>
              {playing ? "Stop oscillator" : "Start oscillator (quiet)"}
            </Button>
            <p className={styles.note}>Off by default. Starts at 8% gain so it stays gentle.</p>
          </div>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Microphone visualiser</h3>
          <canvas
            ref={micRef}
            className={styles.bars}
            aria-label="Microphone frequency visualiser"
          />
          <Button type="button" size="sm" variant="secondary" onClick={toggleMic}>
            {micOn ? "Stop microphone" : "Enable microphone"}
          </Button>
          {micError ? (
            <p className={styles.error} role="alert">
              {micError}
            </p>
          ) : (
            <p className={styles.note}>
              Permission gated — nothing is captured until you allow it.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
