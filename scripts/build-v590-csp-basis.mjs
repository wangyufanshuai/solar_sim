import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V590_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const sourceJsPath = resolve(root, "public/basis/basis_transcoder.js");
const sourceWasmPath = resolve(root, "public/basis/basis_transcoder.wasm");
const outputJsPath = resolve(root, "public/basis-v590/basis_transcoder.js");
const outputWasmPath = resolve(root, "public/basis-v590/basis_transcoder.wasm");
const receiptPath = resolve(root, "public/data/celestial-rendering-v590/basis-runtime-receipt.json");
const expectedSourceJsSha256 = "8478b5b6d6b74e7d3082b89f6417321d8d1dc0307f2b30d4484bb11b441696a1";
const expectedSourceWasmSha256 = "6cf17dc889352c42e9acf8897107978d127005fe3386c36a0e3845e27967630a";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function replaceSection(source, startMarker, endMarker, replacement, id) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end <= start || source.indexOf(startMarker, start + startMarker.length) >= 0) {
    throw new Error(`v590-basis-patch-boundary:${id}`);
  }
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

const cspSafeInvoker = `/* v590-csp-safe-craft-invoker */
function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=usesDestructorStack(argTypes);var returns=argTypes[0].name!=="void";var retType=argTypes[0];var classParam=argTypes[1];var invokerFn=function(){if(arguments.length!==argCount-2){throwBindingError("function "+humanName+" called with "+arguments.length+" arguments, expected "+(argCount-2))}var destructors=needsDestructorStack?[]:null;var wired=[];var thisWired;if(isClassMethodFunc){thisWired=classParam["toWireType"](destructors,this)}for(var i=0;i<argCount-2;++i){wired.push(argTypes[i+2]["toWireType"](destructors,arguments[i]))}var callArgs=[cppTargetFunc];if(isClassMethodFunc){callArgs.push(thisWired)}for(var j=0;j<wired.length;++j){callArgs.push(wired[j])}var rv=cppInvokerFunc.apply(null,callArgs);if(needsDestructorStack){runDestructors(destructors)}else{for(var k=isClassMethodFunc?1:2;k<argTypes.length;++k){var type=argTypes[k];if(type.destructorFunction!==null){type.destructorFunction(k===1?thisWired:wired[k-2])}}}return returns?retType["fromWireType"](rv):undefined};return createNamedFunction(humanName,invokerFn)};`;

const cspSafeMethodCaller = `/* v590-csp-safe-emval-method-caller */
var __emval_get_method_caller=(argCount,argTypes,kind)=>{var types=emval_lookupTypes(argCount,argTypes);var retType=types.shift();argCount--;var invokerFunction=function(obj,func,destructorsRef,args){var values=[];var offset=0;for(var i=0;i<argCount;++i){values.push(types[i].readValueFromPointer(args+offset));offset+=types[i]["argPackAdvance"]}var rv;if(kind===1){rv=reflectConstruct(func,values)}else if(kind===0){rv=func.call(obj,...values)}else{rv=func.call(...values)}if(!retType.isVoid){return emval_returnValue(retType,destructorsRef,rv)}};var functionName="methodCaller<("+types.map(t=>t.name).join(", ")+") => "+retType.name+">";return emval_addMethodCaller(createNamedFunction(functionName,invokerFunction))};`;

const sourceJs = readFileSync(sourceJsPath);
const sourceWasm = readFileSync(sourceWasmPath);
if (sha256(sourceJs) !== expectedSourceJsSha256) throw new Error("v590-basis-source-js-drift");
if (sha256(sourceWasm) !== expectedSourceWasmSha256) throw new Error("v590-basis-source-wasm-drift");

let patchedJs = sourceJs.toString("utf8");
patchedJs = replaceSection(
  patchedJs,
  "function craftInvokerFunction",
  "var __embind_register_class_constructor",
  cspSafeInvoker,
  "craft-invoker",
);
patchedJs = replaceSection(
  patchedJs,
  "var __emval_get_method_caller=",
  "var __emval_get_module_property=",
  cspSafeMethodCaller,
  "emval-method-caller",
);
if ((patchedJs.match(/newFunc\(Function/g) ?? []).length !== 0) throw new Error("v590-basis-dynamic-invoker-remains");
if (!patchedJs.includes("v590-csp-safe-craft-invoker") || !patchedJs.includes("v590-csp-safe-emval-method-caller")) {
  throw new Error("v590-basis-patch-marker");
}

const outputJs = Buffer.from(patchedJs, "utf8");
atomicWrite(outputJsPath, outputJs);
atomicWrite(outputWasmPath, sourceWasm);

const unsignedReceipt = {
  version: "v590-csp-safe-basis-runtime-v1",
  generatedAt,
  status: "derived-runtime-complete",
  policy: {
    unsafeEvalRequired: false,
    wasmUnsafeEvalRequired: true,
    historicalBasisRewritten: false,
    sourceRuntime: "three-basis-readonly",
  },
  source: {
    js: { path: "public/basis/basis_transcoder.js", bytes: sourceJs.byteLength, sha256: expectedSourceJsSha256 },
    wasm: { path: "public/basis/basis_transcoder.wasm", bytes: sourceWasm.byteLength, sha256: expectedSourceWasmSha256 },
    licenses: ["three-MIT", "Basis-Universal-Apache-2.0"],
  },
  output: {
    path: "/basis-v590/",
    js: { path: "public/basis-v590/basis_transcoder.js", bytes: outputJs.byteLength, sha256: sha256(outputJs) },
    wasm: { path: "public/basis-v590/basis_transcoder.wasm", bytes: sourceWasm.byteLength, sha256: sha256(sourceWasm) },
    replacements: ["craftInvokerFunction", "__emval_get_method_caller"],
  },
};
const receipt = { ...unsignedReceipt, receiptSha256: canonicalSha(unsignedReceipt) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));

console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  jsSha256: receipt.output.js.sha256,
  wasmSha256: receipt.output.wasm.sha256,
}, null, 2));
