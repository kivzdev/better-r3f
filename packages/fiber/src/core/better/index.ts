// better-r3f: performance features layered on top of react-three-fiber.
// Kept in one folder so the fork stays easy to rebase onto upstream.

export type { FramePool, FramePoolStats } from './pool'
export type { WarningOptions } from './warnings'
export { setWarnings } from './warnings'
export type { AdaptiveDprOptions } from './adaptive'
export { AdaptiveDprController } from './adaptive'
export { useDisposable, disposeValue } from './disposable'
export type { InstancesProps, InstanceItemProps } from './instances'
export { Instances, InstanceItem, InstancesMesh, InstanceProxy } from './instances'
