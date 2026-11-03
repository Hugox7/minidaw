export type PCMChunk = {startFrame: number; channels: Float32Array[]};
// Crop by audio-clock frame numbers, not by the delivery time of messages.
export function encodeTake(chunks: PCMChunk[], startFrame: number, endFrame: number, sampleRate: number, channels = 2): Blob {
  const length = Math.max(0, endFrame - startFrame);
  const bytes = new ArrayBuffer(44 + length * channels * 2), view = new DataView(bytes);
  const text = (offset: number, value: string) => {for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));};
  text(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * 2, true); view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, length * channels * 2, true);
  for (const chunk of chunks) {
    const from = Math.max(startFrame, chunk.startFrame), to = Math.min(endFrame, chunk.startFrame + chunk.channels[0].length);
    for (let frame = from; frame < to; frame++) for (let channel = 0; channel < channels; channel++) {
      const value = Math.max(-1, Math.min(1, chunk.channels[channel]?.[frame - chunk.startFrame] ?? 0));
      view.setInt16(44 + ((frame - startFrame) * channels + channel) * 2, value < 0 ? value * 32768 : value * 32767, true);
    }
  }
  return new Blob([bytes], {type: 'audio/wav'});
}
