import * as Tone from 'tone';
import {encodeTake} from './wav';
import type {PCMChunk} from './wav';
export type InputChannel = 'left' | 'right' | 'stereo';
export type Capture = {start: (time: number, endTime: number) => void; stop: () => void; cancel: () => void; done: Promise<Blob | null>};
export type InputSession = {analyser: AnalyserNode; deviceName: string; channelCount: number; sampleRate: number; createCapture: (latencyMs?: number) => Capture; close: () => void};
export async function listAudioInputs() {
  if (!navigator.mediaDevices) throw new Error('Ouvre l’application sur localhost ou en HTTPS pour accéder à la carte son.');
  return (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'audioinput');
}
export async function openAudioInput(deviceId: string, channel: InputChannel, onDisconnect: () => void): Promise<InputSession> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('L’accès audio nécessite localhost ou HTTPS et un navigateur compatible.');
  await Tone.start();
  const stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: deviceId ? {exact: deviceId} : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: {ideal: 2}}, video: false});
  try {
    const context = Tone.getContext();
    await context.addAudioWorkletModule('/worklets/recorder.js');
    const source = context.createMediaStreamSource(stream), splitter = context.createChannelSplitter(2), merger = context.createChannelMerger(2), analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(splitter);
    if (channel === 'stereo') {splitter.connect(merger, 0, 0); splitter.connect(merger, 1, 1);}
    else {const index = channel === 'right' ? 1 : 0; splitter.connect(merger, index, 0); splitter.connect(merger, index, 1);}
    merger.connect(analyser);
    const settings = stream.getAudioTracks()[0].getSettings();
    const captures = new Set<Capture>(); let closed = false;
    stream.getAudioTracks().forEach(track => {track.onended = onDisconnect;});
    return {
      analyser, deviceName: stream.getAudioTracks()[0].label || 'Entrée audio', channelCount: settings.channelCount ?? 2, sampleRate: context.sampleRate,
      createCapture(latencyMs = 0) {
        // Shift the capture window instead of shortening the resulting musical phrase.
        const latencyFrames = Math.round((Number.isFinite(latencyMs) ? Math.max(0, Math.min(500, latencyMs)) : 0) / 1000 * context.sampleRate);
        if (closed) throw new Error('L’entrée audio est déconnectée.');
        const node = context.createAudioWorkletNode('mini-daw-recorder', {numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2]});
        const silent = context.createGain(); silent.gain.value = 0;
        merger.connect(node); node.connect(silent); silent.connect(context.rawContext.destination);
        const chunks: PCMChunk[] = []; let startFrame = 0, endFrame = 0, started = false, settled = false;
        let resolve!: (blob: Blob | null) => void, reject!: (error: Error) => void;
        const done = new Promise<Blob | null>((yes, no) => {resolve = yes; reject = no;});
        const clean = () => {try {merger.disconnect(node);} catch {} node.disconnect(); silent.disconnect(); node.port.close(); captures.delete(capture);};
        const capture: Capture = {
          done,
          start(time, endTime) {started = true; startFrame = Math.round(time * context.sampleRate) + latencyFrames; endFrame = Math.round(endTime * context.sampleRate) + latencyFrames; node.port.postMessage({type: 'start', startFrame, endFrame});},
          stop() {if (settled) return; if (!started) {capture.cancel(); return;} endFrame = Math.min(endFrame, Math.round(Tone.immediate() * context.sampleRate) + latencyFrames); node.port.postMessage({type: 'stop', endFrame});},
          cancel() {if (settled) return; settled = true; clean(); resolve(null);},
        };
        node.port.onmessage = ({data}) => {
          if (settled) return;
          if (data.type === 'chunk') chunks.push({startFrame: data.startFrame, channels: data.channels});
          if (data.type === 'done') {
            settled = true; clean();
            const end = Math.max(startFrame, Math.min(endFrame, data.endFrame));
            resolve(end - startFrame < context.sampleRate * .05 ? null : encodeTake(chunks, startFrame, end, context.sampleRate));
          }
        };
        node.onprocessorerror = () => {if (!settled) {settled = true; clean(); reject(new Error('La capture audio a été interrompue. Réactive l’entrée puis réessaie.'));}};
        captures.add(capture); return capture;
      },
      close() {if (closed) return; closed = true; for (const capture of [...captures]) capture.cancel(); stream.getTracks().forEach(track => {track.onended = null; track.stop();}); source.disconnect(); splitter.disconnect(); merger.disconnect(); analyser.disconnect();},
    };
  } catch (error) {stream.getTracks().forEach(track => track.stop()); throw error;}
}
