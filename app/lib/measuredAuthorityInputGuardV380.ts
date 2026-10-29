export type MeasuredAuthorityInputSizeDecisionV380 = Readonly<{
  path: string;
  size: number;
  maximumBytes: number;
  accepted: true;
}>;

export function assertMeasuredAuthorityInputSizeV380(args: {
  path: string;
  size: number;
  maximumBytes: number;
}): MeasuredAuthorityInputSizeDecisionV380 {
  if (
    !args.path.startsWith("dist/") ||
    args.path.includes("..") ||
    !Number.isSafeInteger(args.size) ||
    !Number.isSafeInteger(args.maximumBytes) ||
    args.size <= 0 ||
    args.maximumBytes <= 0 ||
    args.size > args.maximumBytes
  ) {
    throw new Error(`v380-input-size:${args.path}`);
  }
  return Object.freeze({ ...args, accepted: true });
}
