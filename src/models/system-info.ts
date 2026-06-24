export interface JavaInfo {
  name: string;
  execPath: string;
  vendor: string;
  majorVersion: number;
  isLts: boolean;
  isUserAdded: boolean;
}

export interface MemoryInfo {
  total: number;
  used: number;
  suggestedMaxAlloc: number;
}

export type JavaVendor = "zulu" | "bellsoft" | "temurin";

export interface ThirdPartyJavaRelease {
  vendor: JavaVendor;
  majorVersion: number;
  fullVersion: string;
  isLts: boolean;
  isJre: boolean;
  architecture: string;
  os: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  sha1?: string;
}
