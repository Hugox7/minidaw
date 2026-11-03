// Records PCM on the same sample clock as the backing tracks. Output is silence.
class MiniDawRecorder extends AudioWorkletProcessor {
  constructor() {
    super(); this.running = false; this.finished = false; this.length = 0; this.chunkStart = 0; this.buffers = [new Float32Array(2048), new Float32Array(2048)];
    this.port.onmessage = ({data}) => {
      if (data.type === 'start') {this.startFrame = data.startFrame; this.endFrame = data.endFrame; this.running = true;}
      if (data.type === 'stop') {this.endFrame = Math.min(this.endFrame, data.endFrame); if (currentFrame >= this.endFrame) this.finish();}
    };
  }
  flush() {
    if (!this.length) return;
    const channels = this.buffers.map(buffer => buffer.slice(0, this.length));
    this.port.postMessage({type: 'chunk', startFrame: this.chunkStart, channels}, channels.map(channel => channel.buffer));
    this.length = 0;
  }
  finish() {
    if (this.finished || !this.running) return;
    this.flush(); this.finished = true; this.running = false;
    this.port.postMessage({type: 'done', startFrame: this.startFrame, endFrame: Math.max(this.startFrame, this.endFrame)});
  }
  process(inputs, outputs) {
    if (!this.running) return true;
    const input = inputs[0] ?? [], block = outputs?.[0]?.[0]?.length ?? 128;
    const from = Math.max(0, this.startFrame - currentFrame), to = Math.min(block, this.endFrame - currentFrame);
    for (let i = from; i < to; i++) {
      if (!this.length) this.chunkStart = currentFrame + i;
      this.buffers[0][this.length] = input[0]?.[i] ?? 0;
      this.buffers[1][this.length] = input[1]?.[i] ?? input[0]?.[i] ?? 0;
      this.length++;
      if (this.length === 2048) this.flush();
    }
    if (currentFrame + block >= this.endFrame) this.finish();
    return true;
  }
}
registerProcessor('mini-daw-recorder', MiniDawRecorder);
