import { Buffer } from 'buffer';
import process from 'process';
import * as util from 'util';
import { EventEmitter } from 'events';
import { Readable, Writable, Stream, Transform } from 'stream';

// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.process = process;
// @ts-ignore
window.global = window;
// @ts-ignore
window.util = util;
// @ts-ignore
window.EventEmitter = EventEmitter;
// @ts-ignore
window.Stream = Stream;
// @ts-ignore
window.Readable = Readable;
// @ts-ignore
window.Writable = Writable;
// @ts-ignore
window.Transform = Transform;

export { };
