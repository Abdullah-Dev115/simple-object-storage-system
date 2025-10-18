export interface IStorageService {
  store(id: string, data: Buffer): Promise<void>;
  retrieve(id: string): Promise<Buffer>;
}
