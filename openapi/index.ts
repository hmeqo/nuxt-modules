/* eslint-disable @typescript-eslint/no-explicit-any */
let _sdk: any

export function getSdk() {
  return _sdk
}

export function setOpenapiSdk(sdk: any) {
  _sdk = sdk
}
