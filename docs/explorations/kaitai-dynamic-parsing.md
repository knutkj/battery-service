# Exploring Kaitai Struct for Dynamic Binary Parsing in Z-Wave Reverse Engineering

Kaitai Struct is a remarkable open-source project that brings a declarative
approach to describing binary data formats. For protocol reverse
engineers—especially those in the Z-Wave community—Kaitai offers a powerful
language and a suite of tools for modeling, documenting, and parsing complex
binary structures. This post explores my attempt to use Kaitai Struct for
dynamic, user-driven parsing in JavaScript, what I learned about its current
capabilities, and how you can still benefit from its ecosystem.

## ✅ What I Originally Intended to Build

My goal was to empower users—both in Node.js and browser environments—to:

- **Upload or provide a `.ksy` file dynamically** (e.g., via file upload in the
  browser or file read in Node).
- **Provide hex input** (as a string) to be parsed by the corresponding Kaitai
  spec.
- **Parse the input using Kaitai Struct at runtime**, without pre-generating any
  JavaScript code.
- **Receive a Kaitai-style parsed JS object** as output.

The imagined API looked like this:

```js
const parser = createKsyParser(ksyYamlObject);
const result = parser.parse(hexString);
```

I hoped to wrap the Kaitai runtime in ESM exports, pack it if needed, and call
into it from modern JavaScript code—enabling fully dynamic, user-driven binary
parsing.

## 🛠️ What Kaitai Struct Actually Provides

Kaitai Struct is a project with several modular components, each serving a
distinct purpose:

1. **The Compiler (`ksc`)**: A Java-based tool that reads `.ksy` files and
   generates target-specific parser code (JavaScript, Python, etc).
2. **The Runtime (`kaitai-struct.js`)**: A small library providing binary
   parsing primitives for the generated parsers.

**The runtime itself cannot interpret `.ksy` files.** It expects to execute
generated parser code—a plain JavaScript class compiled from a `.ksy` file ahead
of time. The runtime does not include a YAML parser, expression evaluator, or
type system for `.ksy` files. It is a runtime executor, not a dynamic
interpreter.

There is an npm package called
[`kaitai-struct-compiler`](https://www.npmjs.com/package/kaitai-struct-compiler),
but it is a wrapper around the Java compiler and:

- Only works in **Node.js**, not the browser.
- Requires **Java installed**.
- Outputs parser JS code **to disk**, not as in-memory modules.
- **Still requires dynamic code loading or evaluation** if you want to use the
  generated parser immediately.

Currently, there is no official JavaScript-based Kaitai compiler, and no support
for running `.ksy` specs directly in a browser.

## 🚫 Why This Doesn’t Match My Needs

For my use case—dynamic, user-facing binary parsing in both browser and Node—I
needed:

- A runtime API that takes a `.ksy` as a JS object (parsed YAML) and hex input,
  and returns a parsed object.
- No file system, no Java requirement, no precompiled JS modules.
- Support in both browser and Node.
- Dynamically building parsers in user-facing apps as a core feature.

But the official Kaitai system assumes all `.ksy` specs are compiled ahead of
time—either during build or in a CLI process—and fed into the runtime via
generated JS code. My assumption that `.ksy` files could be directly interpreted
in JS was based on intuition and API symmetry, but the actual design is
fundamentally static and compile-time driven.

## 🌟 Why Kaitai Struct Is Still Worth Your Attention

Despite this limitation, Kaitai Struct remains a fantastic resource for protocol
reverse engineers and the Z-Wave community. Its language is expressive,
well-documented, and supported by a vibrant ecosystem. You can pick and choose
components that fit your workflow:

- **The language**: Use `.ksy` files to formally describe binary formats, making
  your work reproducible and shareable.
- **The compiler**: Generate parsers for multiple languages, including
  JavaScript, Python, and more.
- **The runtime**: Integrate generated parsers into your tools and pipelines.
- **The Web IDE**: Experiment and visualize formats interactively at
  [ide.kaitai.io](https://ide.kaitai.io).

For more on how Kaitai Struct is used in this project, see
[data-formats.md](../project/data-formats.md).

## ✅ What Alternatives Are Possible

If you need dynamic parsing, here are two main paths forward:

### 🅰️ Accept Precompilation and Dynamically Load the Result

Use the official `kaitai-struct-compiler` in a Node service (or a headless CLI
process) to compile `.ksy` to JS, then bundle and dynamically load the result.
This approach:

- Leverages Kaitai’s full language and correctness guarantees.
- Is realistic if you're willing to split runtime and compilation.

Downsides:

- No browser-side support for `.ksy` ingestion.
- You’d need to host the compiler or provide a server endpoint.

### 🅱️ Build a Custom `.ksy` Interpreter in JavaScript

Use a JS YAML parser to ingest `.ksy`, and implement a partial interpreter for
the spec:

- Walk the `seq` array.
- Apply types and sizes.
- Read data from a hex buffer using a JS stream abstraction.

This is effortful but feasible for a **restricted subset** of the language: no
conditionals, expressions, subtypes, or TLVs. Over time, the interpreter could
grow toward full spec support.

Upsides:

- Works entirely in the browser or Node.
- No Java, no compilation, no dynamic evaluation.

Downsides:

- No support for Kaitai's expression language unless reimplemented.
- You’re taking on responsibility for runtime correctness.

## 💡 My Decision Point

At this point, I must choose:

1. Embrace precompilation and treat `.ksy` → JS as a build/runtime split.
2. Begin building a `.ksy` interpreter in JavaScript, likely starting with
   fixed-size formats.
3. Accept that the Kaitai ecosystem does not support fully dynamic parsing yet,
   and either contribute upstream or limit usage accordingly.

## 📌 Summary

| Capability                          | Official Kaitai Support         |
| ----------------------------------- | ------------------------------- |
| Parse `.ksy` in browser at runtime  | ❌ Not supported                |
| Parse `.ksy` in Node via JS         | ❌ Not supported                |
| Compile `.ksy` to JS via CLI        | ✅ Supported                    |
| Compile `.ksy` to JS in Node (Java) | ✅ via `kaitai-struct-compiler` |
| Use compiled JS parser in browser   | ✅ With bundling                |
| Run Kaitai parser on hex string     | ✅ (with precompiled parser)    |

Kaitai Struct is a great effort and a valuable tool for anyone working with
binary protocols. While it does not yet support fully dynamic parsing in
JavaScript, its language and tooling are a solid foundation for reverse
engineering and documentation. If you’re working in the Z-Wave space or any
protocol analysis domain, Kaitai is well worth your attention.
