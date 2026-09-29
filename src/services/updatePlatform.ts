export function isTVUpdateBuild(configuredIsTV: unknown, runtimeIsTV: boolean) {
  return typeof configuredIsTV === 'boolean' ? configuredIsTV : runtimeIsTV;
}
