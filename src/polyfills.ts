// @ts-ignore
if (window.LOG_DEBUG) window.LOG_DEBUG('polyfills.ts: Loading imports...');

import { Buffer } from 'buffer';
import process from 'process';
import * as util from 'util';
import { EventEmitter } from 'events';
import { Readable, Writable, Stream, Transform } from 'stream';

// @ts-ignore
if (window.LOG_DEBUG) window.LOG_DEBUG('polyfills.ts: Assigning globals...');

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

// @ts-ignore
if (window.LOG_DEBUG) window.LOG_DEBUG('polyfills.ts: Finished assignments.');

export { };
